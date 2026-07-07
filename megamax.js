/* ===========================
   TAB MEGA / GIGAMAX
   - Recupera tutte le forme Mega e Gigamax dalla PokéAPI
   - Permette di selezionare quali si possiedono (salvato in localStorage "ownedMega")
   - Collezione separata da quella principale
=========================== */

let megaGmaxCache = null;

function getOwnedMega() {
    return JSON.parse(localStorage.getItem("ownedMega") || "[]");
}

function saveOwnedMega(list) {
    localStorage.setItem("ownedMega", JSON.stringify(list));
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
    // Aggiorna solo la card cliccata, senza ridisegnare tutto
    const card = document.getElementById("megacard-" + CSS.escape(name));
    if (card) {
        if (owned.includes(name)) {
            card.classList.add("owned");
        } else {
            card.classList.remove("owned");
        }
    }
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

    const cached = localStorage.getItem("megaGmaxData_v2");
    if (cached) {
        try {
            megaGmaxCache = JSON.parse(cached);
            return megaGmaxCache;
        } catch (e) {}
    }

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
            const img =
                data.sprites.other?.["official-artwork"]?.front_default ||
                data.sprites.other?.home?.front_default ||
                data.sprites.front_default ||
                null;

            results.push({
                dexNumber: speciesId,
                name: data.name,
                img: img,
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
    try { localStorage.setItem("megaGmaxData_v2", JSON.stringify(results)); } catch (e) {}
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
    container.innerHTML = `
        <div style="width:100%; text-align:center; padding:30px;">
            <p>⏳ Caricamento in corso...</p>
        </div>`;

    try {
        const data = await loadMegaGmaxData();
        const owned = getOwnedMega();

        container.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px 0 4px 0;">
                <span id="mega-counter" style="font-weight:bold; color:#2a75bb;">
                    Possedute: ${owned.length}
                </span>
                <span style="color:#888; font-size:13px; margin-left:10px;">
                    (clicca una carta per segnarla come posseduta)
                </span>
            </div>
        `;

        data.forEach(p => {
            const isOwned = owned.includes(p.name);
            const badgeColor = p.kind === "Gigamax" ? "#8b5cf6" : "#e11d48";
            const imgTag = p.img
                ? `<img src="${p.img}" alt="${p.name}" class="card-img">`
                : `<div style="height:100px;display:flex;align-items:center;justify-content:center;color:#aaa;">🚫</div>`;

            const div = document.createElement("div");
            div.id = "megacard-" + p.name;
            div.className = "card selectable" + (isOwned ? " owned" : "");
            div.onclick = () => toggleOwnedMega(p.name);
            div.innerHTML = `
                <p class="card-name" style="font-size:13px;">${formatFormName(p.name)}</p>
                <p class="card-id">#${p.dexNumber}</p>
                ${imgTag}
                <div style="margin-top:8px;">
                    <span style="
                        display:inline-block;
                        padding:3px 8px;
                        border-radius:12px;
                        font-size:11px;
                        font-weight:bold;
                        color:white;
                        background:${badgeColor};
                    ">${p.kind}</span>
                </div>
            `;
            container.appendChild(div);
        });

        if (data.length === 0) {
            container.innerHTML = "<p style='text-align:center;width:100%;'>Nessun dato trovato.</p>";
        }

    } catch (err) {
        container.innerHTML = `<p style="text-align:center;width:100%;color:red;">⚠️ Errore: ${err.message}</p>`;
    }
}
