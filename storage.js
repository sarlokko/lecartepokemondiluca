/* ===========================
   STORAGE + SYNC NAS
   I dati locali non vengono mai cancellati: unione con il NAS.
=========================== */

const STORAGE_KEYS = [
    "ownedCards",
    "ownedShiny",
    "ownedMega",
    "ownedExV",
    "cardNotes",
    "challengeState",
    "battleStatsAllTime",
    "typeQuizStatsAllTime"
];

let serverSyncEnabled = false;
let serverSaveTimer = null;
let serverPollTimer = null;
let lastServerUpdatedAt = null;
let pendingServerSave = false;

function storageGetJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function storageSetJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    scheduleServerSave();
}

function hasServerData(data) {
    if (!data) return false;
    return STORAGE_KEYS.some(key => {
        const val = data[key];
        if (val == null) return false;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "object") return Object.keys(val).length > 0;
        return true;
    });
}

function mergeIdArrays(a, b) {
    const set = new Set();
    (Array.isArray(a) ? a : []).forEach(id => set.add(id));
    (Array.isArray(b) ? b : []).forEach(id => set.add(id));
    return [...set].sort((x, y) => x - y);
}

function mergeStringArrays(a, b) {
    const set = new Set();
    (Array.isArray(a) ? a : []).forEach(s => set.add(s));
    (Array.isArray(b) ? b : []).forEach(s => set.add(s));
    return [...set].sort();
}

function mergeNotes(server, local) {
    return { ...(server || {}), ...(local || {}) };
}

function mergeNumericStats(server, local, extraKeys = []) {
    const base = { correct: 0, wrong: 0, total: 0, bestStreak: 0, currentStreak: 0 };
    const a = { ...base, ...(server || {}) };
    const b = { ...base, ...(local || {}) };
    const keys = ["correct", "wrong", "total", "bestStreak", "currentStreak", ...extraKeys];
    const out = {};
    keys.forEach(k => {
        out[k] = Math.max(a[k] || 0, b[k] || 0);
    });
    return out;
}

