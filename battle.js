/* ===========================
   TAB LOTTE — BATTLE LOGIC
=========================== */

let battler1 = null;
let battler2 = null;

const BATTLE_STATS_KEY = "battleStatsAllTime";

function getBattleStats() {
    try {
        const s = JSON.parse(localStorage.getItem(BATTLE_STATS_KEY) || "null");
        if (s) return s;
    } catch (_) {}
    return { correct: 0, wrong: 0, total: 0, bestStreak: 0, currentStreak: 0 };
}

function saveBattleStats(stats) {
    localStorage.setItem(BATTLE_STATS_KEY, JSON.stringify(stats));
}

function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function typeIconsHTML(types) {
    return types.map(t =>
        `<img src="${TYPE_ICONS[t]}" class="type-icon battle-type-icon" alt="${t}" title="${t}">`
    ).join("");
}

function renderBattleStats() {
    const el = document.getElementById("battle-stats");
    if (!el) return;

    const stats = getBattleStats();
    const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    const week = typeof getChallengeState === "function" ? getChallengeState() : null;
    const weekWins = week ? week.battleWins : 0;
    const weekTotal = week ? week.battleTotal : 0;

    el.innerHTML = `
        <div class="battle-stats-bar">
            <div class="battle-stat-pill correct-pill">
                <span class="pill-icon">✅</span>
                <span class="pill-num">${stats.correct}</span>
                <span class="pill-label">Indovinati</span>
            </div>
            <div class="battle-stat-pill wrong-pill">
                <span class="pill-icon">❌</span>
                <span class="pill-num">${stats.wrong}</span>
                <span class="pill-label">Sbagliati</span>
            </div>
            <div class="battle-stat-pill accuracy-pill">
                <span class="pill-icon">🎯</span>
                <span class="pill-num">${pct}%</span>
                <span class="pill-label">Precisione</span>
            </div>
            <div class="battle-stat-pill streak-pill">
                <span class="pill-icon">🔥</span>
                <span class="pill-num">${stats.currentStreak}</span>
                <span class="pill-label">Serie attuale</span>
            </div>
            <div class="battle-stat-pill record-pill">
                <span class="pill-icon">🏅</span>
                <span class="pill-num">${stats.bestStreak}</span>
                <span class="pill-label">Record serie</span>
            </div>
        </div>
        <p class="battle-week-hint">Questa settimana: ${weekWins} indovinati su ${weekTotal} lotte</p>
    `;
}

function pickRandomBattlers() {
    const shuffled = shuffleArray(allCards);
    battler1 = shuffled[0];
    battler2 = shuffled[1];

    renderBattlePreview();
    populateWinnerSelect();
    document.getElementById("winnerChoice").style.display = "block";
    document.getElementById("battleResult").innerHTML = "";
}

function buildFighterCard(pokemon, side) {
    const types = getPokemonTypes(pokemon.id);
    return `
        <div class="battle-fighter battle-fighter-${side}" id="fighter-${side}">
            <div class="fighter-glow"></div>
            <img src="${pokemon.img}" alt="${pokemon.name}" class="fighter-img">
            <p class="fighter-name">${pokemon.name}</p>
            <p class="fighter-id">#${pokemon.id}</p>
            <div class="type-row">${typeIconsHTML(types)}</div>
        </div>
    `;
}

function renderBattlePreview() {
    document.getElementById("battlePreview").innerHTML = `
        <div class="battle-arena">
            ${buildFighterCard(battler1, "left")}
            <div class="battle-vs">
                <span>VS</span>
            </div>
            ${buildFighterCard(battler2, "right")}
        </div>
    `;
}

function populateWinnerSelect() {
    document.getElementById("winnerSelect").innerHTML = `
        <option value="1">${battler1.name}</option>
        <option value="2">${battler2.name}</option>
    `;
}

