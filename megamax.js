/* ===========================
   TAB MEGA / GIGAMAX
   Usa limit=10000 per includere tutte le forme speciali
   (le Mega/Gigamax hanno ID >10000 nell'API e sfuggono con limit=2000)
=========================== */

let megaGmaxCache = null;

async function loadMegaGmaxData() {
    if (megaGmaxCache) return megaGmaxCache;

    // Cache localStorage per evitare di richiamare l'API ad ogni visita
    const cached = localStorage.getItem("megaGmaxData_v2");
    if (cached) {
        try {
            megaGmaxCache = JSON.parse(cached);
            return megaGmaxCache;
        } catch (e) {
            // cache corrotta, ignora
        }
    }

    // limit=10000 necessario: le forme Mega/Gmax hanno ID >10000 nell'API
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

            const speciesId = parseInt(
                data.species.url.split("/").filter(Boolean).pop()
            );

            // Prova prima official-artwork, poi fallback su sprite normale
            const img =
                (data.sprites.other?.["official-artwork"]?.front_default) ||
                (data.sprites.other?.home?.front_default) ||
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

    results.sort((a, b) => {
        if (a.dexNumber !== b.dexNumber) return a.dexNumber - b.dexNumber;
        return a.name.localeCompare(b.name);
    });

    megaGmaxCache = results;
    try {
        localStorage.setItem("megaGmaxData_v2", JSON.stringify(results));
    } catch (e) {
        // localStorage pieno, ignora
    }
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
            <p>⏳ Caricamento in corso... (prima volta può richiedere qualche secondo)</p>
        </div>`;

    try {
        const data = await loadMegaGmaxData();

        if (data.length === 0) {
            container.innerHTML = "<p style='text-align:center;width:100%;'>Nessun dato trovato.</p>";
            return;
        }

        container.innerHTML = "";
        data.forEach(p => {
            const imgTag = p.img
                ? `<img src="${p.img}" alt="${p.name}" class="card-img">`
                : `<div style="height:100px;display:flex;align-items:center;justify-content:center;color:#aaa;">🚫 Immagine non disponibile</div>`;

            const badgeColor = p.kind === "Gigamax" ? "#8b5cf6" : "#e11d48";

            container.innerHTML += `
                <div class="card">
                    <p class="card-name" style="font-size:14px;">${formatFormName(p.name)}</p>
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
                </div>
            `;
        });

    } catch (err) {
        container.innerHTML = `<p style="text-align:center;width:100%;color:red;">⚠️ Errore nel caricamento: ${err.message}</p>`;
    }
}
