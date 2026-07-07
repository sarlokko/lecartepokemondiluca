/* Note per carta — solo sulle possedute */

function getNotes() {
    try {
        return JSON.parse(localStorage.getItem("cardNotes") || "{}");
    } catch {
        return {};
    }
}

function getNote(id) {
    return getNotes()[String(id)] || "";
}

function saveNote(id, text) {
    const notes = getNotes();
    const trimmed = text.trim();
    if (trimmed) {
        notes[String(id)] = trimmed;
    } else {
        delete notes[String(id)];
    }
    localStorage.setItem("cardNotes", JSON.stringify(notes));
}

function deleteNote(id) {
    saveNote(id, "");
}

function openNoteEditor(id, name) {
    const current = getNote(id);
    const text = prompt(`Nota per ${name}:`, current);
    if (text === null) return;
    saveNote(id, text);
    renderActiveTab();
}

function noteBadgeHTML(id) {
    const note = getNote(id);
    if (!note) return "";
    return `<span class="note-badge" title="${escapeAttr(note)}">📝</span>`;
}

function noteButtonHTML(id, name) {
    const hasNote = !!getNote(id);
    return `<button class="note-btn" onclick="event.stopPropagation(); openNoteEditor(${id}, '${escapeAttr(name)}')" title="Aggiungi nota">${hasNote ? "📝" : "✏️"}</button>`;
}

function escapeAttr(str) {
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;");
}
