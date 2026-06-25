/* ===========================
   TAB MEGA / GIGAMAX
   Recupera dinamicamente da PokéAPI tutti i Pokémon
   con Megaevoluzione o forma Gigamax, ordinati per numero Pokédex.
=========================== */

let megaGmaxCache = null;

async function loadMegaGmaxData() {
    if (megaGmaxCache) return megaGmaxCache;

    // Cache persistente per evitare di richiamare l'API ad ogni visita
    const cached = localStorage.getItem("megaGmaxData");
    if (cached) {
        try {
            megaGmaxCache = JSON.parse(cached);
            return megaGmaxCache;
        } catch (e) {
            // cache corrotta, la ignoriamo e ricarichiamo
        }
    }

    const listRes = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000");
    const listData = await listRes.json();

    // Filtra solo le forme Mega e Gigamax
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

            const img =
                (data.sprites.other &&
                    data.sprites.other["official-artwork"] &&
                    data.sprites.other["official-artwork"].front_default) ||
                data.sprites.front_default;

            if (!img) continue;

            results.push({
                dexNumber: speciesId,
                name: data.name,
                img: img,
                kind: c.name.includes("-gmax") ? "Gigamax" : "Megaevoluzione"
            });
        } catch (e) {
            console.error("Errore nel recuperare la forma:", c.name, e);
        }
    }

    results.sort((a, b) => a.dexNumber - b.dexNumber);

    megaGmaxCache = results;
    localStorage.setItem("megaGmaxData", JSON.stringify(results));
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
    container.innerHTML = "<p style='text-align:center;width:100%;'>⏳ Caricamento Mega Evoluzioni e Gigamax...</p>";

    try {
        const data = await loadMegaGmaxData();
        container.innerHTML = "";

        data.forEach(p => {
            container.innerHTML += `
                <div class="card">
                    <p class="card-name">${formatFormName(p.name)}</p>
                    <p class="card-id">#${p.dexNumber} — ${p.kind}</p>
                    <img src="${p.img}" alt="${p.name}" class="card-img">
                </div>
            `;
        });

        if (data.length === 0) {
            container.innerHTML = "<p style='text-align:center;width:100%;'>Nessun dato trovato.</p>";
        }
    } catch (err) {
        container.innerHTML = `<p style="text-align:center;width:100%;">⚠️ Errore nel caricamento: ${err.message}</p>`;
    }
}
