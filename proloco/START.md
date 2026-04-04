# Pro Loco Gestionale 2026 - Quick Start

## ⚡ Start Subito in 30 Secondi

### Opzione 1: Browser (Consigliato)
1. Apri `index.html` nel browser
2. Fatto! L'app è pronta

### Opzione 2: Con Dati di Esempio
1. Apri `GUIDE.html`
2. Click "📊 Carica Dati di Esempio"
3. L'app si apre con dati di test

### Opzione 3: Console Browser (Avanzato)
```javascript
// Apri DevTools (F12) e scrivi:
loadSampleData()
```

---

## 📊 Cosa Puoi Fare

### Dashboard
- Panoramica statistiche
- Avvisi intelligenti
- Quick access alle funzioni

### Gestione Eventi
- Crea event (title, data, location, budget)
- Modifica status
- Assegna volontari
- Traccia visitatori

### Volontari
- Registra volontari
- Traccia ore lavorate
- Assegna a compiti
- Visualizza statistiche

### Budget
- Entrate/Spese
- Categorie automatiche
- Saldo in tempo reale
- Statistiche per categoria

### Compiti
- Crea task list
- Assegna a volontari
- Priorità (bassa/normale/alta)
- Avvisi per scadenze

### Rapporti
- Report complessivi
- Export JSON/CSV
- Statistiche complete

### Impostazioni
- Customizza nome Pro Loco
- Cambia colori tema
- Social media links
- Esporta/Importa dati

---

## 🎨 Personalizzazione

### Colori
1. Settings → Tema e Colori
2. Seleziona colori primario/secondario
3. Click "Applica Colori"

### Nome Organizzazione
1. Settings → Informazioni Base
2. Modifica "Nome Pro Loco"
3. Click "Salva Informazioni"

---

## 💾 Dati

### Salvataggio
- Automatico in localStorage
- Tipo: localStorage con JSON
- Dimensione: ~5-10MB (limit browser)

### Backup
```
Settings → Gestione Dati → Esporta Impostazioni
```

### Ripristino
```
Settings → Gestione Dati → Importa Impostazioni
```

---

## 🔧 Sviluppatori

### File Structure
```
proloco/
├── index.html              # Main page
├── GUIDE.html              # Guida completa (visual)
├── package.json            # Metadata
├── README.md               # Documentazione
├── css/style.css          # Styles (complete design system)
└── js/
    ├── storage.js         # localStorage wrapper
    ├── utils.js           # 40+ utility functions
    ├── events.js          # EventsManager class
    ├── volunteers.js      # VolunteersManager class
    ├── budget.js          # BudgetManager class
    ├── tasks.js           # TasksManager class
    ├── dashboard.js       # DashboardManager class
    ├── reports.js         # ReportsManager class
    ├── settings.js        # SettingsManager class
    ├── navigation.js      # NavigationManager class
    └── sample-data.js     # Sample data for testing
```

### Aggiungere Feature
1. Modifica il manager appropriato (es. events.js)
2. Aggiungi metodo alla classe
3. Usa nel HTML con `functionName()`

### Aggiungere Pagina
1. Crea nuovo divver with `data-page="name"`
2. Aggiungi link sidebar
3. Implementa rendering in navigation.js

---

## 🌐 Browser Support

| Browser | Min Version | Status |
|---------|-------------|--------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Mobile | Latest | ✅ Responsive |

---

## 📞 Note

- **No Installation**: Vanilla JS, no dependencies
- **No Backend**: Everything in localStorage
- **No Tracking**: Completely private, offline-first
- **No Cost**: Free and open source
- **No Data Collection**: Zero telemetry

---

## 🚀 Prossimi Passi

1. **Amplia Database**: Aggiungi più eventi/volontari
2. **Personalizza**: Cambia colori e logo
3. **Export**: Backup dati regolarmente
4. **Condividi**: URL dell'app con team
5. **Estendi**: Aggiungi features custom

---

**Pronto a partire?** Apri `index.html` nel browser! 🎉
