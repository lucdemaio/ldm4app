/**
 * APP.JS
 * File principale dell'applicazione
 * Orchestrazione e inizializzazione di tutti i moduli
 */

class SoccerManagerApp {
    constructor() {
        this.initialized = false;
    }

    /**
     * Inizializza l'applicazione
     */
    async init() {
        console.log('⚽ Avvio SoccerManager Pro...');
        console.log('📅 Data:', new Date().toLocaleDateString('it-IT'));

        try {
            // 1. Inizializza lo state manager e carica i dati
            await appState.init();

            // 2. Inizializza i moduli UI
            UI.init();
            ThemeManager.init();
            InfoModule.init();

            // 3. Inizializza i moduli funzionali
            DashboardModule.init();
            AthletesModule.init();
            TeamsModule.init();
            // Polling robusto per CalendarModule
            const waitForModule = (modName, maxTries = 20, interval = 500) => {
                return new Promise((resolve, reject) => {
                    let tries = 0;
                    const poll = () => {
                        const mod = window[modName];
                        if (mod && typeof mod.init === 'function') {
                            resolve(mod);
                        } else if (++tries >= maxTries) {
                            reject(new Error(`${modName} non disponibile dopo ${maxTries} tentativi.`));
                        } else {
                            setTimeout(poll, interval);
                        }
                    };
                    poll();
                });
            };

            try {
                const calendarModule = await waitForModule('CalendarModule', 20, 500);
                calendarModule.init();
            } catch (err) {
                console.error(err.message);
                alert('Errore: CalendarModule non disponibile. Ricarica la pagina o contatta il supporto.');
                // Esegui diagnostica automatica se disponibile per facilitare il debug
                try { if (typeof DiagnosticsModule !== 'undefined' && typeof DiagnosticsModule.runFullCheck === 'function') { setTimeout(() => DiagnosticsModule.runFullCheck(), 800); } } catch(e) { /* ignore */ }
            }
            EvaluationsModule.init();
            ReportsModule.init();
            FinancesModule.init();
            MatchDayModule.init();
            AttendanceModule.init();
            TacticsModule.init();
            if (typeof FiscalModule !== 'undefined' && typeof FiscalModule.init === 'function') {
                FiscalModule.init();
            } else {
                console.warn('FiscalModule non disponibile al momento dell\'inizializzazione. Verrà riprovato più tardi.');
                setTimeout(() => {
                    if (typeof FiscalModule !== 'undefined' && typeof FiscalModule.init === 'function') {
                        FiscalModule.init();
                        console.log('FiscalModule inizializzato al retry.');
                    }
                }, 2000);
            }

            // Polling robusto per LogisticsModule
            try {
                const logisticsModule = await waitForModule('LogisticsModule', 20, 500);
                logisticsModule.init();
            } catch (err) {
                console.error(err.message);
                alert('Errore: LogisticsModule non disponibile. Ricarica la pagina o contatta il supporto.');
            }

            // Bind Logistica Trasferte menu link sempre, con retry nel handler (se il link è disponibile)
            const logisticsLink = document.getElementById('logistics-menu-link');
            if (logisticsLink && !logisticsLink._bound) {
                logisticsLink._bound = true;
                logisticsLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Logistics menu clicked');
                    const tryOpenLogistics = () => {
                        if (typeof LogisticsModule !== 'undefined' && LogisticsModule) {
                            console.log('LogisticsModule available');
                            // Cerca la prima partita disponibile
                            const calendar = (window.appState && window.appState.state && Array.isArray(window.appState.state.calendar)) ? window.appState.state.calendar : [];
                            const firstMatch = calendar.find(ev => ev.type === 'match');
                            if (firstMatch && typeof LogisticsModule.showLogistics === 'function') {
                                console.log('Opening logistics for match:', firstMatch.id);
                                LogisticsModule.showLogistics(firstMatch.id);
                            } else if (typeof LogisticsModule.showLogisticsDashboard === 'function') {
                                console.log('Opening logistics dashboard');
                                LogisticsModule.showLogisticsDashboard();
                            } else {
                                console.log('No matches found, opening calendar');
                                showView('calendar');
                            }
                        } else {
                            console.log('LogisticsModule not available, retrying');
                            setTimeout(tryOpenLogistics, 1000);
                        }
                    };
                    tryOpenLogistics();
                });
            }

