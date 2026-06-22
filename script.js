let allCards = POKEMON_LIST;
let filtered = allCards;

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

let currentGen = 1;

async function getPokemonTypes(id) {
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();
        return data.types.map(t => t.type.name);
    } catch {
        return [];
    }
}

async function cardHTML(card, selectable = false, owned = false) {
    const types = await getPokemonTypes(card.id);

    const typeIconsHTML = types
        .map(t => `<img src="https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${t}.png" class="type-icon">`)
        .join("");

    return `
        <div class="card ${selectable ? "selectable" : ""} ${owned ? "owned" : ""}"
             onclick="${selectable ? `toggleOwned(${card.id})` : ""}">
            <p class="card-name">${card.name}</p>
            <p class="card-id">#${card.id}</p>
            <img src="${card.img}" class="card-img">
            <div class="type-row">${typeIconsHTML}</div>
        </div>
    `;
}

async function renderGeneration() {
    const container = document.getElementById("list-gen");
    container.innerHTML = "";

    const [start, end] = GENERATIONS[currentGen];
    const cards = allCards.filter(c => c.id >= start && c.id <= end);

    for (const card of cards) {
        container.innerHTML += await cardHTML(card);
    }
}

function selectGen(gen) {
    currentGen = gen;
    document.getElementById("gen-title").textContent = `Generazione ${gen}`;
    renderGeneration();
}

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
    const list = filtered.length > 0 ? filtered : allCards;

    for (const card of list) {
        container.innerHTML += await cardHTML(card, true, owned.includes(card.id));
    }
}

async function renderOwned() {
    const owned = getOwned();
    const cards = allCards.filter(c => owned.includes(c.id));

    const container = document.getElementById("list-owned");
    container.innerHTML = "";

    for (const card of cards) {
        container.innerHTML += await cardHTML(card);
    }
}

async function renderMissing() {
    const owned = getOwned();
    const cards = allCards.filter(c => !owned.includes(c.id));

    const container = document.getElementById("list-missing");
    container.innerHTML = "";

    for (const card of cards) {
        container.innerHTML += await cardHTML(card);
    }
}

document.getElementById("search").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    filtered = allCards.filter(c => c.name.toLowerCase().includes(q));
    renderSelect();
});

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

(function () {
    selectGen(1);
})();
