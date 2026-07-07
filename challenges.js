/* Sfide settimanali */

const CHALLENGE_POOL = [
    { type: "new_owned", target: 10, label: "Aggiungi {n} nuove carte alla collezione" },
    { type: "new_owned", target: 5, label: "Aggiungi {n} nuove carte alla collezione" },
    { type: "new_shiny", target: 2, label: "Trova {n} Pokémon Shiny" },
    { type: "new_shiny", target: 1, label: "Trova {n} Pokémon Shiny" },
    { type: "new_gen", gen: 1, target: 5, label: "Ottieni {n} Pokémon della Gen I" },
    { type: "new_gen", gen: 2, target: 4, label: "Ottieni {n} Pokémon della Gen II" },
    { type: "new_gen", gen: 3, target: 4, label: "Ottieni {n} Pokémon della Gen III" },
    { type: "new_type", pokeType: "fire", target: 3, label: "Colleziona {n} Pokémon di tipo Fuoco" },
    { type: "new_type", pokeType: "water", target: 3, label: "Colleziona {n} Pokémon di tipo Acqua" },
    { type: "new_type", pokeType: "grass", target: 3, label: "Colleziona {n} Pokémon di tipo Erba" },
    { type: "new_type", pokeType: "electric", target: 2, label: "Colleziona {n} Pokémon Elettro" },
    { type: "battle_guess", target: 5, label: "Indovina {n} vincitori nelle lotte" },
    { type: "battle_guess", target: 3, label: "Indovina {n} vincitori nelle lotte" },
    { type: "battle_fight", target: 10, label: "Gioca {n} lotte in arena" },
    { type: "battle_fight", target: 5, label: "Gioca {n} lotte in arena" },
    { type: "battle_streak", target: 3, label: "Indovina {n} vincitori di fila" },
    { type: "battle_streak", target: 2, label: "Indovina {n} vincitori di fila" },
    { type: "gen_percent", gen: 1, target: 30, label: "Completa almeno il {n}% della Gen I" },
    { type: "gen_percent", gen: 2, target: 25, label: "Completa almeno il {n}% della Gen II" },
    { type: "new_mega", target: 2, label: "Ottieni {n} forme Mega/Gigamax" },
    { type: "collect_type_total", pokeType: "dragon", target: 10, label: "Possiedi almeno {n} Pokémon Drago (totali)" },
    { type: "collect_type_total", pokeType: "ghost", target: 8, label: "Possiedi almeno {n} Pokémon Spettro (totali)" }
];

