/**
 * TOOLTIPS.JS
 * Sistema Tooltips Riutilizzabile
 * Suggerimenti contestuali per funzioni complesse
 */

const TooltipManager = {
    tooltips: {
        'evaluations': {
            title: 'Valutazioni Tecniche',
            text: 'Assegna voti da 1 a 10 per monitorare le prestazioni degli atleti. L\'app calcola automaticamente le medie e può suggerire la formazione migliore.',
            icon: 'star'
        },
        'import-json': {
            title: 'Importa Dati JSON',
            text: 'ATTENZIONE: Questa operazione sostituirà TUTTI i dati attuali. Assicurati di aver fatto un backup prima di procedere.',
            icon: 'alert-triangle'
        },
        'export-json': {
            title: 'Esporta Dati',
            text: 'Salva tutti i tuoi dati in un file JSON. Consigliamo di fare backup settimanali e conservare il file in un luogo sicuro.',
            icon: 'download'
        },
        'medical-certificate': {
            title: 'Certificato Medico',
            text: 'Monitora le scadenze dei certificati medici. L\'app ti avviserà 30 giorni prima della scadenza.',
            icon: 'heart-pulse'
        },
        'payment-credits': {
            title: 'Crediti Residui',
            text: 'Calcolo automatico: Quota Annuale - Somma Pagamenti Ricevuti = Credito Residuo',
            icon: 'calculator'
        },
        'matchday-lineup': {
            title: 'Formazione Automatica',
            text: 'L\'app analizza le medie delle valutazioni tecniche e suggerisce i migliori 11 atleti in base al modulo selezionato.',
            icon: 'users'
        },
        'file-system-api': {
            title: 'Salvataggio Permanente',
            text: 'Attiva il File System Access per salvare automaticamente i PDF in una cartella dedicata sul tuo computer. I file saranno sempre accessibili.',
            icon: 'folder-open'
        },
        'scouting': {
            title: 'Scouting Esterni',
            text: 'Monitora atleti esterni senza aggiungerli alla rosa ufficiale. Puoi assegnare valutazioni e inserirli in una watchlist.',
            icon: 'target'
        },
        'season-archive': {
            title: 'Archivia Stagione',
            text: 'Crea uno snapshot completo dei dati della stagione corrente. Potrai consultare le statistiche storiche senza appesantire il database attivo.',
            icon: 'archive'
        },
        'logistics': {
            title: 'Logistica Trasferte',
            text: 'Assegna gli atleti ai veicoli disponibili (auto/bus) per organizzare le trasferte. Calcolo automatico dei posti disponibili.',
            icon: 'bus'
        },
        'fiscal-manager': {
            title: 'Gestione Fiscale',
            text: 'Registra ricevute, gestisci collaboratori e tieni traccia della prima nota contabile per la tua società.',
            icon: 'receipt'
        }
    },

    activeTooltip: null,

    /**
     * Crea tooltip button
     */
    createButton(tooltipId) {
        return `
            <button class="tooltip-trigger" 
                    data-tooltip-id="${tooltipId}"
                    onclick="TooltipManager.show('${tooltipId}', event)"
                    aria-label="Aiuto">
                <i data-lucide="help-circle"></i>
            </button>
        `;
    },

    /**
     * Mostra tooltip
     */
    show(tooltipId, event) {
        event?.stopPropagation();
        
        const tooltip = this.tooltips[tooltipId];
        if (!tooltip) return;

        // Chiudi tooltip precedente se aperto
        this.hide();

        const trigger = event?.currentTarget || document.querySelector(`[data-tooltip-id="${tooltipId}"]`);
        if (!trigger) return;

        // Crea tooltip element
        const tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip-popup';
        tooltipEl.innerHTML = `
            <div class="tooltip-header">
                <i data-lucide="${tooltip.icon}"></i>
                <strong>${tooltip.title}</strong>
                <button class="tooltip-close" onclick="TooltipManager.hide()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="tooltip-body">
                ${tooltip.text}
            </div>
        `;

        document.body.appendChild(tooltipEl);

        // Posiziona tooltip
        setTimeout(() => {
            const rect = trigger.getBoundingClientRect();
            const tooltipRect = tooltipEl.getBoundingClientRect();

            let top = rect.bottom + 8;
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

            // Controllo bordi schermo
            if (left < 8) left = 8;
            if (left + tooltipRect.width > window.innerWidth - 8) {
                left = window.innerWidth - tooltipRect.width - 8;
            }

            // Se esce dal bottom, mostra sopra
            if (top + tooltipRect.height > window.innerHeight - 8) {
                top = rect.top - tooltipRect.height - 8;
            }

            tooltipEl.style.top = `${top}px`;
            tooltipEl.style.left = `${left}px`;
            tooltipEl.classList.add('show');

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 10);

        this.activeTooltip = tooltipEl;

        // Chiudi al click fuori
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick);
        }, 100);
    },

    /**
     * Nascondi tooltip
     */
    hide() {
        if (this.activeTooltip) {
            this.activeTooltip.classList.remove('show');
            setTimeout(() => {
                this.activeTooltip?.remove();
                this.activeTooltip = null;
            }, 200);
            document.removeEventListener('click', this.handleOutsideClick);
        }
    },

    /**
     * Gestisci click fuori dal tooltip
     */
    handleOutsideClick(e) {
        if (!e.target.closest('.tooltip-popup') && !e.target.closest('.tooltip-trigger')) {
            TooltipManager.hide();
        }
    },

    /**
     * Inizializza tutti i tooltip nella pagina
     */
    initAll() {
        // I tooltip vengono creati dinamicamente quando servono
        console.log('✅ Tooltip Manager inizializzato');
    }
};
