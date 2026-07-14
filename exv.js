/* ===========================
   TAB EX / V
=========================== */

function getOwnedExV() {
    return JSON.parse(localStorage.getItem("ownedExV") || "[]");
}

function saveOwnedExV(list) {
    localStorage.setItem("ownedExV", JSON.stringify(list));
}

function getExVImg(entry) {
    const card = typeof POKEMON_LIST !== "undefined"
        ? POKEMON_LIST.find(c => c.id === entry.dexNumber)
        : null;
    return card ? card.img : null;
}

function buildExVImgTag(entry) {
    const img = getExVImg(entry);
    if (!img) {
        return `<div class="exv-img-placeholder">🚫</div>`;
    }
    return `<img src="${img}" alt="${entry.name}" class="card-img exv-form-img" loading="lazy">`;
}

function toggleOwnedExV(name) {
    let owned = getOwnedExV();
    if (owned.includes(name)) {
        owned = owned.filter(x => x !== name);
    } else {
        owned.push(name);
    }
    saveOwnedExV(owned);
    if (typeof updateChallengeProgress === "function") updateChallengeProgress();
    if (typeof renderChallenges === "function" && activeTab === "challenges") renderChallenges();

    const card = document.getElementById("exvcard-" + CSS.escape(name));
    if (card) card.classList.toggle("owned", owned.includes(name));

    updateExVCounter();
    if (typeof updateProgressDashboard === "function") updateProgressDashboard();
}

function updateExVCounter() {
    const owned = getOwnedExV();
    const counter = document.getElementById("exv-counter");
    if (counter) counter.textContent = "Possedute: " + owned.length;
}

function formatExVName(rawName) {
    return rawName
        .replace(/-/g, " ")
        .split(" ")
        .map(w => {
            if (w === "ex") return "EX";
            if (w === "v") return "V";
            return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(" ");
}

function loadExVData() {
    if (typeof EX_V_LIST !== "undefined" && EX_V_LIST.length) {
        return [...EX_V_LIST].sort((a, b) =>
            a.dexNumber !== b.dexNumber
                ? a.dexNumber - b.dexNumber
                : a.name.localeCompare(b.name)
        );
    }
    return [];
}

function renderExV() {
    const container = document.getElementById("list-exv");
    if (!container) return;

    const data = loadExVData();
    const owned = getOwnedExV();

    container.innerHTML = `
        <div class="exv-header">
            <span id="exv-counter" class="exv-counter">Possedute: ${owned.length}</span>
            <span class="exv-hint">(clicca una carta per segnarla come posseduta)</span>
        </div>
    `;

    if (data.length === 0) {
        container.innerHTML += "<p class='exv-empty'>Nessun dato trovato.</p>";
        return;
    }

    const frag = document.createDocumentFragment();
    data.forEach(p => {
        const isOwned = owned.includes(p.name);
        const badgeClass = p.kind === "EX" ? "badge-ex" : "badge-v";

        const div = document.createElement("div");
        div.id = "exvcard-" + p.name;
        div.className = "card selectable exv-card" + (isOwned ? " owned" : "");
        div.onclick = () => toggleOwnedExV(p.name);
        div.innerHTML = `
            <p class="card-name exv-card-name">${formatExVName(p.name)}</p>
            <p class="card-id">#${p.dexNumber}</p>
            ${buildExVImgTag(p)}
            <span class="exv-kind-badge ${badgeClass}">${p.kind}</span>
        `;
        frag.appendChild(div);
    });
    container.appendChild(frag);
}