const TYPE_CHART = {
    fire: { weak: ["water", "rock", "ground"], strong: ["grass", "ice", "bug", "steel"] },
    water: { weak: ["grass", "electric"], strong: ["fire", "rock", "ground"] },
    grass: { weak: ["fire", "ice", "flying", "bug", "poison"], strong: ["water", "rock", "ground"] },
    electric: { weak: ["ground"], strong: ["water", "flying"] },
    ice: { weak: ["fire", "rock", "fighting", "steel"], strong: ["grass", "ground", "flying", "dragon"] },
    fighting: { weak: ["flying", "psychic", "fairy"], strong: ["normal", "rock", "steel", "ice", "dark"] },
    poison: { weak: ["ground", "psychic"], strong: ["grass", "fairy"] },
    ground: { weak: ["water", "grass", "ice"], strong: ["fire", "electric", "rock", "poison", "steel"] },
    flying: { weak: ["electric", "ice", "rock"], strong: ["grass", "fighting", "bug"] },
    psychic: { weak: ["bug", "ghost", "dark"], strong: ["fighting", "poison"] },
    bug: { weak: ["fire", "flying", "rock"], strong: ["grass", "psychic", "dark"] },
    rock: { weak: ["water", "grass", "fighting", "ground", "steel"], strong: ["fire", "ice", "flying", "bug"] },
    ghost: { weak: ["ghost", "dark"], strong: ["psychic", "ghost"] },
    dragon: { weak: ["ice", "dragon", "fairy"], strong: ["dragon"] },
    dark: { weak: ["fighting", "bug", "fairy"], strong: ["psychic", "ghost"] },
    steel: { weak: ["fire", "fighting", "ground"], strong: ["rock", "ice", "fairy"] },
    fairy: { weak: ["poison", "steel"], strong: ["fighting", "dragon", "dark"] },
    normal: { weak: ["fighting"], strong: [] },
};

function typeEffectiveness(attackerTypes, defenderTypes) {
    let multiplier = 1;
    let notes = [];
    attackerTypes.forEach(at => {
        defenderTypes.forEach(dt => {
            const chart = TYPE_CHART[at];
            if (!chart) return;
            if (chart.strong.includes(dt)) {
                multiplier *= 2;
                notes.push(`${at} è superefficace contro ${dt}`);
            }
            if (chart.weak.includes(dt)) {
                multiplier *= 0.5;
                notes.push(`${at} è poco efficace contro ${dt}`);
            }
        });
    });
    return { multiplier, notes };
}

async function fetchFullStats(id) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) throw new Error(`Pokémon #${id} non trovato su PokéAPI`);
    const data = await res.json();
    const stats = {};
    data.stats.forEach(s => (stats[s.stat.name] = s.base_stat));
    return {
        types: data.types.map(t => t.type.name),
        abilities: data.abilities.map(a => a.ability.name),
        hp: stats["hp"],
        attack: stats["attack"],
        defense: stats["defense"],
        speed: stats["speed"],
    };
}

function statBar(label, value, maxVal) {
    const pct = Math.min(100, Math.round((value / maxVal) * 100));
    return `
        <div class="stat-mini-row">
            <span class="stat-mini-label">${label}</span>
            <div class="stat-mini-bar"><div class="stat-mini-fill" style="width:${pct}%"></div></div>
            <span class="stat-mini-val">${value}</span>
        </div>`;
}

function recordBattleResult(correct) {
    const stats = getBattleStats();
    stats.total++;
    if (correct) {
        stats.correct++;
        stats.currentStreak++;
        if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak;
    } else {
        stats.wrong++;
        stats.currentStreak = 0;
    }
    saveBattleStats(stats);

    if (typeof recordBattleInChallenges === "function") {
        recordBattleInChallenges(correct);
    }

    renderBattleStats();
    if (activeTab === "challenges" && typeof renderChallenges === "function") {
        renderChallenges();
    }
}

