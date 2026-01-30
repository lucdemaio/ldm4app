# PWA Missione — Deploy rapido

Questa cartella contiene una Progressive Web App completa basata su `mission-app.html` del progetto originale. Puoi caricare tutto il contenuto di `c:\Users\lucde\Desktop\pwa missione` su un sito web per avere l'app funzionante via `index.html`.

Cosa è stato incluso ✅
- `index.html` — entrypoint PWA (derivato da `mission-app.html`)
- `manifest.json` — manifest PWA
- `sw.js` — service worker con caching offline
- `offline.html` — pagina offline
- `assets/` — CSS e tutti gli script JS necessari
- `sample-data.json`, `missione-tutti-i-dati.json`, `mission-export.json` — dati di esempio
- `icons/icon.svg` — icona app

Istruzioni rapide (locale)
1. Avvia un server locale per testare la PWA (necessario per service worker e fetch):
   - Python: `python -m http.server 8000` (da dentro la cartella `pwa missione`)
   - Oppure usa un server statico a tua scelta.
2. Apri `http://localhost:8000` nel browser.
3. Controlla in DevTools > Application: manifest e service worker registrati.

Istruzioni per pubblicazione
- Carica l'intera cartella `pwa missione` sul tuo hosting (HTTPS raccomandato per installabilità).
- Assicurati che `index.html` sia raggiungibile come root (es. https://tuo-dominio/).

Note tecniche
- La sincronizzazione cloud è un mock (`SyncModule`) — richiede un endpoint reale per funzionare.
- I backup/esportazioni generano file JSON/PDF scaricabili in locale.
- Le funzionalità che richiedono servizi esterni (es. Google Drive, PayPal) sono solo scheletri o aprono la pagina esterna.

Se vuoi, posso: 
- Impacchettare la cartella in un .zip pronto per upload ✅
- Aggiungere un singolo comando `deploy` (FTP, rsync, GitHub Pages) ✨

Fammi sapere quale di questi preferisci! (Breve e diretto)