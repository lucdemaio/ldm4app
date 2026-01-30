/**
 * LEGAL-DOCS.JS
 * Gestione documenti legali con firma digitale
 * - Modulo Iscrizione pre-compilato
 * - Consenso Privacy GDPR
 * - SignaturePad per firme digitali
 * - Generazione PDF con firma
 */

class SignaturePad {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.strokes = [];
        this.currentStroke = [];
        
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        // Set canvas size to match display size
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * 2; // Retina display
        this.canvas.height = rect.height * 2;
        this.ctx.scale(2, 2);
        
        // Set drawing style
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }
    
    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        // Touch events for tablet
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });
    }
    
    getCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const coords = this.getCoordinates(e);
        this.lastX = coords.x;
        this.lastY = coords.y;
        this.currentStroke = [coords];
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const coords = this.getCoordinates(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.stroke();
        
        this.lastX = coords.x;
        this.lastY = coords.y;
        this.currentStroke.push(coords);
    }
    
    stopDrawing() {
        if (this.isDrawing && this.currentStroke.length > 0) {
            this.strokes.push([...this.currentStroke]);
            this.currentStroke = [];
        }
        this.isDrawing = false;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.strokes = [];
        this.currentStroke = [];
    }
    
    isEmpty() {
        return this.strokes.length === 0;
    }
    
    toDataURL() {
        return this.canvas.toDataURL('image/png');
    }
}

class LegalDocManager {
    constructor() {
        this.signaturePad = null;
        this.currentAthlete = null;
        this.currentDocType = null;

        // Aggiorna la vista quando gli atleti cambiano (aggiunti/aggiornati/eliminati)
        try {
            const setupSubscriptions = () => {
                if (typeof appState !== 'undefined' && typeof appState.subscribe === 'function') {
                    appState.subscribe('athletes:added', () => this._refreshIfActive());
                    appState.subscribe('athletes:updated', () => this._refreshIfActive());
                    appState.subscribe('athletes:deleted', () => this._refreshIfActive());
                }
            };

            // Se appState è pronto subito, sottoscrivi; altrimenti riprova dopo un delay
            setupSubscriptions();
            setTimeout(setupSubscriptions, 500);
        } catch (e) { /* ignore */ }
    }

    _refreshIfActive() {
        try {
            // Se siamo nella dashboard dei documenti legali o in un modal correlato, rinfresca la vista
            if (document.querySelector('.legal-docs-dashboard')) {
                this.showLegalDocsDashboard();
                return;
            }
            if (document.querySelector('.athlete-selector-modal')) {
                // Rerender selector
                this.selectAthleteForDoc(this.currentDocType || 'registration');
                return;
            }
            if (document.querySelector('.signature-modal')) {
                // Mantieni lo stato della firma ma aggiorna eventuali riferimenti (se necessario)
                // Non forziamo il cambio di view per non disturbare l'utente
            }
        } catch (e) { /* ignore */ }
    }

    // Helper per ottenere gli atleti da appState o fallback su LocalStorage / Storage
    getAthletes() {
        try {
            if (window.appState && typeof window.appState.getAthletes === 'function') {
                const fromState = window.appState.getAthletes() || [];
                console.debug('LegalDocManager.getAthletes: from appState ->', fromState.length, 'items');
                if (fromState && fromState.length) return fromState;
            }
        } catch (e) { console.warn('LegalDocManager.getAthletes: appState.getAthletes error', e); }

        try {
            const localAthletes = JSON.parse(localStorage.getItem('athletes') || '[]') || [];
            if (localAthletes.length) {
                console.debug('LegalDocManager.getAthletes: from localStorage "athletes" ->', localAthletes.length, 'items');
                return localAthletes;
            }
        } catch (e) { /* ignore */ }

        try {
            // Prova a leggere lo stato completo salvato (fallback per appState persistito)
            if (typeof Storage !== 'undefined' && typeof Storage.loadState === 'function') {
                const saved = Storage.loadState();
                if (saved && Array.isArray(saved.athletes) && saved.athletes.length) {
                    console.debug('LegalDocManager.getAthletes: from Storage.loadState ->', saved.athletes.length, 'items');
                    return saved.athletes;
                }
            } else {
                const savedRaw = localStorage.getItem('soccermanager_app_state');
                if (savedRaw) {
                    try {
                        const parsed = JSON.parse(savedRaw);
                        if (parsed && Array.isArray(parsed.athletes) && parsed.athletes.length) {
                            console.debug('LegalDocManager.getAthletes: from soccermanager_app_state ->', parsed.athletes.length, 'items');
                            return parsed.athletes;
                        }
                    } catch (e) { /* ignore */ }
                }
            }
        } catch (e) { /* ignore */ }

        console.debug('LegalDocManager.getAthletes: no athletes found');
        return [];
    }

