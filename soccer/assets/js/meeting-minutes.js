/**
 * MEETING-MINUTES.JS
 * Generatore Verbali Assemblee Sociali
 * - Ordine del giorno dinamico
 * - Selezione partecipanti da libro soci
 * - Generazione PDF formattato
 * - Archivio verbali storici
 */

class MeetingMinutesManager {
    constructor() {
        this.currentMinute = {
            type: 'ordinaria',
            date: new Date().toISOString(),
            participants: [],
            agenda: [],
            decisions: [],
            notes: ''
        };

        // Aggiorna la vista dei verbali quando gli atleti cambiano
        try {
            const setupSubscriptions = () => {
                if (typeof appState !== 'undefined' && typeof appState.subscribe === 'function') {
                    appState.subscribe('athletes:added', () => this._refreshIfActive());
                    appState.subscribe('athletes:updated', () => this._refreshIfActive());
                    appState.subscribe('athletes:deleted', () => this._refreshIfActive());
                }
            };
            setupSubscriptions();
            setTimeout(setupSubscriptions, 500);
        } catch (e) { /* ignore */ }
    }

    _refreshIfActive() {
        try {
            if (document.querySelector('.meeting-minutes-dashboard')) {
                this.showMeetingMinutesDashboard();
                return;
            }
            const membersSelection = document.getElementById('membersSelection');
            if (membersSelection) {
                this.updateMembersSelection();
            }
        } catch (e) { /* ignore */ }
    }

