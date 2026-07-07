/* ===========================
   CONFIG
=========================== */

let allCards = POKEMON_LIST;
let filtered = allCards;
let currentGen = 1;
let activeTab = "home";
let ownedSet = new Set(getOwnedArray());
let shinySet = new Set(getOwnedShinyArray());

function getOwnedShinyArray() {
    return JSON.parse(localStorage.getItem("ownedShiny") || "[]");
}

function saveOwnedShinyFromSet(set) {
    localStorage.setItem("ownedShiny", JSON.stringify([...set].sort((a, b) => a - b)));
}

const GENERATIONS = [
    { gen: 1, name: "Gen I",    min: 1,    max: 151 },
    { gen: 2, name: "Gen II",   min: 152,  max: 251 },
    { gen: 3, name: "Gen III",  min: 252,  max: 386 },
    { gen: 4, name: "Gen IV",   min: 387,  max: 493 },
    { gen: 5, name: "Gen V",    min: 494,  max: 649 },
    { gen: 6, name: "Gen VI",   min: 650,  max: 721 },
    { gen: 7, name: "Gen VII",  min: 722,  max: 809 },
    { gen: 8, name: "Gen VIII", min: 810,  max: 905 },
    { gen: 9, name: "Gen IX",   min: 906,  max: 1025 }
];

const TYPE_ICONS = {
    normal: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/normal.png",
    fire: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/fire.png",
    water: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/water.png",
    grass: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/grass.png",
    electric: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/electric.png",
    ice: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/ice.png",
    fighting: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/fighting.png",
    poison: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/poison.png",
    ground: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/ground.png",
    flying: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/flying.png",
    psychic: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/psychic.png",
    bug: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/bug.png",
    rock: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/rock.png",
    ghost: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/ghost.png",
    dragon: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/dragon.png",
    dark: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/dark.png",
    steel: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/steel.png",
    fairy: "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/fairy.png"
};

const TOTAL_POKEMON = 1025;

function getGenRange(gen) {
    return GENERATIONS.find(g => g.gen === gen) || GENERATIONS[0];
}

function getPokemonTypes(id) {
    return POKEMON_TYPES[String(id)] || [];
}

/* ===========================
   STORAGE
=========================== */

function getOwnedArray() {
    return JSON.parse(localStorage.getItem("ownedCards") || "[]");
}

function saveOwnedFromSet() {
    localStorage.setItem("ownedCards", JSON.stringify([...ownedSet].sort((a, b) => a - b)));
}

/* ===========================
   QR SYNC
=========================== */

function toBase64Url(b64) {
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return s;
}

function encodeOwnedBitset(ownedIds) {
    const bytes = new Uint8Array(Math.ceil(TOTAL_POKEMON / 8));
    ownedIds.forEach(id => {
        if (id >= 1 && id <= TOTAL_POKEMON) {
            const idx = id - 1;
            bytes[Math.floor(idx / 8)] |= (1 << (idx % 8));
        }
    });
    let binary = "";
    bytes.forEach(b => binary += String.fromCharCode(b));
    return toBase64Url(btoa(binary));
}

function decodeBitset(encoded) {
    const binary = atob(fromBase64Url(encoded));
    const ids = [];
    for (let i = 0; i < binary.length; i++) {
        const byte = binary.charCodeAt(i);
        for (let bit = 0; bit < 8; bit++) {
            if (byte & (1 << bit)) {
                const id = i * 8 + bit + 1;
                if (id <= TOTAL_POKEMON) ids.push(id);
            }
        }
    }
    return ids;
}

function encodeMega(ownedMega) {
    return toBase64Url(btoa(unescape(encodeURIComponent(JSON.stringify(ownedMega)))));
}

function decodeMega(encoded) {
    return JSON.parse(decodeURIComponent(escape(atob(fromBase64Url(encoded)))));
}

function generateQRCode() {
    const owned = [...ownedSet];
    const ownedMega = JSON.parse(localStorage.getItem("ownedMega") || "[]");
    const ownedShiny = [...shinySet];
    const bitset = encodeOwnedBitset(owned);
    const shinyBitset = encodeOwnedBitset(ownedShiny);
    const mega = encodeMega(ownedMega);
    const baseUrl = window.location.href.split("?")[0];
    const syncUrl = baseUrl + "?sync=" + bitset + "&shiny=" + shinyBitset + "&mega=" + mega;

    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";
    try {
        const qr = qrcode(0, "L");
        qr.addData(syncUrl);
        qr.make();
        qrContainer.innerHTML = qr.createImgTag(4);
    } catch (e) {
        qrContainer.innerHTML = '<p style="color:#c00;">Errore generazione QR: ' + String(e) + '</p>';
    }
}