            // Delegated listener sul navbar per intercettare click anche se il singolo elemento non è ancora stato legato
            const navbar = document.querySelector('header.navbar-main') || document.getElementById('navbar-main');
            if (navbar && !navbar._logisticsDelegationBound) {
                navbar._logisticsDelegationBound = true;
                navbar.addEventListener('click', (e) => {
                    const link = e.target.closest && e.target.closest('#logistics-menu-link');
                    if (!link) return;
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Logistics delegated click');
                    let retries = 0;
                    const maxRetries = 15; // evitiamo loop infiniti
                    const tryOpenLogistics = () => {
                        if (typeof LogisticsModule !== 'undefined' && LogisticsModule) {
                            console.log('LogisticsModule available (delegated)');
                            const calendar = (window.appState && window.appState.state && Array.isArray(window.appState.state.calendar)) ? window.appState.state.calendar : [];
                            const firstMatch = calendar.find(ev => ev.type === 'match');
                            if (firstMatch && typeof LogisticsModule.showLogistics === 'function') {
                                console.log('Opening logistics for match:', firstMatch.id);
                                LogisticsModule.showLogistics(firstMatch.id);
                                return;
                            } else if (typeof LogisticsModule.showLogisticsDashboard === 'function') {
                                console.log('Opening logistics dashboard');
                                LogisticsModule.showLogisticsDashboard();
                                return;
                            } else {
                                console.log('No matches and no dashboard, opening calendar');
                                showView('calendar');
                                return;
                            }
                        } else {
                            if (retries++ < maxRetries) {
                                console.log('LogisticsModule not ready, retry', retries);
                                setTimeout(tryOpenLogistics, 1000);
                            } else {
                                console.warn('LogisticsModule failed to become available after retries');
                                alert('Modulo Logistica non disponibile al momento.');
                            }
                        }
                    };
                    tryOpenLogistics();
                });
            }

            // Salvataggio automatico su ogni modifica di stato
            const autoSaveEvents = [
                'athletes:added','athletes:updated','athletes:deleted',
                'teams:added','teams:updated','teams:deleted',
                'calendar:added','calendar:updated','calendar:deleted',
                'evaluations:added','evaluations:updated','evaluations:deleted',
                'settings:changed','filters:changed','filters:reset',
                'ui:section-changed','ui:sidebar-changed','ui:modal-changed'
            ]; // NOTE: removed 'state:updated' to avoid recursive autosave loop
            autoSaveEvents.forEach(event => {
                appState.subscribe(event, () => {
                    try {
                        appState.saveState();
                        console.log('[AUTOSAVE] Stato salvato per evento:', event);
                    } catch (e) {
                        console.warn('[AUTOSAVE] Errore salvataggio:', e);
                    }
                });
            });
            if (typeof LogisticsModule !== 'undefined' && LogisticsModule && typeof LogisticsModule.init === 'function') {
                LogisticsModule.init();
            } else {
                console.warn('LogisticsModule non disponibile al momento dell\'inizializzazione. Verrà riprovato più tardi.');
            }
            if (typeof ArchiveModule !== 'undefined' && ArchiveModule && typeof ArchiveModule.init === 'function') {
                ArchiveModule.init();
            }

            // 3b. Inizializza sistema di aiuto e guida
            OnboardingModule.init();
            HelpCenterModule.init();
            TooltipManager.initAll();

            // 4. Inizializza Lucide Icons
            lucide.createIcons();

            // 6. Setup listeners globali
            this.setupGlobalListeners();

            // Diagnostics module init (non invasivo)
            try { if (typeof DiagnosticsModule !== 'undefined' && typeof DiagnosticsModule.init === 'function') DiagnosticsModule.init(); } catch (e) { console.warn('Diagnostics init failed', e); }

            // 7. Verifica aggiornamenti e migrazioni
            this.checkUpdates();

            // 8. Controlla e aggiorna categorie automaticamente
            appState.checkCategoryUpdate();

            this.initialized = true;
            console.log('✅ SoccerManager Pro inizializzato con successo!');

