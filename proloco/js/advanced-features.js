/**
 * AdvancedFeaturesManager - Funzionalità creative e avanzate
 */
class AdvancedFeaturesManager {
  constructor() {
    this.templates = storage.get('event-templates') || [];
    this.messages = storage.get('messages') || [];
    this.photos = storage.get('event-photos') || [];
    this.ratings = storage.get('ratings') || [];
  }

  // ===== TEMPLATE EVENTS =====
  createEventTemplate(name, eventData) {
    const template = {
      id: Utils.generateId(),
      name: name,
      data: eventData,
      createdAt: new Date().toISOString(),
      uses: 0
    };
    this.templates.push(template);
    this.save();
    Utils.showAlert('Template evento creato!', 'success');
    return template;
  }

  getTemplates() {
    return this.templates;
  }

  useTemplate(templateId, eventData) {
    const template = this.templates.find(t => t.id === templateId);
    if (template) {
      template.uses++;
      this.save();
      
      // Usa il template
      const newEvent = { ...template.data, ...eventData };
      eventsManager.addEvent(newEvent);
    }
  }

  deleteTemplate(templateId) {
    this.templates = this.templates.filter(t => t.id !== templateId);
    this.save();
  }

  // ===== ADVANCED SEARCH & FILTERS =====
  searchEvents(query) {
    const q = query.toLowerCase();
    return eventsManager.getAllEvents().filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  }

