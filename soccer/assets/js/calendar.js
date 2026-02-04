/**
 * CALENDAR.JS
 * Modulo per la gestione del calendario
 * Allenamenti, partite, eventi
 */

const CalendarModule = {
    showEventDetails(eventId) {
        const event = appState.getCalendarEvents().find(e => e.id === eventId);
        if (!event) return;

        const eventDate = new Date(event.date);
        const team = appState.getTeam(event.teamId);

        const modalBody = `
            <div class="event-details-full">
                <div class="detail-row">
                    <strong>Tipo:</strong>
                    <span>${event.type === 'training' ? '🏃 Allenamento' : '⚽ Partita'}</span>
                </div>
                <div class="detail-row">
                    <strong>Data:</strong>
                    <span>${eventDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                ${event.time ? `
                    <div class="detail-row">
                        <strong>Ora:</strong>
                        <span>${event.time}</span>
                    </div>
                ` : ''}
                ${team ? `
                    <div class="detail-row">
                        <strong>Squadra:</strong>
                        <span>${team.name}</span>
                    </div>
                ` : ''}
                ${event.location ? `
                    <div class="detail-row">
                        <strong>Luogo:</strong>
                        <span>${event.location}</span>
                    </div>
                ` : ''}
                ${event.description ? `
                    <div class="detail-row">
                        <strong>Note:</strong>
                        <p>${event.description}</p>
                    </div>
                ` : ''}
                
                <div class="form-actions" style="margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${event.type === 'training' ? `
                        <button class="btn btn-secondary" onclick="AttendanceModule.showAttendanceModal('${eventId}')">
                            <i data-lucide="clipboard-check"></i> Appello
                        </button>
                    ` : ''}
                    ${event.type === 'match' ? `
                        <button class="btn btn-success logistics-btn" data-event-id="${eventId}">
                            <i data-lucide="bus"></i> Logistica Trasferta
                        </button>
                        <button class="btn btn-secondary" onclick="MatchDayModule.showFormationModal('${event.teamId}')">
                            <i data-lucide="users"></i> Distinta
                        </button>
                        <button class="btn btn-primary" data-html2canvas-ignore="true" onclick="CalendarModule.generatePoster('${eventId}')">
                            <i data-lucide="image"></i> Crea Locandina
                        </button>
                    ` : ''}
                    <button class="btn btn-primary" onclick="CalendarModule.showEventForm('${eventId}')">
                        <i data-lucide="edit"></i> Modifica
                    </button>
                </div>
            </div>

            <style>
                .event-details-full .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid var(--color-gray-200);
                }
            </style>
        `;

        UI.showModal(event.title, modalBody);
        lucide.createIcons();
        // Bind logistica trasferta button anche nella modale evento
        setTimeout(() => {
            document.querySelectorAll('.logistics-btn').forEach(btn => {
                if (btn._bound) return;
                btn._bound = true;
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const eventId = btn.getAttribute('data-event-id');
                    CalendarModule.openLogistics(eventId);
                });
            });

            // Bind crea locandina
            document.querySelectorAll('[onclick^="CalendarModule.generatePoster"]').forEach(btn => {
                if (btn._posterBound) return;
                btn._posterBound = true;
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    try {
                        const onclick = btn.getAttribute('onclick');
                        const match = onclick && onclick.match(/CalendarModule\.generatePoster\('([^']+)'\)/);
                        const eid = match ? match[1] : null;
                        if (eid) CalendarModule.generatePoster(eid);
                    } catch (err) { console.warn('generatePoster bind failed', err); }
                });
            });
        }, 100);
    },

    // Generate poster for an event (social/shareable image)
    async generatePoster(eventId) {
        try {
            const ev = appState.getCalendarEvents().find(e => e.id === eventId);
            if (!ev) { UI.showToast('Evento non trovato', 'error'); return; }
            const team = ev.teamId ? appState.getTeam(ev.teamId) : null;
            const date = new Date(ev.date);
            const dateText = `${date.toLocaleDateString('it-IT', { weekday:'short', day:'numeric', month:'short' })}${ev.time ? ' • ' + ev.time : ''}`;

            const lines = [];
            if (team) lines.push(team.name);
            if (ev.location) lines.push(ev.location);

            await Utils.generateSocialPoster({
                title: ev.title || (ev.type === 'match' ? 'Partita' : 'Evento'),
                subtitle: ev.type === 'match' ? 'Partita' : 'Evento',
                dateText,
                location: ev.location || '',
                lines,
                footerText: 'Creato da: www.ldm4app.com',
                qrUrl: 'https://www.ldm4app.com',
                filename: `locandina_${(ev.title||'evento').replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.png`,
                size: 1080
            });
        } catch (err) {
            console.error('generatePoster failed', err);
            UI.showToast('Errore generazione locandina', 'danger');
        }
    },
    getFilteredEvents() {
        let events = appState.getCalendarEvents();
        const filters = appState.getFilters();

        if (filters.calendarView !== 'all') {
            events = events.filter(e => e.type === filters.calendarView);
        }

        return events;
    },

    /**
     * Open logistics module for an event, loading/retrying the module if necessary
     * @param {string} eventId
     */
    openLogistics(eventId) {
        const tryCall = () => {
            if (typeof LogisticsModule !== 'undefined' && LogisticsModule && typeof LogisticsModule.showLogistics === 'function') {
                LogisticsModule.showLogistics(eventId);
                return true;
            }
            return false;
        };

        const waitForLogisticsModule = (maxTries = 20, interval = 500) => {
            return new Promise((resolve, reject) => {
                let tries = 0;
                const poll = () => {
                    if (typeof LogisticsModule !== 'undefined' && LogisticsModule) {
                        console.log('LogisticsModule disponibile dopo', tries, 'tentativi');
                        resolve(LogisticsModule);
                    } else if (++tries >= maxTries) {
                        reject(new Error('LogisticsModule non disponibile dopo ' + maxTries + ' tentativi.'));
                    } else {
                        setTimeout(poll, interval);
                    }
                };
                poll();
            });
        };

        waitForLogisticsModule()
            .then((LogisticsModule) => {
                LogisticsModule.showLogistics(eventId);
            })
            .catch((err) => {
                console.error(err.message);
                UI.showToast('Errore: ' + err.message, 'error');
            });
    },

    createEventCard(event) {
        const eventDate = new Date(event.date);
        const team = appState.getTeam(event.teamId);
        const isUpcoming = eventDate >= new Date();
        
        return `
            <div class="calendar-event ${event.type}" onclick="CalendarModule.showEventDetails('${event.id}')">
                <div class="event-date">
                    <i data-lucide="calendar"></i>
                    ${eventDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    ${event.time ? ` - ${event.time}` : ''}
                </div>
                
                <h3 class="event-title">
                    ${event.type === 'training' ? '🏃' : '⚽'}
                    ${event.title}
                </h3>
                
                <div class="event-details">
                    ${team ? `<div><i data-lucide="shield"></i> ${team.name}</div>` : ''}
                    ${event.location ? `<div><i data-lucide="map-pin"></i> ${event.location}</div>` : ''}
                    ${!isUpcoming ? '<div style="color: var(--color-gray-500);">Evento Passato</div>' : ''}
                </div>
            </div>
        `;
    },

    showEventForm(eventId = null) {
        const event = eventId ? appState.getCalendarEvents().find(e => e.id === eventId) : null;
        const isEdit = !!event;
        const teams = appState.getTeams();

        const modalBody = `
            <form id="event-form" class="form">
                <div class="form-group">
                    <label>Tipo Evento *</label>
                    <select name="type" required>
                        <option value="training" ${event?.type === 'training' ? 'selected' : ''}>🏃 Allenamento</option>
                        <option value="match" ${event?.type === 'match' ? 'selected' : ''}>⚽ Partita</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Titolo *</label>
                    <input type="text" name="title" required value="${event?.title || ''}" 
                           placeholder="Es: Allenamento Tecnico">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Data *</label>
                        <input type="date" name="date" required value="${event?.date || ''}">
                    </div>
                    <div class="form-group">
                        <label>Ora</label>
                        <input type="time" name="time" value="${event?.time || ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label>Squadra</label>
                    <select name="teamId">
                        <option value="">Tutte le Squadre</option>
                        ${teams.map(t => `
                            <option value="${t.id}" ${event?.teamId === t.id ? 'selected' : ''}>
                                ${t.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Luogo</label>
                    <input type="text" name="location" value="${event?.location || ''}" 
                           placeholder="Es: Campo Comunale">
                </div>

                <div class="form-group">
                    <label>Note</label>
                    <textarea name="description" rows="3" placeholder="Dettagli evento...">${event?.description || ''}</textarea>
                </div>

                <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    ${isEdit ? `
                        <button type="button" class="btn btn-danger" onclick="CalendarModule.deleteEvent('${eventId}')">
                            <i data-lucide="trash-2"></i> Elimina
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">
                        Annulla
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i data-lucide="save"></i> ${isEdit ? 'Salva' : 'Aggiungi'}
                    </button>
                </div>
            </form>
        `;

        UI.showModal(isEdit ? 'Modifica Evento' : 'Nuovo Evento', modalBody);
        
        document.getElementById('event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent(eventId);
        });
        
        lucide.createIcons();
    },

    saveEvent(eventId = null) {
        const form = document.getElementById('event-form');
        const formData = new FormData(form);
        
        const eventData = {
            type: formData.get('type'),
            title: formData.get('title'),
            date: formData.get('date'),
            time: formData.get('time'),
            teamId: formData.get('teamId'),
            location: formData.get('location'),
            description: formData.get('description')
        };

        if (eventId) {
            appState.updateEvent(eventId, eventData);
        } else {
            appState.addEvent(eventData);
        }

        UI.closeModal();
        UI.showToast(eventId ? 'Evento aggiornato' : 'Evento aggiunto', 'success');
    },

    deleteEvent(eventId) {
        if (confirm('Sei sicuro di voler eliminare questo evento?')) {
            appState.deleteEvent(eventId);
            UI.closeModal();
            UI.showToast('Evento eliminato', 'success');
        }
    },

    /**
     * Render the calendar events into the DOM
     */
    render() {
        const container = document.getElementById('calendar-events');
        if (!container) {
            console.warn('CalendarModule: container #calendar-events non trovato');
            return;
        }

        const events = this.getFilteredEvents();
        if (events.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <i data-lucide="calendar-days" style="font-size: 4rem; color: var(--color-gray-400); margin-bottom: 1rem;"></i>
                    <h3>Nessun evento in calendario</h3>
                    <p style="color: var(--color-gray-600);">Aggiungi allenamenti e partite al calendario</p>
                    <button class="btn btn-primary" id="calendar-add-event-btn">
                        <i data-lucide="plus"></i>
                        Aggiungi Evento
                    </button>
                </div>
            `;
            lucide.createIcons();
            // bind add event button
            setTimeout(() => {
                // Aggiungi log per debug
                console.log('Binding pulsante Aggiungi Evento');
                const addBtn = document.getElementById('calendar-add-event-btn');
                if (addBtn) {
                    console.log('Pulsante trovato, aggiungo event listener');
                    addBtn.addEventListener('click', () => {
                        console.log('Pulsante Aggiungi Evento cliccato');
                        this.showEventForm();
                    });
                } else {
                    console.warn('Pulsante Aggiungi Evento non trovato nel DOM');
                }
            }, 0);
            return;
        }

        const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));
        container.innerHTML = sortedEvents.map(e => this.createEventCard(e)).join('');
        lucide.createIcons();

        // After render bind logistics buttons
        setTimeout(() => {
            document.querySelectorAll('.logistics-btn').forEach(btn => {
                if (btn._bound) return;
                btn._bound = true;
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const eventId = btn.getAttribute('data-event-id');
                    CalendarModule.openLogistics(eventId);
                });
            });

            // Bind filter buttons
            document.querySelectorAll('.calendar-filters .btn-tab').forEach(btn => {
                if (btn._bound) return;
                btn._bound = true;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-filters .btn-tab').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const view = btn.getAttribute('data-view');
                    appState.setFilter('calendarView', view);
                });
            });

            // Bind add event button in header
            const addHeaderBtn = document.getElementById('add-event-btn');
            if (addHeaderBtn && !addHeaderBtn._bound) {
                addHeaderBtn._bound = true;
                addHeaderBtn.addEventListener('click', () => this.showEventForm());
            }
        }, 0);
    },

    init() {
        console.log('📅 Calendar Module initialized');
        // Re-render on calendar changes and filters
        appState.subscribe('calendar:added', () => this.render());
        appState.subscribe('calendar:updated', () => this.render());
        appState.subscribe('calendar:deleted', () => this.render());
        appState.subscribe('filters:changed', () => this.render());

        // Initial render
        setTimeout(() => this.render(), 0);
    }
};

// Assign CalendarModule to the global window object
window.CalendarModule = CalendarModule;
