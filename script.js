let allCards = POKEMON_LIST;
let filtered = allCards;
let currentPage = 1;
const itemsPerPage = 50;

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

function renderHome() {
    const container = document.getElementById("list-home");
    container.innerHTML = "";

    const pageItems = paginate(filtered);
    pageItems.forEach(card => {
        container.innerHTML += `
            <div class="card">
                <img src="${card.img}" alt="${card.name}">
                <p>${card.name}</p>
            </div>
        `;
    });

    renderPagination(filtered.length, renderHome, "pagination-home");
}

function renderSelect() {
    const container = document.getElementById("list-select");
    container.innerHTML = "";

    const owned = getOwned();
    const pageItems = paginate(filtered);

    pageItems.forEach(card => {
        const isOwned = owned.includes(card.id);
        container.innerHTML += `
            <div class="card selectable ${isOwned ? "owned" : ""}" onclick="toggleOwned(${card.id})">
                <img src="${card.img}" alt="${card.name}">
                <p>${card.name}</p>
            </div>
        `;
    });

    renderPagination(filtered.length, renderSelect, "pagination-select");
}

function renderOwned() {
    const owned = getOwned();
    const ownedCards = allCards.filter(c => owned.includes(c.id));

    const container = document.getElementById("list-owned");
    container.innerHTML = "";

    const pageItems = paginate(ownedCards);
    pageItems.forEach(card => {
        container.innerHTML += `
            <div class="card">
                <img src="${card.img}" alt="${card.name}">
                <p>${card.name}</p>
            </div>
        `;
    });

    renderPagination(ownedCards.length, renderOwned, "pagination-owned");
}

function renderMissing() {
    const owned = getOwned();
    const missingCards = allCards.filter(c => !owned.includes(c.id));

    const container = document.getElementById("list-missing");
    container.innerHTML = "";

    const pageItems = paginate(missingCards);
    pageItems.forEach(card => {
        container.innerHTML += `
            <div class="card">
                <img src="${card.img}" alt="${card.name}">
                <p>${card.name}</p>
            </div>
        `;
    });

    renderPagination(missingCards.length, renderMissing, "pagination-missing");
}

document.getElementById("search").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    filtered = allCards.filter(c => c.name.toLowerCase().includes(q));
    currentPage = 1;
    renderAll();
});

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
