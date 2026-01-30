# Server per Gestionale Ristoranti 🔧

Questo server Express legge e scrive i dati in:

`C:\Users\lucde\Desktop\gestionale ristoranti\database.json`

## Installazione

1. Apri una PowerShell nella cartella del progetto (`c:\Users\lucde\Desktop\programma missione`).
2. Esegui:

```powershell
npm install
```

## Avvio

```powershell
npm start
```

Il server ascolterà su `http://localhost:3000` (o `process.env.PORT`).

## Endpoint

- GET `/api/data` → restituisce il contenuto di `database.json`.
- POST `/api/data` → salva il JSON inviato in `database.json`.

## Test rapidi

- Recupera i dati:

```powershell
curl http://localhost:3000/api/data
```

- Salva un file di esempio (`sample-database.json` fornito) con:

```powershell
curl -X POST -H "Content-Type: application/json" -d @sample-database.json http://localhost:3000/api/data
```

> Nota: il server creerà la cartella `gestionale ristoranti` e il file `database.json` se non esistono. Se riscontri problemi di permessi, esegui PowerShell come utente con i permessi necessari.
