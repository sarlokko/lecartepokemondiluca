/* ===========================
   CONFIG
=========================== */

let allCards = POKEMON_LIST;
let filtered = allCards;
let currentGen = 1;

// Range Pokédex nazionale per generazione
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

function getGenRange(gen) {
    return GENERATIONS.find(g => g.gen === gen) || GENERATIONS[0];
}

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
   RENDERING
=========================== */

renderAll();

function getOwned() {
    return JSON.parse(localStorage.getItem("ownedCards") || "[]");
}

function saveOwned(list) {
    localStorage.setItem("ownedCards", JSON.stringify(list));
}

function renderAll() {
    renderHome();
    renderSelect();
    renderOwned();
    renderMissing();
}

function paginate(list) {
    const range = getGenRange(currentGen);
    return list.filter(c => c.id >= range.min && c.id <= range.max);
}

function renderPagination(totalItems, renderFunction, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    GENERATIONS.forEach(g => {
        container.innerHTML += `
            <button class="page-btn ${g.gen === currentGen ? "active" : ""}" onclick="changeGen(${g.gen}, '${renderFunction.name}')">${g.name}</button>
        `;
    });
}

function changeGen(gen, fnName) {
    currentGen = gen;
    window[fnName]();
}

/* ===========================
   CARD TEMPLATE
=========================== */

async function cardHTML(card, selectable = false, owned = false) {
    const types = await getPokemonTypes(card.id);

    const typeIconsHTML = types
        .map(t => `<img src="${TYPE_ICONS[t]}" class="type-icon">`)
        .join("");

    return `
        <div class="card ${selectable ? "selectable" : ""} ${owned ? "owned" : ""}"
             ${selectable ? `onclick="toggleOwned(${card.id})"` : ""}>

            <p class="card-name">${card.name}</p>
            <p class="card-id">#${card.id}</p>

            <img src="${card.img}" alt="${card.name}" class="card-img">

            <div class="type-row">${typeIconsHTML}</div>
        </div>
    `;
}

/* ===========================
   RENDER SEZIONI
=========================== */

async function renderHome() {
    const container = document.getElementById("list-home");
    container.innerHTML = "";

    const pageItems = paginate(filtered);

    for (const card of pageItems) {
        container.innerHTML += await cardHTML(card);
    }

    renderPagination(filtered.length, renderHome, "pagination-home");
}

async function renderSelect() {
    const container = document.getElementById("list-select");
    container.innerHTML = "";

    const owned = getOwned();
    const pageItems = paginate(filtered);

    for (const card of pageItems) {
        container.innerHTML += await cardHTML(card, true, owned.includes(card.id));
    }

    renderPagination(filtered.length, renderSelect, "pagination-select");
}

async function renderOwned() {
    const owned = getOwned();
    const ownedCards = allCards.filter(c => owned.includes(c.id));

    const container = document.getElementById("list-owned");
    container.innerHTML = "";

    const pageItems = paginate(ownedCards);

    for (const card of pageItems) {
        container.innerHTML += await cardHTML(card);
    }

    renderPagination(ownedCards.length, renderOwned, "pagination-owned");
}

async function renderMissing() {
    const owned = getOwned();
    const missingCards = allCards.filter(c => !owned.includes(c.id));

    const container = document.getElementById("list-missing");
    container.innerHTML = "";

    const pageItems = paginate(missingCards);

    for (const card of pageItems) {
        container.innerHTML += await cardHTML(card);
    }

    renderPagination(missingCards.length, renderMissing, "pagination-missing");
}

/* ===========================
   SEARCH
=========================== */

document.getElementById("search").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    filtered = allCards.filter(c => c.name.toLowerCase().includes(q));
    currentGen = 1;
    renderAll();
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
    renderAll();
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

    // URL COMPLETO PER IMPORT AUTOMATICO
    const syncUrl = `https://sarlokko.github.io/lecartepokemondiluca/?sync=${encoded}`;

    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";

    // typeNumber 0 = la libreria scala automaticamente la dimensione del QR
    // in base a quanti dati deve contenere (anche centinaia di carte)
    const qr = qrcode(0, "L");
    qr.addData(syncUrl);
    qr.make();

    qrContainer.innerHTML = qr.createImgTag(4); // 4 = dimensione pixel per modulo
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
})();
