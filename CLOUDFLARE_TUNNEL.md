# Cloudflare Tunnel — accesso esterno (stesso tunnel di easyproxy)

Espone l'app Pokémon all'esterno riusando il **tunnel Cloudflare già attivo** per easyproxy.

L'app sul NAS risponde su **porta 8085** → il tunnel deve puntare lì.

---

## Metodo A — Dashboard Cloudflare (consigliato)

Se easyproxy è gestito da Zero Trust / Dashboard:

1. Vai su [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels**
2. Apri il **tunnel già usato per easyproxy** (non creare uno nuovo)
3. Tab **Public Hostname** (o **Published application routes**) → **Add a public hostname**
4. Configura:

| Campo | Valore |
|-------|--------|
| **Subdomain** | es. `luca` o `pokemon` |
| **Domain** | il tuo dominio (stesso di easyproxy) |
| **Type** | HTTP |
| **URL** | `localhost:8085` |

5. **Save**

Risultato: `https://luca.tuodominio.it` → app Pokémon (HTTPS automatico).

### Se `localhost:8085` non funziona

Il tunnel potrebbe girare in Docker senza accesso a `localhost` del NAS. Prova:

- `http://127.0.0.1:8085`
- `http://IP-LAN-NAS:8085` (es. `192.168.1.50:8085`)
- `http://host.docker.internal:8085` (solo se cloudflared è in Docker su Linux recente)

Verifica prima sul NAS che l'app risponde:

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8085
```

Deve rispondere `200`.

---

## Metodo B — File `config.yml` (cloudflared locale)

Se gestisci il tunnel con un file di configurazione (come easyproxy), **aggiungi una riga ingress** sopra la regola finale `404`:

```yaml
tunnel: <ID-TUNNEL-EASYPROXY>
credentials-file: /percorso/<ID>.json

ingress:
  # ... regola easyproxy esistente ...
  - hostname: easyproxy.tuodominio.it
    service: http://localhost:XXXX

  # NUOVA — app Pokémon Luca
  - hostname: luca.tuodominio.it
    service: http://localhost:8085

  # Catch-all obbligatorio (ultima riga)
  - service: http_status:404
```

Poi riavvia cloudflared:

```bash
# esempio se è un container Docker
docker restart cloudflared

# oppure servizio systemd
sudo systemctl restart cloudflared
```

Se il DNS non si crea automaticamente:

```bash
cloudflared tunnel route dns <nome-tunnel> luca.tuodominio.it
```

---

## Dopo la configurazione

1. Apri `https://luca.tuodominio.it` da **fuori casa** (4G sul telefono, non Wi‑Fi)
2. Controlla **☁️ NAS** nell'header (sync attiva)
3. Segna una carta → verifica su un altro dispositivo

**Non serve** usare l'IP `192.168.x.x:8085` dall'esterno: solo il dominio Cloudflare.

---

## Sicurezza (consigliata)

L'app è pubblica su Internet. Opzioni:

### 1. Cloudflare Access (come easyproxy, se già lo usi)

Zero Trust → **Access** → **Applications** → Add application:

- Domain: `luca.tuodominio.it`
- Policy: email tua / famiglia

### 2. Token sync sul NAS

In `docker-compose.yml`:

```yaml
environment:
  SYNC_TOKEN: "un-token-lungo-e-segreto"
```

E in `index.html` prima di `storage.js`:

```html
<script>window.SYNC_TOKEN = "un-token-lungo-e-segreto";</script>
```

---

## Risoluzione problemi

| Problema | Soluzione |
|----------|-----------|
| 502 Bad Gateway | URL servizio errato → prova IP LAN del NAS |
| 404 da Cloudflare | Hostname non nel tunnel o DNS non propagato |
| Sito easyproxy ok, Pokémon no | Porta 8085: `docker compose ps` sul NAS |
| ☁️ NAS non appare | Normale se tunnel ok; sync dipende dal NAS raggiungibile dal tunnel |

---

## Riepilogo

```
Internet  →  Cloudflare  →  tunnel easyproxy  →  localhost:8085  →  luca-pokemon (Docker)
                HTTPS              (stesso tunnel)              (stessa NAS)
```

Un solo tunnel, due hostname: easyproxy + luca-pokemon.
