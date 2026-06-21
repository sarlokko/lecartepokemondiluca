/* ===========================
   CONFIG
=========================== */

let allCards = POKEMON_LIST;
let filtered = allCards;
let currentPage = 1;
const itemsPerPage = 50; // come hai impostato tu

// Cache per non rifare richieste
const typeCache = {};

// Icone ufficiali Pokémon HOME (Opzione A)
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
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
}

function renderPagination(totalItems, renderFunction, containerId) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        container.innerHTML += `
            <button class="page-btn ${i === currentPage ? "active" : ""}" onclick="changePage(${i}, '${renderFunction.name}')">${i}</button>
        `;
    }
}

function changePage(page, fnName) {
    currentPage = page;
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
    currentPage = 1;
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
