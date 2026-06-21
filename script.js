// =========================
// CARICAMENTO LISTA POKEMON
// =========================

let allCards = [];
let filtered = [];
let currentTab = "home";
let currentPage = 1;
const itemsPerPage = 20;

// Carica lista carte
fetch("pokemon-list.js")
    .then(res => res.json())
    .then(data => {
        allCards = data;
        filtered = allCards;
        renderAll();
    });

// =========================
// GESTIONE LOCAL STORAGE
// =========================

function getOwned() {
    return JSON.parse(localStorage.getItem("ownedCards") || "[]");
}

function saveOwned(list) {
    localStorage.setItem("ownedCards", JSON.stringify(list));
}

// =========================
// RENDERING PAGINE
// =========================

function renderAll() {
    renderHome();
    renderSelect();
    renderOwned();
    renderMissing();
}

// HOME
function renderHome() {
    const container = document.getElementById("list-home");
    container.innerHTML = "";

    const pageItems = paginate(filtered);
    pageItems.forEach(card => {
        container.innerHTML += `
            <div class="card">
                <img src="${card.image}" alt="${card.name}">
                <p>${card.name}</p>
            </div>
        `;
    });

    renderPagination(filtered.length, renderHome, "pagination-home");
}

// SELEZIONA
function renderSelect() {
    const container = document.getElementById("list-select");
    container.innerHTML = "";

    const owned = getOwned();
    const pageItems = paginate(filtered);

    pageItems.forEach(card => {
        const isOwned = owned.includes(card.id);
        container.innerHTML += `
            <div class="card selectable ${isOwned ? "owned" : ""}" onclick="toggleOwned(${card.id})">
                <img src="${card.image}" alt="${card.name}">
                <p>${card.name}</p>
            </div>
        `;
    });

    renderPagination(filtered.length, renderSelect, "pagination-select");
}

// POSSEDUTI
function renderOwned() {
    const owned = getOwned();
    const ownedCards = allCards.filter(c => owned.includes(c.id));

    const container = document.getElementById("list-owned");
    container.innerHTML = "";

    const pageItems = paginate(ownedCards);
    pageItems.forEach(card => {
        container.innerHTML += `
            <div class="card">
                <img src="${card.image}" alt="${card.name}">
                <p>${card.name}</p>
            </div>
        `;
    });

    renderPagination(ownedCards.length, renderOwned, "pagination-owned");
}

// MANCANTI
function renderMissing() {
    const owned = getOwned();
    const missingCards = allCards.filter(c => !owned.includes(c.id));

    const container = document.getElementById("list-missing");
    container.innerHTML = "";

    const pageItems = paginate(missingCards);
    pageItems.forEach(card => {
        container.innerHTML += `
            <div class="card">
                <img src="${card.image}" alt="${card.name}">
                <p>${card.name}</p>
            </div>
        `;
    });

    renderPagination(missingCards.length, renderMissing, "pagination-missing");
}

// =========================
// PAGINAZIONE
// =========================

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

// =========================
// RICERCA
// =========================

document.getElementById("search").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    filtered = allCards.filter(c => c.name.toLowerCase().includes(q));
    currentPage = 1;
    renderAll();
});

// =========================
// GESTIONE POSSEDUTI
// =========================

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

// =========================
// QR CODE SYNC
// =========================

// Genera QR con i posseduti
function generateQRCode() {
    const owned = getOwned();

    const data = {
        owned: owned,
        timestamp: Date.now()
    };

    const encoded = btoa(JSON.stringify(data));

    document.getElementById("qrcode").innerHTML = "";

    new QRCode(document.getElementById("qrcode"), {
        text: encoded,
        width: 200,
        height: 200
    });
}

// Mostra QR
document.getElementById("qrSyncBtn").addEventListener("click", () => {
    const box = document.getElementById("qrContainer");
    box.style.display = box.style.display === "none" ? "block" : "none";
    generateQRCode();
});

// Import automatico via ?sync=
(function () {
    const params = new URLSearchParams(window.location.search);
    if (params.has("sync")) {
        try {
            const decoded = JSON.parse(atob(params.get("sync")));
            if (decoded.owned) {
                saveOwned(decoded.owned);
                alert("Sincronizzazione completata!");
                renderAll();
            }
        } catch (e) {
            console.error("Errore importazione QR:", e);
        }
    }
})();
