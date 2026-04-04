# Pro Loco Gestionale 2026 🎉

Applicazione web moderna e completamente funzionante per la gestione di Pro Loco (enti locali per la valorizzazione del turismo in Italia).

## 🚀 Caratteristiche

### ✅ Completamente Funzionante
- **Zero dipendenze esterne** - Vanilla JavaScript puro
- **Persistenza dati** - localStorage con JSON serialization
- **Design moderno** - Interfaccia 2026 con gradients e animazioni
- **Responsive** - Desktop e mobile ottimizzati

### 📊 Moduli Disponibili

1. **Dashboard** - Panoramica completa con statistiche in tempo reale
   - Totale eventi, volontari attivi, saldo budget
   - Prossimi eventi e compiti ricenti
   - Sistema di avvisi intelligente

2. **Gestione Eventi** - CRUD completo per gli eventi
   - Creazione, modifica, eliminazione
   - Assegnazione volontari
   - Gestione status (pianificato, in corso, completato)
   - Tracciamento budget ed visitatori

3. **Gestione Volontari** - Registro completo dei volontari
   - Profili dettagliati con abilità e disponibilità
   - Tracciamento ore lavorate
   - Assegnazione a ruoli
   - Gestione contatti

4. **Gestione Budget** - Contabilità semplificata
   - Entrate e spese categorizzate
   - Saldo in tempo reale
   - Statistiche per categoria
   - Export dati finanziari

5. **Gestione Compiti** - Sistema di task management
   - Assegnazione compiti ai volontari
   - Priorità (bassa, normale, alta)
   - Scadenze e avvisi
   - Tracciamento stato avanzamento

6. **Rapporti e Statistiche** - Analytics complete
   - Report complessivi evento, volontari, budget
   - Export JSON e CSV
   - Grafici visuali
   - Analisi tendenze

7. **Impostazioni** - Configurazione Pro Loco
   - Dati organizzazione (nome, contatti, social)
   - Tema colori personalizzabile
   - Notifiche (email, SMS)
   - Export/Import impostazioni

## 📁 Struttura File

```
proloco/
├── index.html                 # Pagina principale
├── css/
│   └── style.css             # Sistema design completo
├── js/
│   ├── storage.js            # Gestione localStorage
│   ├── utils.js              # 40+ funzioni utilità
│   ├── events.js             # Manager eventi
│   ├── volunteers.js         # Manager volontari
│   ├── budget.js             # Manager budget
│   ├── tasks.js              # Manager compiti
│   ├── dashboard.js          # Manager dashboard
│   ├── reports.js            # Manager rapporti
│   ├── settings.js           # Manager impostazioni
│   ├── navigation.js         # Gestione navigazione
│   └── sample-data.js        # Dati di esempio
├── pages/                    # Pagine future
├── assets/                   # Immagini e file
└── README.md                 # Questo file
```

## 🎯 Avvio Rapido

1. **Aprire il file**: Apri `index.html` in un browser moderno
   
2. **Caricare dati di esempio** (opzionale):
   - Apri Console (F12)
   - Digita: `loadSampleData()`
   - Conferma il caricamento

3. **Esplorare l'app**:
   - Dashboard mostra panoramica
   - Usa sidebar per navigare tra sezioni
   - Ogni sezione ha pulsante "+ Nuovo" per aggiungere dati

## 💡 Dati di Esempio

La app include dataset di esempio:
- **3 Eventi** di vario tipo
- **4 Volontari** con diversi ruoli
- **5 Voci Budget** entrate/spese
- **5 Compiti** con diversi stati

Per caricare: `loadSampleData()` in console

## 🎨 Personalizzazione

### Colori
1. Vai a **Impostazioni**
2. Sezione **Tema e Colori**
3. Seleziona colori primario/secondario
4. Click **Applica Colori**

### Nome Organizzazione
1. Vai a **Impostazioni**
2. Sezione **Informazioni Base**
3. Modifica "Nome Pro Loco"
4. Click **Salva Informazioni**

## 📊 Gestione Dati

### Salvataggio
- Tutti i dati salvati localmente in browser
- Persiste tra sessioni (non viene perso al refresh)
- Sempre disponibile offline

### Export
- **JSON**: Backup completo dati
- **CSV**: Per fogli di calcolo
- Disponibile in ogni sezione e in Rapporti

### Import
1. Vai a **Impostazioni**
2. Sezione **Gestione Dati**
3. Click **Importa Impostazioni**
4. Seleziona file JSON

## 🔍 Funzioni Principali

### Dashboard
```javascript
dashboardManager.getDashboardData()      // Prende tutti i dati
dashboardManager.getStats()              // Statistiche principali
dashboardManager.getAlerts()             // Avvisi intelligenti
```

### Eventi
```javascript
eventsManager.addEvent(data)             // Crea evento
eventsManager.updateEvent(id, data)      // Modifica
eventsManager.deleteEvent(id)            // Elimina
eventsManager.getUpcomingEvents(5)       // Prossimi 5 eventi
```

### Volontari
```javascript
volunteersManager.addVolunteer(data)     // Registra volontario
volunteersManager.addHours(id, hours)    // Aggiungi ore
volunteersManager.getStats()             // Statistiche volontari
```

### Budget
```javascript
budgetManager.addEntry(data)             // Aggiungi voce
budgetManager.getTotals()                // Entrate/Spese/Saldo
budgetManager.exportReportJSON()         // Export JSON
```

### Compiti
```javascript
tasksManager.addTask(data)               // Crea compito
tasksManager.getOverdueTasks()           // Compiti scaduti
tasksManager.updateTaskStatus(id, status) // Cambia status
```

### Rapporti
```javascript
reportsManager.getComprehensiveReport()  // Report completo
reportsManager.exportReportCSV()         // Export CSV
reportsManager.getAvailableSkills()      // Skills disponibili
```

## 🛠️ Sviluppo

### Aggiungere funzione
1. Modifica il manager appropriato (es. `events.js`)
2. Aggiungi metodo alla classe
3. Chiama da HTML con `functionName()`

### Aggiungere pagina
1. Crea HTML in `pages/` o nel tab pagina
2. Aggiungi link sidebar in `navigation.js`
3. Implementa rendering in `loadPageContent()`

### Aggiungere category budget
1. Edit `budgetManager.budget.categories`
2. Sarà disponibile nei form

## 🌐 Compatibilità Browser

✅ Chrome/Edge 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Mobile browsers  

Richiede JavaScript abilitato e localStorage disponibile.

## 📝 Licenza

Applicazione open source per Pro Loco italiane. Libero uso e modifica.

## 🤝 Contributi

Per segnalare bug o suggerire funzioni:
1. Testa con `loadSampleData()`
2. Verifica comportamento
3. Segnala con dettagli

## 📞 Supporto

Per ogni sezione:
- Tab **Impostazioni** -> **Gestione Dati** per backup
- Console browser (F12) per diagnostica
- Tutti i dati salvati localmente - nessun cloud

---

**Creato con ❤️ per le Pro Loco italiane**  
*Pro Loco Gestionale 2026 - Vanilla JavaScript*
