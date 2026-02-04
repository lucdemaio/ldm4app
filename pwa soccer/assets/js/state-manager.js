/**
 * STATE-MANAGER.JS
 * Gestione centralizzata dello stato dell'applicazione
 * Implementa pattern Observer per reattività
 */

class StateManager {
    constructor() {
        this.state = {
            athletes: [],
            teams: [],
            calendar: [],
            evaluations: [],  // NUOVO: valutazioni atleti
            settings: {
                theme: 'light',
                notifications: true,
                language: 'it'
            },
            filters: {
                athleteSearch: '',
                selectedTeam: '',
                selectedRole: '',
                calendarView: 'all'
            },
            ui: {
                currentSection: 'dashboard',
                sidebarOpen: false,
                modalOpen: false
            }
        };

        // Observers per notificare i cambiamenti
        this.observers = {};
    }

    /**
     * Inizializza lo stato caricando i dati dal LocalStorage
     */
    async init() {
        console.log('🔄 Inizializzazione StateManager...');
        
        try {
            // Carica i dati salvati
            const savedState = Storage.loadState();
            if (savedState) {
                this.state = savedState;
                console.log('✅ Stato caricato dal LocalStorage');
            } else {
                // Prima volta: carica dati di esempio
                await this.loadSampleData();
                console.log('✅ Dati di esempio caricati');
            }
            return true;
        } catch (error) {
            console.error('❌ Errore inizializzazione StateManager:', error);
            return false;
        }
    }

    /**
     * Carica dati di esempio dal file JSON
     */
    async loadSampleData() {
        try {
            const data = (typeof Utils !== 'undefined' && typeof Utils.fetchJson === 'function') ? await Utils.fetchJson('data/sample-data.json') : (async () => {
                try { const response = await fetch('data/sample-data.json'); if (!response.ok) return null; const text = await response.text(); return text ? JSON.parse(text) : null; } catch (e) { return null; }
            })();

            if (data) {
                this.state.athletes = data.athletes || [];
                this.state.teams = data.teams || [];
                this.state.calendar = data.calendar || [];
                this.saveState();
            } else {
                console.warn('⚠️ Impossibile caricare sample-data.json o file vuoto, uso dati vuoti');
                this.state.athletes = [];
                this.state.teams = [];
                this.state.calendar = [];
            }
        } catch (error) {
            console.warn('⚠️ Impossibile caricare sample-data.json, uso dati vuoti', error);
            this.state.athletes = [];
            this.state.teams = [];
            this.state.calendar = [];
        }
    }

    /**
     * Registra un observer per un evento specifico
     * @param {string} event - Nome dell'evento
     * @param {Function} callback - Funzione da chiamare
     */
    subscribe(event, callback) {
        if (!this.observers[event]) {
            this.observers[event] = [];
        }
        this.observers[event].push(callback);
    }