            // Welcome message (solo prima volta)
            this.showWelcomeIfFirstTime();

        } catch (error) {
            console.error('❌ Errore inizializzazione app:', error);
            this.showErrorScreen(error);
        }
    }

    /**
     * Setup listeners globali dell'applicazione
     */
    setupGlobalListeners() {
        // Salvataggio automatico periodico
        setInterval(() => {
            Storage.createBackup();
            console.log('💾 Backup automatico creato');
        }, 5 * 60 * 1000); // Ogni 5 minuti

        // Gestione visibilità pagina
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // App in background
                Storage.createBackup();
                console.log('📴 App in background - backup creato');
            } else {
                // App in foreground
                console.log('📱 App in foreground');
                DashboardModule.updateStats();
            }
        });

        // Gestione errori globali (migliorata per raccolta informazioni)
        window.addEventListener('error', (event) => {
            try {
                const payload = {
                    message: event.message || (event.error && event.error.message) || 'N/D',
                    file: event.filename || 'N/D',
                    line: event.lineno || 'N/D',
                    column: event.colno || 'N/D',
                    error: event.error || null
                };
                console.error('Errore globale:', payload);
                // Preferisci passare l'oggetto Error quando disponibile
                this.logError(event.error || payload);
            } catch (e) { console.error('Errore handler globale fallito', e); }
        });

        // Gestione promise rejections (migliorata)
        window.addEventListener('unhandledrejection', (event) => {
            try {
                console.error('Promise rejection:', event.reason);
                // Salva sia reason che eventuale stack
                this.logError(event.reason || { message: 'Unhandled rejection (no reason)' });
            } catch (e) { console.error('unhandledrejection handler error', e); }
        });

        // Prevenzione chiusura accidentale (se modifiche non salvate)
        window.addEventListener('beforeunload', (event) => {
            // Normalmente lo stato è sempre salvato, ma per sicurezza
            Storage.saveState(appState.state);
        });
    }

    /**
     * Verifica aggiornamenti e migrazioni dati
     */
    checkUpdates() {
        const currentVersion = '1.0.0';
        const savedVersion = localStorage.getItem('app_version');

        if (!savedVersion) {
            // Prima installazione
            localStorage.setItem('app_version', currentVersion);
            localStorage.setItem('first_launch', new Date().toISOString());
        } else if (savedVersion !== currentVersion) {
            // Aggiornamento
            console.log(`🔄 Aggiornamento da ${savedVersion} a ${currentVersion}`);
            this.migrateData(savedVersion, currentVersion);
            localStorage.setItem('app_version', currentVersion);
        }
    }

    /**
     * Migrazione dati tra versioni
     */
    migrateData(fromVersion, toVersion) {
        console.log(`🔄 Migrazione dati: ${fromVersion} → ${toVersion}`);
        
        // Implementare logica di migrazione se necessario
        // Esempio:
        // if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
        //     // Aggiungi nuovi campi agli atleti
        // }
    }

    /**
     * Mostra messaggio di benvenuto alla prima apertura
     */
    showWelcomeIfFirstTime() {
        // Allow disabling auto welcome for a clean testing/dev experience
        if (localStorage.getItem('disable_auto_welcome') === 'true') return;

        const firstLaunch = localStorage.getItem('first_launch');
        const hasShownWelcome = localStorage.getItem('welcome_shown');

        // For testing/dev: if it's the first launch but welcome was never shown,
        // mark it as shown and skip actually opening the modal to avoid blocking
        // the UI during automated tests. Remove this behavior if you want the
        // welcome modal to be shown in production first launches.
        if (firstLaunch && !hasShownWelcome) {
            try{ localStorage.setItem('welcome_shown', 'true'); }catch(e){}
            return;
        }

        if (firstLaunch && !hasShownWelcome) {
            setTimeout(() => {
                const modalBody = `
                    <div style="text-align: center; padding: 2rem 1rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">⚽</div>
                        <h2 style="margin-bottom: 1rem;">Benvenuto in SoccerManager Pro!</h2>
                        <p style="color: var(--color-gray-600); margin-bottom: 2rem;">
                            L'app completa per la gestione della tua società sportiva calcistica.
                        </p>
                        
                        <div style="text-align: left; margin-bottom: 2rem;">
                            <h4 style="margin-bottom: 0.5rem;">🎯 Funzionalità Principali:</h4>
                            <ul style="color: var(--color-gray-700); line-height: 1.8;">
                                <li>📋 Anagrafica atleti completa</li>
                                <li>🛡️ Gestione squadre e convocazioni</li>
                                <li>📅 Calendario allenamenti e partite</li>
                                <li>💾 Salvataggio automatico locale</li>
                                <li>📤 Esportazione/Importazione dati</li>
                            </ul>
                        </div>

                        <p style="font-size: 0.875rem; color: var(--color-gray-500);">
                            Tutti i dati sono salvati localmente sul tuo dispositivo in modo sicuro.
                        </p>

                        <button class="btn btn-primary" onclick="UI.closeModal()" style="margin-top: 1rem; width: 100%;">
                            <i data-lucide="check"></i>
                            Inizia Subito
                        </button>
                    </div>
                `;

                UI.showModal('', modalBody);
                lucide.createIcons();
                localStorage.setItem('welcome_shown', 'true');
            }, 1000);
        }
    }

    /**
     * Mostra schermata di errore critico
     */
    showErrorScreen(error) {
        const container = document.getElementById('app-container');
        const message = (error && error.message) ? error.message : String(error || 'Errore sconosciuto');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem;">
                    <div style="font-size: 4rem; color: var(--color-danger); margin-bottom: 1rem;">⚠️</div>
                    <h2>Errore Inizializzazione</h2>
                    <p style="color: var(--color-gray-600); margin: 1rem 0;">
                        Si è verificato un errore durante il caricamento dell'applicazione.
                    </p>
                    <pre style="background: var(--color-gray-100); padding: 1rem; border-radius: var(--radius-md); text-align: left; overflow: auto; margin: 1rem 0;">
                        ${message}
                    </pre>
                        <button class="btn btn-primary btn-glass primary" onclick="location.reload()">
                        <i data-lucide="refresh-cw"></i>
                        Ricarica Applicazione
                    </button>
                </div>
            `;
            lucide.createIcons();
        }
    }

    /**
     * Log errori per debug (in produzione può inviare a server)
     */
    logError(error) {
        const message = (error && error.message) ? error.message : String(error || 'Errore sconosciuto');
        const stack = (error && error.stack) ? error.stack : undefined;
        const section = (typeof appState !== 'undefined' && typeof appState.getUIState === 'function') ? (appState.getUIState().currentSection || 'N/D') : 'N/D';

        const errorLog = {
            timestamp: new Date().toISOString(),
            message,
            stack,
            section,
            userAgent: navigator.userAgent
        };

        try { console.error('📝 Error Log:', errorLog); } catch(e) { /* ignore */ }

        // Salva localmente per debug e diagnostica (max 200 record)
        try {
            const reports = JSON.parse(localStorage.getItem('errorReports') || '[]');
            reports.push(errorLog);
            if (reports.length > 200) reports.shift();
            localStorage.setItem('errorReports', JSON.stringify(reports));
        } catch (e) { /* ignore */ }

        // Mostra toast non invasivo
        try { UI.showToast('Si è verificato un errore (vedi console). Segnala se persiste', 'danger'); } catch(e) { /* ignore */ }

        // In produzione, inviare a un servizio di error tracking
        // come Sentry, LogRocket, etc.
    }

    /**
     * Info applicazione
     */
    getAppInfo() {
        return {
            name: 'SoccerManager Pro',
            version: '1.0.0',
            author: 'Your Name',
            description: 'Gestione Società Sportiva Calcistica',
            platform: navigator.userAgent,
            storageAvailable: Storage.isAvailable(),
            dataSize: Storage.getUsedSpace()
        };
    }
}

// ========== INIZIALIZZAZIONE ==========

// Attendi il caricamento completo del DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Attendi anche Capacitor (se presente)
if (window.Capacitor) {
    window.Capacitor.Plugins.App?.addListener('appStateChange', (state) => {
        if (state.isActive) {
            console.log('📱 App riattivata');
            DashboardModule.updateStats();
        }
    });
}

// Funzione di inizializzazione
async function initApp() {
    const app = new SoccerManagerApp();
    await app.init();
    
    // Rendi l'istanza disponibile globalmente per debug
    window.app = app;
    
    // Info app in console
    console.table(app.getAppInfo());
}
window.initApp = initApp;

// ========== SERVICE WORKER (PWA) ==========
// Per rendere l'app installabile come PWA

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js')
        //     .then(reg => console.log('✅ Service Worker registrato'))
        //     .catch(err => console.log('❌ Service Worker errore:', err));
    });
}

// Lingua fissa italiana
document.body.setAttribute('data-lang', 'it');

// Export per uso esterno
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SoccerManagerApp, appState, Storage };
}