    updateMembersSelection() {
        const members = this.getSocialMembers();
        const el = document.getElementById('membersSelection');
        if (!el) return;

        if (members.length === 0) {
            el.innerHTML = `
                <div class="empty-members">
                    <p>Nessun socio disponibile. Aggiungi atleti per creare il libro soci.</p>
                </div>
            `;
        } else {
            let html = `
                <div class="select-all-row">
                    <label class="checkbox-label">
                        <input type="checkbox" id="selectAll" onchange="meetingMinutes.toggleSelectAll(this.checked)">
                        <span>Seleziona Tutti</span>
                    </label>
                </div>
            `;
            html += members.map(member => `
                <label class="member-checkbox" data-name="${(member.name||'').toLowerCase()}">
                    <input type="checkbox" class="member-select" value="${member.id}" onchange="meetingMinutes.updateSelectedCount()">
                    <div class="member-info">
                        <div class="member-avatar">${member.name ? member.name.charAt(0) : '?'}</div>
                        <div>
                            <h4>${member.name || '—'}</h4>
                            <p>${member.role || 'Socio'}</p>
                        </div>
                    </div>
                </label>
            `).join('');
            el.innerHTML = html;
            Utils.initLucideIcons();
            this.updateSelectedCount();
        }
    }    
    showMeetingMinutesDashboard() {
        const minutes = this.getSavedMinutes();
        
        const html = `
            <div class="meeting-minutes-dashboard">
                <div class="section-header">
                    <h2><i data-lucide="file-text"></i> Verbali Assemblee</h2>
                    <button class="btn btn-primary btn-glass primary" onclick="meetingMinutes.showCreateMinuteForm()">
                        <i data-lucide="plus"></i>
                        Nuovo Verbale
                    </button>
                </div>
                
                <!-- Statistiche Rapide -->
                <div class="stats-overview">
                    <div class="stat-card">
                        <div class="stat-icon bg-blue">
                            <i data-lucide="calendar"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${minutes.length}</h3>
                            <p>Verbali Totali</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-green">
                            <i data-lucide="users"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${this.getSocialMembers().length}</h3>
                            <p>Soci Registrati</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-orange">
                            <i data-lucide="clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${this.getRecentMinutesCount()}</h3>
                            <p>Ultimi 30 giorni</p>
                        </div>
                    </div>
                </div>
                
                <!-- Lista Verbali Storici -->
                <div class="minutes-history">
                    <h3><i data-lucide="history"></i> Storico Verbali</h3>
                    
                    ${minutes.length === 0 ? `
                        <div class="empty-state">
                            <i data-lucide="folder-open"></i>
                            <h4>Nessun Verbale</h4>
                            <p>Crea il primo verbale di assemblea</p>
                        </div>
                    ` : `
                        <div class="minutes-list">
                            ${minutes.map(minute => this.renderMinuteCard(minute)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = html;
        Utils.initLucideIcons();
    }
    
    renderMinuteCard(minute) {
        const date = new Date(minute.date);
        const typeLabels = {
            ordinaria: 'Ordinaria',
            straordinaria: 'Straordinaria',
            consiglio: 'Consiglio Direttivo'
        };
        
        return `
            <div class="minute-card">
                <div class="minute-header">
                    <div class="minute-type ${minute.type}">
                        ${typeLabels[minute.type] || 'Assemblea'}
                    </div>
                    <div class="minute-date">
                        <i data-lucide="calendar"></i>
                        ${date.toLocaleDateString('it-IT')} - ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div class="minute-content">
                    <div class="minute-info">
                        <p><strong>Partecipanti:</strong> ${minute.participants.length}</p>
                        <p><strong>Punti OdG:</strong> ${minute.agenda.length}</p>
                    </div>
                    ${minute.agenda.length > 0 ? `
                        <div class="minute-preview">
                            <strong>Ordine del Giorno:</strong>
                            <ol>
                                ${minute.agenda.slice(0, 3).map(item => `<li>${item}</li>`).join('')}
                                ${minute.agenda.length > 3 ? '<li>...</li>' : ''}
                            </ol>
                        </div>
                    ` : ''}
                </div>
                <div class="minute-actions">
                    <button class="btn btn-secondary btn-glass secondary" onclick="meetingMinutes.viewMinute('${minute.id}')">
                        <i data-lucide="eye"></i>
                        Visualizza
                    </button>
                    <button class="btn btn-primary btn-glass primary" onclick="meetingMinutes.downloadMinutePDF('${minute.id}')">
                        <i data-lucide="download"></i>
                        Scarica PDF
                    </button>
                    <button class="btn-icon btn-danger" onclick="meetingMinutes.deleteMinute('${minute.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    showCreateMinuteForm() {
        const members = this.getSocialMembers();
        
        const html = `
            <div class="create-minute-form">
                <div class="form-header">
                    <button class="btn-icon" onclick="meetingMinutes.showMeetingMinutesDashboard()">
                        <i data-lucide="arrow-left"></i>
                    </button>
                    <h2><i data-lucide="file-plus"></i> Nuovo Verbale Assemblea</h2>
                </div>
                
                <div class="form-content">
                    <!-- Tipo Assemblea -->
                    <div class="form-section">
                        <h3><i data-lucide="info"></i> Informazioni Assemblea</h3>
                        
                        <div class="form-group">
                            <label>Tipo Assemblea *</label>
                            <select id="meetingType" class="form-input">
                                <option value="ordinaria">Assemblea Ordinaria</option>
                                <option value="straordinaria">Assemblea Straordinaria</option>
                                <option value="consiglio">Consiglio Direttivo</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Data *</label>
                                <input type="date" id="meetingDate" class="form-input" 
                                       value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>Ora *</label>
                                <input type="time" id="meetingTime" class="form-input" 
                                       value="${new Date().toTimeString().slice(0,5)}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Luogo Assemblea</label>
                            <input type="text" id="meetingPlace" class="form-input" 
                                   placeholder="Es: Sede Sociale, Via Roma 1">
                        </div>
                    </div>
                    
                    <!-- Selezione Partecipanti -->
                    <div class="form-section">
                        <h3>
                            <i data-lucide="users"></i> 
                            Partecipanti 
                            <span class="selected-count" id="selectedCount">(0 selezionati)</span>
                        </h3>
                        
                        <div class="search-filter">
                            <i data-lucide="search"></i>
                            <input type="text" id="memberSearch" class="form-input" 
                                   placeholder="Cerca socio per nome..." 
                                   onkeyup="meetingMinutes.filterMembers(this.value)">
                        </div>
                        
                        <div class="members-selection" id="membersSelection">
                            ${members.length === 0 ? `
                                <div class="empty-members">
                                    <p>Nessun socio disponibile. Aggiungi atleti per creare il libro soci.</p>
                                </div>
                            ` : `
                                <div class="select-all-row">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="selectAll" onchange="meetingMinutes.toggleSelectAll(this.checked)">
                                        <span>Seleziona Tutti</span>
                                    </label>
                                </div>
                                ${members.map(member => `
                                    <label class="member-checkbox" data-name="${(member.name||'').toLowerCase()}">
                                        <input type="checkbox" class="member-select" value="${member.id}" 
                                               onchange="meetingMinutes.updateSelectedCount()">
                                        <div class="member-info">
                                            <div class="member-avatar">${member.name ? member.name.charAt(0) : '?'}</div>
                                            <div>
                                                <h4>${member.name || '—'}</h4>
                                                <p>${member.role || 'Socio'}</p>
                                            </div>
                                        </div>
                                    </label>
                                `).join('')}
                            `}
                        </div>
                    </div>
                    
                    <!-- Ordine del Giorno -->
                    <div class="form-section">
                        <h3>
                            <i data-lucide="list"></i> 
                            Ordine del Giorno
                        </h3>
                        
                        <div id="agendaItems">
                            <div class="agenda-item">
                                <input type="text" class="form-input agenda-input" 
                                       placeholder="1. Es: Approvazione verbale assemblea precedente">
                            </div>
                            <div class="agenda-item">
                                <input type="text" class="form-input agenda-input" 
                                       placeholder="2. Es: Bilancio economico stagione">
                            </div>
                        </div>
                        
                        <button class="btn btn-secondary" onclick="meetingMinutes.addAgendaItem()">
                            <i data-lucide="plus"></i>
                            Aggiungi Punto OdG
                        </button>
                    </div>
                    
                    <!-- Delibere e Decisioni -->
                    <div class="form-section">
                        <h3><i data-lucide="clipboard-check"></i> Delibere e Decisioni</h3>
                        
                        <div id="decisionsItems">
                            <div class="decision-item">
                                <label>Delibera 1</label>
                                <textarea class="form-input decision-input" rows="3" 
                                          placeholder="Descrivi la delibera o decisione presa..."></textarea>
                            </div>
                        </div>
                        
                        <button class="btn btn-secondary" onclick="meetingMinutes.addDecisionItem()">
                            <i data-lucide="plus"></i>
                            Aggiungi Delibera
                        </button>
                    </div>
                    
                    <!-- Note Aggiuntive -->
                    <div class="form-section">
                        <h3><i data-lucide="message-square"></i> Note Aggiuntive</h3>
                        <textarea id="meetingNotes" class="form-input" rows="4" 
                                  placeholder="Note, osservazioni o informazioni aggiuntive..."></textarea>
                    </div>
                    
                    <!-- Azioni -->
                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="meetingMinutes.showMeetingMinutesDashboard()">
                            Annulla
                        </button>
                        <button class="btn btn-primary btn-glass primary" onclick="meetingMinutes.previewMinute()">
                            <i data-lucide="eye"></i>
                            Anteprima
                        </button>
                        <button class="btn btn-primary btn-glass primary" onclick="meetingMinutes.generateMinutePDF()">
                            <i data-lucide="download"></i>
                            Genera PDF
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = html;
        Utils.initLucideIcons();
    }
    
    filterMembers(query) {
        const members = document.querySelectorAll('.member-checkbox');
        const searchTerm = (query || '').toLowerCase();
        
        members.forEach(member => {
            const name = member.getAttribute('data-name') || '';
            member.style.display = name.includes(searchTerm) ? 'flex' : 'none';
        });
    }
    
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.member-select');
        checkboxes.forEach(cb => cb.checked = checked);
        this.updateSelectedCount();
    }
    
    updateSelectedCount() {
        const selected = document.querySelectorAll('.member-select:checked').length;
        const countEl = document.getElementById('selectedCount');
        if (countEl) {
            countEl.textContent = `(${selected} selezionati)`;
        }
    }
    
    addAgendaItem() {
        const container = document.getElementById('agendaItems');
        const count = container.children.length + 1;
        
        const item = document.createElement('div');
        item.className = 'agenda-item';
        item.innerHTML = `
            <input type="text" class="form-input agenda-input" 
                   placeholder="${count}. Inserisci punto ordine del giorno">
            <button class="btn-icon btn-danger" onclick="this.parentElement.remove()">
                <i data-lucide="x"></i>
            </button>
        `;
        
        container.appendChild(item);
        Utils.initLucideIcons();
    }
    
    addDecisionItem() {
        const container = document.getElementById('decisionsItems');
        const count = container.children.length + 1;
        
        const item = document.createElement('div');
        item.className = 'decision-item';
        item.innerHTML = `
            <label>Delibera ${count}</label>
            <textarea class="form-input decision-input" rows="3" 
                      placeholder="Descrivi la delibera o decisione presa..."></textarea>
            <button class="btn-icon btn-danger" onclick="this.parentElement.remove()">
                <i data-lucide="x"></i>
            </button>
        `;
        
        container.appendChild(item);
        Utils.initLucideIcons();
    }
    
    collectFormData() {
        const type = document.getElementById('meetingType')?.value || 'ordinaria';
        const dateStr = document.getElementById('meetingDate')?.value;
        const timeStr = document.getElementById('meetingTime')?.value;
        const place = document.getElementById('meetingPlace')?.value || 'Sede Sociale';
        
        // Combine date and time
        const dateTime = new Date(`${dateStr}T${timeStr}`);
        
        // Get selected participants
        const selectedIds = Array.from(document.querySelectorAll('.member-select:checked'))
            .map(cb => cb.value);
        const members = this.getSocialMembers();
        const participants = members.filter(m => selectedIds.includes(m.id));
        
        // Get agenda items
        const agendaInputs = document.querySelectorAll('.agenda-input');
        const agenda = Array.from(agendaInputs)
            .map(input => input.value.trim())
            .filter(val => val !== '');
        
        // Get decisions
        const decisionInputs = document.querySelectorAll('.decision-input');
        const decisions = Array.from(decisionInputs)
            .map(input => input.value.trim())
            .filter(val => val !== '');
        
        const notes = document.getElementById('meetingNotes')?.value || '';
        
        return {
            id: Date.now().toString(),
            type,
            date: dateTime.toISOString(),
            place,
            participants,
            agenda,
            decisions,
            notes
        };
    }
    
    previewMinute() {
        const data = this.collectFormData();
        
        if (data.participants.length === 0) {
            Utils.showToast('Seleziona almeno un partecipante', 'warning');
            return;
        }
        
        if (data.agenda.length === 0) {
            Utils.showToast('Inserisci almeno un punto all\'ordine del giorno', 'warning');
            return;
        }
        
        const html = `
            <div class="minute-preview-modal">
                <div class="preview-container">
                    <div class="preview-header">
                        <h2>Anteprima Verbale</h2>
                        <button class="btn-icon" onclick="meetingMinutes.showCreateMinuteForm()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    
                    <div class="preview-content">
                        ${this.generateMinuteHTML(data)}
                    </div>
                    
                    <div class="preview-actions">
                        <button class="btn btn-secondary" onclick="meetingMinutes.showCreateMinuteForm()">
                            <i data-lucide="edit"></i>
                            Modifica
                        </button>
                        <button class="btn btn-primary" onclick="meetingMinutes.saveAndGeneratePDF()">
                            <i data-lucide="download"></i>
                            Salva e Genera PDF
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = html;
        Utils.initLucideIcons();
        
        // Store current data temporarily
        this.currentMinute = data;
    }
    
    generateMinutePDF() {
        const data = this.collectFormData();
        
        if (data.participants.length === 0) {
            Utils.showToast('Seleziona almeno un partecipante', 'warning');
            return;
        }
        
        if (data.agenda.length === 0) {
            Utils.showToast('Inserisci almeno un punto all\'ordine del giorno', 'warning');
            return;
        }
        
        // Save and generate
        this.currentMinute = data;
        this.saveAndGeneratePDF();
    }
    
    async saveAndGeneratePDF() {
        try {
            // Save to storage
            const minutes = this.getSavedMinutes();
            minutes.unshift(this.currentMinute);
            localStorage.setItem('meetingMinutes', JSON.stringify(minutes));
            
            // Generate PDF
            await this.createPDF(this.currentMinute);
            
            Utils.showToast('Verbale salvato e scaricato!', 'success');
            Utils.hapticFeedback('success');
            
            setTimeout(() => this.showMeetingMinutesDashboard(), 1500);
            
        } catch (error) {
            console.error('Error saving minute:', error);
            Utils.showToast('Errore durante il salvataggio', 'error');
        }
    }
    
    generateMinuteHTML(data) {
        const date = new Date(data.date);
        const typeLabels = {
            ordinaria: 'ASSEMBLEA ORDINARIA DEI SOCI',
            straordinaria: 'ASSEMBLEA STRAORDINARIA DEI SOCI',
            consiglio: 'VERBALE CONSIGLIO DIRETTIVO'
        };
        
        return `
            <div class="minute-document">
                <div class="doc-header-official">
                    <h1>VERBALE</h1>
                    <h2>${typeLabels[data.type]}</h2>
                    <p class="doc-number">N. ${data.id.slice(-6)}</p>
                </div>
                
                <div class="doc-meta">
                    <p><strong>Data:</strong> ${date.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Ora:</strong> ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Luogo:</strong> ${data.place}</p>
                </div>
                
                <div class="doc-section">
                    <h3>PRESENTI</h3>
                    <div class="participants-list">
                        ${data.participants.map((p, i) => 
                            `<p>${i + 1}. ${p.name}${p.role ? ` - ${p.role}` : ''}</p>`
                        ).join('')}
                    </div>
                    <p class="participant-count"><em>Totale presenti: ${data.participants.length}</em></p>
                </div>
                
                <div class="doc-section">
                    <h3>ORDINE DEL GIORNO</h3>
                    <ol class="agenda-list">
                        ${data.agenda.map(item => `<li>${item}</li>`).join('')}
                    </ol>
                </div>
                
                ${data.decisions.length > 0 ? `
                    <div class="doc-section">
                        <h3>DELIBERE E DECISIONI</h3>
                        ${data.decisions.map((decision, i) => `
                            <div class="decision-block">
                                <h4>Delibera ${i + 1}</h4>
                                <p>${decision}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${data.notes ? `
                    <div class="doc-section">
                        <h3>NOTE</h3>
                        <p>${data.notes}</p>
                    </div>
                ` : ''}
                
                <div class="doc-closing">
                    <p>La riunione termina alle ore ___________</p>
                    <br>
                    <div class="signatures">
                        <div class="signature-block">
                            <p>Il Presidente</p>
                            <div class="signature-line">_____________________________</div>
                        </div>
                        <div class="signature-block">
                            <p>Il Segretario</p>
                            <div class="signature-line">_____________________________</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async createPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const date = new Date(data.date);
        const typeLabels = {
            ordinaria: 'ASSEMBLEA ORDINARIA DEI SOCI',
            straordinaria: 'ASSEMBLEA STRAORDINARIA DEI SOCI',
            consiglio: 'VERBALE CONSIGLIO DIRETTIVO'
        };
        
        let y = 20;
        
        // Header
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('VERBALE', 105, y, { align: 'center' });
        
        y += 10;
        doc.setFontSize(14);
        doc.text(typeLabels[data.type], 105, y, { align: 'center' });
        
        y += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`N. ${data.id.slice(-6)}`, 105, y, { align: 'center' });
        
        y += 15;
        
        // Meta info
        doc.setFontSize(11);
        doc.text(`Data: ${date.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 20, y);
        y += 6;
        doc.text(`Ora: ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`, 20, y);
        y += 6;
        doc.text(`Luogo: ${data.place}`, 20, y);
        
        y += 12;
        
        // Participants
        doc.setFont(undefined, 'bold');
        doc.text('PRESENTI:', 20, y);
        y += 6;
        
        doc.setFont(undefined, 'normal');
        data.participants.forEach((p, i) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(`${i + 1}. ${p.name}${p.role ? ` - ${p.role}` : ''}`, 25, y);
            y += 5;
        });
        
        doc.setFont(undefined, 'italic');
        y += 2;
        doc.text(`Totale presenti: ${data.participants.length}`, 25, y);
        
        y += 12;
        
        // Agenda
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text('ORDINE DEL GIORNO:', 20, y);
        y += 6;
        
        doc.setFont(undefined, 'normal');
        data.agenda.forEach((item, i) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            const lines = doc.splitTextToSize(`${i + 1}. ${item}`, 170);
            doc.text(lines, 25, y);
            y += lines.length * 5 + 2;
        });
        
        y += 8;
        
        // Decisions
        if (data.decisions.length > 0) {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFont(undefined, 'bold');
            doc.text('DELIBERE E DECISIONI:', 20, y);
            y += 6;
            
            data.decisions.forEach((decision, i) => {
                if (y > 260) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.setFont(undefined, 'bold');
                doc.text(`Delibera ${i + 1}:`, 25, y);
                y += 5;
                
                doc.setFont(undefined, 'normal');
                const lines = doc.splitTextToSize(decision, 165);
                doc.text(lines, 25, y);
                y += lines.length * 5 + 5;
            });
        }
        
        // Notes
        if (data.notes) {
            y += 5;
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFont(undefined, 'bold');
            doc.text('NOTE:', 20, y);
            y += 6;
            
            doc.setFont(undefined, 'normal');
            const lines = doc.splitTextToSize(data.notes, 170);
            doc.text(lines, 25, y);
            y += lines.length * 5;
        }
        
        // Closing and signatures
        if (y > 230) {
            doc.addPage();
            y = 20;
        } else {
            y += 15;
        }
        
        doc.setFont(undefined, 'normal');
        doc.text('La riunione termina alle ore ___________', 20, y);
        
        y += 20;
        
        // Signatures
        doc.text('Il Presidente', 30, y);
        doc.text('Il Segretario', 120, y);
        
        y += 5;
        doc.line(30, y, 85, y); // President signature line
        doc.line(120, y, 175, y); // Secretary signature line
        
        // Footer (shared)
        if (window.PDFUtils && typeof window.PDFUtils.addStandardFooter === 'function') {
            window.PDFUtils.addStandardFooter(doc);
        } else {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Documento generato da SoccerManager Pro', 105, 285, { align: 'center' });
        }
        
        // Save
        const filename = `Verbale_${typeLabels[data.type].replace(/\s+/g, '_')}_${date.toLocaleDateString('it-IT').replace(/\//g, '-')}.pdf`;
        
        // Save to filesystem if available
        if (window.fileSystemManager && window.fileSystemManager.rootDirectoryHandle) {
            const pdfBlob = doc.output('blob');
            await fileSystemManager.saveFile(filename, pdfBlob, 'Verbali');
        } else {
            // Fallback to download
            doc.save(filename);
        }
    }
    
    async downloadMinutePDF(id) {
        const minutes = this.getSavedMinutes();
        const minute = minutes.find(m => m.id === id);
        
        if (minute) {
            await this.createPDF(minute);
            Utils.showToast('PDF scaricato!', 'success');
        }
    }
    
    viewMinute(id) {
        const minutes = this.getSavedMinutes();
        const minute = minutes.find(m => m.id === id);
        
        if (!minute) {
            Utils.showToast('Verbale non trovato', 'error');
            return;
        }
        
        const html = `
            <div class="minute-view-modal">
                <div class="view-container">
                    <div class="view-header">
                        <button class="btn-icon" onclick="meetingMinutes.showMeetingMinutesDashboard()">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <h2>Visualizza Verbale</h2>
                        <button class="btn btn-primary" onclick="meetingMinutes.downloadMinutePDF('${id}')">
                            <i data-lucide="download"></i>
                            Scarica PDF
                        </button>
                    </div>
                    
                    <div class="view-content">
                        ${this.generateMinuteHTML(minute)}
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = html;
        Utils.initLucideIcons();
    }
    
    deleteMinute(id) {
        if (!confirm('Sei sicuro di voler eliminare questo verbale?')) {
            return;
        }
        
        const minutes = this.getSavedMinutes();
        const filtered = minutes.filter(m => m.id !== id);
        localStorage.setItem('meetingMinutes', JSON.stringify(filtered));
        
        Utils.showToast('Verbale eliminato', 'success');
        this.showMeetingMinutesDashboard();
    }
    
    getSocialMembers() {
        // Get athletes as social members
        const athletes = (typeof appState !== 'undefined' && typeof appState.getAthletes === 'function') ? appState.getAthletes() : JSON.parse(localStorage.getItem('athletes') || '[]');
        return athletes.map(a => ({
            id: a.id,
            name: a.name,
            role: a.role
        }));
    }
    
    getSavedMinutes() {
        return JSON.parse(localStorage.getItem('meetingMinutes') || '[]');
    }
    
    getRecentMinutesCount() {
        const minutes = this.getSavedMinutes();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return minutes.filter(m => new Date(m.date) >= thirtyDaysAgo).length;
    }
}

// Global instance
const meetingMinutes = new MeetingMinutesManager();
window.meetingMinutes = meetingMinutes;
