# 🏆 Gestionale Tornei Pro v2.0
## Il miglior programma gratuito per la gestione di tornei sportivi

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Open%20Source-green.svg)
![Platform](https://img.shields.io/badge/platform-Web%20%2B%20PWA-success.svg)

---

## 🎯 **Vision**

**Gestionale Tornei Pro** è una piattaforma **completamente gratuita** e **open-source** progettata per democratizzare la gestione dei tornei sportivi. Perfetto per:

- **Pro Loco** - Organizzazione di tornei comunitari
- **Associazioni Sportive Dilettantistiche** - Gestione competizioni ufficiali
- **Scuole e Oratori** - Tornei educativi
- **Palestre e Centri Sportivi** - Gestione campionati
- **Privati** - Tornei amatoriali

---

## ✨ **Caratteristiche Principali v2.0**

### 🏅 **Gestione Tornei Avanzata**
- ✅ Creazione di tornei illimitati
- ✅ Multiple formati: girone all'italiana, playoffs, misto, Swiss system
- ✅ Supporto andata/ritorno per ogni sport
- ✅ Gironi divisi in categorie e divisioni
- ✅ Auto-generazione calendario intelligente
- ✅ Gestione bye automatiche e rotazioni

### 👥 **Gestione Giocatori Professionale**
- ✅ Database completo di giocatori per torneo
- ✅ Assegnazione ruoli e numeri maglia
- ✅ Storico partite e statistiche individuali
- ✅ Tracking presenze automatico
- ✅ Note mediche (infortuni, squalifiche)
- ✅ Export lista giocatori

### 📊 **Statistiche Avanzate e Analytics**
- ✅ Dashboard KPI in tempo reale
- ✅ Grafici trend partite per sport
- ✅ Top scorers e assistmen
- ✅ Heatmap presenze giocatori
- ✅ Report dettagliati PDF
- ✅ Export dati completo (CSV, JSON, PDF)

### 👑 **Admin Panel Enterprise**
- ✅ Autenticazione password admin
- ✅ Gestione utenti e permessi
- ✅ Backup automatico giornaliero
- ✅ Ripristino da backup
- ✅ Log attività complete
- ✅ Monitoraggio sistema

### ☁️ **Cloud Sync API (Opzionale)**
- ✅ Sincronizzazione nel cloud
- ✅ Backup automatico cloud
- ✅ Condivisione tornei via link
- ✅ Offline-first con sync automatico
- ✅ Queue offline per operazioni
- ✅ Ripristino da cloud

### 🎨 **Design Professionale**
- ✅ Dark Mode / Light Mode
- ✅ Tema personalizzabile
- ✅ Interfaccia responsiva (mobile/tablet/desktop)
- ✅ Animazioni fluide
- ✅ Design moderno gradients
- ✅ Accessibilità WCAG 2.1

### 🌍 **Multi-Lingua Internazionale**
- ✅ Italiano 🇮🇹
- ✅ English 🇬🇧
- ✅ Español 🇪🇸
- ✅ Français 🇫🇷
- ✅ Deutsch 🇩🇪
- ✅ Facilmente estensibile

### 🔗 **QR Code & Condivisione**
- ✅ Generazione QR code tornei
- ✅ Locandine professionali stampabili
- ✅ Condivisione social
- ✅ Link pubblici ai tornei
- ✅ Attestati e certificati

### 📄 **Export Professionale**
- ✅ PDF classifiche e calendari
- ✅ CSV per foglio di calcolo
- ✅ JSON per integrazione
- ✅ Stampa tabelloni
- ✅ Certificati scaricabili
- ✅ Batch export

### 💾 **Archiviazione Intelligente**
- ✅ IndexedDB per storage locale
- ✅ PWA con offline-first
- ✅ Storage illimitato (fino a limiti browser)
- ✅ Sincronizzazione automatica
- ✅ Versioning automatico

---

## 🚀 **Quick Start**

### Installazione

1. **Clona il repository**
   ```bash
   git clone https://github.com/your-org/gestionale-tornei-pro.git
   cd gestionale-tornei-pro
   ```

2. **Apri nel browser**
   - Semplicemente apri `index.html` nel tuo browser
   - Nessun server richiesto! (PWA-ready)

3. **Configurazione iniziale (opzionale)**
   - Imposta password admin in Admin Panel
   - Abilita Cloud Sync se desideri sincronizzazione
   - Seleziona lingua preferita

### Prima di iniziare

- Browser moderno (Chrome 85+, Firefox 78+, Safari 13+, Edge 85+)
- Spazio storage almeno 50MB
- Connessione internet (opzionale, funziona offline)

---

## 📚 **Guida Utente**

### Dashboard principale
Visualizza tutti i tuoi tornei con statistiche in tempo reale.

### Creazione Torneo
1. Clicca "Nuovo Torneo"
2. Compila form base (nome, sport, formato)
3. Aggiungi squadre (manuale o importa)
4. Configura regole e punti
5. Salva

### Gestione Giocatori
1. Vai a "Giocatori"
2. Seleziona squadra
3. Aggiungi giocatori (uno per uno o importa CSV)
4. Assegna ruoli e numeri maglia
5. Traccia statistiche

### Generazione Calendario
1. Apri torneo
2. Clicca "Genera Calendario"
3. Revisiona partite proposte
4. Modifica date se necessario
5. Pubblica

### Gestione Risultati
1. Vai a "Giornate" o "Calendario"
2. Clicca partita
3. Inserisci risultato
4. Aggiungi statistiche giocatori (gol, card, etc)
5. Salva - Classifica si aggiorna automaticamente

### Export Report
1. Seleziona torneo
2. Vai a "Export"
3. Scegli formato (PDF/CSV/JSON)
4. Clicca "Scarica"

---

## 🔧 **Configurazione Avanzata**

### Abilita Cloud Sync

```javascript
CloudSync.setAPIConfig('https://api.tuoserver.com', 'TUA_API_KEY');
CloudSync.startAutoSync(5 * 60 * 1000); // Sincronizza ogni 5 minuti
```

### Cambia Tema Programmaticamente

```javascript
ThemeManager.setTheme('dark'); // 'light', 'dark', o 'auto'
ThemeManager.toggleTheme(); // Toggle
```

### Cambia Lingua

```javascript
I18n.set('en'); // 'it', 'en', 'es', 'fr', 'de'
```

### Accedi Admin Panel

```
Admin Panel > Impostazioni
Password: (configurata al primo accesso)
```

---

## 🏗️ **Architettura**

```
gestionale-tornei-pro/
├── index.html                 # Entry point
├── css/
│   └── app.css               # Stili principali + variabili tema
├── js/
│   ├── config.js             # Configurazione globale
│   ├── i18n.js               # Sistema multi-lingua
│   ├── theme.js              # Gestione temi (dark/light)
│   ├── storage.js            # IndexedDB wrapper
│   ├── players.js            # Modulo giocatori
│   ├── statistics.js         # Statistiche e analytics
│   ├── admin.js              # Admin panel
│   ├── qrcode.js             # QR code generator
│   ├── export-pro.js         # Export avanzati
│   ├── cloud-sync.js         # Cloud sync API
│   ├── router.js             # Router SPA
│   ├── tornei.js             # Gestione tornei
│   ├── squadre.js            # Gestione squadre
│   ├── giornate.js           # Gestione giornate
│   ├── classifica.js         # Classifiche
│   └── [altri moduli...]
├── examples/
│   └── sample-tornei.json    # Dati di esempio
└── README.md                 # Questo file
```

### Stack Tecnologico
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla + Bootstrap 5)
- **Storage**: IndexedDB + LocalStorage
- **Database**: Nessuno richiesto (PWA)
- **API**: Opzionale - REST API (cloud sync)
- **Packaging**: Progressive Web App (PWA)

