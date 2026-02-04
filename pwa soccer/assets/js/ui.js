// ...existing code...

const UI = {
    // ...existing code...

    /**
     * Mostra dialog per pubblicare dati criptati
     */
    async showPublishDialog() {
        const modalBody = `
            <div style="padding:1rem;">
                <label for="publish-password"><strong>Password di cifratura:</strong></label>
                <input id="publish-password" type="password" class="form-control" style="width:100%;margin-bottom:1rem;" placeholder="Password" autocomplete="current-password" />
                <button id="publish-confirm-btn" class="btn btn-primary" style="width:100%;">Pubblica Dati</button>
            </div>
        `;
        this.showModal('Pubblica Dati (Criptato)', modalBody);
        setTimeout(() => {
            document.getElementById('publish-confirm-btn')?.addEventListener('click', async () => {
                const password = document.getElementById('publish-password').value.trim();
                if (!password) {
                    this.showToast('Inserisci una password', 'danger');
                    return;
                }
                this.showToast('Pubblicazione in corso...', 'info');
                try {
                    const ok = await Storage.publishEncryptedData(password);
                    if (ok) {
                        this.showToast('Dati pubblicati con successo!', 'success');
                        this.closeModal();
                    } else {
                        this.showToast('Errore pubblicazione dati', 'danger');
                    }
                } catch (e) {
                    this.showToast('Errore pubblicazione dati', 'danger');
                }
            });
        }, 100);
    },
// ...existing code...
    /**
     * Inizializza il modulo UI
     */
    init() {
        // ...existing code...
        
        // Cleanup any residual modal state that could block interactions
        try{
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            document.querySelectorAll('.modal-overlay').forEach(o => o.parentNode && o.parentNode.removeChild(o));
            document.body.classList.remove('modal-open');
        }catch(e){}

        this.bindEvents();

        // Normalize inline showView onclicks to data-section so initNavigation can bind handlers
        try{
            document.querySelectorAll('.nav-btn[onclick*="showView("]').forEach(btn => {
                try{
                    const onclick = btn.getAttribute('onclick') || '';
                    const match = onclick.match(/showView\(['"]([a-z0-9_-]+)['"]\)/i);
                    if(match && match[1]){
                        btn.dataset.section = match[1];
                        btn.classList.add('nav-item');
                    }
                }catch(_){/* ignore */}
            });
        }catch(e){}

        // Robust fallback: directly bind click handlers to any element with inline "showView(...)"
        // This ensures clicks call UI.showView even if other event handlers or overlays stop propagation.
        try{
            document.querySelectorAll('[onclick*="showView(")]').forEach(el => {
                try{
                    const onclick = el.getAttribute('onclick') || '';
                    const match = onclick.match(/showView\(['"]([a-z0-9_-]+)['"]\)/i);
                    if (match && match[1]) {
                        const section = match[1];
                        // avoid double-binding
                        if (!el._showViewBound) {
                            el.addEventListener('click', (ev) => {
                                try { ev.preventDefault(); ev.stopPropagation(); } catch(_){}
                                try { UI.showView(section); } catch(err){ console.error('Error calling UI.showView from inline handler', err); }
                            });
                            el._showViewBound = true;
                        }
                    }
                }catch(_){/* ignore */}
            });
        }catch(e){}

        this.initDelegation();
        this.initNavigation();
        this.initSidebar();
        
        // Salva snapshot del contenuto iniziale dell'app per poterlo ripristinare se moduli sovrascrivono `app-container`
        try {
            if (!this._appTemplate) {
                const app = document.getElementById('app-container');
                if (app) this._appTemplate = app.innerHTML;
            }
        } catch (e) { /* non critico */ }
        
        // Nascondi loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 500);

        // Applica colori di squadra all'avvio (varnish --team-primary)
        try{ this.setTeamColors && this.setTeamColors(); }catch(e){/* ignore */}

        // Robustness: normalize inline showView onclicks to data-section for delegation (moved earlier during init)
        // (empty placeholder)

        // Protezione: chiudi eventuali modal attivi all'avvio a meno che non sia esplicitamente richiesto
        try{
            const modal = document.getElementById('modal');
            const shouldKeepModal = localStorage.getItem('modal_should_open'); // flag temporaneo opzionale
            if(modal && modal.classList.contains('active') && !shouldKeepModal){
                modal.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        }catch(e){/* ignore */}
    },

    /**
     * Applica i colori della squadra salvata come variabili CSS
     */
    setTeamColors() {
        try{
            let team = null;
            const raw = localStorage.getItem('current_team');
            if(raw){
                if(typeof Utils !== 'undefined' && typeof Utils.safeJSONParse === 'function') team = Utils.safeJSONParse(raw, null);
                else team = JSON.parse(raw);
            }
            const fallback = getComputedStyle(document.documentElement).getPropertyValue('--color-accent') || '#22c55e';
            const primary = (team && (team.primaryColor || (team.colors && team.colors[0]))) || fallback.trim();
            if(primary) document.documentElement.style.setProperty('--team-primary', primary);

            if(typeof appState !== 'undefined' && typeof appState.subscribe === 'function'){
                ['teams:updated','teams:added','teams:deleted'].forEach(ev => {
                    appState.subscribe(ev, () => { try{ const raw2 = localStorage.getItem('current_team'); if(raw2){ const t2 = Utils.safeJSONParse(raw2, null); const p = (t2 && (t2.primaryColor|| (t2.colors && t2.colors[0]))) || fallback.trim(); document.documentElement.style.setProperty('--team-primary', p); } }catch(_){} });
                });
            }

            window.addEventListener('storage', (e)=>{ if(e.key === 'current_team'){ try{ const t = e.newValue ? JSON.parse(e.newValue) : null; const p = (t && (t.primaryColor|| (t.colors && t.colors[0]))) || fallback.trim(); document.documentElement.style.setProperty('--team-primary', p); }catch(_){} } });
        }catch(e){}
    },


    /**
     * Binding eventi globali UI
     */
    bindEvents() {
        // ...existing code...

        // Chiusura modal
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Chiusura modal click fuori: verifica se ci sono dati non salvati e chiedi conferma
        document.getElementById('modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.confirmAndCloseModal();
            }
        });

        // ESC per chiudere modal: se il modal è aperto, verifica dati non salvati; chiudi sempre la sidebar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('modal');
                if (modal && modal.classList.contains('active')) {
                    this.confirmAndCloseModal();
                }
                this.closeSidebar();
            }
        });

        // Refresh button dashboard
        document.querySelector('[data-action="refresh"]')?.addEventListener('click', () => {
            DashboardModule.render();
            this.showToast('Dati aggiornati', 'success');
        });

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const navbarMain = document.getElementById('navbar-main');
        
        mobileMenuToggle?.addEventListener('click', () => {
            navbarMain?.classList.toggle('active');
            // ...existing code...
        });

        // Dropdown toggles (click e accessibilità)
        document.querySelectorAll('.nav-dropdown .dropdown-toggle').forEach(toggle => {
            try{ toggle.setAttribute('type', 'button'); }catch(e){}
            try{ toggle.setAttribute('aria-haspopup', 'true'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('tabindex', '0'); }catch(e){}

            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                if (e.stopPropagation) e.stopPropagation();

                const dropdown = toggle.closest('.nav-dropdown');
                const menu = dropdown ? dropdown.querySelector('.dropdown-menu') : null;

                // Toggle
                const wasActive = dropdown?.classList.contains('active');
                const isActive = dropdown?.classList.toggle('active');
                try{ toggle.setAttribute('aria-expanded', isActive ? 'true' : 'false'); }catch(e){}

                setTimeout(() => {
                    // ...existing code...
                }, 80);
            });

            toggle.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggle.click();
                }
            });
        });

        // Chiudi mobile menu al click su un link
        document.querySelectorAll('.dropdown-menu a, .nav-btn:not(.dropdown-toggle)').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navbarMain?.classList.remove('active');
                    // ...existing code...
                }

                // Chiudi il dropdown che contiene il link (utile su desktop): evita che il menu rimanga sopra il contenuto
                const dropdown = link.closest('.nav-dropdown');
                if (dropdown) {
                    dropdown.classList.remove('active');
                    // ...existing code...
                }
            // Applica la nuova classe CSS alla navbar principale
            const navbar = document.getElementById('navbar-main');
            if (navbar) {
                navbar.classList.add('navbar-main');
            }
            });
        });
    },

    /**
     * Inizializza delegazione eventi globali per evitare perdita di listener su innerHTML
     */
    initDelegation() {
        if (this._delegationInitialized) return;

        document.addEventListener('click', (e) => {
            const target = e.target;

            // Chiudi dropdown se clicchi esternamente
            const insideDropdown = target.closest('.nav-dropdown');
            if (!insideDropdown) {
                document.querySelectorAll('.nav-dropdown.active').forEach(d => d.classList.remove('active'));
            }

            // Modal close button
            const closeBtn = target.closest('.modal-close');
            if (closeBtn) { this.closeModal(); return; }

            // Click sul backdrop del modal
            if (target.id === 'modal' && e.target === target) { this.closeModal(); return; }

            // Refresh action (data-action="refresh")
            const refreshBtn = target.closest('[data-action="refresh"]');
            if (refreshBtn) {
                if (typeof DashboardModule !== 'undefined' && typeof DashboardModule.render === 'function') {
                    DashboardModule.render();
                }
                this.showToast('Dati aggiornati', 'success');
                return;
            }

            // Mobile menu toggle
            const mobileToggle = target.closest('#mobile-menu-toggle');
            if (mobileToggle) {
                const navbarMain = document.getElementById('navbar-main');
                navbarMain?.classList.toggle('active');
                return;
            }

            // Nav dropdown toggle (delegated) — gestito sia per mobile che per desktop
            const dropdownToggle = target.closest('.nav-dropdown .dropdown-toggle');
            if (dropdownToggle) {
                e.preventDefault();
                const dropdown = dropdownToggle.closest('.nav-dropdown');
                const wasActive = dropdown?.classList.contains('active');
                toggle.classList.add('dropdown-toggle');
                // Inserisci icona Lucide se non presente
                if (!toggle.querySelector('.icon')) {
                    const icon = document.createElement('i');
                    icon.className = 'icon';
                    icon.setAttribute('data-lucide', 'chevron-down');
                    toggle.insertBefore(icon, toggle.firstChild);
                }
                const nowActive = dropdown?.classList.toggle('active');
                try{ dropdownToggle.setAttribute('aria-expanded', nowActive ? 'true' : 'false'); }catch(e){}
                // ...existing code...
                return;
            }

            // Sidebar links (delegate)
                        // Gestione bottoni nav-icon-btn con data-action (es. impostazioni in alto a destra)
                        const navIconBtn = target.closest('.nav-icon-btn[data-action]');
                        if (navIconBtn) {
                            e.preventDefault();
                            const action = navIconBtn.dataset.action;
                            this.handleSidebarAction(action);
                            return;
                        }
            const sidebarLink = target.closest('.sidebar-link, .sidebar-footer-link');
            if (sidebarLink) {
                e.preventDefault();
                const action = sidebarLink.dataset.action;
                this.handleSidebarAction(action);
                this.closeSidebar();
                return;
            }

            // Nav items delegation
            const navItem = target.closest('.nav-item');
            if (navItem && navItem.dataset && navItem.dataset.section) {
                e.preventDefault();
                this.showView(navItem.dataset.section);
                return;
            }
        });

        this._delegationInitialized = true;
    },
    /**
     * Inizializza sistema di navigazione bottom nav
     */
    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const dataSectionItems = document.querySelectorAll('[data-section]');
        const sections = document.querySelectorAll('.app-section');

        // Bind click handlers to explicit .nav-item items
        navItems.forEach(item => {
            if (!item._navItemBound) {
                item.addEventListener('click', () => {
                    const sectionName = item.dataset.section;
                    this.showView(sectionName);
                });
                item._navItemBound = true;
            }
        });

        // Bind only to elements with data-section that are NOT nav-item
        dataSectionItems.forEach(item => {
            if (item.classList.contains('nav-item')) return; // skip if already handled
            if (!item._dataSectionBound) {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sectionName = item.dataset.section;
                    this.showView(sectionName);
                });
                item._dataSectionBound = true;
            }
        });
    },

    /**
     * Mostra una vista/sezione specifica
     * @param {string} sectionName - Nome della sezione da mostrare
     */
    showView(sectionName) {
        console.log('UI.showView: Tentativo di aprire la sezione', sectionName, new Error().stack);
        let targetSection = document.getElementById(`${sectionName}-section`);
        if (!targetSection) {
            // Se la sezione non esiste nel DOM, prova a ripristinare il template principale (alcuni moduli sovrascrivono `app-container`)
            if (this._appTemplate) {
                console.warn(`UI.showView: Sezione ${sectionName} non trovata. Ripristino template principale...`);
                try {
                    const app = document.getElementById('app-container');
                    if (app) app.innerHTML = this._appTemplate;
                    // Reinizializza binding e delegazione in modo sicuro (idempotente)
                    try { this.init(); } catch(e) { console.error('Errore reinizializzazione UI dopo ripristino', e); }
                    // Ridisegna la vista richiesta
                    if (typeof DashboardModule !== 'undefined' && typeof DashboardModule.render === 'function') DashboardModule.render();
                    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') lucide.createIcons();
                    // Riprova a recuperare la sezione
                    targetSection = document.getElementById(`${sectionName}-section`);
                    if (!targetSection) {
                        console.error(`UI.showView: Impossibile ripristinare la sezione ${sectionName}`);
                        return;
                    }
                } catch (e) {
                    console.error(`UI.showView: Errore ripristino template principale: ${e && e.message ? e.message : e}`);
                    return;
                }
            } else {
                console.error(`UI.showView: Sezione ${sectionName} non trovata nel DOM`);
                return;
            }
        }
        if (sectionName === 'teams') {
            // ...existing code...
            // Usa già targetSection dichiarato sopra
            if (targetSection) {
                // ...existing code...
                // ...existing code...
            } else {
                console.error('UI.showView: Sezione teams non trovata nel DOM');
            }
        }
        if (sectionName === 'reports') {
            // Usa già targetSection dichiarato sopra
            if (targetSection) {
                targetSection.classList.add('active');
                if (typeof ReportsModule !== 'undefined' && typeof ReportsModule.render === 'function') {
                    ReportsModule.render();
                } else {
                    console.error('ReportsModule non è definito o manca la funzione render');
                }
            } else {
                console.error('UI.showView: Sezione reports non trovata nel DOM');
            }
            return;
        }
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.app-section');

            // Pulizia UI
        try {
            document.querySelectorAll('.nav-dropdown.active').forEach(d => d.classList.remove('active'));
            const modalOverlay = document.querySelector('.modal-overlay');
            if (modalOverlay && modalOverlay.parentElement) modalOverlay.parentElement.removeChild(modalOverlay);
            document.body.classList.remove('modal-open');
        } catch(e) {}

        // Rimuovi active da tutti
        navItems.forEach(n => n.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        // Aggiungi active al selezionato
        const targetNav = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
        if (targetNav) {
            targetNav.classList.add('active');
        } else {
            // ...existing code...
        }
        // targetSection è già dichiarato sopra
        if (targetSection) {
            targetSection.classList.add('active');
            // ...existing code...
        }

        // Chiudi mobile menu se aperto
        const navbarMain = document.getElementById('navbar-main');
        if (navbarMain) {
            navbarMain.classList.remove('active');
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Render specifico modulo se necessario
        switch(sectionName) {
            case 'dashboard':
                if (typeof DashboardModule !== 'undefined') {
                    if (typeof DashboardModule.render === 'function') DashboardModule.render();
                    else if (typeof DashboardModule.updateStats === 'function') DashboardModule.updateStats();
                }
                break;
            case 'teams':
                if (typeof TeamsModule !== 'undefined') {
                    if (typeof TeamsModule.render === 'function') {
                        // ...existing code...
                        TeamsModule.render();
                    } else if (typeof TeamsModule.renderTeams === 'function') {
                        // ...existing code...
                        TeamsModule.renderTeams();
                    } else {
                        // ...existing code...
                    }
                } else {
                    // ...existing code...
                }
                break;
            case 'athletes':
                // ...existing code...
                if (typeof AthletesModule !== 'undefined') {
                    if (typeof AthletesModule.render === 'function') {
                        // ...existing code...
                        AthletesModule.render();
                    } else {
                        // ...existing code...
                    }
                } else {
                    // ...existing code...
                    // Prova a renderizzare più tardi nel caso il modulo venga inizializzato subito dopo
                    setTimeout(() => {
                        if (typeof AthletesModule !== 'undefined' && typeof AthletesModule.render === 'function') {
                            // ...existing code...
                            AthletesModule.render();
                        }
                    }, 150);
                }
                break;
            case 'calendar':
                // ...existing code...
                if (typeof CalendarModule !== 'undefined') {
                    if (typeof CalendarModule.render === 'function') {
                        // ...existing code...
                        CalendarModule.render();
                    } else {
                        // ...existing code...
                    }
                } else {
                    // ...existing code...
                    setTimeout(() => {
                        if (typeof CalendarModule !== 'undefined' && typeof CalendarModule.render === 'function') {
                            // ...existing code...
                            CalendarModule.render();
                        }
                    }, 150);
                }
                break;
            default:
                // ...existing code...
        }

        // Log diagnostici aggiuntivi
        // ...existing code...
    },

    /**
     * Inizializza sidebar
     */
    initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('sidebar-toggle');
        const closeBtn = document.getElementById('sidebar-close');

        toggleBtn?.addEventListener('click', () => this.toggleSidebar());
        closeBtn?.addEventListener('click', () => this.closeSidebar());
        overlay?.addEventListener('click', () => this.closeSidebar());

        // Sidebar actions
        document.querySelectorAll('.sidebar-link, .sidebar-footer-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const action = link.dataset.action;
                this.handleSidebarAction(action);
            });
        });
    },

    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar?.classList.toggle('active');
        overlay?.classList.toggle('active');
        appState.toggleSidebar();
    },

    /**
     * Chiudi sidebar
     */
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
    },

    /**
     * Gestisce le azioni della sidebar
     */
    handleSidebarAction(action) {
        switch(action) {
            case 'export-data':
                Storage.exportToFile();
                this.showToast('Dati esportati con successo', 'success');
                break;
            case 'import-data':
                this.showImportDialog();
                break;
            case 'toggle-theme':
                ThemeManager.toggle();
                break;
            case 'settings':
                this.showSettings();
                break;
            case 'backup':
                Storage.createBackup();
                this.showToast('Backup creato', 'success');
                break;
            case 'show-info':
                InfoModule.showInfoModal();
                break;
            default:
                break;
        }
        this.closeSidebar();
    },

    /**
     * Mostra dialog importazione
     */
    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const state = await Storage.importFromFile(file);
                    // Validazione struttura minima
                    if (state && typeof state === 'object' && Array.isArray(state.calendar) && Array.isArray(state.athletes) && Array.isArray(state.teams)) {
                        if (confirm('Vuoi sovrascrivere i dati attuali con quelli importati?')) {
                            appState.importData(JSON.stringify(state));
                            this.showToast('Dati importati con successo!', 'success');
                            setTimeout(()=>location.reload(), 800);
                        }
                    } else {
                        this.showToast('Il file non contiene dati validi (partite, atleti, squadre)', 'danger');
                    }
                } catch (error) {
                    this.showToast('Errore importazione file', 'danger');
                }
            }
        };
        
        input.click();
    },

    /**
     * Mostra impostazioni
     */
    showSettings() {
        const storageInfo = Storage.getStorageInfo();
        // Recupera impostazioni connessione salvate
        const conn = JSON.parse(localStorage.getItem('ldm_connection') || '{}');
        const modalBody = `
            <div class="settings-panel">
                <h4>Impostazioni</h4>
                <div style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
                    <button class="btn btn-primary" style="flex:1;min-width:140px;" onclick="UI.showImportDialog()">
                        <i data-lucide='upload'></i> Importa Dati JSON
                    </button>
                    <button class="btn btn-secondary" style="flex:1;min-width:140px;" onclick="Storage.exportToFile()">
                        <i data-lucide='download'></i> Esporta Dati JSON
                    </button>
                </div>
                <button class="btn btn-success" style="width:100%;margin-bottom:1rem;" onclick="UI.showPublishDialog()">
                    <i data-lucide='upload'></i> Pubblica Dati (Criptato)
                </button>
                <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--color-gray-200);">
                <h4>Impostazioni Connessione</h4>
                <div class="detail-row">
                    <strong>URL FTP / JSON / Cartella pubblica:</strong>
                </div>
                <input id="ldm-conn-url" type="text" placeholder="https://... oppure ftp://..." style="width:100%;margin-bottom:0.5rem;" value="${conn.url || ''}" />
                <button class="btn btn-primary btn-glass primary" style="width:100%;margin-bottom:1rem;" onclick="UI.saveConnectionSettings()">
                    <i data-lucide='save'></i> Salva Impostazioni Connessione
                </button>
                <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--color-gray-200);">
                <h4>Informazioni Storage</h4>
                <div class="detail-row">
                    <strong>Dimensione Dati:</strong>
                    <span>${storageInfo.stateSize}</span>
                </div>
                <div class="detail-row">
                    <strong>Dimensione Backup:</strong>
                    <span>${storageInfo.backupSize}</span>
                </div>
                <div class="detail-row">
                    <strong>Ultimo Salvataggio:</strong>
                    <span>${storageInfo.lastSaved}</span>
                </div>
                <div class="detail-row">
                    <strong>Ultimo Backup:</strong>
                    <span>${storageInfo.lastBackup}</span>
                </div>
                <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--color-gray-200);">
                <h4>Azioni Pericolose</h4>
                <button class="btn btn-danger" onclick="appState.resetAll()" style="width: 100%;">
                    <i data-lucide="trash-2"></i>
                    Cancella Tutti i Dati
                </button>
                <p style="color: var(--color-gray-600); font-size: 0.875rem; margin-top: 1rem;">
                    ⚠️ Questa azione è irreversibile. Assicurati di aver esportato i dati prima di procedere.
                </p>
            </div>
            <style>
                .settings-panel .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid var(--color-gray-200);
                }
                .settings-panel h4 {
                    margin-bottom: 1rem;
                }
            </style>
        `;
        this.showModal('Impostazioni', modalBody);
        lucide.createIcons();
    },

    saveConnectionSettings() {
        const url = document.getElementById('ldm-conn-url').value.trim();
        localStorage.setItem('ldm_connection', JSON.stringify({ url }));
        alert('Impostazioni di connessione salvate!');
        UI.showSettings();
    },

    /**
     * Mostra modal generico
     */
    showModal(title, body, size = 'medium') {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalTitle && modalBody) {
            if (modalTitle) modalTitle.textContent = title;
            modalBody.innerHTML = body;
            
            // Gestisci dimensione modal
            modal.classList.remove('modal-small', 'modal-medium', 'modal-large', 'modal-fullscreen');
            modal.classList.add(`modal-${size}`);
            
            modal.classList.add('active');
            appState.toggleModal();

            // Quando la modal è aperta, disabilita gli hover sui card sottostanti aggiungendo una classe al body
            document.body.classList.add('modal-open');

            // Se la modal è fullscreen NON aggiungere la X di chiusura standard, lasciando solo quella personalizzata nella dashboard fiscale
            // (nessuna X aggiunta qui)

            // Aggiorna icone e forza il focus sul primo elemento editabile per rendere i campi immediatamente utilizzabili
            setTimeout(() => {
                if (typeof lucide !== 'undefined') lucide.createIcons();
                const firstFocusable = modal.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])');
                if (firstFocusable) {
                    try { firstFocusable.focus(); } catch (e) { /* ignore */ }
                }
            }, 50);
        }
    },

    /**
     * Chiudi modal
     */
    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
            modal.classList.remove('modal-small', 'modal-medium', 'modal-large', 'modal-fullscreen');

            // Ripristina stato body
            document.body.classList.remove('modal-open');

            // Rimuovi eventuale pulsante 'Indietro' creato dinamicamente
            const backBtn = modal.querySelector('.modal-back');
            if (backBtn) backBtn.remove();
        }
    },

    /**
     * Controlla se nel modal ci sono form con dati inseriti (non vuoti)
     */
    _modalHasUnsavedForm(modal) {
        if (!modal) return false;
        const forms = modal.querySelectorAll('form');
        if (!forms || forms.length === 0) return false;

        for (const form of forms) {
            const elements = Array.from(form.elements || []);
            for (const el of elements) {
                if (el.disabled) continue;
                const tag = (el.tagName || '').toLowerCase();

                if (tag === 'input') {
                    const type = (el.type || '').toLowerCase();
                    if (['text','number','date','email','tel','search','password','url'].includes(type)) {
                        if (el.value && String(el.value).trim() !== '') return true;
                    } else if (type === 'checkbox' || type === 'radio') {
                        if (el.checked) return true;
                    } else if (type === 'file') {
                        if (el.files && el.files.length > 0) return true;
                    }
                } else if (tag === 'textarea') {
                    if (el.value && String(el.value).trim() !== '') return true;
                } else if (tag === 'select') {
                    if (el.value && String(el.value) !== '') return true;
                }
            }
        }

        return false;
    },

    /**
     * Chiudi il modal chiedendo conferma se ci sono dati non salvati
     */
    confirmAndCloseModal() {
        const modal = document.getElementById('modal');
        if (!modal || !modal.classList.contains('active')) return;

        if (this._modalHasUnsavedForm(modal)) {
            if (!confirm('Ci sono dati non salvati nel modulo. Vuoi chiudere e perdere le modifiche?')) {
                return;
            }
        }

        this.closeModal();
    },

    /**
     * Mostra toast notification
     */
    showToast(message, type = 'info') {
        // Rimuovi toast esistenti
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${this.getToastIcon(type)}
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Animazione entrata
        setTimeout(() => toast.classList.add('show'), 10);

        // Rimozione automatica dopo 3 secondi
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Ottiene icona per toast in base al tipo
     */
    getToastIcon(type) {
        const icons = {
            success: '✓',
            danger: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
};

// Aggiungi stili per toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        bottom: calc(var(--bottom-nav-height) + 1rem);
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background-color: var(--color-gray-900);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: var(--z-loading);
        opacity: 0;
        transition: all var(--transition-base);
        max-width: 90%;
    }

    .toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }

    .toast-success { background-color: var(--color-success); }
    .toast-danger { background-color: var(--color-danger); }
    .toast-warning { background-color: var(--color-warning); }
    .toast-info { background-color: var(--color-info); }

    .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-group label {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--color-gray-700);
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        padding: 0.75rem;
        border: 1px solid var(--color-gray-300);
        border-radius: var(--radius-md);
        font-size: 1rem;
        transition: all var(--transition-fast);
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }

    @media (max-width: 640px) {
        .form-row {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(toastStyles);

// Esponi showView globalmente per la navbar
window.showView = function(sectionName) {
    UI.showView(sectionName);
};

window.UI = UI;
