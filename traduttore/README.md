# Traduzioni Ldm4app (Vite + React + PWA)

Progetto Vite di base con supporto PWA e cartelle dedicate per il motore di traduzione (`src/workers`) e per i componenti dell'interfaccia (`src/components`).

Comandi principali:

- `npm install` — installa le dipendenze
- `npm run dev` — avvia il server di sviluppo
- `npm run build` — build di produzione
- `npm run preview` — preview della build

Dove mettere il tuo codice:

- Motore di traduzione (Web Worker): `src/workers`
- Componenti UI del gestionale: `src/components`

## Offline e caching del modello (PWA)

- Il Service Worker (configurato via `vite-plugin-pwa`) intercetta e memorizza i file del modello di `@xenova/transformers` man mano che vengono scaricati la prima volta.
- Usa il pulsante **Precarica modello** nell'interfaccia per avviare il caricamento e popolare la cache; dopo il primo caricamento il modello sarà disponibile offline (Cache Storage).
- Se vuoi forzare la cache da codice: invia `postMessage({ type: 'CACHE_URLS', urls: [...] })` al `navigator.serviceWorker.controller`.

---

## Motore Locale — Introduzione e Istruzioni

### Perché è meglio di Google Translate

- **Privacy 100%:** i tuoi dati non lasciano mai il computer.
- **Zero Costi:** non servono chiavi API o abbonamenti.
- **Offline Ready:** funziona anche in aereo o senza connessione (dopo il primo avvio).

### Istruzioni operative (Step-by-Step)

- **Primo Avvio:** "Al primo accesso, il sistema scaricherà il modello linguistico NLLB (circa 200-600MB). Vedrai una barra di caricamento. Una volta finito, il motore sarà residente nel tuo browser."

- **Selezione Lingue:** "Scegli la lingua di origine e quella di destinazione dal menu a tendina."

- **Traduzione:** "Scrivi o incolla il testo nel campo di sinistra. La traduzione apparirà a destra man mano che digiti (Debounced processing)."

- **Gestione Risorse:** "Se il PC rallenta, puoi mettere in pausa il motore AI dal tasto `Power` in basso a sinistra."


