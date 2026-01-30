# Missione Manager

Applicazione web leggera per la gestione di una missione cattolica: volontari, progetti, donatori, calendario, logistica e reportistica.

Installazione: aprire `mission-app.html` in un browser moderno. I dati vengono salvati in `localStorage` per semplicità.

Credenziali demo: `admin` / `admin` (ruolo: admin), `coord` / `coord` (ruolo: coordinator). Usa il pulsante "Login" in alto per accedere.

Funzionalità incluse (skeleton):
- Dashboard con statistiche e grafici (Chart.js)
- Gestione Volontari (aggiungi, lista)
- Gestione Progetti (aggiungi, lista)
- Donatori e registrazione donazioni
- Calendario eventi semplici
- Report PDF veloce (jsPDF)

Questa è una base da estendere: ora include un MVP per autenticazione/ruoli, sincronizzazione cloud (mock), gestione pagamenti/donazioni (simulata), gestione inventario/logistica e supporto multilingua (IT/EN). Per produzione sono necessari: backend sicuro, gestione chiavi per pagamenti, webhook e autenticazione centralizzata.

Feature aggiunte in questo aggiornamento:
- Autenticazione e ruoli (admin/coordinator/volunteer) con visibilità controllata per azioni sensibili.
- Sincronizzazione (push/pull mock), esportazione/importazione JSON per backup.
- Pagamenti: form per registrare donazioni e link a sandbox PayPal (simulazione).
- Logistica/Inventario: gestione articoli e quantità con semplici comandi +1/-1.
- Internazionalizzazione: supporto IT/EN via selettore lingua (data-i18n).

Per test rapido: apri `mission-app.html`, accedi con `admin/admin` o `coord/coord` e esplora le nuove voci nel pannello laterale.

---

## Avviare un server locale (evitare errori CORS)
Quando apri il file direttamente con `file://` alcuni browser bloccano le richieste (CORS), causando errori come "Failed to load resource" per `sample-data.json` o `manifest.json`.
Per lavorare correttamente in sviluppo avvia un server locale nella cartella del progetto. Di seguito alcune opzioni semplici:

- Python 3 (consigliato, già presente su molti sistemi):
  - Apri PowerShell nella cartella del progetto e lancia:
    - `python -m http.server 8000` oppure su Windows: `py -m http.server 8000`
  - Apri poi nel browser: `http://localhost:8000/mission-app.html`

- Node (se hai Node.js):
  - Usa `npx` (senza installare globalmente): `npx http-server -p 8000` oppure `npx serve -p 8000`
  - Apri `http://localhost:8000/mission-app.html`

- VS Code: installa l'estensione **Live Server** e clicca con il tasto destro su `mission-app.html` → **Open with Live Server**.

Nota: dopo aver avviato il server locale, i file statici verranno serviti via `http` e gli errori CORS scompariranno. Se preferisci posso aggiungere un piccolo script `start-server` (Node) o una sezione nel README con screenshot dei passaggi. 
