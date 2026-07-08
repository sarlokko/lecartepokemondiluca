/* Tab "Di che tipo è?" — indovina il tipo */

const TYPE_QUIZ_STATS_KEY = "typeQuizStatsAllTime";

const TYPE_LABELS_IT = {
    normal: "Normale", fire: "Fuoco", water: "Acqua", grass: "Erba",
    electric: "Elettro", ice: "Ghiaccio", fighting: "Lotta", poison: "Veleno",
    ground: "Terra", flying: "Volante", psychic: "Psico", bug: "Coleottero",
    rock: "Roccia", ghost: "Spettro", dragon: "Drago", dark: "Buio",
    steel: "Acciaio", fairy: "Folletto"
};

const ALL_POKEMON_TYPES = Object.keys(TYPE_ICONS);

let typeQuizPokemon = null;
let typeQuizAttempts = 3;
let typeQuizSelected = new Set();
let typeQuizLocked = false;

function getTypeQuizStats() {
    try {
        const s = JSON.parse(localStorage.getItem(TYPE_QUIZ_STATS_KEY) || "null");
        if (s) return s;
    } catch (_) {}
    return { correct: 0, wrong: 0, total: 0, almost: 0, bestStreak: 0, currentStreak: 0 };
}

function saveTypeQuizStats(stats) {
    localStorage.setItem(TYPE_QUIZ_STATS_KEY, JSON.stringify(stats));
}

function typeLabelsHTML(types) {
    return types.map(t => TYPE_LABELS_IT[t] || t).join(" + ");
}

function renderTypeQuizStats() {
    const el = document.getElementById("typequiz-stats");
    if (!el) return;

    const stats = getTypeQuizStats();
    const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    const week = typeof getChallengeState === "function" ? getChallengeState() : null;

    el.innerHTML = `
        <div class="typequiz-stats-bar">
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
                <span class="pill-icon">🏆</span>
                <span class="pill-num">${stats.bestStreak}</span>
                <span class="pill-label">Record serie</span>
            </div>
        </div>
        <p class="battle-week-hint">Questa settimana: ${week ? week.typeQuizWins : 0} indovinati su ${week ? week.typeQuizTotal : 0} tentativi</p>
    `;
}

function renderTypeQuizCard() {
    const cardEl = document.getElementById("typequiz-card");
    const attemptsEl = document.getElementById("typequiz-attempts");
    if (!cardEl || !typeQuizPokemon) return;

    cardEl.innerHTML = `
        <div class="typequiz-pokemon-card">
            <img src="${typeQuizPokemon.img}" alt="${typeQuizPokemon.name}" class="typequiz-img">
            <h3 class="typequiz-name">${typeQuizPokemon.name}</h3>
            <p class="typequiz-id">#${String(typeQuizPokemon.id).padStart(4, "0")}</p>
        </div>
    `;

    if (attemptsEl) {
        attemptsEl.textContent = `Tentativi rimasti: ${typeQuizAttempts}`;
    }
}

function renderTypeQuizGrid() {
    const grid = document.getElementById("typequiz-type-grid");
    if (!grid) return;

    grid.innerHTML = ALL_POKEMON_TYPES.map(t => `
        <button type="button"
            class="typequiz-type-btn ${typeQuizSelected.has(t) ? "selected" : ""}"
            data-type="${t}"
            onclick="toggleTypeQuizType('${t}')"
            ${typeQuizLocked ? "disabled" : ""}>
            <img src="${TYPE_ICONS[t]}" alt="${TYPE_LABELS_IT[t]}" class="type-icon">
            <span>${TYPE_LABELS_IT[t]}</span>
        </button>
    `).join("");
}

function renderTypeQuizFeedback(msg, kind) {
    const el = document.getElementById("typequiz-feedback");
    if (!el) return;
    el.className = "typequiz-feedback" + (kind ? ` feedback-${kind}` : "");
    el.innerHTML = msg || "";
}

function renderTypeQuiz() {
    renderTypeQuizStats();
    renderTypeQuizCard();
    renderTypeQuizGrid();
    const actions = document.getElementById("typequiz-actions");
    if (actions) actions.style.display = typeQuizLocked ? "none" : "flex";
}

function initTypeQuiz() {
    typeQuizLocked = false;
    if (!typeQuizPokemon) pickRandomTypeQuizPokemon();
    else renderTypeQuiz();
}

