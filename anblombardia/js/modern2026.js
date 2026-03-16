/**
 * MODERN ANB 2026 - JavaScript Dynamic Effects
 * Effetti animati, particelle, interazioni e logica moderna
 */

// ============================================================================
// PARTICELLE ANIMATE
// ============================================================================

function createParticles() {
  const particlesContainer = document.getElementById('particles');
  const particleCount = window.innerWidth > 1024 ? 40 : 20;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 4 + 1;
    const left = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = left + '%';
    particle.style.bottom = '-10px';
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = delay + 's';
    
    particlesContainer.appendChild(particle);
  }
}

// ============================================================================
// RESIZE IFRAME BASE SUL CONTENUTO
// ============================================================================

function resizeIframe(iframe) {
  try {
    iframe.style.height = iframe.contentWindow.document.documentElement.scrollHeight + 'px';
    
    // Aggiungi un observer per cambamenti dinamici
    const observer = new MutationObserver(() => {
      iframe.style.height = iframe.contentWindow.document.documentElement.scrollHeight + 'px';
    });
    
    observer.observe(iframe.contentWindow.document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  } catch (e) {
    // Fallback per cross-origin iframes
    iframe.style.height = '1200px';
  }
}

// ============================================================================
// EFFETTO SCROLL PARALLAX
// ============================================================================

let scrolled = 0;

window.addEventListener('scroll', () => {
  scrolled = window.pageYOffset;
  
  // Parallax effect sul header
  const header = document.querySelector('.header-container');
  if (header) {
    header.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
  
  // Effetto di cambiamento colore su scroll
  const navbar = document.querySelector('.navbar');
  if (scrolled > 100) {
    navbar.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.8)';
    navbar.style.backdropFilter = 'blur(20px)';
  } else {
    navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
    navbar.style.backdropFilter = 'blur(15px)';
  }
});

// ============================================================================
// MENU MOBILE TOGGLE
// ============================================================================

function toggleMobileMenu() {
  const navContainer = document.getElementById('navContainer');
  
  if (navContainer.classList.contains('mobile-expanded')) {
    navContainer.classList.remove('mobile-expanded');
  } else {
    navContainer.classList.add('mobile-expanded');
  }
}

// Gestione click su dropdown items per chiudere il menu
document.addEventListener('click', (e) => {
  const dropdowns = document.querySelectorAll('.dropdown');
  
  dropdowns.forEach(dropdown => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
});

// ============================================================================
// DROPDOWN MENU ENHANCEMENT
// ============================================================================

document.querySelectorAll('.dropdown').forEach(dropdown => {
  const trigger = dropdown.querySelector('.nav-link');
  
  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Chiudi altri dropdown
      document.querySelectorAll('.dropdown').forEach(otherDropdown => {
        if (otherDropdown !== dropdown) {
          otherDropdown.classList.remove('active');
        }
      });
      
      // Toggle questo dropdown
      dropdown.classList.toggle('active');
    });
  }
});

// ============================================================================
// EFFETTO SCROLL SMOOTH
// ============================================================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#') {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  });
});

// ============================================================================
// EFFETTO HOVER LUMINOSO SUI NAV ITEMS
// ============================================================================

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('mouseenter', function(e) {
    // Crea effetto di glow
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Aggiungi classe di animazione
    this.style.setProperty('--hover-x', x + 'px');
    this.style.setProperty('--hover-y', y + 'px');
  });
});

// ============================================================================
// ANIMAZIONE NUMERI (Se presenti nel contenuto)
// ============================================================================

function animateNumbers() {
  const numbers = document.querySelectorAll('[data-value]');
  
  numbers.forEach(number => {
    const value = parseInt(number.getAttribute('data-value'));
    const duration = 2000;
    const start = 0;
    const range = value - start;
    const current = { value: start };
    
    const timer = setInterval(() => {
      current.value += range / (duration / 16);
      if (current.value >= value) {
        current.value = value;
        clearInterval(timer);
      }
      number.textContent = Math.floor(current.value);
    }, 16);
  });
}

