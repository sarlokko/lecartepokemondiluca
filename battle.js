/* ===========================
   TAB LOTTE — BATTLE LOGIC
   (richiede script.js già caricato: usa getOwned() e allCards)
=========================== */

let battler1 = null;
let battler2 = null;

function pickRandomBattlers() {
  const owned = getOwned(); // funzione già presente in script.js
  if (owned.length < 2) {
    document.getElementById("battlePreview").innerHTML =
      "<p>Devi possedere almeno 2 carte per lottare!</p>";
    document.getElementById("winnerChoice").style.display = "none";
    document.getElementById("battleResult").innerHTML = "";
    return;
  }

  const shuffled = owned.slice().sort(() => Math.random() - 0.5);
  const id1 = shuffled[0];
  const id2 = shuffled[1];

  battler1 = allCards.find(p => p.id === id1);
  battler2 = allCards.find(p => p.id === id2);

  renderBattlePreview();
  populateWinnerSelect();
  document.getElementById("winnerChoice").style.display = "block";
  document.getElementById("battleResult").innerHTML = "";
}

function renderBattlePreview() {
  document.getElementById("battlePreview").innerHTML = `
    <div style="text-align:center;">
      <img src="${battler1.img}" style="width:120px;height:120px;object-fit:contain;">
      <p><strong>${battler1.name}</strong></p>
    </div>
    <div style="font-size:28px;align-self:center;">VS</div>
    <div style="text-align:center;">
      <img src="${battler2.img}" style="width:120px;height:120px;object-fit:contain;">
      <p><strong>${battler2.name}</strong></p>
    </div>
  `;
}

function populateWinnerSelect() {
  document.getElementById("winnerSelect").innerHTML = `
    <option value="1">${battler1.name}</option>
    <option value="2">${battler2.name}</option>
  `;
}

/* ===========================
   TABELLA EFFICACIA TIPI (semplificata)
=========================== */
const TYPE_CHART = {
  fire: { weak: ["water", "rock", "ground"], strong: ["grass", "ice", "bug", "steel"] },
  water: { weak: ["grass", "electric"], strong: ["fire", "rock", "ground"] },
  grass: { weak: ["fire", "ice", "flying", "bug", "poison"], strong: ["water", "rock", "ground"] },
  electric: { weak: ["ground"], strong: ["water", "flying"] },
  ice: { weak: ["fire", "rock", "fighting", "steel"], strong: ["grass", "ground", "flying", "dragon"] },
  fighting: { weak: ["flying", "psychic", "fairy"], strong: ["normal", "rock", "steel", "ice", "dark"] },
  poison: { weak: ["ground", "psychic"], strong: ["grass", "fairy"] },
  ground: { weak: ["water", "grass", "ice"], strong: ["fire", "electric", "rock", "poison", "steel"] },
  flying: { weak: ["electric", "ice", "rock"], strong: ["grass", "fighting", "bug"] },
  psychic: { weak: ["bug", "ghost", "dark"], strong: ["fighting", "poison"] },
  bug: { weak: ["fire", "flying", "rock"], strong: ["grass", "psychic", "dark"] },
  rock: { weak: ["water", "grass", "fighting", "ground", "steel"], strong: ["fire", "ice", "flying", "bug"] },
  ghost: { weak: ["ghost", "dark"], strong: ["psychic", "ghost"] },
  dragon: { weak: ["ice", "dragon", "fairy"], strong: ["dragon"] },
  dark: { weak: ["fighting", "bug", "fairy"], strong: ["psychic", "ghost"] },
  steel: { weak: ["fire", "fighting", "ground"], strong: ["rock", "ice", "fairy"] },
  fairy: { weak: ["poison", "steel"], strong: ["fighting", "dragon", "dark"] },
  normal: { weak: ["fighting"], strong: [] },
};

