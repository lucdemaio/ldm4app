/**
 * ONBOARDING.JS
 * Modulo Tutorial di Benvenuto (Primo Avvio)
 * Carosello interattivo con slide guidate
 */

const OnboardingModule = {
    currentSlide: 0,
    totalSlides: 4,

    slides: [
        {
            icon: 'sparkles',
            title: 'Benvenuto in SoccerManager Pro!',
            description: 'La soluzione di ldm4app per gestire la tua società sportiva in totale privacy.',
            color: '#3b82f6'
        },
        {
            icon: 'shield',
            title: 'Inizia dalle Squadre',
            description: 'Crea le tue categorie per attivare l\'aggiornamento automatico dell\'età e delle categorie ogni anno.',
            color: '#22c55e'
        },
        {
            icon: 'heart-pulse',
            title: 'Salute e Pagamenti',
            description: 'Monitora le icone 🚑 per gli infortuni e il colore delle scadenze mediche direttamente dalla Dashboard.',
            color: '#f59e0b'
        },
        {
            icon: 'database',
            title: 'I tuoi dati sono tuoi',
            description: 'Ricorda di esportare il file JSON settimanalmente. Essendo un\'app offline, il backup è sotto la tua responsabilità.',
            color: '#ef4444'
        }
    ],

    /**
     * Verifica se mostrare onboarding al primo avvio
     */
    init() {
        const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
        
        if (!hasCompletedOnboarding) {
            setTimeout(() => {
                this.show();
            }, 1000); // Attendi 1 secondo dopo il caricamento
        }
    },

    /**
     * Mostra onboarding manuale (da impostazioni)
     */
    show() {
        this.currentSlide = 0;
        this.render();
    },

    /**
     * Renderizza il carosello onboarding
     */
    render() {
        const slide = this.slides[this.currentSlide];
        
        const content = `
            <div class="onboarding-container">
                <!-- Progress Indicator -->
                <div class="onboarding-progress">
                    ${this.slides.map((_, index) => `
                        <div class="progress-dot ${index === this.currentSlide ? 'active' : ''} ${index < this.currentSlide ? 'completed' : ''}"></div>
                    `).join('')}
                </div>

                <!-- Slide Content -->
                <div class="onboarding-slide" style="animation: slideIn 0.4s ease-out;">
                    <div class="slide-icon" style="background: ${slide.color};">
                        <i data-lucide="${slide.icon}"></i>
                    </div>
                    
                    <h2 class="slide-title">${slide.title}</h2>
                    <p class="slide-description">${slide.description}</p>

                    ${this.currentSlide === 0 ? `
                        <div class="welcome-badge">
                            <i data-lucide="check-circle"></i>
                            <span>100% Offline · Privacy Garantita</span>
                        </div>
                    ` : ''}

                    ${this.currentSlide === 3 ? `
                        <div class="backup-reminder">
                            <i data-lucide="alert-triangle"></i>
                            <strong>Importante:</strong> Nessun cloud, nessun abbonamento. I tuoi dati restano sul tuo dispositivo.
                        </div>
                    ` : ''}
                </div>

                <!-- Navigation -->
                <div class="onboarding-navigation">
                    ${this.currentSlide > 0 ? `
                        <button class="btn btn-outline" onclick="OnboardingModule.previousSlide()">
                            <i data-lucide="chevron-left"></i>
                            Indietro
                        </button>
                    ` : '<div></div>'}

                    ${this.currentSlide < this.totalSlides - 1 ? `
                        <button class="btn btn-primary" onclick="OnboardingModule.nextSlide()">
                            Avanti
                            <i data-lucide="chevron-right"></i>
                        </button>
                    ` : `
                        <button class="btn btn-success" onclick="OnboardingModule.complete()">
                            <i data-lucide="check"></i>
                            Inizia Subito
                        </button>
                    `}
                </div>

                <!-- Skip Button -->
                ${this.currentSlide < this.totalSlides - 1 ? `
                    <button class="onboarding-skip" onclick="OnboardingModule.complete()">
                        Salta Tutorial
                    </button>
                ` : ''}
            </div>
        `;

        UI.showModal('', content, 'medium');
        
        // Nascondi il pulsante di chiusura standard del modal
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.style.display = 'none';
        }

        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 50);
    },

    /**
     * Slide successiva
     */
    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.currentSlide++;
            this.render();
        }
    },

    /**
     * Slide precedente
     */
    previousSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.render();
        }
    },

    /**
     * Completa onboarding
     */
    complete() {
        localStorage.setItem('onboarding_completed', 'true');
        localStorage.setItem('onboarding_completed_date', new Date().toISOString());
        
        UI.closeModal();
        
        // Messaggio di benvenuto
        setTimeout(() => {
            UI.showToast('🎉 Benvenuto in SoccerManager Pro! Inizia creando la tua prima squadra.', 'success');
        }, 300);
    },

    /**
     * Reset onboarding (da impostazioni)
     */
    reset() {
        localStorage.removeItem('onboarding_completed');
        localStorage.removeItem('onboarding_completed_date');
        this.show();
    }
};

// Animazione CSS per slide
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);
// Esponi il modulo globalmente per gli handler inline
window.OnboardingModule = OnboardingModule;
