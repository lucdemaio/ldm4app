/**
 * AnimationsManager 2026 - Effetti moderni e microinterazioni
 */
class AnimationsManager {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // TUTTE LE ANIMAZIONI DISABILITATE PER RISOLVERE BUG
    // this.createParticleEffects();
    // this.addScrollAnimations();
    // this.addButtonRipples();
    // this.addTransitionMagic();
    this.initialized = true;
  }

  /**
   * Crea effetti particella su click
   */
  createParticleEffects() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) {
        this.createClickParticles(e.pageX, e.pageY);
      }
    });
  }

  createClickParticles(x, y) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 8px;
        height: 8px;
        background: radial-gradient(circle, #6366f1, #a78bfa);
        border-radius: 50%;
        pointer-events: none;
        animation: particleFloat 0.8s ease-out forwards;
        z-index: 9999;
      `;
      
      document.body.appendChild(particle);
      
      setTimeout(() => particle.remove(), 800);
    }
  }

  /**
   * Aggiungi animazioni scroll
   */
  addScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'slideInCard 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forward';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card').forEach(card => {
      observer.observe(card);
    });
  }

  /**
   * Aggiungi effetto ripple ai bottoni
   */
  addButtonRipples() {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          left: ${x}px;
          top: ${y}px;
          animation: rippleEffect 0.6s ease-out;
          pointer-events: none;
        `;

        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  /**
   * Effetto transizione magica tra pagine
   */
  addTransitionMagic() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.page, .card, .stat-box').forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * Aggiungi effetto hover 3D ai card
   */
  enable3DCardHover() {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const xRotation = ((y / rect.height) - 0.5) * 10;
        const yRotation = ((x / rect.width) - 0.5) * -10;

        card.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) translateZ(0)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  }

  /**
   * Aggiungi contatore numeri animati
   */
  animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      const duration = 2000;
      const increment = target / (duration / 16);
      
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current);
        }
      }, 16);
    });
  }

  /**
   * Effetto confetti
   */
  triggerConfetti(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    const confettiPieces = 50;
    for (let i = 0; i < confettiPieces; i++) {
      const confetti = document.createElement('div');
      const emoji = ['🎉', '✨', '🎊', '⭐', '🌟', '💫', '🎈'][Math.floor(Math.random() * 7)];
      
      confetti.textContent = emoji;
      confetti.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        font-size: ${Math.random() * 20 + 10}px;
        pointer-events: none;
        animation: confettiFall ${Math.random() * 2 + 2}s ease-in forwards;
        z-index: 9999;
      `;

      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 4000);
    }
  }

  /**
   * Toast notifiche animate
   */
  showAnimatedToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = {
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      info: '#6366f1'
    }[type];

    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      animation: toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 10000;
      max-width: 300px;
      font-weight: 500;
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.4s ease-out forwards';
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }

  /**
   * Drag & Drop con animazioni
   */
  enableDragDrop() {
    let draggedElement = null;

    document.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('draggable')) {
        draggedElement = e.target;
        e.target.style.opacity = '0.5';
        e.target.style.transform = 'scale(0.95)';
      }
    });

    document.addEventListener('dragend', (e) => {
      if (draggedElement) {
        draggedElement.style.opacity = '1';
        draggedElement.style.transform = 'scale(1)';
        draggedElement = null;
      }
    });
  }

  /**
   * Effetto typing per testi
   */
  typeText(element, text, speed = 50) {
    element.textContent = '';
    let index = 0;

    const type = () => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      }
    };

    type();
  }

  /**
   * Pulse di attenzione su elemento
   */
  pulseAttention(element, duration = 2000) {
    element.style.animation = `attentionPulse ${duration / 1000}s ease-in-out`;
    setTimeout(() => {
      element.style.animation = 'none';
    }, duration);
  }

  /**
   * Aggiunta style per animazioni
   */
  injectAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes particleFloat {
        to {
          transform: translate(var(--tx), var(--ty)) scale(0);
          opacity: 0;
        }
      }

      @keyframes rippleEffect {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      @keyframes confettiFall {
        to {
          transform: translateY(600px) rotate(360deg);
          opacity: 0;
        }
      }

      @keyframes toastSlideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes toastSlideOut {
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      @keyframes attentionPulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
        }
      }

      .visible {
        opacity: 1;
      }

      .draggable {
        cursor: grab;
      }

      .draggable:active {
        cursor: grabbing;
      }
    `;
    document.head.appendChild(style);
  }
}

// Istanza globale e inizializzazione
const animationsManager = new AnimationsManager();

// Inizializza quando DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  // TUTTE LE ANIMAZIONI DISABILITATE
  // animationsManager.injectAnimationStyles();
  // animationsManager.init();
  // animationsManager.enable3DCardHover();
  // animationsManager.animateCounters();
});

// Export per uso globale
window.AnimationsManager = AnimationsManager;
