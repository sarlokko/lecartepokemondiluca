# Installazione su UGREEN DXP2800 (UGOS Pro)

Guida per hostare **Le Carte Pokémon di Luca** sul NAS con sincronizzazione automatica tra telefono e PC.

## Cosa ottieni

- App accessibile da tutti i dispositivi sulla stessa URL
- **Sync automatica**: segni una carta sul telefono → appare sul PC (entro ~15 secondi)
- Dati salvati sul NAS in `data/collection.json`
- Indicatore nell'app: **☁️ NAS** = sync attiva, **📱 Locale** = solo dispositivo

---

## Requisiti

- UGREEN NASync DXP2800 con UGOS Pro
- Docker installato dall'App Center
- ~150 MB di spazio (app + container)

---

## Passo 1 — Copia i file sul NAS

1. Scarica o clona il repository sul PC
2. Copia l'intera cartella del progetto sul NAS, es.:
   ```
   /volume1/docker/luca-pokemon/
   ```
3. La cartella deve contenere: `docker-compose.yml`, `Dockerfile`, `server/`, tutti i file `.js`, `index.html`, ecc.

---

## Passo 2 — Avvia con Docker

### Opzione A — Interfaccia Docker (Projects)

1. Apri **Docker** → **Projects** → **Create**
2. Nome: `luca-pokemon`
3. Percorso: la cartella copiata sul NAS
4. Usa il file `docker-compose.yml` incluso
5. Clic **Deploy**

### Opzione B — Terminale SSH

```bash
cd /volume1/docker/luca-pokemon
docker compose up -d --build
```

---

## Passo 3 — Apri l'app

Da un dispositivo sulla stessa rete:

```
http://IP-DEL-NAS:8085
```

Esempio: `http://192.168.1.50:8085`

Dovresti vedere **☁️ NAS** nell'header (sync attiva).

---

## Passo 4 — Accesso da remoto (opzionale)

### UGREENlink (più semplice)

1. Attiva UGREENlink in **Control Panel** → **Device Connection**
2. Configura l'accesso remoto al NAS
3. Per il container Docker, in **Docker** → container → **Settings** → abilita accesso remoto UGREENlink

### Tailscale (più sicuro)

Installa Tailscale sul NAS e sui dispositivi → accedi via IP Tailscale.

### Cloudflare Tunnel (accesso esterno con dominio)

Riusa il tunnel già usato per **easyproxy**: guida completa in **`CLOUDFLARE_TUNNEL.md`**.

In breve: Zero Trust → Tunnels → tunnel easyproxy → **Add public hostname** → `localhost:8085`.

---

## Token di sicurezza (opzionale)

Per evitare modifiche da estranei, modifica `docker-compose.yml`:

```yaml
environment:
  SYNC_TOKEN: "il-tuo-token-segreto"
```

Poi aggiungi in `index.html` prima di `storage.js`:

```html
<script>window.SYNC_TOKEN = "il-tuo-token-segreto";</script>
```

---

## I tuoi dati non si perdono

L'app **non cancella** la collezione esistente. Funziona così:

| Situazione | Cosa succede |
|------------|--------------|
| Hai carte su GitHub Pages / telefono | Apri l'URL del NAS → dati **importati** automaticamente |
| Hai carte su NAS e sul telefono | Vengono **uniti** (unione, non sostituzione) |
| Solo GitHub Pages, senza NAS | Tutto come prima, `localStorage` locale |
| Backup manuale | Pulsanti **💾** (esporta) e **📂** (ripristina) nell'header |

**Consiglio:** prima di passare al NAS, clicca **💾** per scaricare un backup JSON.

### Prima sincronizzazione

1. Apri l'app dove hai già segnato le carte (es. GitHub Pages)
2. Clic **💾** per un backup (opzionale ma consigliato)
3. Apri `http://IP-NAS:8085` sullo stesso dispositivo
4. Vedrai un messaggio tipo: *"Collezione caricata sul NAS: X carte importate"*
5. Su altri dispositivi: apri la stessa URL → stessi dati

Il QR code (**Aggiorna 🔄**) resta disponibile come alternativa.

---

## Comandi utili

```bash
# Stato
docker compose ps

# Log
docker compose logs -f

# Riavvio
docker compose restart

# Aggiornamento dopo modifica codice
docker compose up -d --build

# Backup dati
cp data/collection.json data/collection-backup-$(date +%Y%m%d).json
```

---

## Risorse sul DXP2800

| | |
|---|---|
| Spazio disco | ~150 MB totali |
| RAM container | ~30–50 MB |
| CPU a riposo | 0% |
| CPU in uso | picchi brevi su click/apertura |

---

## Risoluzione problemi

**Vedo 📱 Locale invece di ☁️ NAS**
- L'app non è servita dal container (stai aprendo file locali o GitHub Pages)
- Il container non è avviato: `docker compose ps`
- Porta 8085 bloccata dal firewall

**Modifiche non si propagano**
- Attendi ~15 secondi (polling automatico)
- Ricarica la pagina sull'altro dispositivo
- Controlla i log: `docker compose logs`

**Permessi Docker su UGOS**
Se il container non legge i file, consulta la documentazione UGREEN su `ugacltool` per i permessi ACL.

---

## Struttura dati

File: `data/collection.json` sul NAS

Contiene: carte possedute, shiny, mega, EX/V, note, sfide, statistiche lotte e quiz.

**Fai backup regolari** di questo file.
