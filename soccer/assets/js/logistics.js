/**
 * LOGISTICS.JS
 * Modulo Logistica Trasferte
 * - Gestione veicoli per partite
 * - Assegnazione atleti ai veicoli
 * - Calcolo automatico posti disponibili
 * - Export PDF organizzazione trasferta
 */

const LogisticsModule = {
    currentEventId: null,

    /**
     * Inizializza il modulo
     */
    init() {
        console.log('🚌 Logistics Module initialized');
    },

    /**
     * Mostra interfaccia logistica per una partita
     * @param {string} eventId - ID evento (partita)
     */
    showLogistics(eventId) {
        const event = appState.state.calendar?.find(e => e.id === eventId);
        if (!event) {
            UI.showToast('Evento non trovato', 'error');
            return;
        }
        if (!event.type || event.type !== 'match') {
            UI.showToast('La logistica è disponibile solo per le partite.', 'warning');
            return;
        }
        if (!event.teamId) {
            UI.showToast('Squadra non specificata nell’evento. Impossibile gestire la logistica.', 'error');
            return;
        }
        if (!appState.state.athletes || !Array.isArray(appState.state.athletes)) {
            UI.showToast('Dati atleti non disponibili. Controlla il caricamento.', 'error');
            return;
        }

        this.currentEventId = eventId;

        // Inizializza logistica se non esiste
        if (!event.logistics) {
            event.logistics = {
                vehicles: [],
                assignments: {} // {athleteId: vehicleId}
            };
        }

        // Ottieni atleti della squadra
        const athletes = appState.state.athletes.filter(a => a.teamId === event.teamId);
        if (!athletes.length) {
            UI.showToast('Nessun atleta associato alla squadra per questa trasferta.', 'warning');
        }

        const modalBody = `
            <div class="logistics-container">
                <div class="logistics-header">
                    <div class="event-info">
                        <h3><i data-lucide="bus"></i> Logistica Trasferta</h3>
                        <p class="event-title">${event.title}</p>
                        <p class="event-details">
                            <i data-lucide="calendar"></i> ${new Date(event.date).toLocaleDateString('it-IT')}
                            ${event.time ? `<i data-lucide="clock"></i> ${event.time}` : ''}
                            ${event.location ? `<i data-lucide="map-pin"></i> ${event.location}` : ''}
                        </p>
                    </div>
                </div>

                <!-- Statistiche -->
                <div class="logistics-stats">
                    <div class="stat-card">
                        <div class="stat-icon bg-blue">
                            <i data-lucide="users"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="total-athletes">${athletes.length}</h3>
                            <p>Atleti Totali</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-green">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="assigned-athletes">0</h3>
                            <p>Assegnati</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-purple">
                            <i data-lucide="car"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="total-vehicles">${event.logistics.vehicles.length}</h3>
                            <p>Veicoli</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-orange">
                            <i data-lucide="alert-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="available-seats">0</h3>
                            <p>Posti Disponibili</p>
                        </div>
                    </div>
                </div>

                <!-- Azioni Rapide -->
                <div class="logistics-actions">
                        <button class="btn btn-primary btn-azione" data-html2canvas-ignore="true" onclick="LogisticsModule.showAddVehicleForm()">
                            <i data-lucide="plus" data-html2canvas-ignore="true"></i>
                            Aggiungi Veicolo
                        </button>
                        <button class="btn btn-secondary btn-azione" data-html2canvas-ignore="true" onclick="LogisticsModule.autoAssignAthletes()">
                            <i data-lucide="shuffle" data-html2canvas-ignore="true"></i>
                            Assegnazione Automatica
                        </button>
                        <button class="btn btn-secondary btn-azione" data-html2canvas-ignore="true" onclick="LogisticsModule.exportLogisticsPDF()">
                            <i data-lucide="file-text" data-html2canvas-ignore="true"></i>
                            Esporta PDF
                        </button>
                </div>

                <!-- Veicoli e Assegnazioni -->
                <div id="vehicles-container" class="vehicles-container">
                    ${this.renderVehicles(event)}
                </div>

                <!-- Atleti Non Assegnati -->
                <div class="unassigned-section">
                    <h4><i data-lucide="user-x"></i> Atleti Non Assegnati</h4>
                    <div id="unassigned-athletes" class="unassigned-list">
                        ${this.renderUnassignedAthletes(event, athletes)}
                    </div>
                </div>
            </div>
        `;

        UI.showModal(`Logistica Trasferta - ${event.title}`, modalBody, 'extra-large');

        setTimeout(() => {
            this.updateStats(event, athletes);
            lucide.createIcons();
        }, 50);
    },

    /**
     * Renderizza lista veicoli
     */
    renderVehicles(event) {
        if (!event.logistics.vehicles || event.logistics.vehicles.length === 0) {
            return `
                <div class="empty-state">
                    <i data-lucide="bus"></i>
                    <h3>Nessun veicolo configurato</h3>
                    <p>Aggiungi auto o pullman per organizzare la trasferta</p>
                    <button class="btn btn-primary" onclick="LogisticsModule.showAddVehicleForm()">
                        <i data-lucide="plus"></i>
                        Aggiungi Primo Veicolo
                    </button>
                </div>
            `;
        }
        return event.logistics.vehicles.map(vehicle => {
            const assignedAthletes = Object.entries(event.logistics.assignments || {})
                .filter(([athleteId, vId]) => vId === vehicle.id)
                .map(([athleteId]) => athleteId);

            const seatsUsed = assignedAthletes.length;
            const seatsAvailable = vehicle.seats - seatsUsed;
            const percentFull = (seatsUsed / vehicle.seats * 100).toFixed(0);

            return `
                <div class="vehicle-card ${seatsAvailable === 0 ? 'vehicle-full' : ''}">
                    <div class="vehicle-header">
                        <div class="vehicle-info">
                            <div class="vehicle-icon ${vehicle.type}">
                                <i data-lucide="${vehicle.type === 'bus' ? 'bus' : 'car'}"></i>
                            </div>
                            <div>
                                <h4>${vehicle.name}</h4>
                                <p class="vehicle-driver">
                                    <i data-lucide="user"></i>
                                    ${vehicle.driver || 'Conducente non specificato'}
                                </p>
                                ${vehicle.phone ? `<p class="vehicle-contact"><i data-lucide="phone"></i> ${vehicle.phone}</p>` : ''}
                            </div>
                        </div>
                        <div class="vehicle-actions">
                            <button class="btn-icon" onclick="LogisticsModule.editVehicle('${vehicle.id}')" title="Modifica">
                                <i data-lucide="edit"></i>
                            </button>
                            <button class="btn-icon btn-danger" onclick="LogisticsModule.deleteVehicle('${vehicle.id}')" title="Elimina">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Occupazione Posti -->
                    <div class="seats-info">
                        <div class="seats-bar">
                            <div class="seats-fill" style="width: ${percentFull}%"></div>
                        </div>
                        <div class="seats-text">
                            <span class="seats-used contatore-auto">${seatsUsed} / ${vehicle.seats} posti</span>
                            <span class="seats-available contatore-auto ${seatsAvailable === 0 ? 'seats-full' : ''}">
                                ${seatsAvailable} disponibili
                            </span>
                        </div>
                    </div>

                    <!-- Atleti Assegnati -->
                    <div class="assigned-athletes">
                        ${assignedAthletes.length > 0 ? `
                            <div class="athletes-grid">
                                ${assignedAthletes.map(athleteId => {
                                    const athlete = appState.getAthlete(athleteId);
                                    return athlete ? `
                                        <div class="athlete-chip">
                                            <span>${athlete.firstName} ${athlete.lastName}</span>
                                            <button class="chip-remove btn-azione" data-html2canvas-ignore="true" onclick="LogisticsModule.unassignAthlete('${athleteId}')" title="Rimuovi">
                                                <i data-lucide="x" data-html2canvas-ignore="true"></i>
                                            </button>
                                        </div>
                                    ` : '';
                                }).join('')}
                            </div>
                        ` : `
                            <p class="empty-vehicle">Nessun atleta assegnato</p>
                        `}
                    </div>

                    <!-- Drop Zone -->
                    ${seatsAvailable > 0 ? `
                        <div class="drop-zone" data-vehicle-id="${vehicle.id}" data-html2canvas-ignore="false">
                            <i data-lucide="user-plus" data-html2canvas-ignore="true"></i>
                            Trascina atleti qui o clicca per selezionare
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    /**
     * Attach drag & drop handlers and click handlers for drop zones
     */
    attachDragDropHandlers(event) {
        try {
            // Drag start for unassigned chips
            document.querySelectorAll('.unassigned-chip').forEach(el => {
                el.addEventListener('dragstart', (e) => {
                    const athleteId = el.dataset.athleteId;
                    if (e.dataTransfer) {
                        e.dataTransfer.setData('text/plain', athleteId);
                        e.dataTransfer.effectAllowed = 'move';
                    }
                    el.classList.add('dragging');
                });

                el.addEventListener('dragend', () => {
                    el.classList.remove('dragging');
                });
            });

            // Drop zones
            document.querySelectorAll('.drop-zone').forEach(zone => {
                zone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    zone.classList.add('drop-over');
                });

                zone.addEventListener('dragleave', () => {
                    zone.classList.remove('drop-over');
                });

                zone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    zone.classList.remove('drop-over');
                    let athleteId = null;
                    try {
                        athleteId = e.dataTransfer && e.dataTransfer.getData('text/plain');
                    } catch (err) {
                        // ignore
                    }
                    if (!athleteId) return;
                    const vehicleId = zone.dataset.vehicleId;
                    if (!vehicleId) return;
                    this.assignAthlete(athleteId, vehicleId);
                });

                // Click to open selection modal
                zone.addEventListener('click', () => {
                    this.openAssignSelectionModal(event, zone.dataset.vehicleId);
                });
            });
        } catch (err) {
            console.warn('attachDragDropHandlers failed', err);
        }
    },

    /**
     * Open a modal to select multiple unassigned athletes and assign them
     */
    openAssignSelectionModal(event, vehicleId) {
        const assigned = new Set(Object.keys(event.logistics.assignments || {}));
        const athletes = event.teamId 
            ? appState.state.athletes.filter(a => a.teamId === event.teamId)
            : appState.state.athletes;
        const unassigned = athletes.filter(a => !assigned.has(a.id));

        if (!unassigned.length) {
            UI.showToast('Nessun atleta disponibile per l\'assegnazione', 'info');
            return;
        }

        const listHtml = unassigned.map(a => `
            <label class="checkbox-item">
                <input type="checkbox" name="assign-athlete" value="${a.id}">
                ${a.firstName} ${a.lastName} ${a.shirtNumber ? '(' + a.shirtNumber + ')' : ''}
            </label>
        `).join('');

        const body = `
            <div class="logistics-container">
                ${listHtml}
            </div>
        `;

        try {
            if (typeof UI !== 'undefined' && typeof UI.showModal === 'function') {
                UI.showModal(`Logistica Trasferta - ${event.title}`, body, 'extra-large');
            } else if (typeof UI !== 'undefined' && UI.showModal) {
                UI.showModal(`Logistica Trasferta - ${event.title}`, body);
            } else {
                // Fallback robusto
                const overlayId = 'modal-logistics-overlay';
                const existing = document.getElementById(overlayId);
                if (existing) existing.remove();
                const overlay = document.createElement('div');
                overlay.id = overlayId;
                overlay.className = 'modal modal-logistics-overlay';
                overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:10000;';
                overlay.innerHTML = `
                    <div class="modal-content" style="max-width:960px;width:90%;background:#fff;border-radius:8px;overflow:hidden;">
                        <div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:1rem;border-bottom:1px solid #eee;">
                            <h3 id="modal-logistics-title" style="margin:0;font-size:1.25rem;">Logistica Trasferte</h3>
                            <button class="modal-close" aria-label="Chiudi" style="background:none;border:0;font-size:1.1rem;padding:0.25rem;cursor:pointer;">✕</button>
                        </div>
                        <div id="modal-logistics-body" class="modal-body" style="padding:1.25rem;max-height:70vh;overflow:auto;">
                            ${body}
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);
                document.body.classList.add('modal-open');
                overlay.querySelector('.modal-close')?.addEventListener('click', ()=>{ overlay.remove(); document.body.classList.remove('modal-open'); });
                overlay.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            setTimeout(() => {
                this.updateStats(event, athletes);
                if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') lucide.createIcons();
            }, 100);
        } catch (e) {
            console.warn('Errore nel rendering modal Logistica:', e);
            if (typeof UI !== 'undefined' && UI.showToast) UI.showToast('Errore visualizzazione logistica: ' + e.message, 'danger');
        }
    },

    /**
     * Renderizza atleti non assegnati
     */
    renderUnassignedAthletes(event, athletes) {
        const assigned = new Set(Object.keys(event.logistics.assignments || {}));
        const unassigned = athletes.filter(a => !assigned.has(a.id));

        if (unassigned.length === 0) {
            return `
                <div class="all-assigned">
                    <i data-lucide="check-circle-2"></i>
                    <p>Tutti gli atleti sono stati assegnati!</p>
                </div>
            `;
        }

        return `
            <div class="athletes-grid">
                ${unassigned.map(athlete => `
                    <div class="athlete-chip unassigned-chip" draggable="true" data-athlete-id="${athlete.id}">
                        <span>${athlete.firstName} ${athlete.lastName}</span>
                        <div class="athlete-assign-btn">
                            <button class="btn-icon btn-sm" onclick="LogisticsModule.showAssignMenu('${athlete.id}')" title="Assegna">
                                <i data-lucide="arrow-right"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Mostra form aggiungi veicolo
     */
    showAddVehicleForm() {
        const formHtml = `
            <div class="vehicle-form">
                <form id="vehicle-form">
                    <div class="form-group">
                        <label>Tipo Veicolo *</label>
                        <select name="type" required>
                            <option value="car">🚗 Auto</option>
                            <option value="bus">🚌 Pullman</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Nome/Identificativo *</label>
                        <input type="text" name="name" required placeholder="es. Auto Rossi, Pullman Blu">
                    </div>

                    <div class="form-group">
                        <label>Conducente *</label>
                        <input type="text" name="driver" required placeholder="Nome e cognome">
                    </div>

                    <div class="form-group">
                        <label>Telefono Conducente</label>
                        <input type="tel" name="phone" placeholder="+39 123 456 7890">
                    </div>

                    <div class="form-group">
                        <label>Numero Posti *</label>
                        <input type="number" name="seats" required min="2" max="60" value="4" placeholder="4">
                        <small>Posti disponibili per atleti (escluso conducente)</small>
                    </div>

                    <div class="form-group">
                        <label>Note</label>
                        <textarea name="notes" rows="2" placeholder="Informazioni aggiuntive..."></textarea>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">
                            Annulla
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="save"></i>
                            Aggiungi Veicolo
                        </button>
                    </div>
                </form>
            </div>
        `;

        UI.showModal('Aggiungi Veicolo', formHtml, 'medium');

        document.getElementById('vehicle-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveVehicle();
        });

        lucide.createIcons();
    },

    /**
     * Salva nuovo veicolo
     */
    saveVehicle(vehicleId = null) {
        const form = document.getElementById('vehicle-form');
        const formData = new FormData(form);

        const event = appState.state.calendar.find(e => e.id === this.currentEventId);
        if (!event) return;

        const vehicle = {
            id: vehicleId || Date.now().toString(),
            type: formData.get('type'),
            name: formData.get('name'),
            driver: formData.get('driver'),
            phone: formData.get('phone'),
            seats: parseInt(formData.get('seats')),
            notes: formData.get('notes')
        };

        if (vehicleId) {
            // Modifica esistente
            const index = event.logistics.vehicles.findIndex(v => v.id === vehicleId);
            if (index !== -1) {
                event.logistics.vehicles[index] = vehicle;
            }
        } else {
            // Nuovo veicolo
            event.logistics.vehicles.push(vehicle);
        }

        appState.saveState();
        UI.closeModal();
        
        // Riapri logistica
        setTimeout(() => {
            this.showLogistics(this.currentEventId);
        }, 300);

        UI.showToast(vehicleId ? 'Veicolo modificato' : 'Veicolo aggiunto', 'success');
    },

    /**
     * Modifica veicolo
     */
    editVehicle(vehicleId) {
        const event = appState.state.calendar.find(e => e.id === this.currentEventId);
        if (!event) return;

        const vehicle = event.logistics.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;

        const formHtml = `
            <div class="vehicle-form">
                <form id="vehicle-form">
                    <div class="form-group">
                        <label>Tipo Veicolo *</label>
                        <select name="type" required>
                            <option value="car" ${vehicle.type === 'car' ? 'selected' : ''}>🚗 Auto</option>
                            <option value="bus" ${vehicle.type === 'bus' ? 'selected' : ''}>🚌 Pullman</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Nome/Identificativo *</label>
                        <input type="text" name="name" required value="${vehicle.name}">
                    </div>

                    <div class="form-group">
                        <label>Conducente *</label>
                        <input type="text" name="driver" required value="${vehicle.driver}">
                    </div>

                    <div class="form-group">
                        <label>Telefono Conducente</label>
                        <input type="tel" name="phone" value="${vehicle.phone || ''}">
                    </div>

                    <div class="form-group">
                        <label>Numero Posti *</label>
                        <input type="number" name="seats" required min="2" max="60" value="${vehicle.seats}">
                        <small>Posti disponibili per atleti (escluso conducente)</small>
                    </div>

                    <div class="form-group">
                        <label>Note</label>
                        <textarea name="notes" rows="2">${vehicle.notes || ''}</textarea>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">
                            Annulla
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="save"></i>
                            Salva Modifiche
                        </button>
                    </div>
                </form>
            </div>
        `;

        UI.showModal('Modifica Veicolo', formHtml, 'medium');

        document.getElementById('vehicle-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveVehicle(vehicleId);
        });

        lucide.createIcons();
    },

    /**
     * Elimina veicolo
     */
    deleteVehicle(vehicleId) {
        if (!confirm('Eliminare questo veicolo? Gli atleti assegnati verranno liberati.')) {
            return;
        }

        const event = appState.state.calendar.find(e => e.id === this.currentEventId);
        if (!event) return;

        // Rimuovi veicolo
        event.logistics.vehicles = event.logistics.vehicles.filter(v => v.id !== vehicleId);

        // Rimuovi assegnazioni
        Object.keys(event.logistics.assignments).forEach(athleteId => {
            if (event.logistics.assignments[athleteId] === vehicleId) {
                delete event.logistics.assignments[athleteId];
            }
        });

        appState.saveState();
        
        // Ricarica
        this.showLogistics(this.currentEventId);
        UI.showToast('Veicolo eliminato', 'success');
    },

    /**
     * Assegna atleta a veicolo
     */
    assignAthlete(athleteId, vehicleId) {
        const event = appState.state.calendar.find(e => e.id === this.currentEventId);
        if (!event) return;

        const vehicle = event.logistics.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;

        // Verifica posti disponibili
        const currentAssignments = Object.values(event.logistics.assignments).filter(v => v === vehicleId).length;
        if (currentAssignments >= vehicle.seats) {
            UI.showToast('Veicolo pieno', 'warning');
            return;
        }

        // Assegna
        if (!event.logistics.assignments) {
            event.logistics.assignments = {};
        }
        event.logistics.assignments[athleteId] = vehicleId;

        appState.saveState();
        this.showLogistics(this.currentEventId);

        const athlete = appState.getAthlete(athleteId);
        UI.showToast(`${athlete.firstName} ${athlete.lastName} assegnato a ${vehicle.name}`, 'success');
    },

    /**
     * Rimuovi assegnazione atleta
     */
    unassignAthlete(athleteId) {
        const event = appState.state.calendar.find(e => e.id === this.currentEventId);
        if (!event) return;

        delete event.logistics.assignments[athleteId];
        appState.saveState();
        
        this.showLogistics(this.currentEventId);

        const athlete = appState.getAthlete(athleteId);
        UI.showToast(`${athlete.firstName} ${athlete.lastName} rimosso`, 'info');
    },

    /**
     * Mostra menu assegnazione per atleta
     */
    showAssignMenu(athleteId) {
        const event = appState.state.calendar.find(e => e.id === this.currentEventId);
        if (!event || !event.logistics.vehicles.length) return;

        const athlete = appState.getAthlete(athleteId);
        const menuHtml = `
            <div class="assign-menu">
                <h4>Assegna ${athlete.firstName} ${athlete.lastName} a:</h4>
                <div class="vehicle-options">
                    ${event.logistics.vehicles.map(vehicle => {
                        const currentAssignments = Object.values(event.logistics.assignments || {})
                            .filter(v => v === vehicle.id).length;
                        const available = vehicle.seats - currentAssignments;
                        const disabled = available <= 0;

                        return `
                            <button class="vehicle-option ${disabled ? 'disabled' : ''}" 
                                    onclick="LogisticsModule.assignAthlete('${athleteId}', '${vehicle.id}'); UI.closeModal();"
                                    ${disabled ? 'disabled' : ''}>
                                <div class="option-icon">
                                    <i data-lucide="${vehicle.type === 'bus' ? 'bus' : 'car'}"></i>
                                </div>
                                <div class="option-info">
                                    <strong>${vehicle.name}</strong>
                                    <span>${vehicle.driver}</span>
                                    <span class="option-seats ${disabled ? 'full' : ''}">
                                        ${available} ${available === 1 ? 'posto' : 'posti'} ${disabled ? '(PIENO)' : ''}
                                    </span>
                                </div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        UI.showModal('Seleziona Veicolo', menuHtml, 'small');
        setTimeout(() => lucide.createIcons(), 100);
    },

    /**
     * Assegnazione automatica atleti
     */
    autoAssignAthletes() {
        const event = appState.state.calendar.find(e => e.id === this.currentEventId);
        if (!event || !event.logistics.vehicles.length) {
            UI.showToast('Aggiungi prima dei veicoli', 'warning');
            return;
        }

        const athletes = event.teamId 
            ? appState.state.athletes.filter(a => a.teamId === event.teamId)
            : appState.state.athletes;

        if (!confirm(`Assegnare automaticamente ${athletes.length} atleti ai veicoli disponibili?`)) {
            return;
        }

        // Reset assegnazioni
        event.logistics.assignments = {};

        // Ordina veicoli per capienza (dal più grande al più piccolo)
        const vehicles = [...event.logistics.vehicles].sort((a, b) => b.seats - a.seats);

        let vehicleIndex = 0;
        let athleteIndex = 0;

        while (athleteIndex < athletes.length && vehicleIndex < vehicles.length) {
            const vehicle = vehicles[vehicleIndex];
            const currentAssignments = Object.values(event.logistics.assignments)
                .filter(v => v === vehicle.id).length;

            if (currentAssignments < vehicle.seats) {
                event.logistics.assignments[athletes[athleteIndex].id] = vehicle.id;
                athleteIndex++;
            } else {
                vehicleIndex++;
            }
        }

        appState.saveState();
        this.showLogistics(this.currentEventId);

        const assigned = Object.keys(event.logistics.assignments).length;
        UI.showToast(`${assigned} atleti assegnati automaticamente`, 'success');
    },

    /**
     * Aggiorna statistiche
     */
    updateStats(event, athletes) {
        const assignedCount = Object.keys(event.logistics.assignments || {}).length;
        const totalSeats = event.logistics.vehicles.reduce((sum, v) => sum + v.seats, 0);
        const availableSeats = totalSeats - assignedCount;

        document.getElementById('assigned-athletes').textContent = assignedCount;
        document.getElementById('available-seats').textContent = availableSeats;
    },

    /**
     * Esporta PDF logistica trasferta
     */
    async exportLogisticsPDF() {
        const event = appState.state.calendar.find(e => e.id === this.currentEventId);
        if (!event) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Titolo (emoji removed to avoid font/encoding issues)
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 71, 42);
        doc.text('LOGISTICA TRASFERTA', 105, 20, { align: 'center' });

        // Info Evento
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(event.title, 105, 30, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`${new Date(event.date).toLocaleDateString('it-IT')} ${event.time || ''}`, 105, 37, { align: 'center' });
        if (event.location) {
            doc.text(`Destinazione: ${event.location}`, 105, 44, { align: 'center' });
        }

        let yPos = 55;

        // Tabella veicoli (solo riepilogo pulito per PDF: conducente, telefono, lista atleti assegnati)
        event.logistics.vehicles.forEach(vehicle => {
            const assignedAthletes = Object.entries(event.logistics.assignments || {})
                .filter(([_, vId]) => vId === vehicle.id)
                .map(([aId]) => appState.getAthlete(aId))
                .filter(a => a);
            // Skip vehicle if no assigned athletes (we only want clean summary)
            if (!assignedAthletes.length) return;

            // Driver name + phone
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`Conducente: ${vehicle.driver || 'N/D'}`, 25, yPos);
            yPos += 6;
            if (vehicle.phone) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Telefono: ${vehicle.phone}`, 25, yPos);
                yPos += 7;
            }

            // Lista atleti assegnati
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            assignedAthletes.forEach((athlete, index) => {
                doc.text(`${index + 1}. ${athlete.firstName} ${athlete.lastName}`, 30, yPos);
                yPos += 6;
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
            });

            yPos += 5;

            // Nuova pagina se necessario
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
        });

        // Atleti non assegnati
        const assigned = new Set(Object.keys(event.logistics.assignments || {}));
        const athletes = event.teamId 
            ? appState.state.athletes.filter(a => a.teamId === event.teamId)
            : appState.state.athletes;
        const unassigned = athletes.filter(a => !assigned.has(a.id));

        if (unassigned.length > 0) {
            yPos += 5;
            doc.setFillColor(239, 68, 68);
            doc.rect(20, yPos, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`⚠️ Atleti Non Assegnati (${unassigned.length})`, 25, yPos + 6);
            
            yPos += 10;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');

            unassigned.forEach((athlete, index) => {
                doc.text(`${index + 1}. ${athlete.firstName} ${athlete.lastName}`, 30, yPos);
                yPos += 5;
                
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
            });
        }

        // Footer (shared)
        if (window.PDFUtils && typeof window.PDFUtils.addStandardFooter === 'function') {
            window.PDFUtils.addStandardFooter(doc);
        } else {
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text(`SoccerManager Pro - Pagina ${i}/${pageCount}`, 105, 287, { align: 'center' });
            }
        }

        // Salva
        const filename = `Logistica_${event.title.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);

        UI.showToast('PDF Logistica esportato', 'success');
    }
};

// Esposizione globale
window.LogisticsModule = LogisticsModule;

// Aggiungo un log per confermare il caricamento del modulo
console.log('LogisticsModule caricato e disponibile su window');

// Dashboard generale logistica: mostra un messaggio informativo o una lista trasferte
LogisticsModule.showLogisticsDashboard = function() {
    const body = `<div style="padding:2rem;text-align:center"><i data-lucide='bus' style='font-size:3rem;color:#2563eb;'></i><h3>Seleziona una partita dal calendario per gestire la logistica della trasferta.</h3><p>Vai su <b>Calendario</b> e clicca sull'icona <i data-lucide='bus'></i> accanto alla partita desiderata.</p></div>`;
    // Assicura chiusura di qualsiasi modal aperta prima di aprire la nostra
    if (typeof UI !== 'undefined' && typeof UI.closeModal === 'function') {
        try { UI.closeModal(); } catch (e) { /* ignore */ }
    }

    // Prima prova con UI.showModal se disponibile
    if (typeof UI !== 'undefined' && typeof UI.showModal === 'function') {
        UI.showModal('Logistica Trasferte', body, 'medium');
    } else if (typeof UI !== 'undefined' && UI.showModal) {
        // backward-compat fallback
        UI.showModal('Logistica Trasferte', body);
    }

    // Fallback robusto: assicurati che la modal sia visibile anche se UI.showModal non ha effetto
    try {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = 'Logistica Trasferte';
            modalBody.innerHTML = body;
            modal.classList.add('active');
            modal.classList.add('modal-logistics');
            modal.style.zIndex = 9999;
            document.body.classList.add('modal-open');
            // ensure it's on top and visible
            modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
            console.log('Logistics dashboard modal forced visible (with modal-logistics class)');
        }

        // Ulteriore fallback: crea una modal indipendente se la modal condivisa viene sovrascritta
        const overlayId = 'modal-logistics-overlay';
        // rimuovi overlay esistente
        const existing = document.getElementById(overlayId);
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.className = 'modal modal-logistics-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:10000;';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:960px;width:90%;background:#fff;border-radius:8px;overflow:hidden;">
                <div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:1rem;border-bottom:1px solid #eee;">
                    <h3 id="modal-logistics-title" style="margin:0;font-size:1.25rem;">Logistica Trasferte</h3>
                    <button class="modal-close" aria-label="Chiudi" style="background:none;border:0;font-size:1.1rem;padding:0.25rem;cursor:pointer;">✕</button>
                </div>
                <div id="modal-logistics-body" class="modal-body" style="padding:1.25rem;max-height:70vh;overflow:auto;">
                    ${body}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.classList.add('modal-open');
        overlay.querySelector('.modal-close')?.addEventListener('click', ()=>{ overlay.remove(); document.body.classList.remove('modal-open'); });
        // ensure the overlay is reachable and focused
        overlay.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log('Logistics overlay created and displayed');
    } catch (e) {
        console.warn('Errore nel rendering modal Logistica:', e);
    }

    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') setTimeout(()=>lucide.createIcons(),100);
};