function typeEffectiveness(attackerTypes, defenderTypes) {
  let multiplier = 1;
  let notes = [];
  attackerTypes.forEach(at => {
    defenderTypes.forEach(dt => {
      const chart = TYPE_CHART[at];
      if (!chart) return;
      if (chart.strong.includes(dt)) {
        multiplier *= 2;
        notes.push(`${at} è superefficace contro ${dt}`);
      }
      if (chart.weak.includes(dt)) {
        multiplier *= 0.5;
        notes.push(`${at} è poco efficace contro ${dt}`);
      }
    });
  });
  return { multiplier, notes };
}

/* ===========================
   FETCH STATISTICHE COMPLETE
=========================== */
async function fetchFullStats(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!res.ok) throw new Error(`Pokémon #${id} non trovato su PokéAPI`);
  const data = await res.json();
  const stats = {};
  data.stats.forEach(s => (stats[s.stat.name] = s.base_stat));
  return {
    types: data.types.map(t => t.type.name),
    abilities: data.abilities.map(a => a.ability.name),
    hp: stats["hp"],
    attack: stats["attack"],
    defense: stats["defense"],
    speed: stats["speed"],
  };
}

/* ===========================
   LOTTA
=========================== */
async function runBattle() {
  const resultDiv = document.getElementById("battleResult");
  resultDiv.innerHTML = "<p>⏳ Sto calcolando la lotta...</p>";

  try {
    const [data1, data2] = await Promise.all([
      fetchFullStats(battler1.id),
      fetchFullStats(battler2.id),
    ]);

    const eff1to2 = typeEffectiveness(data1.types, data2.types);
    const eff2to1 = typeEffectiveness(data2.types, data1.types);

    const score1 = (data1.attack * 1.2 + data1.speed * 0.8 + data1.hp * 0.6) * eff1to2.multiplier;
    const score2 = (data2.attack * 1.2 + data2.speed * 0.8 + data2.hp * 0.6) * eff2to1.multiplier;

    const winnerIs1 = score1 >= score2;
    const predictedWinner = winnerIs1 ? battler1 : battler2;
    const predictedLoser = winnerIs1 ? battler2 : battler1;
    const winnerData = winnerIs1 ? data1 : data2;
    const winnerNotes = winnerIs1 ? eff1to2.notes : eff2to1.notes;
    const winnerScore = winnerIs1 ? score1 : score2;
    const loserScore = winnerIs1 ? score2 : score1;

    const userChoice = document.getElementById("winnerSelect").value;
    const userPick = userChoice === "1" ? battler1 : battler2;
    const correct = userPick.id === predictedWinner.id;

    resultDiv.innerHTML = `
      <div style="border:2px solid #28a745;border-radius:10px;padding:18px;max-width:600px;margin:0 auto;">
        <h3 style="text-align:center;">🏆 Vince ${predictedWinner.name}!</h3>
        <p style="text-align:center;">${correct ? "✅ Hai indovinato!" : "❌ Avevi scelto l'altro, peccato!"}</p>
        <hr>
        <p><strong>${battler1.name}</strong> — Tipo: ${data1.types.join("/")} | HP: ${data1.hp} | Attacco: ${data1.attack} | Difesa: ${data1.defense} | Velocità: ${data1.speed}</p>
        <p><strong>${battler2.name}</strong> — Tipo: ${data2.types.join("/")} | HP: ${data2.hp} | Attacco: ${data2.attack} | Difesa: ${data2.defense} | Velocità: ${data2.speed}</p>
        <hr>
        <p><strong>Perché vince ${predictedWinner.name}:</strong></p>
        <ul>
          ${
            winnerNotes.length
              ? winnerNotes.map(n => `<li>${n}</li>`).join("")
              : "<li>Nessun vantaggio di tipo particolare: ha vinto per statistiche superiori (attacco/velocità/HP).</li>"
          }
          <li>Punteggio di battaglia stimato: ${predictedWinner.name} ${Math.round(winnerScore)} vs ${predictedLoser.name} ${Math.round(loserScore)}</li>
          <li>Abilità di ${predictedWinner.name}: ${winnerData.abilities.join(", ")}</li>
        </ul>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<p>⚠️ Errore nel recuperare i dati: ${err.message}</p>`;
  }
}
