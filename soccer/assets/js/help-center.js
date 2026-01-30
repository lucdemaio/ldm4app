/**
 * HELP-CENTER.JS
 * Centro Assistenza con FAQ Accordion
 * Supporto e guide rapide
 */

const HelpCenterModule = {
    faqs: [
        {
            id: 'faq-1',
            question: 'Posso usare l\'app su più dispositivi?',
            answer: 'Sì, ma devi esportare il file JSON dal primo dispositivo e importarlo sul secondo. I dati non si sincronizzano via cloud per garantire la tua privacy.',
            category: 'generale',
            icon: 'smartphone'
        },
        {
            id: 'faq-2',
            question: 'Come si calcolano i crediti residui?',
            answer: 'L\'app sottrae i pagamenti registrati dalla quota annuale impostata nella scheda atleta. Puoi visualizzare il riepilogo completo nella sezione "Gestione Pagamenti".',
            category: 'pagamenti',
            icon: 'euro'
        },
        {
            id: 'faq-3',
            question: 'Cosa succede se perdo il telefono?',
            answer: 'Se hai salvato il file di export (JSON) su un computer o una chiavetta, puoi recuperare tutto in un istante. Ti consigliamo di fare backup settimanali usando la funzione "Esporta Dati".',
            category: 'backup',
            icon: 'shield-alert'
        },
        {
            id: 'faq-4',
            question: 'Come funzionano le scadenze dei certificati medici?',
            answer: 'L\'app mostra un\'icona colorata accanto ad ogni atleta: verde (valido), giallo (scade tra 30 giorni), rosso (scaduto). Puoi impostare la data di scadenza nella scheda atleta.',
            category: 'certificati',
            icon: 'heart-pulse'
        },
        {
            id: 'faq-5',
            question: 'Come importare dati da un file JSON?',
            answer: 'Vai su Impostazioni → Importa Dati, seleziona il file JSON precedentemente esportato. ATTENZIONE: Questa operazione sovrascriverà tutti i dati attuali. Fai sempre un backup prima di importare.',
            category: 'backup',
            icon: 'upload'
        },
        {
            id: 'faq-6',
            question: 'Cosa sono le valutazioni tecniche?',
            answer: 'Le valutazioni tecniche permettono di assegnare un punteggio (1-10) alle prestazioni degli atleti durante allenamenti e partite. L\'app calcola automaticamente le medie e può suggerire la formazione migliore.',
            category: 'valutazioni',
            icon: 'star'
        },
        {
            id: 'faq-7',
            question: 'Come creare una distinta per una partita?',
            answer: 'Vai su Calendario, seleziona l\'evento partita, clicca su "MatchDay". Potrai convocare gli atleti disponibili, definire la formazione e visualizzare la distinta completa da stampare o esportare in PDF.',
            category: 'partite',
            icon: 'clipboard-list'
        },
        {
            id: 'faq-8',
            question: 'L\'app funziona offline?',
            answer: 'Sì, SoccerManager Pro è completamente offline. Non richiede connessione internet e non invia dati a server esterni. Tutti i tuoi dati rimangono sul dispositivo in totale privacy.',
            category: 'generale',
            icon: 'wifi-off'
        }
    ],

    categories: [
        { id: 'generale', name: 'Generale', icon: 'info' },
        { id: 'pagamenti', name: 'Pagamenti', icon: 'euro' },
        { id: 'certificati', name: 'Certificati Medici', icon: 'heart-pulse' },
        { id: 'backup', name: 'Backup e Import', icon: 'database' },
        { id: 'valutazioni', name: 'Valutazioni', icon: 'star' },
        { id: 'partite', name: 'Partite e Distinte', icon: 'shield' }
    ],

    activeCategory: 'all',
    expandedFaqId: null,

    /**
     * Inizializzazione
     */
    init() {
        console.log('✅ Help Center inizializzato');
    },

    /**
     * Mostra Help Center
     */
    show() {
        // Nascondi tutte le altre sezioni
        document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
        
        // Mostra la view del help center
        const helpCenterView = document.getElementById('help-center-view');
        if (helpCenterView) {
            helpCenterView.classList.add('active');
        }
        
        // Chiudi la sidebar
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
        
        this.render();
    },

    /**
     * Renderizza Help Center
     */
    render() {
        const container = document.getElementById('help-center-view');
        if (!container) return;

        const filteredFaqs = this.activeCategory === 'all' 
            ? this.faqs 
            : this.faqs.filter(faq => faq.category === this.activeCategory);

        container.innerHTML = `
            <div class="help-center-container">
                <!-- Header -->
                <div class="help-header">
                    <div class="help-header-content">
                        <div class="help-icon">
                            <i data-lucide="life-buoy"></i>
                        </div>
                        <div>
                            <h2 data-i18n="Centro Assistenza">Centro Assistenza</h2>
                            <p data-i18n="Trova risposte alle domande più frequenti">Trova risposte alle domande più frequenti</p>
                        </div>
                    </div>
                </div>

                <!-- Language selector removed: fixed app language -->

                <!-- Quick Actions -->
                <div class="help-quick-actions">
                    <button class="quick-action-card" onclick="OnboardingModule.show()">
                        <i data-lucide="play-circle"></i>
                        <span data-i18n="Rivedi Tutorial">Rivedi Tutorial</span>
                    </button>
                    <!-- Contatto via email rimosso da Centro Assistenza per rispettare le impostazioni privacy -->
                </div>
                <!-- language change disabled -->

                <!-- Category Filter -->
                <div class="help-categories">
                    <button class="category-chip ${this.activeCategory === 'all' ? 'active' : ''}" 
                            onclick="HelpCenterModule.filterByCategory('all')">
                        <i data-lucide="grid-3x3"></i>
                        <span data-i18n="Tutte">Tutte</span>
                    </button>
                    ${this.categories.map(cat => `
                        <button class="category-chip ${this.activeCategory === cat.id ? 'active' : ''}" 
                                onclick="HelpCenterModule.filterByCategory('${cat.id}')">
                            <i data-lucide="${cat.icon}"></i>
                            <span data-i18n="${cat.name}">${cat.name}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- FAQ Accordion -->
                <div class="faq-accordion">
                    ${filteredFaqs.map(faq => `
                        <div class="faq-item ${this.expandedFaqId === faq.id ? 'expanded' : ''}" 
                             data-faq-id="${faq.id}"
                             onclick="HelpCenterModule.toggleFaq('${faq.id}')">
                            <div class="faq-question">
                                <div class="faq-question-content">
                                    <i data-lucide="${faq.icon}"></i>
                                    <span data-i18n="${faq.question}">${faq.question}</span>
                                </div>
                                <i data-lucide="chevron-down" class="faq-chevron"></i>
                            </div>
                            <div class="faq-answer">
                                <p data-i18n="${faq.answer}">${faq.answer}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>


                <!-- Footer Info -->
                <div class="help-footer">
                    <p><i data-lucide="shield-check"></i> I tuoi dati sono al sicuro - 100% offline e privato</p>
                    <p class="version-info">LDM Soccer Manager v1.0.0 — Creato da www.ldm4app.com</p>
                </div>
            </div>
        `;

        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 50);
    },

    /**
     * Filtra FAQ per categoria
     */
    filterByCategory(categoryId) {
        this.activeCategory = categoryId;
        this.expandedFaqId = null;
        this.render();
    },

    /**
     * Toggle FAQ accordion
     */
    toggleFaq(faqId) {
        const faqItem = document.querySelector(`.faq-item[data-faq-id="${faqId}"]`);
        if (!faqItem) return;
        
        // Chiudi tutte le altre FAQ
        document.querySelectorAll('.faq-item.expanded').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('expanded');
            }
        });
        
        // Toggle la FAQ corrente
        faqItem.classList.toggle('expanded');
        this.expandedFaqId = faqItem.classList.contains('expanded') ? faqId : null;
        
        // Ricrea icone Lucide
        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 50);
    },

    /**
     * Mostra guide video (placeholder)
     */
    showVideoGuides() {
        UI.showModal('Guide Video', `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🎥</div>
                <h3>Guide Video in Arrivo</h3>
                <p style="color: var(--color-gray-600); margin: 1rem 0;">
                    Stiamo preparando una serie di video tutorial per aiutarti a sfruttare al meglio SoccerManager Pro.
                </p>
                <p style="color: var(--color-gray-500); font-size: 0.875rem;">
                    Riceverai una notifica quando saranno disponibili.
                </p>
            </div>
        `);
        setTimeout(() => lucide.createIcons(), 50);
    },

    /**
     * Contatta assistenza
     */
    contactSupport() {
        UI.showModal('Assistenza disabilitata', `
            <div style="padding:1rem;">
                <p>La possibilità di contattare il supporto via e-mail è stata disabilitata in questa distribuzione.</p>
                <p>Consulta le FAQ nel Centro Assistenza o visita: <a href="https://www.ldm4app.com" target="_blank">ldm4app.com</a></p>
            </div>
        `);
    }
};

// Esponi il modulo globalmente
window.HelpCenterModule = HelpCenterModule;