    /**
     * Notifica tutti gli observers di un evento
     * @param {string} event - Nome dell'evento
     * @param {*} data - Dati da passare agli observers
     */
    notify(event, data) {
        if (this.observers[event]) {
            this.observers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    // Non permettere che un observer corrotto interrompa la catena
                    try { console.error(`Observer error for ${event}:`, err); } catch(e) { /* ignore */ }
                    // Salva un registro dell'errore in LocalStorage per debug (non bloccante)
                    try {
                        const reports = JSON.parse(localStorage.getItem('errorReports') || '[]');
                        reports.push({ timestamp: new Date().toISOString(), source: `observer:${event}`, message: (err && err.message) ? err.message : String(err), stack: err && err.stack ? err.stack : undefined });
                        if (reports.length > 200) reports.shift();
                        localStorage.setItem('errorReports', JSON.stringify(reports));
                    } catch (e) { /* ignore */ }
                }
            });
        }
    }

    /**
     * Salva lo stato corrente nel LocalStorage
     */
    saveState() {
        const ok = Storage.saveState(this.state);
        if (!ok) {
            UI.showToast('Errore salvataggio: spazio insufficiente in LocalStorage. Rimuovi file pesanti o usa il backup su file.', 'danger');
            console.error('StateManager: Storage.saveState returned false');
        }
        this.notify('state:updated', this.state);
    }

    // ========== GETTERS ==========

    getAthletes() {
        // ...existing code...
        return this.state.athletes;
    }

    getAthlete(id) {
        return this.state.athletes.find(a => a.id === id);
    }

    getTeams() {
        return this.state.teams;
    }

    getTeam(id) {
        return this.state.teams.find(t => t.id === id);
    }

    getCalendarEvents() {
        return this.state.calendar;
    }

    getSettings() {
        return this.state.settings;
    }

    getFilters() {
        return this.state.filters;
    }

    getUIState() {
        return this.state.ui;
    }

    // ========== SETTERS - ATHLETES ==========

    addAthlete(athlete) {
        const newAthlete = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...athlete
        };
        
        this.state.athletes.push(newAthlete);
        this.saveState();
        this.notify('athletes:added', newAthlete);
        
        return newAthlete;
    }

    updateAthlete(id, updates) {
        const index = this.state.athletes.findIndex(a => a.id === id);
        
        if (index !== -1) {
            this.state.athletes[index] = {
                ...this.state.athletes[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            this.saveState();
            this.notify('athletes:updated', this.state.athletes[index]);
            
            return this.state.athletes[index];
        }
        
        return null;
    }

    deleteAthlete(id) {
        const index = this.state.athletes.findIndex(a => a.id === id);
        
        if (index !== -1) {
            const deleted = this.state.athletes.splice(index, 1)[0];
            this.saveState();
            this.notify('athletes:deleted', deleted);
            
            return deleted;
        }
        
        return null;
    }

    // ========== SETTERS - TEAMS ==========

    addTeam(team) {
        const newTeam = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            athletes: [],
            // normalize color fields
            primaryColor: team.primaryColor || (team.colors && team.colors[0]) || '#1e40af',
            secondaryColor: team.secondaryColor || (team.colors && team.colors[1]) || '',
            accentColor: team.accentColor || (team.colors && team.colors[2]) || '',
            uniformStyle: team.uniformStyle || 'solid',
            colors: (team.colors && team.colors.length) ? team.colors : [team.primaryColor || '#1e40af', team.secondaryColor || '', team.accentColor || ''].filter(Boolean),
            ...team
        };
        
        this.state.teams.push(newTeam);
        this.saveState();
        this.notify('teams:added', newTeam);
        
        return newTeam;
    }

    updateTeam(id, updates) {
        const index = this.state.teams.findIndex(t => t.id === id);
        
        if (index !== -1) {
            this.state.teams[index] = {
                ...this.state.teams[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            this.saveState();
            this.notify('teams:updated', this.state.teams[index]);
            
            return this.state.teams[index];
        }
        
        return null;
    }

    deleteTeam(id) {
        const index = this.state.teams.findIndex(t => t.id === id);
        
        if (index !== -1) {
            const deleted = this.state.teams.splice(index, 1)[0];
            this.saveState();
            this.notify('teams:deleted', deleted);
            
            return deleted;
        }
        
        return null;
    }

    // ========== SETTERS - CALENDAR ==========

    addEvent(event) {
        const newEvent = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...event
        };
        
        this.state.calendar.push(newEvent);
        this.saveState();
        this.notify('calendar:added', newEvent);
        
        return newEvent;
    }

    updateEvent(id, updates) {
        const index = this.state.calendar.findIndex(e => e.id === id);
        
        if (index !== -1) {
            this.state.calendar[index] = {
                ...this.state.calendar[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            this.saveState();
            this.notify('calendar:updated', this.state.calendar[index]);
            
            return this.state.calendar[index];
        }
        
        return null;
    }

    deleteEvent(id) {
        const index = this.state.calendar.findIndex(e => e.id === id);
        
        if (index !== -1) {
            const deleted = this.state.calendar.splice(index, 1)[0];
            this.saveState();
            this.notify('calendar:deleted', deleted);
            
            return deleted;
        }
        
        return null;
    }

    // ========== SETTERS - EVALUATIONS ==========

    addEvaluation(evaluation) {
        if (!this.state.evaluations) {
            this.state.evaluations = [];
        }
        
        this.state.evaluations.push(evaluation);
        this.saveState();
        this.notify('evaluations:added', evaluation);
        
        return evaluation;
    }

    getEvaluations(athleteId) {
        if (!this.state.evaluations) {
            this.state.evaluations = [];
        }
        
        return this.state.evaluations.filter(e => e.athleteId === athleteId);
    }

    deleteEvaluation(id) {
        if (!this.state.evaluations) {
            return null;
        }
        
        const index = this.state.evaluations.findIndex(e => e.id === id);
        
        if (index !== -1) {
            const deleted = this.state.evaluations.splice(index, 1)[0];
            this.saveState();
            this.notify('evaluations:deleted', deleted);
            
            return deleted;
        }
        
        return null;
    }

    // ========== FILTERS ==========

    setFilter(key, value) {
        this.state.filters[key] = value;
        this.notify('filters:changed', this.state.filters);
    }

    resetFilters() {
        this.state.filters = {
            athleteSearch: '',
            selectedTeam: '',
            selectedRole: '',
            calendarView: 'all'
        };
        this.notify('filters:reset', this.state.filters);
    }

    // ========== UI STATE ==========

    setCurrentSection(section) {
        this.state.ui.currentSection = section;
        this.notify('ui:section-changed', section);
    }

    toggleSidebar() {
        this.state.ui.sidebarOpen = !this.state.ui.sidebarOpen;
        this.notify('ui:sidebar-toggled', this.state.ui.sidebarOpen);
    }

    toggleModal() {
        this.state.ui.modalOpen = !this.state.ui.modalOpen;
        this.notify('ui:modal-toggled', this.state.ui.modalOpen);
    }

    // ========== UTILITY METHODS ==========

    /**
     * Esporta tutti i dati come JSON
     */
    exportData() {
        return JSON.stringify(this.state, null, 2);
    }

    /**
     * Importa dati da JSON
     */
    importData(jsonString) {
        try {
            const importedState = JSON.parse(jsonString);
            this.state = { ...this.state, ...importedState };
            this.saveState();
            this.notify('data:imported', this.state);
            return true;
        } catch (error) {
            console.error('❌ Errore importazione dati:', error);
            return false;
        }
    }

    /**
     * Calcola la categoria in base all'anno di nascita
     * @param {string} birthDate - Data di nascita in formato YYYY-MM-DD
     * @returns {string} - Categoria calcolata
     */
    calculateCategory(birthDate) {
        const birthYear = new Date(birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;

        // Categorie basate sull'età
        if (age <= 6) return 'Piccoli Amici';
        if (age <= 8) return 'Primi Calci';
        if (age <= 10) return 'Pulcini';
        if (age <= 12) return 'Esordienti';
        if (age <= 14) return 'Giovanissimi';
        if (age <= 16) return 'Allievi';
        if (age <= 18) return 'Juniores';
        return 'Seniores';
    }

    /**
     * Aggiorna automaticamente le categorie di tutte le squadre
     * basandosi sull'età degli atleti assegnati
     */
    updateTeamCategories() {
        console.log('🔄 Aggiornamento automatico categorie...');
        
        this.state.teams.forEach(team => {
            const athletes = this.getAthletes().filter(a => a.teamId === team.id && a.active);
            
            if (athletes.length > 0) {
                // Trova la categoria più comune tra gli atleti della squadra
                const categories = athletes.map(a => this.calculateCategory(a.birthDate));
                const categoryCount = {};
                
                categories.forEach(cat => {
                    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
                });
                
                // Usa la categoria più frequente
                const suggestedCategory = Object.keys(categoryCount).reduce((a, b) => 
                    categoryCount[a] > categoryCount[b] ? a : b
                );
                
                // Aggiorna solo se diversa
                if (team.category !== suggestedCategory) {
                    console.log(`📝 Squadra "${team.name}": ${team.category || 'N/D'} → ${suggestedCategory}`);
                    this.updateTeam(team.id, { 
                        category: suggestedCategory,
                        lastCategoryUpdate: new Date().toISOString()
                    });
                }
            }
        });
        
        console.log('✅ Categorie aggiornate');
    }

    /**
     * Controlla se è necessario aggiornare le categorie
     * (da chiamare all'avvio o periodicamente)
     */
    checkCategoryUpdate() {
        const lastCheck = localStorage.getItem('lastCategoryCheck');
        const today = new Date().toISOString().split('T')[0];
        
        // Controlla una volta al giorno
        if (lastCheck !== today) {
            this.updateTeamCategories();
            localStorage.setItem('lastCategoryCheck', today);
            
            // Se è gennaio, notifica l'utente
            const month = new Date().getMonth();
            if (month === 0) { // Gennaio
                console.log('🎉 Nuovo anno! Le categorie sono state aggiornate automaticamente.');
            }
        }
    }

    /**
     * Reset completo dell'applicazione
     */
    resetAll() {
        if (confirm('⚠️ Sei sicuro di voler cancellare tutti i dati? Questa azione è irreversibile.')) {
            Storage.clear();
            this.state = {
                athletes: [],
                teams: [],
                calendar: [],
                settings: {
                    theme: 'light',
                    notifications: true,
                    language: 'it'
                },
                filters: {
                    athleteSearch: '',
                    selectedTeam: '',
                    selectedRole: '',
                    calendarView: 'all'
                },
                ui: {
                    currentSection: 'dashboard',
                    sidebarOpen: false,
                    modalOpen: false
                }
            };
            this.notify('data:reset', this.state);
            location.reload();
        }
    }
}

// Istanza globale
const appState = new StateManager();