  searchVolunteers(query) {
    const q = query.toLowerCase();
    return volunteersManager.getAllVolunteers().filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.role.toLowerCase().includes(q) ||
      v.skills?.some(s => s.toLowerCase().includes(q))
    );
  }

  filterEventsByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return eventsManager.getAllEvents().filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= start && eventDate <= end;
    });
  }

  filterEventsByCategory(category) {
    return eventsManager.getAllEvents().filter(e => e.category === category);
  }

  filterEventsByBudget(minBudget, maxBudget) {
    return eventsManager.getAllEvents().filter(e =>
      e.budget >= minBudget && e.budget <= maxBudget
    );
  }

  // ===== CALENDAR VISUALIZATION =====
  generateCalendar(month, year) {
    const events = eventsManager.getAllEvents();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const calendar = {
      month: month,
      year: year,
      daysInMonth: daysInMonth,
      firstDay: firstDay,
      days: []
    };

    // Crea i giorni
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);

      calendar.days.push({
        day: i,
        date: dateStr,
        events: dayEvents,
        hasEvents: dayEvents.length > 0
      });
    }

    return calendar;
  }

  renderCalendar(month, year) {
    const cal = this.generateCalendar(month, year);
    
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

    let html = `
      <div class="calendar-container">
        <div class="calendar-header">
          <button onclick="advancedFeaturesManager.previousMonth()">← Precedente</button>
          <h3>${monthNames[month]} ${year}</h3>
          <button onclick="advancedFeaturesManager.nextMonth()">Successivo →</button>
        </div>

        <div class="calendar-grid">
          ${dayNames.map(day => `<div class="calendar-day-header">${day}</div>`).join('')}
    `;

    // Aggiungi giorni vuoti all'inizio
    for (let i = 0; i < cal.firstDay; i++) {
      html += '<div class="calendar-empty"></div>';
    }

    // Aggiungi giorni del mese
    for (const dayObj of cal.days) {
      const hasEvents = dayObj.events.length > 0;
      html += `
        <div class="calendar-day ${hasEvents ? 'has-events' : ''}">
          <div class="calendar-day-number">${dayObj.day}</div>
          ${dayObj.events.map(e => `
            <div class="calendar-event" title="${e.title}">
              <span class="event-dot"></span>
              <small>${e.title.substring(0, 15)}</small>
            </div>
          `).join('')}
        </div>
      `;
    }

    html += `</div></div>`;
    return html;
  }

  previousMonth() {
    // Implementare navigazione mesi
  }

  nextMonth() {
    // Implementare navigazione mesi
  }

  // ===== EMAIL NOTIFICATIONS =====
  sendEmailNotification(volunteerId, subject, message) {
    const volunteer = volunteersManager.getVolunteer(volunteerId);
    if (!volunteer) return;

    // Nota: Questo richiede un backend
    const notification = {
      id: Utils.generateId(),
      type: 'email',
      to: volunteer.email,
      subject: subject,
      message: message,
      timestamp: new Date().toISOString(),
      sent: false
    };

    const emails = storage.get('pending-emails') || [];
    emails.push(notification);
    storage.set('pending-emails', emails);

    Utils.showAlert(`Email programmata per ${volunteer.name}`, 'info');
  }

  // ===== EVENT PHOTOS GALLERY =====
  addPhotoToEvent(eventId, photoUrl, caption = '') {
    const photo = {
      id: Utils.generateId(),
      eventId: eventId,
      url: photoUrl,
      caption: caption,
      uploadedAt: new Date().toISOString(),
      likes: 0
    };

    this.photos.push(photo);
    this.save();
    Utils.showAlert('Foto aggiunta!', 'success');
    return photo;
  }

  getEventPhotos(eventId) {
    return this.photos.filter(p => p.eventId === eventId);
  }

  likePhoto(photoId) {
    const photo = this.photos.find(p => p.id === photoId);
    if (photo) {
      photo.likes++;
      this.save();
    }
  }

  renderEventGallery(eventId) {
    const photos = this.getEventPhotos(eventId);

    return `
      <div class="gallery-container">
        <h4>Galleria Foto Evento</h4>
        <div class="gallery-grid">
          ${photos.length > 0 ?
            photos.map(p => `
              <div class="gallery-item">
                <img src="${p.url}" alt="${p.caption}" style="width: 100%; border-radius: 8px; cursor: pointer;">
                <p style="margin: 5px 0; font-size: 12px;">${p.caption}</p>
                <button class="btn btn-sm" onclick="advancedFeaturesManager.likePhoto('${p.id}')">
                  ❤️ ${p.likes} Mi piace
                </button>
              </div>
            `).join('') :
            '<p>Nessuna foto caricata</p>'
          }
        </div>
      </div>
    `;
  }

  // ===== RATINGS & FEEDBACK =====
  addRating(eventId, rating, review) {
    const reviewObj = {
      id: Utils.generateId(),
      eventId: eventId,
      rating: rating, // 1-5
      review: review,
      timestamp: new Date().toISOString()
    };

    this.ratings.push(reviewObj);
    this.save();
    Utils.showAlert('Valutazione registrata!', 'success');
  }

  getEventRatings(eventId) {
    return this.ratings.filter(r => r.eventId === eventId);
  }

  getEventAverageRating(eventId) {
    const ratings = this.getEventRatings(eventId);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  }

  renderRatings(eventId) {
    const ratings = this.getEventRatings(eventId);
    const avgRating = this.getEventAverageRating(eventId);

    return `
      <div class="ratings-container">
        <h4>Valutazioni Evento</h4>
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 2em; font-weight: bold; color: #f59e0b;">★ ${avgRating}</div>
          <p>${ratings.length} valutazioni</p>
        </div>

        <div class="ratings-list">
          ${ratings.length > 0 ?
            ratings.map(r => `
              <div class="rating-item" style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                <div style="color: #f59e0b; margin-bottom: 5px;">
                  ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                </div>
                <p style="margin: 0; color: #6b7280;">${r.review}</p>
              </div>
            `).join('') :
            '<p>Nessuna valutazione ancora</p>'
          }
        </div>
      </div>
    `;
  }

  // ===== SMART REMINDERS =====
  createReminder(title, dueDate, type = 'event') {
    const reminder = {
      id: Utils.generateId(),
      title: title,
      dueDate: dueDate,
      type: type, // event, task, volunteer-check
      sent: false,
      createdAt: new Date().toISOString()
    };

    const reminders = storage.get('reminders') || [];
    reminders.push(reminder);
    storage.set('reminders', reminders);

    Utils.showAlert('Promemoria creato!', 'info');
    return reminder;
  }

  getUpcomingReminders(days = 7) {
    const reminders = storage.get('reminders') || [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    return reminders.filter(r => {
      const reminderDate = new Date(r.dueDate);
      return reminderDate >= today && reminderDate <= nextWeek && !r.sent;
    });
  }

  // ===== VOLUNTEER TRACKING =====
  checkVolunteerIn(volunteerId, eventId) {
    const event = eventsManager.getEvent(eventId);
    if (!event) return;

    const tracking = {
      id: Utils.generateId(),
      volunteerId: volunteerId,
      eventId: eventId,
      checkIn: new Date().toISOString(),
      checkOut: null
    };

    const trackings = storage.get('volunteer-tracking') || [];
    trackings.push(tracking);
    storage.set('volunteer-tracking', trackings);

    Utils.showAlert('Check-in registrato!', 'success');
  }

  checkVolunteerOut(volunteerId, eventId) {
    const trackings = storage.get('volunteer-tracking') || [];
    const tracking = trackings.find(t =>
      t.volunteerId === volunteerId && t.eventId === eventId && !t.checkOut
    );

    if (tracking) {
      tracking.checkOut = new Date().toISOString();
      storage.set('volunteer-tracking', trackings);

      const hoursWorked = this.calculateHours(tracking.checkIn, tracking.checkOut);
      volunteersManager.addHours(volunteerId, hoursWorked);
      Utils.showAlert(`Check-out registrato! (${hoursWorked}h)`, 'success');
    }
  }

  calculateHours(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const hours = (end - start) / (1000 * 60 * 60);
    return hours.toFixed(1);
  }

  // ===== VOLUNTEER SCHEDULES =====
  generateVolunteerSchedule(eventId) {
    const event = eventsManager.getEvent(eventId);
    if (!event) return '';

    const volunteers = event.volunteers.map(vId =>
      volunteersManager.getVolunteer(vId)
    ).filter(v => v);

    return `
      <div class="schedule-container">
        <h4>Pianificazione Volontari - ${event.title}</h4>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Nome</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Ruolo</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Disponibilità</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Abilità Rilevanti</th>
              </tr>
            </thead>
            <tbody>
              ${volunteers.map(v => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">${v.name}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">${v.role}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">${v.availableDays.join(', ')}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">${v.skills.join(', ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ===== REPORTING & ANALYTICS =====
  getVolunteerPerformance(volunteerId) {
    const volunteer = volunteersManager.getVolunteer(volunteerId);
    if (!volunteer) return null;

    const trackings = storage.get('volunteer-tracking') || [];
    const volunteerTrackings = trackings.filter(t => t.volunteerId === volunteerId);

    const totalHours = volunteerTrackings.reduce((acc, t) => {
      const hours = this.calculateHours(t.checkIn, t.checkOut);
      return acc + parseFloat(hours);
    }, 0);

    const eventsAttended = [...new Set(volunteerTrackings.map(t => t.eventId))].length;

    return {
      name: volunteer.name,
      totalHours: totalHours.toFixed(1),
      eventsAttended: eventsAttended,
      averageHoursPerEvent: volunteerTrackings.length > 0 ?
        (totalHours / eventsAttended).toFixed(1) : 0,
      lastEvent: volunteerTrackings.length > 0 ?
        new Date(volunteerTrackings[volunteerTrackings.length - 1].checkOut).toLocaleDateString('it-IT') :
        'N/A'
    };
  }

  // ===== SAVE & LOAD =====
  save() {
    storage.set('event-templates', this.templates);
    storage.set('messages', this.messages);
    storage.set('event-photos', this.photos);
    storage.set('ratings', this.ratings);
  }
}

// Istanza globale
const advancedFeaturesManager = new AdvancedFeaturesManager();