function getWeekKey() {
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const year = monday.getFullYear();
    const start = new Date(year, 0, 1);
    const week = Math.ceil(((monday - start) / 86400000 + start.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, "0")}`;
}

function seededRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

function seedFromWeek(weekKey) {
    let h = 0;
    for (let i = 0; i < weekKey.length; i++) h = (h * 31 + weekKey.charCodeAt(i)) | 0;
    return Math.abs(h);
}

function pickChallenges(weekKey) {
    const rand = seededRandom(seedFromWeek(weekKey));
    const pool = [...CHALLENGE_POOL];
    const picked = [];
    const count = 4;
    while (picked.length < count && pool.length) {
        const idx = Math.floor(rand() * pool.length);
        picked.push({ ...pool.splice(idx, 1)[0], id: picked.length });
    }
    return picked.map(c => ({
        ...c,
        label: c.label.replace("{n}", c.target),
        done: false
    }));
}

function getChallengeState() {
    const weekKey = getWeekKey();
    let state;
    try {
        state = JSON.parse(localStorage.getItem("challengeState") || "null");
    } catch {
        state = null;
    }

    if (!state || state.weekKey !== weekKey) {
        state = {
            weekKey,
            challenges: pickChallenges(weekKey),
            baseline: {
                owned: [...ownedSet],
                shiny: [...shinySet],
                mega: JSON.parse(localStorage.getItem("ownedMega") || "[]"),
                battleWins: 0
            },
            battleWins: 0,
            battleTotal: 0,
            bestBattleStreak: 0,
            currentBattleStreak: 0,
            completedIds: []
        };
        localStorage.setItem("challengeState", JSON.stringify(state));
    } else {
        if (state.battleTotal == null) state.battleTotal = state.battleWins || 0;
        if (state.bestBattleStreak == null) state.bestBattleStreak = 0;
        if (state.currentBattleStreak == null) state.currentBattleStreak = 0;
    }
    return state;
}

function saveChallengeState(state) {
    localStorage.setItem("challengeState", JSON.stringify(state));
}

function countNewOwned(state) {
    const base = new Set(state.baseline.owned);
    return [...ownedSet].filter(id => !base.has(id)).length;
}

function countNewShiny(state) {
    const base = new Set(state.baseline.shiny);
    return [...shinySet].filter(id => !base.has(id)).length;
}

function countNewGen(state, gen) {
    const range = getGenRange(gen);
    const base = new Set(state.baseline.owned);
    return [...ownedSet].filter(id => id >= range.min && id <= range.max && !base.has(id)).length;
}

function countNewType(state, pokeType) {
    const base = new Set(state.baseline.owned);
    return [...ownedSet].filter(id => {
        if (base.has(id)) return false;
        return getPokemonTypes(id).includes(pokeType);
    }).length;
}

function countTypeTotal(pokeType) {
    return [...ownedSet].filter(id => getPokemonTypes(id).includes(pokeType)).length;
}

function genPercent(gen) {
    const range = getGenRange(gen);
    const total = range.max - range.min + 1;
    const owned = [...ownedSet].filter(id => id >= range.min && id <= range.max).length;
    return Math.round((owned / total) * 100);
}

function countNewMega(state) {
    const base = new Set(state.baseline.mega);
    const mega = JSON.parse(localStorage.getItem("ownedMega") || "[]");
    return mega.filter(m => !base.has(m)).length;
}

function getChallengeProgress(challenge, state) {
    switch (challenge.type) {
        case "new_owned": return { current: countNewOwned(state), target: challenge.target };
        case "new_shiny": return { current: countNewShiny(state), target: challenge.target };
        case "new_gen": return { current: countNewGen(state, challenge.gen), target: challenge.target };
        case "new_type": return { current: countNewType(state, challenge.pokeType), target: challenge.target };
        case "battle_guess": return { current: state.battleWins, target: challenge.target };
        case "battle_fight": return { current: state.battleTotal, target: challenge.target };
        case "battle_streak": return { current: state.bestBattleStreak, target: challenge.target };
        case "gen_percent": return { current: genPercent(challenge.gen), target: challenge.target };
        case "new_mega": return { current: countNewMega(state), target: challenge.target };
        case "collect_type_total": return { current: countTypeTotal(challenge.pokeType), target: challenge.target };
        default: return { current: 0, target: 1 };
    }
}

function processChallengeCompletions(state) {
    let anyNew = false;
    state.challenges.forEach(c => {
        const { current, target } = getChallengeProgress(c, state);
        if (current >= target && !state.completedIds.includes(c.id)) {
            state.completedIds.push(c.id);
            anyNew = true;
            showToast(`🏆 Sfida completata: ${c.label}`, "success", 4500);
        }
    });
    if (anyNew) saveChallengeState(state);
    return anyNew;
}

function updateChallengeProgress() {
    const state = getChallengeState();
    processChallengeCompletions(state);
}

function recordBattleInChallenges(correct) {
    const state = getChallengeState();
    state.battleTotal++;
    if (correct) {
        state.battleWins++;
        state.currentBattleStreak++;
        if (state.currentBattleStreak > state.bestBattleStreak) {
            state.bestBattleStreak = state.currentBattleStreak;
        }
    } else {
        state.currentBattleStreak = 0;
    }
    saveChallengeState(state);
    updateChallengeProgress();
}

function getBattleChallengeSummary(state) {
    const allTime = typeof getBattleStats === "function" ? getBattleStats() : { correct: 0, wrong: 0, total: 0, bestStreak: 0 };
    const pct = allTime.total ? Math.round((allTime.correct / allTime.total) * 100) : 0;
    return `
        <div class="challenge-card battle-challenge-summary">
            <div class="challenge-title">⚔️ Lotte — riepilogo</div>
            <div class="battle-summary-grid">
                <div><span class="summary-num">${state.battleWins}</span><span class="summary-lbl">Indovinati (settimana)</span></div>
                <div><span class="summary-num">${state.battleTotal}</span><span class="summary-lbl">Lotte giocate</span></div>
                <div><span class="summary-num">${state.bestBattleStreak}</span><span class="summary-lbl">Miglior serie</span></div>
                <div><span class="summary-num">${pct}%</span><span class="summary-lbl">Precisione totale</span></div>
            </div>
            <p class="battle-summary-hint">Vai in tab Lotte per giocare e completare le sfide ⚔️</p>
        </div>`;
}

function renderChallenges() {
    const container = document.getElementById("challenges-content");
    if (!container) return;

    const state = getChallengeState();
    processChallengeCompletions(state);

    const completed = state.completedIds.length;
    const total = state.challenges.length;

    if (!state.challenges.length) {
        container.innerHTML = `
            <div class="challenges-header">
                <h2>🏆 Sfide della settimana</h2>
                <p class="week-label">Nessuna sfida disponibile. Ricarica la pagina.</p>
            </div>`;
        return;
    }

    let html = `
        <div class="challenges-header">
            <h2>🏆 Sfide della settimana</h2>
            <p class="week-label">Settimana ${state.weekKey} — Completate: ${completed}/${total}</p>
        </div>
        ${getBattleChallengeSummary(state)}
    `;

    state.challenges.forEach(c => {
        const { current, target } = getChallengeProgress(c, state);
        const pct = Math.min(100, Math.round((current / target) * 100));
        const done = state.completedIds.includes(c.id);
        html += `
            <div class="challenge-card ${done ? "done" : ""}">
                <div class="challenge-title">${done ? "✅" : "🎯"} ${c.label}</div>
                <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
                <div class="challenge-progress">${Math.min(current, target)} / ${target}${done ? " — Completata!" : ""}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}
