Turni proxy (Gemini/OpenAI)
=========================

Questa cartella contiene un esempio minimale di server proxy (Express) che inoltra richieste POST dalla UI a Gemini (Google Generative) o a OpenAI.
Lo scopo è evitare CORS/SSL problems e **non esporre** la chiave API nel client.

Installazione (sviluppo locale)
1. cd turni/proxy
2. npm install
3. Copia `.env.example` in `.env` e aggiungi `GEMINI_KEY` (o `OPENAI_KEY`)
4. npm start

Esempio di richiesta dal browser
POST JSON a `http://localhost:3000/proxy/gemini` con body:
{
  "model": "models/gemini-2.5-flash",
  "prompt": "ciao",
  "max_tokens": 100
}

Deploy su www.ldm4app.com/turni (produzione)
1) Copia la cartella `turni/proxy` sul server (es. `/var/www/turni/proxy`)
2) Imposta i seguenti env vars nel server (systemd o container):
   - GEMINI_KEY=tuo_gemini_key
   - ALLOWED_ORIGINS=https://www.ldm4app.com
   - PORT=3000 (opzionale)
3) Avvia come servizio (systemd):
   - Copia `turni/proxy/turni-proxy.service` in `/etc/systemd/system/`, modifica `WorkingDirectory` e `Environment` come sopra
   - systemctl daemon-reload
   - systemctl enable --now turni-proxy.service
4) Configura Nginx per inoltrare `/turni/proxy/` al servizio Node (vedi `nginx.turni.proxy.conf.example` in questa cartella). Assicurati che la location `/turni/proxy/` sia definita prima delle regole che servono i file statici di `/turni`.

Controlli e test
- curl -X POST 'https://www.ldm4app.com/turni/proxy/gemini' -H 'Content-Type: application/json' -d '{"model":"models/gemini-2.5-flash","prompt":"ping","max_tokens":1}'
- In browser: imposta `Proxy URL` su `/turni/proxy/gemini` e premi **Test Proxy** in `ia.turni.html`

Sicurezza e best practices
- Mantieni le chiavi API solo nel server (non nel client). Usa `ALLOWED_ORIGINS` per restringere CORS a `https://www.ldm4app.com`.
- Limita le IP/port con firewall se necessario.
- Assicurati che Nginx non risponda con HTML per le rotte proxy (evita `try_files` che riscrive a index.html per `/turni/proxy/*`).

Esempi utili
- `nginx.turni.proxy.conf.example` — snippet Nginx per /turni
- `turni-proxy.service` — esempio systemd unit

Se vuoi, posso preparare il patch Nginx completo e avviare il servizio (forniscimi accesso o le istruzioni che preferisci).