// ============================================================================
// EFFETTO APPARIZIONE SU SCROLL (Intersection Observer)
// ============================================================================

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Osserva elementi con classe 'observe-me'
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.observe-me').forEach(el => {
    observer.observe(el);
  });
});

// ============================================================================
// EFFETTO CURSORE PERSONALIZZATO
// ============================================================================

const cursor = document.createElement('div');
cursor.style.cssText = `
  position: fixed;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(220, 38, 38, 0.5);
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  display: none;
  transition: all 0.1s ease;
`;

document.body.appendChild(cursor);

let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.display = 'block';
  cursor.style.left = (mouseX - 10) + 'px';
  cursor.style.top = (mouseY - 10) + 'px';
});

document.addEventListener('mouseleave', () => {
  cursor.style.display = 'none';
});

// ============================================================================
// ACTIVE NAV STATE MANAGER
// ============================================================================

function updateActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index_new_2026.html';
  
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) {
      link.classList.add('active-nav');
    } else {
      link.classList.remove('active-nav');
    }
  });
}

// ============================================================================
// SCROLL REVEAL ANIMATION
// ============================================================================

function revealOnScroll() {
  const reveals = document.querySelectorAll('.reveal');
  
  reveals.forEach(el => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;
    const revealPoint = 150;
    
    if (elementTop < windowHeight - revealPoint) {
      el.classList.add('active');
    }
  });
}

window.addEventListener('scroll', revealOnScroll);

// ============================================================================
// PERFORMANCE OPTIMIZATION
// ============================================================================

// Implementa lazy loading per le immagini
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

// ============================================================================
// NETWORK STATUS INDICATOR
// ============================================================================

window.addEventListener('online', () => {
  console.log('✓ Connessione ripristinata');
});

window.addEventListener('offline', () => {
  console.log('✗ Connessione persa');
});

// ============================================================================
// THEME DETECTION (Dark/Light)
// ============================================================================

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function handleThemeChange(e) {
  if (e.matches) {
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.style.colorScheme = 'light';
  }
}

prefersDark.addListener(handleThemeChange);
handleThemeChange(prefersDark);

// ============================================================================
// AUDIO FEEDBACK (Opzionale)
// ============================================================================

function playClickSound() {
  // Se desideri aggiungere suoni, implementa qui
  // const audio = new Audio('path/to/sound.mp3');
  // audio.play();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Crea particelle
  createParticles();
  
  // Aggiorna nav attivo
  updateActiveNav();
  
  // Anima numeri se presenti
  setTimeout(animateNumbers, 500);
  
  // Aggiungi event listener ai link per il suono
  document.querySelectorAll('a, button').forEach(element => {
    element.addEventListener('click', playClickSound);
  });
  
  console.log('✓ ANB 2026 Modern Interface - Loaded Successfully');
});

// ============================================================================
// WINDOW RESIZE HANDLER
// ============================================================================

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Ricrea particelle su resize
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
      particlesContainer.innerHTML = '';
      createParticles();
    }
  }, 250);
});

// ============================================================================
// SERVICE WORKER (Optional - Per Progressive Web App)
// ============================================================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Uncomment per una PWA completa
    // navigator.serviceWorker.register('sw.js').then(reg => {
    //   console.log('✓ Service Worker registrato');
    // });
  });
}

// ============================================================================
// CUSTOM CONSOLE MESSAGE
// ============================================================================

console.log('%c 🎖️  ANB REGIONE LOMBARDIA - 2026 ', 'background: #dc2626; color: #fff; font-size: 16px; padding: 10px; border-radius: 5px;');
console.log('%c Versione Moderna con Effetti Dinamici', 'color: #a7f3d0; font-size: 12px; font-weight: bold;');
