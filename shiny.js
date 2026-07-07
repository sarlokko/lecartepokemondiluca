/* Varianti Shiny — UI */

function toggleShiny(id) {
    if (shinySet.has(id)) {
        shinySet.delete(id);
    } else if (ownedSet.has(id)) {
        shinySet.add(id);
    } else {
        showToast("Devi possedere la carta normale prima dello Shiny!", "warn");
        return;
    }
    saveOwnedShinyFromSet(shinySet);
    updateChallengeProgress();

    const cardEl = document.getElementById(`shinycard-${id}`);
    if (cardEl) cardEl.classList.toggle("owned", shinySet.has(id));

    updateProgressDashboard();
    if (activeTab === "shiny") renderShiny();
}

function renderShiny() {
    const container = document.getElementById("list-shiny");
    if (!container) return;
    container.innerHTML = "";

    const ownedCards = allCards.filter(c => ownedSet.has(c.id));
    const pageItems = paginate(ownedCards);
    const frag = document.createDocumentFragment();

    pageItems.forEach(card => {
        const isShiny = shinySet.has(card.id);
        const div = document.createElement("div");
        div.id = `shinycard-${card.id}`;
        div.className = `card selectable shiny-card ${isShiny ? "owned" : ""}`;
        div.onclick = () => toggleShiny(card.id);

        const types = getPokemonTypes(card.id);
        const typeIconsHTML = types.map(t => `<img src="${TYPE_ICONS[t]}" class="type-icon" alt="${t}">`).join("");
        const imgSrc = getShinyImg(card.id);
        const fallback = getShinyImgFallback(card.id);

        div.innerHTML = `
            <p class="card-name">${card.name} <span class="shiny-sparkle">✨</span></p>
            <p class="card-id">#${card.id}</p>
            <img src="${imgSrc}" alt="${card.name} Shiny" class="card-img shiny-img"
                 onerror="this.onerror=null;this.src='${fallback}'">
            <div class="type-row">${typeIconsHTML}</div>
            <p class="shiny-status">${isShiny ? "✅ Shiny posseduto" : "Tocca per segnare Shiny"}</p>
        `;
        frag.appendChild(div);
    });
    container.appendChild(frag);
    renderPagination(ownedCards.length, renderShiny, "pagination-shiny");
}