async function runBattle() {
    const resultDiv = document.getElementById("battleResult");
    resultDiv.innerHTML = `
        <div class="battle-loading">
            <div class="battle-loading-spinner"></div>
            <p>⚔️ La lotta è in corso...</p>
        </div>`;

    document.querySelectorAll(".battle-fighter").forEach(el => el.classList.add("fighting"));

    try {
        const [data1, data2] = await Promise.all([
            fetchFullStats(battler1.id),
            fetchFullStats(battler2.id),
        ]);

        const eff1to2 = typeEffectiveness(data1.types, data2.types);
        const eff2to1 = typeEffectiveness(data2.types, data1.types);

        const score1 = (data1.attack * 1.2 + data1.speed * 0.8 + data1.hp * 0.6) * eff1to2.multiplier;
        const score2 = (data2.attack * 1.2 + data2.speed * 0.8 + data2.hp * 0.6) * eff2to1.multiplier;

        const winnerIs1 = score1 >= score2;
        const predictedWinner = winnerIs1 ? battler1 : battler2;
        const predictedLoser = winnerIs1 ? battler2 : battler1;
        const winnerData = winnerIs1 ? data1 : data2;
        const loserData = winnerIs1 ? data2 : data1;
        const winnerNotes = winnerIs1 ? eff1to2.notes : eff2to1.notes;
        const winnerScore = winnerIs1 ? score1 : score2;
        const loserScore = winnerIs1 ? score2 : score1;

        const userChoice = document.getElementById("winnerSelect").value;
        const userPick = userChoice === "1" ? battler1 : battler2;
        const correct = userPick.id === predictedWinner.id;

        recordBattleResult(correct);

        const leftEl = document.getElementById("fighter-left");
        const rightEl = document.getElementById("fighter-right");
        if (leftEl && rightEl) {
            leftEl.classList.remove("fighting");
            rightEl.classList.remove("fighting");
            if (winnerIs1) {
                leftEl.classList.add("winner");
                rightEl.classList.add("loser");
            } else {
                rightEl.classList.add("winner");
                leftEl.classList.add("loser");
            }
        }

        const maxStat = 255;
        resultDiv.innerHTML = `
            <div class="battle-result-card ${correct ? "result-correct" : "result-wrong"}">
                <div class="result-banner">
                    ${correct ? "✅ Hai indovinato!" : "❌ Non questa volta!"}
                </div>
                <h3 class="result-title">🏆 Vince ${predictedWinner.name}!</h3>
                <p class="result-sub">Avevi scelto <strong>${userPick.name}</strong></p>

                <div class="result-fighters">
                    <div class="result-mini ${predictedWinner.id === battler1.id ? "winner-mini" : "loser-mini"}">
                        <img src="${battler1.img}" alt="">
                        <span>${battler1.name}</span>
                        <span class="score-tag">${Math.round(score1)} pt</span>
                    </div>
                    <div class="result-mini ${predictedWinner.id === battler2.id ? "winner-mini" : "loser-mini"}">
                        <img src="${battler2.img}" alt="">
                        <span>${battler2.name}</span>
                        <span class="score-tag">${Math.round(score2)} pt</span>
                    </div>
                </div>

                <div class="result-stats-grid">
                    <div class="result-stats-col">
                        <h4>${battler1.name}</h4>
                        ${statBar("HP", data1.hp, maxStat)}
                        ${statBar("Attacco", data1.attack, maxStat)}
                        ${statBar("Difesa", data1.defense, maxStat)}
                        ${statBar("Velocità", data1.speed, maxStat)}
                    </div>
                    <div class="result-stats-col">
                        <h4>${battler2.name}</h4>
                        ${statBar("HP", data2.hp, maxStat)}
                        ${statBar("Attacco", data2.attack, maxStat)}
                        ${statBar("Difesa", data2.defense, maxStat)}
                        ${statBar("Velocità", data2.speed, maxStat)}
                    </div>
                </div>

                <div class="result-why">
                    <h4>Perché vince ${predictedWinner.name}</h4>
                    <ul>
                        ${winnerNotes.length
                            ? winnerNotes.map(n => `<li>${n}</li>`).join("")
                            : "<li>Nessun vantaggio di tipo: ha vinto per statistiche superiori.</li>"}
                        <li>Punteggio: <strong>${Math.round(winnerScore)}</strong> vs ${Math.round(loserScore)}</li>
                        <li>Abilità: ${winnerData.abilities.join(", ")}</li>
                    </ul>
                </div>

                <button class="btn-green battle-again-btn" onclick="pickRandomBattlers()">🎲 Nuova lotta</button>
            </div>
        `;

        if (correct && typeof showToast === "function") {
            const stats = getBattleStats();
            if (stats.currentStreak >= 3) {
                showToast(`🔥 Serie di ${stats.currentStreak} indovinati di fila!`, "success");
            }
        }
    } catch (err) {
        document.querySelectorAll(".battle-fighter").forEach(el => el.classList.remove("fighting"));
        resultDiv.innerHTML = `<div class="battle-result-card result-error"><p>⚠️ Errore: ${err.message}</p></div>`;
    }
}

window.addEventListener("load", () => {
    if (document.getElementById("battle-stats")) renderBattleStats();
});