    // Ritorna nome completo facendo fallback su firstName/lastName se name non esiste
    _displayName(athlete) {
        if (!athlete) return '—';
        const name = athlete.name || ((athlete.firstName || '') + ' ' + (athlete.lastName || '')).trim();
        return name || '—';
    }
    
    showLegalDocsDashboard() {
        // Pulizia UI: rimuovi overlay e dropdown residui per evitare di rimanere bloccati
        try {
            document.querySelectorAll('.nav-dropdown.active').forEach(d => d.classList.remove('active'));
            const modalOverlay = document.querySelector('.modal-overlay');
            if (modalOverlay && modalOverlay.parentElement) modalOverlay.parentElement.removeChild(modalOverlay);
            document.body.classList.remove('modal-open');
        } catch(e) { /* ignore */ }

        const athletes = this.getAthletes();
        
        const html = `
            <div class="legal-docs-dashboard">
                <div class="section-header">
                    <h2><i data-lucide="file-text"></i> Documenti Legali</h2>
                </div>
                
                <div class="legal-docs-grid">
                    <!-- Card Modulo Iscrizione -->
                    <div class="legal-doc-card">
                        <div class="doc-icon bg-blue">
                            <i data-lucide="file-plus"></i>
                        </div>
                        <div class="doc-content">
                            <h3>Modulo Iscrizione</h3>
                            <p>Genera modulo d'iscrizione pre-compilato con dati atleta</p>
                            <button class="btn btn-primary" onclick="legalDocs.selectAthleteForDoc('registration')">
                                <i data-lucide="file-text"></i>
                                Crea Modulo
                            </button>
                        </div>
                    </div>
                    
                    <!-- Card Consenso Privacy -->
                    <div class="legal-doc-card">
                        <div class="doc-icon bg-green">
                            <i data-lucide="shield-check"></i>
                        </div>
                        <div class="doc-content">
                            <h3>Consenso Privacy</h3>
                            <p>Genera consenso trattamento dati GDPR personalizzato</p>
                            <button class="btn btn-primary" onclick="legalDocs.selectAthleteForDoc('privacy')">
                                <i data-lucide="shield"></i>
                                Crea Consenso
                            </button>
                        </div>
                    </div>
                    
                    <!-- Card Liberatoria Foto/Video -->
                    <div class="legal-doc-card">
                        <div class="doc-icon bg-orange">
                            <i data-lucide="camera"></i>
                        </div>
                        <div class="doc-content">
                            <h3>Liberatoria Foto/Video</h3>
                            <p>Consenso pubblicazione immagini e riprese video</p>
                            <button class="btn btn-primary" onclick="legalDocs.selectAthleteForDoc('media')">
                                <i data-lucide="image"></i>
                                Crea Liberatoria
                            </button>
                        </div>
                    </div>
                    
                    <!-- Card Certificato Medico -->
                    <div class="legal-doc-card">
                        <div class="doc-icon bg-purple">
                            <i data-lucide="heart-pulse"></i>
                        </div>
                        <div class="doc-content">
                            <h3>Certificato Medico</h3>
                            <p>Promemoria scadenza certificato medico sportivo</p>
                            <button class="btn btn-primary" onclick="legalDocs.selectAthleteForDoc('medical')">
                                <i data-lucide="stethoscope"></i>
                                Crea Promemoria
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Statistiche -->
                <div class="legal-stats-section">
                    <h3><i data-lucide="bar-chart"></i> Statistiche Documenti</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${athletes.length}</div>
                            <div class="stat-label">Atleti Totali</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.getDocumentsCount()}</div>
                            <div class="stat-label">Documenti Generati</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.getPendingCount()}</div>
                            <div class="stat-label">In Attesa Firma</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = html;
        Utils.initLucideIcons();
    }
    
    selectAthleteForDoc(docType) {
        // Pulizia UI: rimuovi overlay residui prima di mostrare il selector
        try {
            document.querySelectorAll('.nav-dropdown.active').forEach(d => d.classList.remove('active'));
            const modalOverlay = document.querySelector('.modal-overlay');
            if (modalOverlay && modalOverlay.parentElement) modalOverlay.parentElement.removeChild(modalOverlay);
            document.body.classList.remove('modal-open');
        } catch(e) { /* ignore */ }

        this.currentDocType = docType;
        const athletes = this.getAthletes();
        
        if (athletes.length === 0) {
            Utils.showToast('Nessun atleta disponibile', 'warning');
            return;
        }
        
        const docTitles = {
            registration: 'Modulo Iscrizione',
            privacy: 'Consenso Privacy',
            media: 'Liberatoria Foto/Video',
            medical: 'Certificato Medico'
        };
        
        const html = `
            <div class="athlete-selector-modal">
                <div class="modal-header">
                    <h3>Seleziona Atleta - ${docTitles[docType]}</h3>
                    <button onclick="legalDocs.showLegalDocsDashboard()" class="btn-icon">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="search-box">
                    <i data-lucide="search"></i>
                    <input type="text" id="athleteSearch" placeholder="Cerca atleta..." 
                           onkeyup="legalDocs.filterAthletes(this.value)">
                </div>
                
                <div class="athletes-list" id="athletesList">
                    ${athletes.map(athlete => `
                        <div class="athlete-item" data-name="${this._displayName(athlete).toLowerCase()}">
                            <div class="athlete-info">
                                <div class="athlete-avatar">${this._displayName(athlete).charAt(0) || '?'}</div>
                                <div>
                                    <h4>${this._displayName(athlete)}</h4>
                                    <p>${athlete.birthDate} • ${athlete.role}</p>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-glass primary" onclick="legalDocs.generateDocument('${athlete.id}')">
                                Seleziona
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = html;
        Utils.initLucideIcons();
    }
    
    filterAthletes(query) {
        const items = document.querySelectorAll('.athlete-item');
        const searchTerm = (query || '').toLowerCase();
        
        items.forEach(item => {
            const name = item.getAttribute('data-name') || '';
            item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
        });
    }
    
    generateDocument(athleteId) {
        const athletes = this.getAthletes();
        this.currentAthlete = athletes.find(a => a.id === athleteId);
        
        if (!this.currentAthlete) {
            Utils.showToast('Atleta non trovato', 'error');
            return;
        }
        
        // Show signature modal
        this.showSignatureModal();
    }
    
    showSignatureModal() {
        // Pulizia UI: assicurati che non ci siano overlay residui che bloccherebbero i click
        try {
            document.querySelectorAll('.nav-dropdown.active').forEach(d => d.classList.remove('active'));
            const modalOverlay = document.querySelector('.modal-overlay');
            if (modalOverlay && modalOverlay.parentElement) modalOverlay.parentElement.removeChild(modalOverlay);
            document.body.classList.remove('modal-open');
        } catch(e) { /* ignore */ }

        const docTitles = {
            registration: 'Modulo Iscrizione',
            privacy: 'Consenso Privacy GDPR',
            media: 'Liberatoria Foto/Video',
            medical: 'Promemoria Certificato Medico'
        };
        
        const docContent = this.getDocumentContent(this.currentDocType, this.currentAthlete);
        
        const html = `
            <div class="signature-modal">
                <div class="signature-container">
                    <div class="signature-header">
                        <h2>${docTitles[this.currentDocType]}</h2>
                        <button onclick="legalDocs.closeSignatureModal()" class="btn-icon">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    
                    <!-- Document Preview -->
                    <div class="document-preview">
                        <div class="doc-header">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24' fill='none' stroke='%231e40af' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 6v6l4 2'/%3E%3C/svg%3E" alt="Logo">
                            <div>
                                <h3>SoccerManager Pro</h3>
                                <p>Società Sportiva Dilettantistica</p>
                            </div>
                        </div>
                        
                        <div class="doc-content">
                            ${docContent}
                        </div>
                    </div>
                    
                    <!-- Signature Section -->
                    <div class="signature-section">
                        <h3><i data-lucide="pen-tool"></i> Firma Genitore/Tutore</h3>
                        <p class="signature-instructions">
                            Firma all'interno del riquadro sottostante utilizzando mouse o touchscreen
                        </p>
                        
                        <div class="signature-pad-container">
                            <canvas id="signatureCanvas" class="signature-canvas"></canvas>
                        </div>
                        
                        <div class="signature-actions">
                            <button class="btn btn-secondary" onclick="legalDocs.clearSignature()">
                                <i data-lucide="eraser"></i>
                                Cancella Firma
                            </button>
                            <button class="btn btn-primary" onclick="legalDocs.saveDocument()">
                                <i data-lucide="download"></i>
                                Salva PDF con Firma
                            </button>
                        </div>
                    </div>
                    
                    <div class="privacy-note">
                        <i data-lucide="info"></i>
                        <small>Il documento verrà salvato solo sul tuo dispositivo. Nessun dato viene trasmesso online.</small>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = html;
        Utils.initLucideIcons();
        
        // Initialize SignaturePad
        const canvas = document.getElementById('signatureCanvas');
        this.signaturePad = new SignaturePad(canvas);
    }
    
    getDocumentContent(type, athlete) {
        const today = new Date().toLocaleDateString('it-IT');
        
        switch(type) {
            case 'registration':
                return `
                    <h3>MODULO DI ISCRIZIONE</h3>
                    <p><strong>Anno Sportivo:</strong> ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</p>
                    
                    <h4>DATI ATLETA</h4>
                    <p><strong>Nome e Cognome:</strong> ${this._displayName(athlete)}</p>
                    <p><strong>Data di Nascita:</strong> ${athlete.birthDate}</p>
                    <p><strong>Ruolo:</strong> ${athlete.role}</p>
                    ${athlete.email ? `<p><strong>Email:</strong> ${athlete.email}</p>` : ''}
                    ${athlete.phone ? `<p><strong>Telefono:</strong> ${athlete.phone}</p>` : ''}
                    
                    <h4>DICHIARAZIONE</h4>
                    <p>Il sottoscritto genitore/tutore legale dichiara di iscrivere l'atleta sopra indicato 
                    alla Società Sportiva e di accettare integralmente lo Statuto Sociale e il Regolamento Interno.</p>
                    
                    <p>Dichiara inoltre che l'atleta è in possesso di certificato medico in corso di validità 
                    per attività sportiva agonistica/non agonistica.</p>
                    
                    <p><strong>Data:</strong> ${today}</p>
                `;
                
            case 'privacy':
                return `
                    <h3>CONSENSO AL TRATTAMENTO DEI DATI PERSONALI</h3>
                    <p><small>Ai sensi del Regolamento UE 2016/679 (GDPR)</small></p>
                    
                    <h4>DATI ATLETA</h4>
                    <p><strong>Nome e Cognome:</strong> ${this._displayName(athlete)}</p>
                    <p><strong>Data di Nascita:</strong> ${athlete.birthDate}</p>
                    
                    <h4>INFORMATIVA</h4>
                    <p>Il sottoscritto, in qualità di genitore/tutore legale, dichiara di aver ricevuto 
                    l'informativa ai sensi dell'art. 13 del Regolamento UE 2016/679 e</p>
                    
                    <p><strong>ACCONSENTE</strong></p>
                    <ul>
                        <li>Al trattamento dei dati personali dell'atleta per finalità amministrative e gestionali</li>
                        <li>All'utilizzo dei dati per comunicazioni relative all'attività sportiva</li>
                        <li>Alla conservazione dei dati per il periodo strettamente necessario</li>
                    </ul>
                    
                    <p><strong>NON ACCONSENTE</strong> (barrare se non si acconsente)</p>
                    <ul>
                        <li>☐ All'invio di comunicazioni promozionali</li>
                        <li>☐ Alla pubblicazione di foto/video sui canali social della società</li>
                    </ul>
                    
                    <p>Il consenso può essere revocato in qualsiasi momento.</p>
                    <p><strong>Data:</strong> ${today}</p>
                `;
                
            case 'media':
                return `
                    <h3>LIBERATORIA FOTO E VIDEO</h3>
                    
                    <h4>DATI ATLETA</h4>
                    <p><strong>Nome e Cognome:</strong> ${this._displayName(athlete)}</p>
                    <p><strong>Data di Nascita:</strong> ${athlete.birthDate}</p>
                    
                    <h4>AUTORIZZAZIONE</h4>
                    <p>Il sottoscritto genitore/tutore legale</p>
                    
                    <p><strong>AUTORIZZA</strong></p>
                    <p>La Società Sportiva a effettuare riprese fotografiche e video dell'atleta durante:</p>
                    <ul>
                        <li>Allenamenti e partite</li>
                        <li>Eventi e manifestazioni sportive</li>
                        <li>Attività promozionali della società</li>
                    </ul>
                    
                    <p><strong>CONSENTE</strong></p>
                    <p>La pubblicazione delle immagini sui seguenti canali:</p>
                    <ul>
                        <li>☑ Sito web ufficiale della società</li>
                        <li>☑ Pagine social (Facebook, Instagram, ecc.)</li>
                        <li>☑ Materiale promozionale (locandine, brochure)</li>
                        <li>☑ Comunicati stampa</li>
                    </ul>
                    
                    <p>Il materiale non sarà ceduto a terzi per finalità commerciali.</p>
                    <p>L'autorizzazione può essere revocata in qualsiasi momento.</p>
                    
                    <p><strong>Data:</strong> ${today}</p>
                `;
                
            case 'medical':
                return `
                    <h3>PROMEMORIA CERTIFICATO MEDICO SPORTIVO</h3>
                    
                    <h4>DATI ATLETA</h4>
                    <p><strong>Nome e Cognome:</strong> ${this._displayName(athlete)}</p>
                    <p><strong>Data di Nascita:</strong> ${athlete.birthDate}</p>
                    
                    <h4>DICHIARAZIONE</h4>
                    <p>Il sottoscritto genitore/tutore legale dichiara che l'atleta è in possesso di:</p>
                    
                    <p>☑ <strong>Certificato Medico per Attività Sportiva Non Agonistica</strong></p>
                    <p style="margin-left: 30px;">Valido fino al: _________________</p>
                    
                    <p>☑ <strong>Certificato Medico per Attività Sportiva Agonistica</strong></p>
                    <p style="margin-left: 30px;">Valido fino al: _________________</p>
                    
                    <h4>IMPEGNO</h4>
                    <p>Il sottoscritto si impegna a:</p>
                    <ul>
                        <li>Rinnovare il certificato alla scadenza</li>
                        <li>Comunicare tempestivamente eventuali problemi di salute</li>
                        <li>Non far partecipare l'atleta ad attività in assenza di certificato valido</li>
                    </ul>
                    
                    <p><strong>IMPORTANTE:</strong> La partecipazione alle attività sportive è subordinata 
                    al possesso di certificato medico in corso di validità.</p>
                    
                    <p><strong>Data:</strong> ${today}</p>
                `;
                
            default:
                return '<p>Documento non disponibile</p>';
        }
    }
    
    clearSignature() {
        if (this.signaturePad) {
            this.signaturePad.clear();
            Utils.showToast('Firma cancellata', 'info');
        }
    }
    
    closeSignatureModal() {
        // Pulizia UI: rimuovi overlay e reset stato prima di tornare alla dashboard
        try {
            const modalOverlay = document.querySelector('.modal-overlay');
            if (modalOverlay && modalOverlay.parentElement) modalOverlay.parentElement.removeChild(modalOverlay);
            document.body.classList.remove('modal-open');
            document.querySelectorAll('.nav-dropdown.active').forEach(d => d.classList.remove('active'));
        } catch(e) { /* ignore */ }

        this.currentAthlete = null;
        this.currentDocType = null;
        this.signaturePad = null;
        this.showLegalDocsDashboard();
    }
    
    async saveDocument() {
        if (!this.signaturePad || this.signaturePad.isEmpty()) {
            Utils.showToast('Aggiungi la firma prima di salvare', 'warning');
            return;
        }
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const docTitles = {
                registration: 'Modulo_Iscrizione',
                privacy: 'Consenso_Privacy',
                media: 'Liberatoria_Media',
                medical: 'Certificato_Medico'
            };
            
            // Header
            doc.setFontSize(20);
            doc.setTextColor(30, 64, 175);
            doc.text('SoccerManager Pro', 105, 20, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text('Società Sportiva Dilettantistica', 105, 28, { align: 'center' });
            
            // Document Title
            doc.setFontSize(16);
            doc.setTextColor(0);
            const title = this.getDocumentTitle(this.currentDocType);
            doc.text(title, 105, 45, { align: 'center' });
            
            // Content
            doc.setFontSize(10);
            const content = this.getDocumentTextContent(this.currentDocType, this.currentAthlete);
            const lines = doc.splitTextToSize(content, 170);
            doc.text(lines, 20, 60);
            
            // Signature
            const signatureData = this.signaturePad.toDataURL();
            doc.addImage(signatureData, 'PNG', 20, 230, 80, 30);
            
            doc.setFontSize(8);
            doc.text('Firma Genitore/Tutore Legale', 20, 265);
            doc.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, 20, 270);
            
            // Footer (shared)
            if (window.PDFUtils && typeof window.PDFUtils.addStandardFooter === 'function') {
                window.PDFUtils.addStandardFooter(doc);
            } else {
                doc.setFontSize(7);
                doc.setTextColor(150);
                doc.text('Documento generato da SoccerManager Pro - Privacy First', 105, 285, { align: 'center' });
            }
            
            // Save
            const safeNameForFile = (this._displayName(this.currentAthlete) || 'athlete').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');
            const filename = `${docTitles[this.currentDocType]}_${safeNameForFile}_${Date.now()}.pdf`;
            
            // Save to filesystem if available
            if (window.fileSystemManager && window.fileSystemManager.rootDirectoryHandle) {
                const pdfBlob = doc.output('blob');
                await fileSystemManager.saveFile(filename, pdfBlob, 'Documenti_Legali');
            } else {
                // Fallback to download
                doc.save(filename);
            }
            
            // Save record
            this.saveDocumentRecord(filename);
            
            Utils.showToast('Documento salvato con successo!', 'success');
            Utils.hapticFeedback('success');
            
            setTimeout(() => this.showLegalDocsDashboard(), 1500);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            Utils.showToast('Errore durante la generazione del PDF', 'error');
        }
    }
    
    getDocumentTitle(type) {
        const titles = {
            registration: 'MODULO DI ISCRIZIONE',
            privacy: 'CONSENSO AL TRATTAMENTO DATI PERSONALI',
            media: 'LIBERATORIA FOTO E VIDEO',
            medical: 'PROMEMORIA CERTIFICATO MEDICO SPORTIVO'
        };
        return titles[type] || 'DOCUMENTO';
    }
    
    getDocumentTextContent(type, athlete) {
        const today = new Date().toLocaleDateString('it-IT');
        
        switch(type) {
            case 'registration':
                return `Anno Sportivo: ${new Date().getFullYear()}/${new Date().getFullYear() + 1}\n\n` +
                    `DATI ATLETA\n` +
                    `Nome e Cognome: ${this._displayName(athlete)}\n` +
                    `Data di Nascita: ${athlete.birthDate}\n` +
                    `Ruolo: ${athlete.role}\n\n` +
                    `DICHIARAZIONE\n` +
                    `Il sottoscritto genitore/tutore legale dichiara di iscrivere l'atleta sopra indicato ` +
                    `alla Società Sportiva e di accettare integralmente lo Statuto Sociale e il Regolamento Interno.\n\n` +
                    `Dichiara inoltre che l'atleta è in possesso di certificato medico in corso di validità.\n\n` +
                    `Data: ${today}`;
                
            case 'privacy':
                return `Ai sensi del Regolamento UE 2016/679 (GDPR)\n\n` +
                    `DATI ATLETA\n` +
                    `Nome e Cognome: ${this._displayName(athlete)}\n` +
                    `Data di Nascita: ${athlete.birthDate}\n\n` +
                    `Il sottoscritto, in qualità di genitore/tutore legale, dichiara di aver ricevuto ` +
                    `l'informativa ai sensi dell'art. 13 del Regolamento UE 2016/679 e ACCONSENTE:\n\n` +
                    `- Al trattamento dei dati personali per finalità amministrative\n` +
                    `- All'utilizzo dei dati per comunicazioni sportive\n` +
                    `- Alla conservazione dei dati per il periodo necessario\n\n` +
                    `Il consenso può essere revocato in qualsiasi momento.\n\n` +
                    `Data: ${today}`;
                
            case 'media':
                return `DATI ATLETA\n` +
                    `Nome e Cognome: ${this._displayName(athlete)}\n` +
                    `Data di Nascita: ${athlete.birthDate}\n\n` +
                    `Il sottoscritto genitore/tutore legale AUTORIZZA la Società Sportiva a:\n\n` +
                    `- Effettuare riprese fotografiche e video durante allenamenti e partite\n` +
                    `- Pubblicare le immagini su sito web e social media\n` +
                    `- Utilizzare il materiale per finalità promozionali\n\n` +
                    `Il materiale non sarà ceduto a terzi per finalità commerciali.\n` +
                    `L'autorizzazione può essere revocata in qualsiasi momento.\n\n` +
                    `Data: ${today}`;
                
            case 'medical':
                return `DATI ATLETA\n` +
                    `Nome e Cognome: ${this._displayName(athlete)}\n` +
                    `Data di Nascita: ${athlete.birthDate}\n\n` +
                    `Il sottoscritto dichiara che l'atleta è in possesso di Certificato Medico ` +
                    `per Attività Sportiva in corso di validità.\n\n` +
                    `Si impegna a:\n` +
                    `- Rinnovare il certificato alla scadenza\n` +
                    `- Comunicare tempestivamente problemi di salute\n` +
                    `- Non far partecipare l'atleta senza certificato valido\n\n` +
                    `IMPORTANTE: La partecipazione alle attività è subordinata al possesso ` +
                    `di certificato medico valido.\n\n` +
                    `Data: ${today}`;
                
            default:
                return 'Documento non disponibile';
        }
    }
    
    saveDocumentRecord(filename) {
        const records = JSON.parse(localStorage.getItem('legalDocuments') || '[]');
        
        records.push({
            id: Date.now(),
            athleteId: this.currentAthlete.id,
            athleteName: this._displayName(this.currentAthlete),
            docType: this.currentDocType,
            filename: filename,
            date: new Date().toISOString(),
            signed: true
        });
        
        localStorage.setItem('legalDocuments', JSON.stringify(records));
    }
    
    getDocumentsCount() {
        const records = JSON.parse(localStorage.getItem('legalDocuments') || '[]');
        return records.length;
    }
    
    getPendingCount() {
        const athletes = this.getAthletes();
        const records = JSON.parse(localStorage.getItem('legalDocuments') || '[]');
        const athletesWithDocs = new Set(records.map(r => r.athleteId));
        return athletes.length - athletesWithDocs.size;
    }
}

// Esporta la classe per usi esterni e fallback
window.LegalDocManager = LegalDocManager;

// Global instance (creata ora)
const legalDocs = new LegalDocManager();
window.legalDocs = legalDocs;

// Wrapper sicuro: usa l'istanza esistente o la crea al volo
window.showLegalDocsDashboard = function() {
    if (!window.legalDocs) {
        window.legalDocs = new window.LegalDocManager();
    }
    if (typeof window.legalDocs.showLegalDocsDashboard === 'function') {
        try { window.legalDocs.showLegalDocsDashboard(); }
        catch (e) { console.error('Errore showLegalDocsDashboard:', e); UI.showToast('Errore apertura Documenti Legali', 'error'); }
    } else {
        UI.showToast('Modulo Documenti Legali non disponibile', 'warning');
    }
};

// Alias per compatibilità
window.openLegalDocs = window.showLegalDocsDashboard;