function pickRandomTypeQuizPokemon() {
    const pool = allCards.filter(c => getPokemonTypes(c.id).length > 0);
    typeQuizPokemon = pool[Math.floor(Math.random() * pool.length)];
    typeQuizAttempts = 3;
    typeQuizSelected.clear();
    typeQuizLocked = false;
    renderTypeQuizFeedback("");
    renderTypeQuiz();
}

function toggleTypeQuizType(type) {
    if (typeQuizLocked || !typeQuizPokemon) return;

    if (typeQuizSelected.has(type)) {
        typeQuizSelected.delete(type);
    } else {
        const actualCount = getPokemonTypes(typeQuizPokemon.id).length;
        const maxPick = actualCount >= 2 ? 2 : 1;
        if (typeQuizSelected.size >= maxPick) {
            const first = typeQuizSelected.values().next().value;
            typeQuizSelected.delete(first);
        }
        typeQuizSelected.add(type);
    }
    renderTypeQuizGrid();
}

function evaluateTypeGuess(selected, actual) {
    const actualSet = new Set(actual);
    const hits = selected.filter(t => actualSet.has(t));

    if (actual.length === 1) {
        return selected.length === 1 && hits.length === 1 ? "correct" : "wrong";
    }

    if (selected.length === 2 && hits.length === 2) return "correct";
    if (hits.length === 1) return "almost";
    return "wrong";
}

function recordTypeQuizResult(result) {
    const stats = getTypeQuizStats();

    if (result === "correct") {
        stats.total++;
        stats.correct++;
        stats.currentStreak++;
        if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak;
    } else if (result === "wrong") {
        stats.total++;
        stats.wrong++;
        stats.currentStreak = 0;
    } else if (result === "almost") {
        stats.almost = (stats.almost || 0) + 1;
    }

    saveTypeQuizStats(stats);

    if (typeof recordTypeQuizInChallenges === "function") {
        recordTypeQuizInChallenges(result);
    }

    renderTypeQuizStats();
    if (activeTab === "challenges" && typeof renderChallenges === "function") {
        renderChallenges();
    }
}

function submitTypeGuess() {
    if (typeQuizLocked || !typeQuizPokemon) return;

    const selected = [...typeQuizSelected];
    if (!selected.length) {
        showToast("Seleziona almeno un tipo!", "error");
        return;
    }

    const actual = getPokemonTypes(typeQuizPokemon.id);
    const result = evaluateTypeGuess(selected, actual);
    const name = typeQuizPokemon.name;

    if (result === "correct") {
        typeQuizLocked = true;
        recordTypeQuizResult("correct");
        renderTypeQuizFeedback(
            `<strong>🎉 Esatto!</strong> ${name} è di tipo ${typeLabelsHTML(actual)}.`,
            "correct"
        );
        showToast(`Bravo! ${name} è ${typeLabelsHTML(actual)}`, "success");
        setTimeout(() => pickRandomTypeQuizPokemon(), 2200);
        renderTypeQuiz();
        return;
    }

    if (result === "almost") {
        recordTypeQuizResult("almost");
        renderTypeQuizFeedback(
            `<strong>🔶 Ci sei quasi!</strong> Hai indovinato uno dei tipi, ma ${name} ne ha ${actual.length}.`,
            "almost"
        );
        typeQuizSelected.clear();
        renderTypeQuizGrid();
        return;
    }

    typeQuizAttempts--;
    recordTypeQuizResult("wrong");

    if (typeQuizAttempts <= 0) {
        typeQuizLocked = true;
        renderTypeQuizFeedback(
            `<strong>😅 Peccato!</strong> ${name} è di tipo ${typeLabelsHTML(actual)}.`,
            "wrong"
        );
        setTimeout(() => pickRandomTypeQuizPokemon(), 2800);
    } else {
        renderTypeQuizFeedback(
            `<strong>❌ Non è questo.</strong> Tentativi rimasti: ${typeQuizAttempts}.`,
            "wrong"
        );
        typeQuizSelected.clear();
    }

    renderTypeQuiz();
}

function skipTypeQuizPokemon() {
    if (typeQuizLocked) return;
    typeQuizSelected.clear();
    pickRandomTypeQuizPokemon();
}
