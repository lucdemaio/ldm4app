# Soccer PWA (Demo)

Questa è una PWA di base pronta per essere usata in un sito web.

## Contenuto creato
- `index.html` — Pagina principale
- `manifest.json` — Manifest PWA
- `sw.js` — Service Worker (cache statico e fallback offline)
- `offline.html` — Pagina di fallback offline
- `assets/css/styles.css` — Stili base
- `assets/js/app.js` — Registrazione SW + install prompt
- `assets/icons/*` — Icone SVG (192 & 512)

## Come testare
1. Avvia un server locale nella cartella (es: `npx http-server .` oppure `python -m http.server 8080`).

   Se non hai Python o non puoi usare npx, puoi avviare lo script PowerShell incluso:
   - Esegui `start-server.bat` (doppio click) per aprire una finestra PowerShell che esegue il server (usa `-ExecutionPolicy Bypass`).
   - Oppure, da PowerShell: `powershell -ExecutionPolicy Bypass -NoProfile -File "serve.ps1" -Port 8080`.

2. Apri `http://localhost:8080` in Chrome/Firefox (HTTPS è necessario per SW in produzione; localhost è OK). Se carichi la cartella come sottocartella (es: `https://tuosito.com/pwa/`) le risorse usano percorsi relativi ed è compatibile.
3. Controlla che il Service Worker si registri (Console). Disconnettiti per vedere la pagina offline.
4. Sul browser compatibile puoi installare la PWA (compare `beforeinstallprompt`).

Nota: il Service Worker è registrato con percorso relativo (`./sw.js`) così il suo scope rimane nella cartella dove caricherai la PWA, permettendo di servire l'app anche da una sottocartella del sito.

## Miglioramenti possibili
- Aggiungere caching dinamico più sofisticato
- Aggiungere immagini raster (PNG) per compatibilità wide
- Aggiungere versioning e update notification

---
Creato automaticamente — pronto per essere integrato nel sito web.
