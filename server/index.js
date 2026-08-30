const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || "8085", 10);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "collection.json");
const SYNC_TOKEN = process.env.SYNC_TOKEN || "";
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, "public");

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

const app = express();
app.use(express.json({ limit: "2mb" }));

function ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ updatedAt: null }, null, 2));
    }
}

function readData() {
    ensureDataFile();
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
        return { updatedAt: null };
    }
}

function writeData(data) {
    ensureDataFile();
    data.updatedAt = new Date().toISOString();
    const tmp = DATA_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, DATA_FILE);
}

function checkAuth(req) {
    if (!SYNC_TOKEN) return true;
    const header = req.get("Authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.get("X-Sync-Token");
    return token === SYNC_TOKEN;
}

app.get("/api/health", (_req, res) => {
    res.json({ ok: true, sync: true });
});

app.get("/api/data", (_req, res) => {
    res.json(readData());
});

app.put("/api/data", (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Token non valido" });
    }
    const body = req.body || {};
    const data = readData();
    STORAGE_KEYS.forEach(key => {
        if (body[key] !== undefined) data[key] = body[key];
    });
    writeData(data);
    res.json({ ok: true, updatedAt: data.updatedAt });
});

app.use(express.static(PUBLIC_DIR, { maxAge: "1h", etag: true }));

app.get("*", (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Luca Pokémon — http://0.0.0.0:${PORT}`);
    console.log(`Dati: ${DATA_FILE}`);
    if (SYNC_TOKEN) console.log("Protezione sync: attiva");
});
