/**
 * Info & Support Module
 * Gestisce la sezione informativa e di supporto dell'app
 * Developed by ldm4app
 */

const InfoModule = (() => {
  const APP_VERSION = '1.0.0';
  const DEVELOPER = 'ldm4app';
  const SUPPORT_EMAIL = '';

  /**
   * Mostra il modal Info & Supporto
   */
  function showInfoModal() {
    const content = `
      <div class="info-modal-container">
        <!-- Header Section -->
        <div class="info-header">
          <div class="info-logo">
            <i data-lucide="shield-check" style="width: 48px; height: 48px; color: var(--color-primary);"></i>
          </div>
          <h2 class="info-app-name">⚽ LDM Soccer Manager</h2>
          <p class="info-version">Versione ${APP_VERSION}</p>
          <p class="info-developer">Sviluppato da <strong>${DEVELOPER}</strong></p>
        </div>

        <!-- Collaboration CTA Section -->
        <div class="info-cta-box">
          <div class="info-cta-icon">
            <i data-lucide="rocket" style="width: 32px; height: 32px;"></i>
          </div>
          <h3>Collaborazioni & Sviluppo Personalizzato</h3>
          <p>
            Vuoi portare SoccerManager Pro a un livello superiore? 
            Siamo aperti a implementare nuove funzioni personalizzate per la tua società sportiva.
          </p>
          <button class="info-contact-btn" id="info-contact-btn">
            <i data-lucide="mail" style="width: 18px; height: 18px;"></i>
            Contatta il Team (email disabilitata)
          </button>
        </div>

        <!-- Quick Guide Section -->
        <div class="info-guide-section">
          <h3>
            <i data-lucide="book-open" style="width: 20px; height: 20px;"></i>
            Guida Rapida
          </h3>
          <div class="info-steps">
            <div class="info-step">
              <div class="info-step-number">1</div>
              <div class="info-step-content">
                <h4><i data-lucide="settings" style="width: 16px; height: 16px;"></i> Configura</h4>
                <p>Crea le squadre per attivare l'aggiornamento automatico delle categorie.</p>
              </div>
            </div>
            <div class="info-step">
              <div class="info-step-number">2</div>
              <div class="info-step-content">
                <h4><i data-lucide="users" style="width: 16px; height: 16px;"></i> Gestisci</h4>
                <p>Inserisci gli atleti e monitora le icone rosse in dashboard per le visite mediche in scadenza.</p>
              </div>
            </div>
            <div class="info-step">
              <div class="info-step-number">3</div>
              <div class="info-step-content">
                <h4><i data-lucide="shield" style="width: 16px; height: 16px;"></i> Proteggi</h4>
                <p>Esporta regolarmente il file JSON per avere un backup di sicurezza esterno.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Privacy & Security Section -->
        <div class="info-privacy-section">
          <div class="info-privacy-icon">
            <i data-lucide="lock" style="width: 24px; height: 24px;"></i>
          </div>
          <h3>Privacy & Sicurezza</h3>
          <p>
            <strong>I tuoi dati sono al sicuro.</strong> ${DEVELOPER} non ha accesso alle informazioni inserite: 
            tutto viene salvato esclusivamente in locale sul tuo dispositivo.
          </p>
          <div class="info-privacy-features">
            <div class="info-privacy-item">
              <i data-lucide="check-circle" style="width: 16px; height: 16px; color: var(--color-success);"></i>
              <span>Nessun server remoto</span>
            </div>
            <div class="info-privacy-item">
              <i data-lucide="check-circle" style="width: 16px; height: 16px; color: var(--color-success);"></i>
              <span>Dati criptati in locale</span>
            </div>
            <div class="info-privacy-item">
              <i data-lucide="check-circle" style="width: 16px; height: 16px; color: var(--color-success);"></i>
              <span>Privacy garantita al 100%</span>
            </div>
          </div>
        </div>

        <!-- Features Summary -->
        <div class="info-features-section">
          <h3>
            <i data-lucide="sparkles" style="width: 20px; height: 20px;"></i>
            Funzionalità Principali
          </h3>
          <div class="info-features-grid">
            <div class="info-feature-item">
              <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
              <span>Report PDF Professionali</span>
            </div>
            <div class="info-feature-item">
              <i data-lucide="activity" style="width: 20px; height: 20px;"></i>
              <span>Valutazioni con Grafici</span>
            </div>
            <div class="info-feature-item">
              <i data-lucide="moon" style="width: 20px; height: 20px;"></i>
              <span>Dark Mode</span>
            </div>
            <div class="info-feature-item">
              <i data-lucide="calendar" style="width: 20px; height: 20px;"></i>
              <span>Calendario Eventi</span>
            </div>
            <div class="info-feature-item">
              <i data-lucide="heart-pulse" style="width: 20px; height: 20px;"></i>
              <span>Monitoraggio Visite Mediche</span>
            </div>
            <div class="info-feature-item">
              <i data-lucide="database" style="width: 20px; height: 20px;"></i>
              <span>Backup Automatico</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="info-footer">
          <p>© ${new Date().getFullYear()} ${DEVELOPER} - Tutti i diritti riservati</p>
          <div style="display:flex;gap:8px;align-items:center;margin-top:0.5rem;">
            <button id="run-health-check" class="btn btn-secondary" style="flex:1;">🔧 Esegui Controllo Salute</button>
            <button id="run-listener-detect" class="btn btn-secondary" style="flex:1;">🔍 Detect Listener Leaks</button>
            <a href="#" class="info-footer-link" id="info-support-link">
              <i data-lucide="mail" style="width: 14px; height: 14px;"></i>
              Supporto
            </a>
            <span class="info-footer-separator">•</span>
            <a href="#" class="info-footer-link" id="info-licenses-link">
              <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
              Licenze
            </a>
          </div>
        </div>
      </div>
    `;

    UI.showModal('Info & Supporto', content, 'large');
    
    // Re-initialize Lucide icons nel modal
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      // Aggiungi event listener al pulsante contatto
      const contactBtn = document.getElementById('info-contact-btn');
      if (contactBtn) {
        contactBtn.addEventListener('click', () => contactSupport());
      }
      
      // Event listener per link supporto footer
      const supportLink = document.getElementById('info-support-link');
      if (supportLink) {
        supportLink.addEventListener('click', (e) => {
          e.preventDefault();
          contactSupport();
        });
      }
      
      // Event listener per link licenze
      const licensesLink = document.getElementById('info-licenses-link');
      if (licensesLink) {
        licensesLink.addEventListener('click', (e) => {
          e.preventDefault();
          showLicenses();
        });
      }

      // Event listener per Health Check
      const healthBtn = document.getElementById('run-health-check');
      if (healthBtn) {
        healthBtn.addEventListener('click', async () => {
          try {
            if (typeof DiagnosticsModule !== 'undefined' && typeof DiagnosticsModule.runFullCheck === 'function') {
              await DiagnosticsModule.runFullCheck();
            } else {
              UI.showToast('Modulo diagnostica non disponibile', 'warning');
            }
          } catch (e) {
            console.error('Health Check error:', e);
            UI.showToast('Errore durante il controllo', 'danger');
          }
        });
      }

      // Event listener per Listener Leak Detection
      const listenerBtn = document.getElementById('run-listener-detect');
      if (listenerBtn) {
        listenerBtn.addEventListener('click', async () => {
          try {
            if (typeof DiagnosticsModule !== 'undefined' && typeof DiagnosticsModule.detectListenerLeaks === 'function') {
              UI.showToast('Eseguo detection listener (potrebbe richiedere qualche secondo)...', 'info');
              const report = await DiagnosticsModule.detectListenerLeaks({ threshold: 10, cycles: 100, delayMs: 10 });
              console.log('Listener detection report:', report);
            } else {
              UI.showToast('Modulo diagnostica non disponibile', 'warning');
            }
          } catch (e) {
            console.error('Listener detect error:', e);
            UI.showToast('Errore durante detection listener', 'danger');
          }
        });
      }
    }, 50);
  }

  /**
   * Apre il client email per contattare il supporto
   */
  function contactSupport() {
    UI.showModal('Assistenza disabilitata', `
      <div style="padding:1rem;">
        <p>La possibilità di contattare il supporto via e-mail è stata disabilitata in questa distribuzione.</p>
        <p>Per informazioni e guide consulta il <strong>Centro Assistenza</strong> o visita il sito: <a href="https://www.ldm4app.com" target="_blank">ldm4app.com</a>.</p>
      </div>
    `);
  }

  /**
   * Mostra le licenze software utilizzate
   */
  function showLicenses() {
    const licensesContent = `
      <div class="licenses-container">
        <h3>Librerie & Licenze</h3>
        <div class="license-item">
          <h4>Chart.js</h4>
          <p>Versione: 4.4.1 | Licenza: MIT</p>
          <p><a href="https://www.chartjs.org" target="_blank">chartjs.org</a></p>
        </div>
        <div class="license-item">
          <h4>jsPDF</h4>
          <p>Versione: 2.5.1 | Licenza: MIT</p>
          <p><a href="https://github.com/parallax/jsPDF" target="_blank">github.com/parallax/jsPDF</a></p>
        </div>
        <div class="license-item">
          <h4>jsPDF-autoTable</h4>
          <p>Versione: 3.7.1 | Licenza: MIT</p>
          <p><a href="https://github.com/simonbengtsson/jsPDF-AutoTable" target="_blank">github.com/simonbengtsson/jsPDF-AutoTable</a></p>
        </div>
        <div class="license-item">
          <h4>Lucide Icons</h4>
          <p>Licenza: ISC</p>
          <p><a href="https://lucide.dev" target="_blank">lucide.dev</a></p>
        </div>
        <div class="license-item">
          <h4>Capacitor</h4>
          <p>Versione: 5.7.0 | Licenza: MIT</p>
          <p><a href="https://capacitorjs.com" target="_blank">capacitorjs.com</a></p>
        </div>
      </div>
    `;

    UI.showModal('Licenze Software', licensesContent);
    
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 50);
  }

  /**
   * Inizializzazione del modulo
   */
  function init() {
    console.log(`InfoModule initialized - Version ${APP_VERSION}`);
  }

  return {
    init,
    showInfoModal,
    contactSupport,
    showLicenses,
    version: APP_VERSION
  };
})();
