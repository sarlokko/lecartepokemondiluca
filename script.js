/* ============================
   GESTIONE TAB
============================ */

const tabs = document.querySelectorAll(".tabs button");
const sections = document.querySelectorAll(".tab-content");

tabs.forEach(btn => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;

        tabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        sections.forEach(sec => sec.classList.remove("active"));
        document.getElementById(tab).classList.add("active");

        renderAll();
    });
});

/* ============================
   STORAGE CARTE POSSEDUTE
============================ */

const STORAGE_KEY = "pokemon_owned_luca";

function loadOwned() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveOwned() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(owned));
}

let owned = loadOwned();

/* ============================
   FUNZIONI DI RENDER
============================ */

function createCard(p, options = {}) {
    const { checkbox = false, links = false } = options;

    const div = document.createElement("div");
    div.className = "pokemon-card";

    // immagine
    const img = document.createElement("img");
    img.src = p.img;
    img.alt = p.name;
    div.appendChild(img);

    // nome
    const name = document.createElement("div");
    name.className = "pokemon-name";
    name.textContent = p.name;
    div.appendChild(name);

    // id
    const id = document.createElement("div");
    id.className = "pokemon-id";
    id.textContent = "#" + p.id.toString().padStart(4, "0");
    div.appendChild(id);

    // checkbox
    if (checkbox) {
        const row = document.createElement("label");
        row.className = "checkbox-row";

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!owned[p.id];

        cb.addEventListener("change", () => {
            if (cb.checked) owned[p.id] = true;
            else delete owned[p.id];
            saveOwned();
            renderAll();
        });

        row.appendChild(cb);
        row.appendChild(document.createTextNode("Posseduta"));
        div.appendChild(row);
    }

    // link marketplace
    if (links) {
        const row = document.createElement("div");
        row.className = "links-row";

        const q = encodeURIComponent(p.name + " Pokémon card");

        const ct = document.createElement("a");
        ct.href = "https://www.cardtrader.com/cards/search?q=" + q;
        ct.target = "_blank";
        ct.className = "link-btn";
        ct.textContent = "CardTrader Zero";

        const cm = document.createElement("a");
        cm.href = "https://www.cardmarket.com/it/Pokemon/Products/Search?searchString=" + q;
        cm.target = "_blank";
        cm.className = "link-btn secondary";
        cm.textContent = "Cardmarket";

        row.appendChild(ct);
        row.appendChild(cm);
        div.appendChild(row);
    }

    return div;
}

function renderHome() {
    const q = document.getElementById("search-home").value.toLowerCase();
    const list = document.getElementById("list-home");
    list.innerHTML = "";

    POKEMON_LIST.filter(p =>
        p.name.toLowerCase().includes(q) || p.id.toString().includes(q)
    ).forEach(p => list.appendChild(createCard(p)));
}

function renderSelect() {
    const q = document.getElementById("search-select").value.toLowerCase();
    const list = document.getElementById("list-select");
    list.innerHTML = "";

    POKEMON_LIST.filter(p =>
        p.name.toLowerCase().includes(q) || p.id.toString().includes(q)
    ).forEach(p => list.appendChild(createCard(p, { checkbox: true })));
}

function renderOwned() {
    const q = document.getElementById("search-owned").value.toLowerCase();
    const list = document.getElementById("list-owned");
    const empty = document.getElementById("empty-owned");

    const ownedList = POKEMON_LIST.filter(p => owned[p.id]);

    list.innerHTML = "";

    ownedList
        .filter(p => p.name.toLowerCase().includes(q) || p.id.toString().includes(q))
        .forEach(p => list.appendChild(createCard(p, { links: true })));

    empty.style.display = ownedList.length === 0 ? "block" : "none";
}

function renderMissing() {
    const q = document.getElementById("search-missing").value.toLowerCase();
    const list = document.getElementById("list-missing");
    const empty = document.getElementById("empty-missing");

    const missingList = POKEMON_LIST.filter(p => !owned[p.id]);

    list.innerHTML = "";

    missingList
        .filter(p => p.name.toLowerCase().includes(q) || p.id.toString().includes(q))
        .forEach(p => list.appendChild(createCard(p, { links: true })));

    empty.style.display = missingList.length === 0 ? "block" : "none";
}

function renderAll() {
    renderHome();
    renderSelect();
    renderOwned();
    renderMissing();
}

/* ============================
   EVENTI DI RICERCA
============================ */

["home", "select", "owned", "missing"].forEach(id => {
    document.getElementById("search-" + id).addEventListener("input", renderAll);
});

/* ============================
   AVVIO
============================ */

renderAll();