(function importFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("sync")) return;

    try {
        const raw = params.get("sync");
        let ownedIds;

        try {
            const decoded = JSON.parse(atob(fromBase64Url(raw)));
            if (decoded.owned && Array.isArray(decoded.owned)) ownedIds = decoded.owned;
        } catch (_) {}

        if (!ownedIds) ownedIds = decodeBitset(raw);

        if (ownedIds) {
            ownedSet = new Set(ownedIds);
            saveOwnedFromSet();
        }

        let shinyCount = 0;
        if (params.has("shiny")) {
            try {
                const shinyIds = decodeBitset(params.get("shiny"));
                shinySet = new Set(shinyIds);
                saveOwnedShinyFromSet(shinySet);
                shinyCount = shinyIds.length;
            } catch (_) {}
        }

        let megaCount = 0;
        if (params.has("mega")) {
            try {
                const megaList = decodeMega(params.get("mega"));
                if (Array.isArray(megaList)) {
                    localStorage.setItem("ownedMega", JSON.stringify(megaList));
                    megaCount = megaList.length;
                }
            } catch (_) {}
        }

        history.replaceState({}, "", window.location.pathname);
        showToast(
            "Sincronizzazione completata! Carte: " + (ownedIds ? ownedIds.length : 0) +
            (shinyCount ? " | Shiny: " + shinyCount : "") +
            (megaCount ? " | Mega: " + megaCount : "")
        );
        updateProgressDashboard();
    } catch (e) {
        console.error("Errore importazione QR:", e);
        showToast("Errore durante la sincronizzazione.", "error");
    }
})();

/* ===========================
   PROGRESS DASHBOARD
=========================== */

function updateProgressDashboard() {
    const dash = document.getElementById("progress-dashboard");
    if (!dash) return;

    const owned = ownedSet.size;
    const shiny = shinySet.size;
    const pct = Math.round((owned / TOTAL_POKEMON) * 100);
    const mega = JSON.parse(localStorage.getItem("ownedMega") || "[]").length;

    let genBars = "";
    GENERATIONS.forEach(g => {
        const total = g.max - g.min + 1;
        const count = [...ownedSet].filter(id => id >= g.min && id <= g.max).length;
        const gp = Math.round((count / total) * 100);
        genBars += `
            <div class="gen-progress-row">
                <span class="gen-label">${g.name}</span>
                <div class="progress-bar-wrap small"><div class="progress-bar-fill" style="width:${gp}%"></div></div>
                <span class="gen-count">${count}/${total}</span>
            </div>`;
    });

    dash.innerHTML = `
        <div class="dashboard-stats">
            <div class="stat-box"><span class="stat-num">${owned}</span><span class="stat-label">/ ${TOTAL_POKEMON} carte</span></div>
            <div class="stat-box shiny-stat"><span class="stat-num">✨ ${shiny}</span><span class="stat-label">Shiny</span></div>
            <div class="stat-box"><span class="stat-num">${mega}</span><span class="stat-label">Mega/Gmax</span></div>
            <div class="stat-box"><span class="stat-num">${pct}%</span><span class="stat-label">Completamento</span></div>
        </div>
        <div class="overall-progress">
            <div class="progress-bar-wrap"><div class="progress-bar-fill gold" style="width:${pct}%"></div></div>
        </div>
        <details class="gen-details">
            <summary>Progresso per generazione</summary>
            ${genBars}
        </details>
    `;
}

/* ===========================
   RENDERING
=========================== */

function paginate(list) {
    const range = getGenRange(currentGen);
    return list.filter(c => c.id >= range.min && c.id <= range.max);
}

function renderPagination(totalItems, renderFn, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    GENERATIONS.forEach(g => {
        const btn = document.createElement("button");
        btn.className = "page-btn" + (g.gen === currentGen ? " active" : "");
        btn.textContent = g.name;
        btn.onclick = () => changeGen(g.gen, renderFn);
        container.appendChild(btn);
    });
}

function changeGen(gen, renderFn) {
    currentGen = gen;
    renderFn();
}