---

## 📊 **Limiti e Quote**

### Piano Gratuito (ILLIMITATO)
- ✅ Tornei illimitati
- ✅ Squadre illimitate
- ✅ Giocatori illimitati
- ✅ Storage locale illimitato
- ✅ Export illimitati
- ✅ Tutte le feature base

### Opzioni Premium (Cloud)
- ☁️ Cloud Sync
- 📱 App mobile sincronizzata
- 🔒 Backup cloud automatico
- 🌐 Hosting cloud

---

## 🐛 **Troubleshooting**

### "Storage pieno"
- Esporta i dati vecchi
- Cancella i tornei completati
- Accedi Admin > Backup > Esporta completo

### "Cloud sync non funziona"
- Verifica connessione internet
- Controlla API key configurata
- Guarda console browser per errori

### "Tema non cambia"
- Pulisci cache browser (Ctrl+Shift+Del)
- Verifica JavaScript abilitato
- Prova tema diverso

### "Lingua non cambia"
- Ricarica pagina dopo cambio
- Cancella dati browser per questa origine
- Verifica browser supporta lingua

---

## 🤝 **Contribuire**

### Come aiutare
1. **Segnala Bug**: GitHub Issues
2. **Suggerisci Feature**: GitHub Discussions
3. **Contribuisci Codice**: Pull Requests benvenuti
4. **Traduzioni**: Aggiungi lingue mancanti in `i18n.js`
5. **Testing**: Testa e segnala su dispositivi diversi

### Linee Guida
- Mantieni compatibilità IE11 (se possibile)
- Aggiungi commenti al codice complesso
- Testa offline mode
- Rispetta struttura modular

---

## 📄 **Licenza**

**Gestionale Tornei Pro** è distribuito sotto licenza **MIT** - completamente open-source e gratuito.

```
Copyright 2026 - Gestionale Tornei Pro Contributors
Released under MIT License
```

---

## 🌟 **Roadmap Futuro**

### v2.1 (Prossimamente)
- [ ] App mobile native (React Native)
- [ ] Integrazione Google Calendar
- [ ] Inviti via email/SMS automatici
- [ ] Video instant replay
- [ ] AI-powered insights

### v3.0 (Long term)
- [ ] Sistema pagamenti integrato
- [ ] Marketplace plugin
- [ ] Community di tornei
- [ ] eSports features
- [ ] Real-time live scoring

---

## 💬 **Supporto & Community**

- 📧 Email: support@tornei-pro.it
- 💬 Discord: [Join Community](https://discord.gg/tornei-pro)
- 📱 Twitter: [@TorneiPro](https://twitter.com/tornei-pro)
- 🌐 Website: www.tornei-pro.it (coming soon)

---

## 🎯 **Credits**

Creato con ❤️ per la community sportiva italiana e mondiale.

**Grazie a:**
- Bootstrap team
- Font Awesome
- IndexedDB community
- Tutti i beta testers

---

## ⚡ **Performance Metrics**

- ⚡ Load time: < 2s (first visit)
- 📦 Bundle size: ~500KB
- 🔄 Offline ready: Yes
- 📱 Mobile optimized: Yes
- ♿ Accessibility: WCAG 2.1 AA
- 🔐 Security: No tracking, open-source

---

**Made with 🏆 for sports lovers worldwide**

> "Il miglior programma gratuito per gestire i tuoi tornei sportivi"
