/* ===========================
   CONFIG
=========================== */

let allCards = POKEMON_LIST;
let filtered = allCards;

// GENERAZIONI
const GENERATIONS = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 905],
    9: [906, 1025]
};

// Colori titolo generazione
const GEN_COLORS = {
    1: "gen1",
    2: "gen2",
    3: "gen3",
    4: "gen4",
    5: "gen5",
    6: "gen6",
    7: "gen7",
    8: "gen8",
    9: "gen9"
};

let currentGen = 1;

// Cache tipi per evitare richieste duplicate
const typeCache = {};

// Icone ufficiali Pokémon HOME
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

/* ===========================
   FETCH TIPI AUTOMATICO
=========================== */

async function getPokemonTypes(id) {
    if (typeCache[id]) return typeCache[id];

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();
        const types = data.types.map(t => t.type.name);

        typeCache[id] = types;
        return types;
    } catch (e) {
        console.error("Errore tipi Pokémon:", e);
        return [];
    }
}

/* ===========================
   GENERAZIONI
=========================== */

function selectGen(gen) {
    currentGen = gen;

    // aggiorna titolo
    const title = document.getElementById("gen-title");
    title.textContent = `Generazione ${gen}`;

    // reset classi colore
    title.className = "";
    title.classList.add(GEN_COLORS[gen]);

    // aggiorna bottoni menu
    document.querySelectorAll("#gen-menu button").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`#gen-menu button:nth-child(${gen})`).classList.add("active");

    renderGeneration();
}

function renderGeneration() {
    const container = document.getElementById("list-gen");
    container.innerHTML = "";

    const [start, end] = GENERATIONS[currentGen];
    const cards = allCards.filter(c => c.id >= start && c.id <= end);

    cards.forEach(async card => {
        container.innerHTML += await cardHTML(card);
    });
}

/* ===========================
   RENDERING ORIGINALE (TABS)
=========================== */

function getOwned() {
    return JSON.parse(localStorage.getItem("ownedCards") || "[]");
}

function saveOwned(list) {
    localStorage.setItem("ownedCards", JSON.stringify(list));
}

async function renderSelect() {
    const container = document.getElementById("list-select");
    container.innerHTML = "";

    const owned = getOwned();

    for (const card of filtered) {
        container.innerHTML += await cardHTML(card, true, owned.includes(card.id));
    }
}

async function renderOwned() {
    const owned = getOwned();
    const ownedCards = allCards.filter(c => owned.includes(c.id));

    const container = document.getElementById("list-owned");
    container.innerHTML = "";

    for (const card of ownedCards) {
        container.innerHTML += await cardHTML(card);
    }
}

async function renderMissing() {
    const owned = getOwned();
    const missingCards = allCards.filter(c => !owned.includes(c.id));

    const container = document.getElementById("list-missing");
    container.innerHTML = "";

    for (const card of missingCards) {
        container.innerHTML += await cardHTML(card);
    }
}

/* ===========================
   SEARCH
=========================== */

document.getElementById("search").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    filtered = allCards.filter(c => c.name.toLowerCase().includes(q));

    renderSelect();
    renderOwned();
    renderMissing();
});

/* ===========================
   TOGGLE OWNED
=========================== */

function toggleOwned(id) {
    let owned = getOwned();

    if (owned.includes(id)) {
        owned = owned.filter(x => x !== id);
    } else {
        owned.push(id);
    }

    saveOwned(owned);

    renderSelect();
    renderOwned();
    renderMissing();
}

/* ===========================
   QR CODE SYNC
=========================== */

function generateQRCode() {
    const owned = JSON.parse(localStorage.getItem("ownedCards") || "[]");

    const data = {
        owned: owned,
        timestamp: Date.now()
    };

    const encoded = btoa(JSON.stringify(data));

    const syncUrl = `https://sarlokko.github.io/lecartepokemondiluca/?sync=${encoded}`;

    document.getElementById("qrcode").innerHTML = "";

    new QRCode(document.getElementById("qrcode"), {
        text: syncUrl,
        width: 200,
        height: 200
    });
}

document.getElementById("qrSyncBtn").addEventListener("click", () => {
    const box = document.getElementById("qrContainer");
    box.style.display = box.style.display === "none" ? "block" : "none";
    generateQRCode();
});

/* IMPORT AUTOMATICO DA URL ?sync= */
(function () {
    const params = new URLSearchParams(window.location.search);

    if (params.has("sync")) {
        try {
            const decoded = JSON.parse(atob(params.get("sync")));
            if (decoded.owned) {
                localStorage.setItem("ownedCards", JSON.stringify(decoded.owned));
                alert("Sincronizzazione completata!");
            }
        } catch (e) {
            console.error("Errore importazione QR:", e);
        }
    }

    // lettura generazione da URL
    if (params.has("gen")) {
        const g = parseInt(params.get("gen"));
        if (g >= 1 && g <= 9) currentGen = g;
    }

    // avvia generazione
    selectGen(currentGen);

})();
