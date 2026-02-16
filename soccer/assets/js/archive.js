/**
 * ARCHIVE.JS
 * Modulo Archiviazione Stagioni
 * - Congela dati fine stagione
 * - Esporta archivi storici
 * - Consulta statistiche anni passati
 * - Gestione foto e documenti storici
 */

const ArchiveModule = {
    archives: [],

    /**
     * Inizializza il modulo
     */
    init() {
        console.log('📦 Archive Module initialized');
        this.loadArchives();
    },

    /**
     * Mostra dashboard archivi
     */
    showArchiveDashboard() {
        const currentSeason = this.getCurrentSeasonName();
        const archiveCount = this.archives.length;
        const currentDataSize = this.calculateDataSize(appState.state);

        const modalBody = `
            <div class="archive-dashboard">
                <div class="archive-header">
                    <div class="current-season-info">
                        <h3><i data-lucide="archive"></i> Gestione Archivi Stagioni</h3>
                        <div class="season-badge">
                            <i data-lucide="calendar"></i>
                            Stagione Corrente: <strong>${currentSeason}</strong>
                        </div>
                        <p class="data-size">Dimensione database attuale: <strong>${currentDataSize}</strong></p>
                    </div>
                </div>

                <!-- Statistiche -->
                <div class="archive-stats">
                    <div class="stat-card">
                        <div class="stat-icon bg-blue">
                            <i data-lucide="database"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${appState.state.athletes?.length || 0}</h3>
                            <p>Atleti Attivi</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-green">
                            <i data-lucide="trophy"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${appState.state.calendar?.filter(e => e.type === 'match').length || 0}</h3>
                            <p>Partite Stagione</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-purple">
                            <i data-lucide="archive"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${archiveCount}</h3>
                            <p>Archivi Salvati</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-orange">
                            <i data-lucide="hard-drive"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${this.getTotalArchiveSize()}</h3>
                            <p>Spazio Archivi</p>
                        </div>
                    </div>
                </div>

                <!-- Azioni Principali -->
                <div class="archive-actions">
                    <div class="action-card action-primary">
                        <div class="action-icon">
                            <i data-lucide="package"></i>
                        </div>
                        <div class="action-content">
                            <h4>Archivia Stagione Corrente</h4>
                            <p>Crea uno snapshot completo dei dati attuali e prepara l'app per la nuova stagione</p>
                            <button class="btn btn-primary" onclick="ArchiveModule.showArchiveSeasonForm()">
                                <i data-lucide="archive"></i>
                                Archivia Stagione
                            </button>
                        </div>
                    </div>

                    <div class="action-card action-secondary">
                        <div class="action-icon">
                            <i data-lucide="download"></i>
                        </div>
                        <div class="action-content">
                            <h4>Esporta Backup Completo</h4>
                            <p>Scarica un backup JSON dell'intera stagione corrente</p>
                            <button class="btn btn-secondary" onclick="ArchiveModule.exportCurrentSeason()">
                                <i data-lucide="download"></i>
                                Esporta Backup
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Lista Archivi -->
                <div class="archives-section">
                    <h4><i data-lucide="folder-archive"></i> Archivi Salvati</h4>
                    <div id="archives-list" class="archives-list">
                        ${this.renderArchivesList()}
                    </div>
                </div>
            </div>
        `;

        UI.showModal('Archivio Stagioni', modalBody, 'extra-large');

        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    },

    /**
     * Mostra form archivia stagione
     */
    showArchiveSeasonForm() {
        const currentYear = new Date().getFullYear();
        const suggestedName = `Stagione ${currentYear - 1}/${currentYear}`;

        const formHtml = `
            <div class="archive-form">
                <div class="warning-box">
                    <i data-lucide="alert-triangle"></i>
                    <div>
                        <h4>Attenzione!</h4>
                        <p>L'archiviazione creerà uno snapshot completo dei dati attuali e ti permetterà di:</p>
                        <ul>
                            <li>✓ Salvare tutti i dati della stagione corrente</li>
                            <li>✓ Consultare statistiche storiche in qualsiasi momento</li>
                            <li>✓ Ripulire il database per la nuova stagione (opzionale)</li>
                        </ul>
                        <p><strong>I dati archiviati saranno sempre consultabili ma non modificabili.</strong></p>
                    </div>
                </div>

                <form id="archive-form">
                    <div class="form-group">
                        <label>Nome Archivio *</label>
                        <input type="text" name="name" required value="${suggestedName}" 
                               placeholder="es. Stagione 2024/2025">
                        <small>Identificativo dell'archivio (es. anno sportivo)</small>
                    </div>

                    <div class="form-group">
                        <label>Descrizione</label>
                        <textarea name="description" rows="3" 
                                  placeholder="Note sulla stagione, risultati principali, etc..."></textarea>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="clearAfter" id="clear-after-archive">
                            <span>Ripulisci database dopo archiviazione</span>
                        </label>
                        <small>Se selezionato, i dati della stagione archiviata verranno rimossi dal database attivo. 
                               I dati rimarranno disponibili nell'archivio storico.</small>
                    </div>

                    <div id="clear-options" style="display: none; margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 8px;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #92400e;">Cosa ripulire?</h4>
                        <label class="checkbox-label">
                            <input type="checkbox" name="clearEvents" checked>
                            <span>Eventi e Partite</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="clearEvaluations" checked>
                            <span>Valutazioni Tecniche</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="clearPayments" checked>
                            <span>Pagamenti</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="clearAttendance" checked>
                            <span>Presenze</span>
                        </label>
                        <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #92400e;">
                            <strong>Gli atleti e le squadre NON verranno eliminati.</strong>
                        </p>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">
                            Annulla
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="archive"></i>
                            Crea Archivio
                        </button>
                    </div>
                </form>
            </div>
        `;

        UI.showModal('Archivia Stagione', formHtml, 'large');

        // Toggle clear options
        document.getElementById('clear-after-archive').addEventListener('change', (e) => {
            document.getElementById('clear-options').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('archive-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createArchive();
        });

        lucide.createIcons();
    },

    /**
     * Crea archivio stagione
     */
    async createArchive() {
        const form = document.getElementById('archive-form');
        const formData = new FormData(form);

        if (!confirm('Confermi la creazione dell\'archivio? Questa operazione potrebbe richiedere alcuni secondi.')) {
            return;
        }

        UI.showToast('Creazione archivio in corso...', 'info');

        // Crea snapshot completo
        const archive = {
            id: Date.now().toString(),
            name: formData.get('name'),
            description: formData.get('description'),
            createdAt: new Date().toISOString(),
            createdDate: new Date().toLocaleDateString('it-IT'),
            
            // Snapshot completo database
            data: {
                athletes: [...(appState.state.athletes || [])],
                teams: [...(appState.state.teams || [])],
                calendar: [...(appState.state.calendar || [])],
                evaluations: [...(appState.state.evaluations || [])],
                payments: [...(appState.state.payments || [])],
                attendance: [...(appState.state.attendance || [])],
                settings: {...(appState.state.settings || {})}
            },

            // Statistiche rapide
            stats: {
                totalAthletes: appState.state.athletes?.length || 0,
                totalTeams: appState.state.teams?.length || 0,
                totalMatches: appState.state.calendar?.filter(e => e.type === 'match').length || 0,
                totalTrainings: appState.state.calendar?.filter(e => e.type === 'training').length || 0,
                totalEvaluations: appState.state.evaluations?.length || 0
            }
        };

        // Salva archivio
        this.archives.push(archive);
        this.saveArchives();

        // Esporta anche su filesystem se disponibile
        await this.exportArchiveToFileSystem(archive);

        // Ripulisci database se richiesto
        const clearAfter = formData.get('clearAfter') === 'on';
        if (clearAfter) {
            const clearOptions = {
                events: formData.get('clearEvents') === 'on',
                evaluations: formData.get('clearEvaluations') === 'on',
                payments: formData.get('clearPayments') === 'on',
                attendance: formData.get('clearAttendance') === 'on'
            };

            this.clearCurrentSeasonData(clearOptions);
        }

        UI.closeModal();
        
        setTimeout(() => {
            UI.showToast('Archivio creato con successo!', 'success');
            this.showArchiveDashboard();
        }, 300);
    },

    /**
     * Ripulisci dati stagione corrente
     */
    clearCurrentSeasonData(options) {
        if (options.events) {
            appState.state.calendar = [];
        }
        if (options.evaluations) {
            appState.state.evaluations = [];
        }
        if (options.payments) {
            appState.state.payments = [];
        }
        if (options.attendance) {
            appState.state.attendance = [];
        }

        appState.saveState();
        UI.showToast('Database ripulito per la nuova stagione', 'info');
    },

    /**
     * Renderizza lista archivi
     */
    renderArchivesList() {
        if (this.archives.length === 0) {
            return `
                <div class="empty-state">
                    <i data-lucide="inbox"></i>
                    <h3>Nessun archivio salvato</h3>
                    <p>Crea il primo archivio per salvare lo storico delle stagioni passate</p>
                </div>
            `;
        }

        return this.archives
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(archive => `
                <div class="archive-card">
                    <div class="archive-card-header">
                        <div class="archive-info">
                            <h4>${archive.name}</h4>
                            <p class="archive-date">
                                <i data-lucide="calendar"></i>
                                Archiviato il ${archive.createdDate}
                            </p>
                            ${archive.description ? `
                                <p class="archive-description">${archive.description}</p>
                            ` : ''}
                        </div>
                        <div class="archive-badge">
                            <i data-lucide="database"></i>
                            ${this.calculateDataSize(archive.data)}
                        </div>
                    </div>

                    <div class="archive-stats-mini">
                        <div class="stat-mini">
                            <i data-lucide="users"></i>
                            <span>${archive.stats.totalAthletes} atleti</span>
                        </div>
                        <div class="stat-mini">
                            <i data-lucide="shield"></i>
                            <span>${archive.stats.totalTeams} squadre</span>
                        </div>
                        <div class="stat-mini">
                            <i data-lucide="trophy"></i>
                            <span>${archive.stats.totalMatches} partite</span>
                        </div>
                        <div class="stat-mini">
                            <i data-lucide="trending-up"></i>
                            <span>${archive.stats.totalEvaluations} valutazioni</span>
                        </div>
                    </div>

                    <div class="archive-actions">
                        <button class="btn btn-sm btn-primary" onclick="ArchiveModule.viewArchive('${archive.id}')">
                            <i data-lucide="eye"></i>
                            Consulta
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="ArchiveModule.exportArchive('${archive.id}')">
                            <i data-lucide="download"></i>
                            Esporta
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="ArchiveModule.restoreArchive('${archive.id}')">
                            <i data-lucide="rotate-ccw"></i>
                            Ripristina
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="ArchiveModule.deleteArchive('${archive.id}')">
                            <i data-lucide="trash-2"></i>
                            Elimina
                        </button>
                    </div>
                </div>
            `).join('');
    },

    /**
     * Visualizza archivio
     */
    viewArchive(archiveId) {
        const archive = this.archives.find(a => a.id === archiveId);
        if (!archive) return;

        const content = `
            <div class="archive-viewer">
                <div class="archive-viewer-header">
                    <h3>${archive.name}</h3>
                    <p>${archive.createdDate}</p>
                    ${archive.description ? `<p class="description">${archive.description}</p>` : ''}
                </div>

                <!-- Statistiche Dettagliate -->
                <div class="viewer-stats">
                    <div class="stat-box">
                        <h4>👥 Atleti</h4>
                        <p class="stat-number">${archive.stats.totalAthletes}</p>
                    </div>
                    <div class="stat-box">
                        <h4>🛡️ Squadre</h4>
                        <p class="stat-number">${archive.stats.totalTeams}</p>
                    </div>
                    <div class="stat-box">
                        <h4>⚽ Partite</h4>
                        <p class="stat-number">${archive.stats.totalMatches}</p>
                    </div>
                    <div class="stat-box">
                        <h4>🏃 Allenamenti</h4>
                        <p class="stat-number">${archive.stats.totalTrainings}</p>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="archive-tabs">
                    <button class="archive-tab active" data-tab="athletes">Atleti</button>
                    <button class="archive-tab" data-tab="teams">Squadre</button>
                    <button class="archive-tab" data-tab="matches">Partite</button>
                    <button class="archive-tab" data-tab="stats">Statistiche</button>
                </div>

                <div class="archive-content">
                    <div id="tab-athletes" class="tab-pane active">
                        ${this.renderArchiveAthletes(archive)}
                    </div>
                    <div id="tab-teams" class="tab-pane">
                        ${this.renderArchiveTeams(archive)}
                    </div>
                    <div id="tab-matches" class="tab-pane">
                        ${this.renderArchiveMatches(archive)}
                    </div>
                    <div id="tab-stats" class="tab-pane">
                        ${this.renderArchiveStats(archive)}
                    </div>
                </div>
            </div>
        `;

        UI.showModal(`Archivio: ${archive.name}`, content, 'extra-large');

        // Setup tabs
        setTimeout(() => {
            document.querySelectorAll('.archive-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.archive-tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                    tab.classList.add('active');
                    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
                });
            });
            lucide.createIcons();
        }, 100);
    },

    /**
     * Renderizza atleti archivio
     */
    renderArchiveAthletes(archive) {
        return `
            <div class="archive-table-container">
                <table class="archive-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Cognome</th>
                            <th>Ruolo</th>
                            <th>Data Nascita</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${archive.data.athletes.map(athlete => `
                            <tr>
                                <td>${athlete.firstName}</td>
                                <td>${athlete.lastName}</td>
                                <td>${athlete.role || 'N/D'}</td>
                                <td>${athlete.birthDate ? new Date(athlete.birthDate).toLocaleDateString('it-IT') : 'N/D'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Renderizza squadre archivio
     */
    renderArchiveTeams(archive) {
        return `
            <div class="teams-grid">
                ${archive.data.teams.map(team => {
                    const teamAthletes = archive.data.athletes.filter(a => a.teamId === team.id);
                    return `
                        <div class="team-archive-card">
                            <h4>${team.name}</h4>
                            <p>${team.category || 'N/D'}</p>
                            <p><strong>${teamAthletes.length}</strong> atleti</p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Renderizza partite archivio
     */
    renderArchiveMatches(archive) {
        const matches = archive.data.calendar.filter(e => e.type === 'match');
        return `
            <div class="archive-table-container">
                <table class="archive-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Partita</th>
                            <th>Luogo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${matches.map(match => `
                            <tr>
                                <td>${new Date(match.date).toLocaleDateString('it-IT')}</td>
                                <td>${match.title}</td>
                                <td>${match.location || 'N/D'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Renderizza statistiche archivio
     */
    renderArchiveStats(archive) {
        const totalPayments = archive.data.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const avgAttendance = this.calculateAvgAttendance(archive.data);

        return `
            <div class="stats-grid">
                <div class="stat-detail-card">
                    <h4>💰 Totale Pagamenti</h4>
                    <p class="big-number">€ ${totalPayments.toFixed(2)}</p>
                </div>
                <div class="stat-detail-card">
                    <h4>📊 Media Presenze</h4>
                    <p class="big-number">${avgAttendance}%</p>
                </div>
                <div class="stat-detail-card">
                    <h4>📈 Valutazioni</h4>
                    <p class="big-number">${archive.stats.totalEvaluations}</p>
                </div>
                <div class="stat-detail-card">
                    <h4>📅 Eventi Totali</h4>
                    <p class="big-number">${archive.data.calendar?.length || 0}</p>
                </div>
            </div>
        `;
    },

    /**
     * Esporta archivio come JSON
     */
    exportArchive(archiveId) {
        const archive = this.archives.find(a => a.id === archiveId);
        if (!archive) return;

        const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Archivio_${archive.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        UI.showToast('Archivio esportato', 'success');
    },

    /**
     * Ripristina archivio
     */
    restoreArchive(archiveId) {
        if (!confirm('Ripristinare questo archivio? I dati correnti verranno SOVRASCRITTI!')) {
            return;
        }

        const archive = this.archives.find(a => a.id === archiveId);
        if (!archive) return;

        // Ripristina dati
        appState.state = {...archive.data};
        appState.saveState();

        UI.closeModal();
        UI.showToast('Archivio ripristinato! Ricarica la pagina.', 'success');

        setTimeout(() => {
            location.reload();
        }, 2000);
    },

    /**
     * Elimina archivio
     */
    deleteArchive(archiveId) {
        if (!confirm('Eliminare definitivamente questo archivio? Questa azione non può essere annullata.')) {
            return;
        }

        this.archives = this.archives.filter(a => a.id !== archiveId);
        this.saveArchives();

        UI.showToast('Archivio eliminato', 'success');
        this.showArchiveDashboard();
    },

    /**
     * Esporta stagione corrente
     */
    exportCurrentSeason() {
        const backup = {
            exportDate: new Date().toISOString(),
            season: this.getCurrentSeasonName(),
            data: appState.state
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Backup_${this.getCurrentSeasonName()}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        UI.showToast('Backup esportato', 'success');
    },

    /**
     * Esporta archivio su filesystem
     */
    async exportArchiveToFileSystem(archive) {
        if (typeof FileSystemManager === 'undefined' || !FileSystemManager.directoryHandle) {
            return; // Filesystem non disponibile
        }

        try {
            const archiveFolder = await FileSystemManager.getOrCreateFolder('Archivi');
            const fileName = `${archive.name.replace(/\s/g, '_')}_${archive.id}.json`;
            const fileHandle = await archiveFolder.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(archive, null, 2));
            await writable.close();

            console.log('Archivio salvato su filesystem:', fileName);
        } catch (error) {
            console.error('Errore salvataggio archivio su filesystem:', error);
        }
    },

    /**
     * Calcola dimensione dati
     */
    calculateDataSize(data) {
        const size = new Blob([JSON.stringify(data)]).size;
        if (size < 1024) return size + ' B';
        if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
    },

    /**
     * Calcola dimensione totale archivi
     */
    getTotalArchiveSize() {
        const totalSize = this.archives.reduce((sum, archive) => {
            const size = new Blob([JSON.stringify(archive)]).size;
            return sum + size;
        }, 0);

        if (totalSize < 1024) return totalSize + ' B';
        if (totalSize < 1024 * 1024) return (totalSize / 1024).toFixed(2) + ' KB';
        return (totalSize / (1024 * 1024)).toFixed(2) + ' MB';
    },

    /**
     * Ottieni nome stagione corrente
     */
    getCurrentSeasonName() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        // Stagione sportiva: Settembre-Giugno
        if (month >= 9) {
            return `${year}/${year + 1}`;
        } else {
            return `${year - 1}/${year}`;
        }
    },

    /**
     * Calcola media presenze
     */
    calculateAvgAttendance(data) {
        const attendance = data.attendance || [];
        if (attendance.length === 0) return 0;

        const present = attendance.filter(a => a.present).length;
        return ((present / attendance.length) * 100).toFixed(1);
    },

    /**
     * Carica archivi da localStorage
     */
    loadArchives() {
        const stored = localStorage.getItem('seasonArchives');
        if (stored) {
            try {
                this.archives = JSON.parse(stored);
            } catch (error) {
                console.error('Errore caricamento archivi:', error);
                this.archives = [];
            }
        }
    },

    /**
     * Salva archivi in localStorage
     */
    saveArchives() {
        localStorage.setItem('seasonArchives', JSON.stringify(this.archives));
    }
};

// Esposizione globale
window.ArchiveModule = ArchiveModule;
