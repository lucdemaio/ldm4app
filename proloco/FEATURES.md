# Pro Loco Gestionale 2026 - Guida Completa

## 📋 Panoramica

Sistema completo di gestione per organizzazioni Pro Loco italiane con funzionalità avanzate di:
- Gestione eventi
- Gestione volontari con tracking ore
- Budget e finanze
- Compiti e scadenze
- Export PDF con branding
- Condivisione social media

## 🚀 Nuove Funzionalità Implementate

### 1. **Export & Branding** 📄
- **Export PDF** con footer "creato da www.ldm4app.com"
- **QR Code** sugli export che linka a www.ldm4app.com
- **Immagini Social** generate automaticamente con branding
- Disponibili per: Eventi, Volontari, Budget, Compiti

**Come usare:**
- Click bottone "📄 PDF" su qualsiasi card
- Click bottone "📸 Social" per generare immagine condivisibile

### 2. **Messaggi & Comunicazione** 💬
- Invio messaggi diretti ai volontari
- Sistema di messaging integrato
- Notifiche via email (future)

**Come usare:**
```javascript
sendMessageVolunteer(volunteerId);
```

### 3. **Template Eventi** 📑
- Crea template di eventi ricorrenti
- Riutilizza configurazioni passate
- Tracking utilizzo template

**Come usare:**
```javascript
advancedFeaturesManager.createEventTemplate('Festival Estivo', eventData);
advancedFeaturesManager.useTemplate(templateId, newEventData);
```

### 4. **Ricerca & Filtri Avanzati** 🔍
- Ricerca full-text su eventi e volontari
- Filtri per data, categoria, budget
- Filtri per skill e disponibilità

**Come usare:**
```javascript
advancedFeaturesManager.searchEvents("query");
advancedFeaturesManager.filterEventsByDateRange("2026-03-01", "2026-03-31");
advancedFeaturesManager.filterEventsByCategory("Festival");
advancedFeaturesManager.filterEventsByBudget(1000, 5000);
```

### 5. **Calendario Visuale** 📅
- Vista mese con eventi ordinati
- Visualizzazione rapida degli impegni
- Click su giorni per dettagli

**Come usare:**
```javascript
advancedFeaturesManager.renderCalendar(month, year);
```

### 6. **Galleria Foto Eventi** 🖼️
- Carica foto per ogni evento
- Sistema di like per le foto
- Visualizzazione in grid responsive

**Come usare:**
```javascript
advancedFeaturesManager.addPhotoToEvent(eventId, photoUrl, caption);
advancedFeaturesManager.renderEventGallery(eventId);
```

### 7. **Sistema di Valutazioni** ⭐
- Rating 1-5 per gli eventi
- Raccolta feedback partecipanti
- Media valutazioni automatica

**Come usare:**
```javascript
advancedFeaturesManager.addRating(eventId, rating, review);
advancedFeaturesManager.renderRatings(eventId);
```

### 8. **Tracking Volontari** 👥
- Check-in/Check-out con timestamp
- Calcolo ore lavorate automatico
- Storico presenze

**Come usare:**
```javascript
advancedFeaturesManager.checkVolunteerIn(volunteerId, eventId);
advancedFeaturesManager.checkVolunteerOut(volunteerId, eventId);
```

### 9. **Performance Volontari** 📊
- Report ore totali
- Numero eventi partecipati
- Media ore per evento
- Ultimo evento frequentato

**Come usare:**
```javascript
const performance = advancedFeaturesManager.getVolunteerPerformance(volunteerId);
```

### 10. **Pianificazione Volontari** 📋
- Matrice volontari per evento
- Visualizzazione skills rilevanti
- Planning interattivo

**Come usare:**
```javascript
advancedFeaturesManager.generateVolunteerSchedule(eventId);
```

### 11. **Promemoria Intelligenti** 🔔
- Crea promemoria per eventi
- Notifiche per scadenze
- Filtri per prossimi 7 giorni

**Come usare:**
```javascript
advancedFeaturesManager.createReminder("Verificare volontari", "2026-03-25", "event");
advancedFeaturesManager.getUpcomingReminders(7);
```

### 12. **Notifiche Email** 📧
- Programmazione email personalizzate
- Queue di invio
- Template futuri

**Come usare:**
```javascript
advancedFeaturesManager.sendEmailNotification(volunteerId, "Subject", "Message Body");
```

## 🎨 Design & UX

### Card Actions (Tutti i moduli)
Ogni card ora ha:
- 📄 **PDF** - Export a PDF
- 📸 **Social** - Genera immagine social (Eventi)
- 💬 **Messaggio** - Contatta volontario (Volontari)
- ✓ **Completa** - Segna come fatto (Compiti)
- ✏️ **Modifica** - Modifica elemento
- 🗑️ **Elimina** - Cancella con conferma

### Stili CSS Aggiunti
- `.modal-*` - Dialoghi modali
- `.calendar-*` - Calendario
- `.gallery-*` - Galleria foto
- `.ratings-*` - Sistema valutazioni
- `.schedule-*` - Pianificazione
- `.search-filter-bar` - Filtri avanzati

## 💾 Storage

Dati persistenti in localStorage:

```javascript
// Core data
storage.get('events')
storage.get('volunteers')  
storage.get('budget')
storage.get('tasks')

// Advanced features
storage.get('event-templates')
storage.get('event-photos')
storage.get('ratings')
storage.get('reminders')
storage.get('messages')
storage.get('volunteer-tracking')
storage.get('pending-emails')
```

## 🔌 Librerie Esterne (CDN)

1. **html2pdf.js** - Generazione PDF
2. **QRCode.js** - QR code generation
3. **html2canvas** - Conversione canvas

## 📱 Responsivo

- Desktop-first design
- Mobile breakpoint 768px
- Sidebar collaps s per mobile (60px)
- Grid auto-responsive

## 🚦 Funzioni Globali

### Navigation & Modal
```javascript
switchPage(pageName)           // Cambia pagina
showEventModal()               // Apri modal nuovo evento
showVolunteerModal()           // Apri modal nuovo volontario
showBudgetModal()              // Apri modal nuova voce
showTaskModal()                // Apri modal nuovo compito
```

### Edit & Delete
```javascript
editEvent(eventId)             // Modifica evento
deleteEvent(eventId)           // Elimina evento
editVolunteer(volunteerId)     // Modifica volontario
deleteVolunteer(volunteerId)   // Elimina volontario
editBudgetEntry(entryId)       // Modifica voce budget
deleteBudgetEntry(entryId)     // Elimina voce budget
editTask(taskId)               // Modifica compito
deleteTask(taskId)             // Elimina compito
markTaskDone(taskId)           // Segna compito come fatto
```

### Communication
```javascript
sendMessageVolunteer(volunteerId)  // Invia messaggio
```

## 🎯 Roadmap Future

- [ ] Real-time notifications
- [ ] Email backend integration
- [ ] Video gallery support
- [ ] Advanced analytics dashboard
- [ ] API REST
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] File upload storage S3
- [ ] Integrazione Google Calendar
- [ ] Webhook per terze parti
- [ ] Dashboard pubblico (evento info)

## 📞 Support

Pro Loco Gestionale
Website: www.ldm4app.com
Created: 2026

---

**Versione: 1.0.0**
**Ultimo aggiornamento: Marzo 2026**