function getWeekKey() {
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const year = monday.getFullYear();
    const start = new Date(year, 0, 1);
    const week = Math.ceil(((monday - start) / 86400000 + start.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, "0")}`;
}

function mergeChallengeState(server, local) {
    if (!local?.weekKey) return server || local;
    if (!server?.weekKey) return local;
    const current = getWeekKey();
    if (local.weekKey === current) return local;
    if (server.weekKey === current) return server;
    const localDone = (local.completedIds || []).length;
    const serverDone = (server.completedIds || []).length;
    return localDone >= serverDone ? local : server;
}

function mergeStorageData(server, local) {
    return {
        ownedCards: mergeIdArrays(server?.ownedCards, local?.ownedCards),
        ownedShiny: mergeIdArrays(server?.ownedShiny, local?.ownedShiny),
        ownedMega: mergeStringArrays(server?.ownedMega, local?.ownedMega),
        ownedExV: mergeStringArrays(server?.ownedExV, local?.ownedExV),
        cardNotes: mergeNotes(server?.cardNotes, local?.cardNotes),
        battleStatsAllTime: mergeNumericStats(server?.battleStatsAllTime, local?.battleStatsAllTime),
        typeQuizStatsAllTime: mergeNumericStats(server?.typeQuizStatsAllTime, local?.typeQuizStatsAllTime, ["almost"]),
        challengeState: mergeChallengeState(server?.challengeState, local?.challengeState)
    };
}

function applyServerData(data) {
    STORAGE_KEYS.forEach(key => {
        if (data[key] !== undefined) {
            localStorage.setItem(key, JSON.stringify(data[key]));
        }
    });
    if (data.updatedAt) lastServerUpdatedAt = data.updatedAt;
}

function collectLocalData() {
    const data = {};
    STORAGE_KEYS.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                data[key] = JSON.parse(raw);
            } catch {
                data[key] = null;
            }
        }
    });
    return data;
}

function countOwnedCards(data) {
    return Array.isArray(data?.ownedCards) ? data.ownedCards.length : 0;
}

async function pushAllToServer() {
    if (!serverSyncEnabled) return;
    pendingServerSave = true;
    try {
        const headers = { "Content-Type": "application/json" };
        if (window.SYNC_TOKEN) headers.Authorization = "Bearer " + window.SYNC_TOKEN;
        const res = await fetch("/api/data", {
            method: "PUT",
            headers,
            body: JSON.stringify(collectLocalData())
        });
        if (res.ok) {
            const body = await res.json();
            lastServerUpdatedAt = body.updatedAt;
        }
    } catch (e) {
        console.warn("Sync NAS: salvataggio fallito", e);
    } finally {
        pendingServerSave = false;
    }
}

function scheduleServerSave() {
    if (!serverSyncEnabled) return;
    clearTimeout(serverSaveTimer);
    serverSaveTimer = setTimeout(() => pushAllToServer(), 600);
}

async function pullFromServer() {
    if (!serverSyncEnabled || pendingServerSave) return;
    try {
        const res = await fetch("/api/data", { cache: "no-store" });
        if (!res.ok) return;
        const serverData = await res.json();
        if (serverData.updatedAt && serverData.updatedAt === lastServerUpdatedAt) return;

        const localData = collectLocalData();
        const merged = mergeStorageData(serverData, localData);
        const before = countOwnedCards(localData);
        const after = countOwnedCards(merged);

        applyServerData(merged);
        lastServerUpdatedAt = serverData.updatedAt;

        if (after > before) {
            scheduleServerSave();
        }

        reloadAppFromStorage();
        updateSyncIndicator();
    } catch (_) {}
}

function startServerPolling() {
    if (serverPollTimer) return;
    serverPollTimer = setInterval(() => {
        if (document.visibilityState === "visible") pullFromServer();
    }, 15000);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") pullFromServer();
    });
}

function updateSyncIndicator() {
    const el = document.getElementById("sync-indicator");
    if (!el) return;
    if (serverSyncEnabled) {
        el.textContent = "☁️ NAS";
        el.className = "sync-indicator sync-on";
        el.title = "Sincronizzazione automatica con il NAS attiva — i dati locali sono uniti, non sostituiti";
    } else {
        el.textContent = "📱 Locale";
        el.className = "sync-indicator sync-off";
        el.title = "Dati su questo dispositivo — usa il QR o il NAS per sincronizzare";
    }
}

function reloadAppFromStorage() {
    if (typeof ownedSet !== "undefined") {
        ownedSet = new Set(storageGetJSON("ownedCards", []));
    }
    if (typeof shinySet !== "undefined") {
        shinySet = new Set(storageGetJSON("ownedShiny", []));
    }
    if (typeof updateProgressDashboard === "function") updateProgressDashboard();
    if (typeof renderActiveTab === "function") renderActiveTab();
    if (activeTab === "megamax" && typeof renderMegaGmax === "function") renderMegaGmax();
    if (activeTab === "exv" && typeof renderExV === "function") renderExV();
    if (activeTab === "battle" && typeof renderBattleStats === "function") renderBattleStats();
    if (activeTab === "typequiz" && typeof initTypeQuiz === "function") initTypeQuiz();
}

async function initAppStorage() {
    try {
        const health = await fetch("/api/health", { cache: "no-store" });
        if (!health.ok) return;
        serverSyncEnabled = true;

        const res = await fetch("/api/data", { cache: "no-store" });
        const serverData = await res.json();
        const localData = collectLocalData();
        const beforeOwned = countOwnedCards(localData);

        const serverHas = hasServerData(serverData);
        const localHas = hasServerData(localData);

        if (serverHas && localHas) {
            const merged = mergeStorageData(serverData, localData);
            applyServerData(merged);
            await pushAllToServer();
            const afterOwned = countOwnedCards(merged);
            if (typeof showToast === "function" && afterOwned >= beforeOwned) {
                const added = afterOwned - beforeOwned;
                const msg = added > 0
                    ? `Collezione unita sul NAS: ${afterOwned} carte (${added} aggiunte dal NAS)`
                    : `Collezione sincronizzata sul NAS: ${afterOwned} carte conservate`;
                showToast(msg, "success", 5000);
            }
        } else if (serverHas) {
            applyServerData(serverData);
            if (typeof showToast === "function") {
                showToast(`Collezione caricata dal NAS: ${countOwnedCards(serverData)} carte`, "success", 4000);
            }
        } else if (localHas) {
            await pushAllToServer();
            if (typeof showToast === "function") {
                showToast(`Collezione caricata sul NAS: ${beforeOwned} carte importate`, "success", 4000);
            }
        } else if (serverData.updatedAt) {
            lastServerUpdatedAt = serverData.updatedAt;
        }

        startServerPolling();
    } catch (_) {
        serverSyncEnabled = false;
    }
    updateSyncIndicator();
}

function isServerSyncEnabled() {
    return serverSyncEnabled;
}

function exportLocalBackup() {
    const data = collectLocalData();
    data.exportedAt = new Date().toISOString();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `luca-pokemon-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === "function") {
        showToast("Backup scaricato — conservalo in sicurezza!", "success");
    }
}

function importBackupFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const imported = JSON.parse(reader.result);
            const local = collectLocalData();
            const merged = mergeStorageData(imported, local);
            applyServerData(merged);
            reloadAppFromStorage();
            scheduleServerSave();
            if (typeof showToast === "function") {
                showToast(`Backup ripristinato: ${countOwnedCards(merged)} carte`, "success", 4500);
            }
        } catch {
            if (typeof showToast === "function") showToast("File backup non valido", "error");
        }
    };
    reader.readAsText(file);
}
