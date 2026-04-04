// Gestione Eventi
class EventsManager {
  constructor() {
    this.events = storage.get('events') || [];
  }

  // Aggiungi evento
  addEvent(eventData) {
    const event = {
      id: Utils.generateId(),
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      category: eventData.category,
      status: 'planned', // planned, ongoing, completed
      expectedVisitors: parseInt(eventData.expectedVisitors) || 0,
      budget: parseFloat(eventData.budget) || 0,
      volunteers: [],
      tasks: [],
      createdAt: new Date().toISOString()
    };

    this.events.push(event);
    this.save();
    Utils.showAlert('Evento creato con successo!', 'success');
    return event;
  }

  // Modifica evento
  updateEvent(id, eventData) {
    this.events = Utils.updateById(this.events, id, eventData);
    this.save();
    Utils.showAlert('Evento aggiornato!', 'success');
  }

  // Elimina evento
  deleteEvent(id) {
    this.events = Utils.removeById(this.events, id);
    this.save();
    Utils.showAlert('Evento eliminato!', 'success');
  }

  // Ottieni evento per ID
  getEvent(id) {
    return Utils.findById(this.events, id);
  }

  // Alias getEventById
  getEventById(id) {
    return this.getEvent(id);
  }

  // Ottieni tutti gli eventi
  getAllEvents() {
    return this.events;
  }

  // Filtra eventi per status
  getEventsByStatus(status) {
    return this.events.filter(e => e.status === status);
  }

  // Ottieni prossimi eventi
  getUpcomingEvents(limit = 5) {
    return this.events
      .filter(e => e.status !== 'completed')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit);
  }

  // Statistiche
  getStats() {
    return {
      total: this.events.length,
      planned: this.getEventsByStatus('planned').length,
      ongoing: this.getEventsByStatus('ongoing').length,
      completed: this.getEventsByStatus('completed').length,
      totalBudget: Utils.sum(this.events, 'budget'),
      totalExpectedVisitors: Utils.sum(this.events, 'expectedVisitors')
    };
  }

  // Aggiungi volontario a evento
  addVolunteerToEvent(eventId, volunteerId) {
    const event = this.getEvent(eventId);
    if (event && !event.volunteers.includes(volunteerId)) {
      event.volunteers.push(volunteerId);
      this.save();
      Utils.showAlert('Volontario assegnato!', 'success');
    }
  }

  // Rimuovi volontario da evento
  removeVolunteerFromEvent(eventId, volunteerId) {
    const event = this.getEvent(eventId);
    if (event) {
      event.volunteers = event.volunteers.filter(v => v !== volunteerId);
      this.save();
      Utils.showAlert('Volontario rimosso!', 'success');
    }
  }

  // Salva i dati
  save() {
    storage.set('events', this.events);
  }

  // Rendering HTML
  renderEventCard(event) {
    const statusColor = {
      planned: 'primary',
      ongoing: 'warning',
      completed: 'success'
    };

    const statusLabel = {
      planned: 'Pianificato',
      ongoing: 'In corso',
      completed: 'Completato'
    };

    return `
      <div class="card event-card" data-id="${event.id}">
        <div class="card-header">
          <div>
            <div class="card-title">${event.title}</div>
            <span class="badge badge-${statusColor[event.status]}">${statusLabel[event.status]}</span>
          </div>
          <div style="display: flex; gap: 5px;">
            <button class="btn btn-sm btn-primary" onclick="exportManager.exportEventPDF('${event.id}')">📄 PDF</button>
            <button class="btn btn-sm btn-secondary" onclick="exportManager.generateEventSocialImage('${event.id}')">📸 Social</button>
            <button class="btn btn-sm btn-secondary" onclick="editEvent('${event.id}')">✏️ Modifica</button>
            <button class="btn btn-sm btn-danger" onclick="deleteEvent('${event.id}')">🗑️ Elimina</button>
          </div>
        </div>
        <div class="card-body">
          <p><strong>📅 Data:</strong> ${Utils.formatDate(event.date)}</p>
          <p><strong>⏰ Ora:</strong> ${event.time}</p>
          <p><strong>📍 Luogo:</strong> ${event.location}</p>
          <p><strong>📂 Categoria:</strong> ${event.category}</p>
          <p><strong>👥 Visitatori attesi:</strong> ${event.expectedVisitors}</p>
          <p><strong>💰 Budget:</strong> ${Utils.formatCurrency(event.budget)}</p>
          <p><strong>👷 Volontari:</strong> ${event.volunteers.length}</p>
        </div>
      </div>
    `;
  }
}

// Istanza globale
const eventsManager = new EventsManager();