function buildCardElement(card, options = {}) {
    const { selectable = false, owned = false, showNote = false, shinyBadge = false } = options;
    const types = getPokemonTypes(card.id);
    const typeIconsHTML = types.map(t => `<img src="${TYPE_ICONS[t]}" class="type-icon" alt="${t}">`).join("");

    const div = document.createElement("div");
    div.id = `card-${card.id}`;
    div.className = `card${selectable ? " selectable" : ""}${owned ? " owned" : ""}${shinySet.has(card.id) ? " has-shiny" : ""}`;
    if (selectable) div.onclick = () => toggleOwned(card.id);

    let extra = "";
    if (shinyBadge && shinySet.has(card.id)) extra += `<span class="shiny-badge">✨</span>`;
    if (showNote) extra += noteBadgeHTML(card.id) + noteButtonHTML(card.id, card.name);

    div.innerHTML = `
        <p class="card-name">${card.name}${extra}</p>
        <p class="card-id">#${card.id}</p>
        <img src="${card.img}" alt="${card.name}" class="card-img" loading="lazy">
        <div class="type-row">${typeIconsHTML}</div>
        ${showNote && getNote(card.id) ? `<p class="card-note">${escapeAttr(getNote(card.id))}</p>` : ""}
    `;
    return div;
}

function renderCardsInto(containerId, cards, options, paginationId, renderFn) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    const pageItems = paginate(cards);
    const frag = document.createDocumentFragment();
    pageItems.forEach(card => {
        const owned = ownedSet.has(card.id);
        frag.appendChild(buildCardElement(card, { ...options, owned }));
    });
    container.appendChild(frag);
    if (paginationId) renderPagination(cards.length, renderFn, paginationId);
}

function renderHome() {
    renderCardsInto("list-home", filtered, {}, "pagination-home", renderHome);
}

function renderSelect() {
    renderCardsInto("list-select", filtered, { selectable: true }, "pagination-select", renderSelect);
}

function renderOwned() {
    const ownedCards = allCards.filter(c => ownedSet.has(c.id));
    renderCardsInto("list-owned", ownedCards, { showNote: true, shinyBadge: true }, "pagination-owned", renderOwned);
}

function renderMissing() {
    let missing = allCards.filter(c => !ownedSet.has(c.id));
    const typeFilter = document.getElementById("missing-type-filter");
    if (typeFilter && typeFilter.value) {
        missing = missing.filter(c => getPokemonTypes(c.id).includes(typeFilter.value));
    }
    renderCardsInto("list-missing", missing, {}, "pagination-missing", renderMissing);
}

function renderActiveTab() {
    updateProgressDashboard();
    switch (activeTab) {
        case "home": renderHome(); break;
        case "select": renderSelect(); break;
        case "owned": renderOwned(); break;
        case "missing": renderMissing(); break;
        case "shiny": renderShiny(); break;
        case "challenges": renderChallenges(); break;
    }
}

function showTab(tab) {
    activeTab = tab;
    document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
    document.getElementById(tab).style.display = "block";
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    document.getElementById("tab-" + tab).classList.add("active");

    if (tab === "megamax" && !window.__megamaxLoaded) {
        window.__megamaxLoaded = true;
        renderMegaGmax();
    }
    if (tab !== "megamax" && tab !== "battle") renderActiveTab();
}

/* ===========================
   SEARCH & FILTERS
=========================== */

document.getElementById("search").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    filtered = allCards.filter(c => c.name.toLowerCase().includes(q));
    currentGen = 1;
    renderActiveTab();
});

const missingFilter = document.getElementById("missing-type-filter");
if (missingFilter) {
    missingFilter.addEventListener("change", () => {
        if (activeTab === "missing") renderMissing();
    });
}

/* ===========================
   TOGGLE OWNED
=========================== */

function toggleOwned(id) {
    if (ownedSet.has(id)) {
        ownedSet.delete(id);
        if (shinySet.has(id)) {
            shinySet.delete(id);
            saveOwnedShinyFromSet(shinySet);
        }
        deleteNote(id);
    } else {
        ownedSet.add(id);
    }
    saveOwnedFromSet();
    updateChallengeProgress();

    const cardEl = document.getElementById(`card-${id}`);
    if (cardEl) cardEl.classList.toggle("owned", ownedSet.has(id));

    updateProgressDashboard();
    if (activeTab === "owned" || activeTab === "missing") renderActiveTab();
}

/* ===========================
   INIT
=========================== */

window.addEventListener("load", () => {
    const btn = document.getElementById("qrSyncBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            const box = document.getElementById("qrContainer");
            if (box.style.display === "none" || !box.style.display) {
                box.style.display = "block";
                generateQRCode();
            } else {
                box.style.display = "none";
            }
        });
    }
    updateProgressDashboard();
    renderActiveTab();
    getChallengeState();
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
}
