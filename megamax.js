/* ===========================
   TAB MEGA / GIGAMAX
=========================== */

let megaGmaxCache = null;

function getOwnedMega() {
    return JSON.parse(localStorage.getItem("ownedMega") || "[]");
}

function saveOwnedMega(list) {
    localStorage.setItem("ownedMega", JSON.stringify(list));
}

function getBasePokemonImg(dexNumber) {
    const card = typeof POKEMON_LIST !== "undefined"
        ? POKEMON_LIST.find(c => c.id === dexNumber)
        : null;
    return card ? card.img : null;
}

function getMegaImgSources(entry) {
    const sources = [entry.img, ...(entry.fallbacks || [])];
    const base = getBasePokemonImg(entry.dexNumber);
    if (base) sources.push(base);
    return [...new Set(sources.filter(Boolean))];
}

function handleMegaImgError(img) {
    const list = (img.dataset.fallbacks || "").split("|").filter(Boolean);
    if (!list.length) {
        img.style.display = "none";
        const ph = img.nextElementSibling;
        if (ph && ph.classList.contains("mega-img-placeholder")) ph.style.display = "flex";
        return;
    }
    img.src = list.shift();
    img.dataset.fallbacks = list.join("|");
}

function buildMegaImgTag(entry) {
    const sources = getMegaImgSources(entry);
    const primary = sources[0];
    const fallbacks = sources.slice(1).join("|");
    if (!primary) {
        return `<div class="mega-img-placeholder">🚫</div>`;
    }
    return `
        <img src="${primary}" alt="${entry.name}" class="card-img mega-form-img" loading="lazy"
             data-fallbacks="${fallbacks}" onerror="handleMegaImgError(this)">
        <div class="mega-img-placeholder" style="display:none;">🚫</div>`;
}

function toggleOwnedMega(name) {
    let owned = getOwnedMega();
    if (owned.includes(name)) {
        owned = owned.filter(x => x !== name);
    } else {
        owned.push(name);
    }
    saveOwnedMega(owned);
    if (typeof updateChallengeProgress === "function") updateChallengeProgress();
    if (typeof renderChallenges === "function" && activeTab === "challenges") renderChallenges();

    const card = document.getElementById("megacard-" + CSS.escape(name));
    if (card) card.classList.toggle("owned", owned.includes(name));

    updateMegaCounter();
    if (typeof updateProgressDashboard === "function") updateProgressDashboard();
}

function updateMegaCounter() {
    const owned = getOwnedMega();
    const counter = document.getElementById("mega-counter");
    if (counter) counter.textContent = "Possedute: " + owned.length;
}

async function loadMegaGmaxData() {
    if (megaGmaxCache) return megaGmaxCache;

    if (typeof MEGA_GMAX_LIST !== "undefined" && MEGA_GMAX_LIST.length) {
        megaGmaxCache = MEGA_GMAX_LIST;
        return megaGmaxCache;
    }

    // Fallback API (lento) se il file statico non è disponibile
    const listRes = await fetch("https://pokeapi.co/api/v2/pokemon?limit=10000");
    const listData = await listRes.json();
    const candidates = listData.results.filter(
        p => p.name.includes("-mega") || p.name.includes("-gmax")
    );

    const results = [];
    for (const c of candidates) {
        try {
            const res = await fetch(c.url);
            const data = await res.json();
            const speciesId = parseInt(data.species.url.split("/").filter(Boolean).pop());
            const formId = data.id;
            const img =
                data.sprites.other?.["official-artwork"]?.front_default ||
                data.sprites.other?.home?.front_default ||
                data.sprites.front_default ||
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${formId}.png`;

            results.push({
                dexNumber: speciesId,
                formId,
                name: data.name,
                img,
                fallbacks: [
                    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${formId}.png`,
                    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${formId}.png`
                ],
                kind: c.name.includes("-gmax") ? "Gigamax" : "Megaevoluzione"
            });
        } catch (e) {
            console.error("Errore nel recuperare:", c.name, e);
        }
    }

    results.sort((a, b) => a.dexNumber !== b.dexNumber
        ? a.dexNumber - b.dexNumber
        : a.name.localeCompare(b.name));

    megaGmaxCache = results;
    return results;
}

function formatFormName(rawName) {
    return rawName
        .replace(/-/g, " ")
        .split(" ")
        .map(w => {
            if (w === "x" || w === "y") return w.toUpperCase();
            if (w === "mega") return "Mega";
            if (w === "gmax") return "Gigamax";
            return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(" ");
}

async function renderMegaGmax() {
    const container = document.getElementById("list-megagmax");
    container.innerHTML = `<div class="mega-loading"><p>⏳ Caricamento in corso...</p></div>`;

    try {
        const data = await loadMegaGmaxData();
        const owned = getOwnedMega();

        container.innerHTML = `
            <div class="mega-header">
                <span id="mega-counter" class="mega-counter">Possedute: ${owned.length}</span>
                <span class="mega-hint">(clicca una carta per segnarla come posseduta)</span>
            </div>
        `;

        const frag = document.createDocumentFragment();
        data.forEach(p => {
            const isOwned = owned.includes(p.name);
            const badgeClass = p.kind === "Gigamax" ? "badge-gmax" : "badge-mega";

            const div = document.createElement("div");
            div.id = "megacard-" + p.name;
            div.className = "card selectable mega-card" + (isOwned ? " owned" : "");
            div.onclick = () => toggleOwnedMega(p.name);
            div.innerHTML = `
                <p class="card-name mega-card-name">${formatFormName(p.name)}</p>
                <p class="card-id">#${p.dexNumber}</p>
                ${buildMegaImgTag(p)}
                <span class="mega-kind-badge ${badgeClass}">${p.kind}</span>
            `;
            frag.appendChild(div);
        });
        container.appendChild(frag);

        if (data.length === 0) {
            container.innerHTML = "<p class='mega-empty'>Nessun dato trovato.</p>";
        }
    } catch (err) {
        container.innerHTML = `<p class="mega-empty mega-error">⚠️ Errore: ${err.message}</p>`;
    }
}

// Rimuove cache obsoleta con URL immagine mancanti
try { localStorage.removeItem("megaGmaxData_v2"); } catch (_) {}
