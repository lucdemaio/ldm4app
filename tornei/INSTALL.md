# 🚀 GUIDA INSTALLAZIONE RAPIDA

## ⚡ 5 Secondi - Avvia l'App

```bash
# 1. Apri semplicemente il file in browser
index.html

# ✅ Fatto! Nessun server necessario
```

---

## 💻 Installazione Completa (Opzionale)

### Per Hosting Locale

#### Windows
```powershell
# 1. Scarica il progetto
git clone https://github.com/your-org/gestionale-tornei-pro.git
cd gestionale-tornei-pro

# 2. Avvia server locale (Python)
python -m http.server 8000

# 3. Apri http://localhost:8000 in browser
```

#### Mac / Linux
```bash
# 1. Scarica il progetto
git clone https://github.com/your-org/gestionale-tornei-pro.git
cd gestionale-tornei-pro

# 2. Avvia server locale (Node.js)
npx http-server

# 3. Apri http://localhost:8080 in browser
```

---

## 🔑 Setup Iniziale (1° Accesso)

### 1️⃣ Crea Password Admin
- Apri **Admin Panel** (⚙️ > Admin Panel)
- Clicca "Configura Password"
- Inserisci password (almeno 6 caratteri)
- ✅ Fatto! Ora sei admin

### 2️⃣ Seleziona Lingua (Opzionale)
- Clicca icona🌍 in alto a destra
- Scegli tra: IT, EN, ES, FR, DE
- Pagina si ricarica automaticamente

### 3️⃣ Attiva Dark Mode (Opzionale)
- Clicca icona🌙 in alto a destra per toggleare
- Tema si applica immediatamente

### 4️⃣ Abilita Cloud Sync (Opzionale)
- Admin Panel > Impostazioni > Abilita API Cloud
- Inserisci API URL (se hai server)
- ✅ Backup automatico attivato

---

## 📱 Installazione come PWA (App)

### Android
1. Apri l'app in **Chrome**
2. Tap il menu (⋮)
3. Seleziona "Installa app"
4. ✅ App installata sulla home

### iOS
1. Apri l'app in **Safari**
2. Tap condivisione (⬆️)
3. Seleziona "Aggiungi a Home"
4. ✅ App installata sulla home

### Desktop (Windows/Mac)
1. Apri l'app nel browser (Chrome/Edge)
2. Click address bar
3. Click "Installa" (icona appare)
4. ✅ App installata come applicazione

---

## 🎯 Primo Torneo: Step by Step

### Step 1: Crea Torneo
```
1. Clicca "Nuovo Torneo" (sidebar sinistra)
2. Compila il form:
   - Nome: "Torneo Calcio Estate 2026"
   - Sport: Calcio
   - Formato: Girone all'italiana
   - Num Squadre: 8
3. Clicca "Salva"
```

### Step 2: Aggiungi Squadre
```
1. Durante creazione torneo, compila:
   - Elenco squadre: (una per riga)
     AC Milano
     Inter Milano
     Juventus
     etc
2. Oppure aggiungi dopo in "Squadre"
```

### Step 3: Aggiungi Giocatori
```
1. Vai a "Giocatori"
2. Clicca "Nuovo Giocatore"
3. Compila:
   - Nome, Cognome
   - Squadra
   - Ruolo (opzionale)
   - Numero maglia
4. Salva
5. Ripeti per tutti i giocatori
```

### Step 4: Genera Calendario
```
1. Torna al torneo
2. Clicca "Genera Calendario"
3. Sistema genera automaticamente le partite
4. Puoi modificare date se vuoi
5. Pubblica quando pronto
```

### Step 5: Inserisci Risultati
```
1. Vai a "Giornate" o "Calendario"
2. Clicca su partita
3. Inserisci risultato
4. Aggiungi goal/eventi dei giocatori
5. Classifica si aggiorna AUTOMATICAMENTE ✅
```

### Step 6: Visualizza Classifiche
```
1. Vai a "Classifiche"
2. Vedi classifica in tempo reale
3. Clicca "Export PDF" per scaricare
```

---

## 📤 Esporta Dati

### Backup Completo
```
Admin Panel > Backup > Esporta Completo
Scarica: backup-tornei-2026-03-10.json
```

### Classifica PDF
```
Torneo > Classifica > Esporta PDF
Scarica: classifica-torneo.pdf
```

### Dati CSV (Foglio Calcolo)
```
Statistiche > Export CSV
Apri in Excel/Google Sheets
```

---

## ☁️ Cloud Sync Setup (Opzionale)

### Abilita Sincronizzazione

```javascript
// In Admin Panel > Impostazioni
CloudSync.setAPIConfig(
  'https://api.tuoserver.com',  // URL server
  'YOUR_API_KEY_HERE'             // API Key
);

// Auto-sync ogni 5 minuti
CloudSync.startAutoSync(5 * 60 * 1000);
```

### Cosa Sincronizza
- ✅ Tutti i tornei
- ✅ Tutte le squadre
- ✅ Tutti i giocatori
- ✅ Tutte le giornate
- ✅ Backup automatico

### Offline Mode
- Se non c'è internet: salva localmente
- Quando torna online: sincronizza automaticamente
- Niente dati persi!

---

## 🆘 Troubleshooting

### "Dice che storage è pieno"
```
Admin Panel > Backup > Esporta Completo
Poi: Admin Panel > Impostazioni > Resetta Dati
Reimporta backup
```

### "App va lenta"
```
1. Pulisci cache: Ctrl+Shift+Del
2. Cancella vecchi tornei completati
3. Esporta backup e ripristina
```

### "Dati non si sincronizzano"
```
1. Verifica impostazioni cloud (Admin Panel)
2. Controlla internet (deve essere online)
3. Apri console browser (F12) per errori
```

### "Tasto non funziona"
```
1. Ricarica pagina: F5
2. Ripulisci cache: Ctrl+Shift+Del
3. Prova da altro browser
```

---

## 🔒 Sicurezza

### Password Admin
- Memorizzata localmente (NON su server)
- Non condividere con estranei
- Cambia periodicamente (Admin Panel > Impostazioni)

### Dati
- Nessun tracciamento (open-source)
- Non condiviso con terzi
- Tutto locale nel tuo browser

### Backup
- Fai backup periodico
- Salva file JSON in luogo sicuro
- Puoi ripristinare quando vuoi

---

## 📞 Supporto

Se hai problemi:
1. Controlla console browser (F12 > Console)
2. Leggi i messaggi di errore
3. Copia errore e condividi su:
   - 📧 GitHub Issues
   - 💬 Discord Community
   - 📱 Twitter @TorneiPro

---

## 🎉 Pronto!

Adesso puoi:
- ✅ Creare tornei illimitati
- ✅ Gestire giocatori e squadre
- ✅ Generare calendari automatici
- ✅ Tracciare risultati
- ✅ Visualizzare classifiche
- ✅ Esportare report
- ✅ Usare offline

**Buon torneo! 🏆**
