// Smooth Scroll for navigation
document.querySelectorAll('a[href*="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Parallax effect
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    const particles = document.querySelector('.particles');
    const scrollPosition = window.pageYOffset;
    
    if (hero) {
        particles.style.transform = `translateY(${scrollPosition * 0.5}px)`;
    }
});

// Animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.about-card, .feature-item, .timeline-item, .stat-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});

// Counter animation for stats
function animateCounters() {
    const stats = document.querySelectorAll('.stat-number');
    
    stats.forEach(stat => {
        const target = parseInt(stat.textContent.replace(/\D/g, ''));
        const isThousand = stat.textContent.includes('K');
        let current = 0;
        const increment = target / 30;
        
        const updateCount = () => {
            current += increment;
            if (current < target) {
                if (isThousand) {
                    stat.textContent = (current / 1000).toFixed(0) + 'K+';
                } else {
                    stat.textContent = Math.floor(current);
                }
                requestAnimationFrame(updateCount);
            } else {
                stat.textContent = isThousand ? target / 1000 + 'K+' : target;
            }
        };
        
        updateCount();
    });
}

// Trigger counter animation when section is in view
const statsSection = document.querySelector('.stats');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                statsObserver.disconnect();
            }
        });
    }, { threshold: 0.5 });
    
    statsObserver.observe(statsSection);
}

// CTA Button animation
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
    ctaButton.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        const rect = ctaButton.getBoundingClientRect();
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
            pointer-events: none;
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
        `;
        
        ctaButton.style.position = 'relative';
        ctaButton.style.overflow = 'hidden';
        ctaButton.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
}

// Add ripple animation to styles if not present
if (!document.querySelector('style[data-ripple]')) {
    const style = document.createElement('style');
    style.setAttribute('data-ripple', 'true');
    style.textContent = `
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Mobile menu toggle (for future expansion)
function setupMobileMenu() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.2)';
            } else {
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            }
        });
    }
}

// ===== ADVANCED BUTTON INTERACTIONS =====
// Button ripple effect on all buttons
function addRippleEffectToButtons() {
    const buttons = document.querySelectorAll('button, .btn-primary, .btn-secondary, .cta-button, a[href*="pages"]');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Skip if this is a link that opens in a new page
            if (e instanceof MouseEvent && this.tagName === 'A' && !e.ctrlKey && !e.metaKey) {
                // Create ripple effect for link clicks too
                createRippleEffect(this, e);
            } else if (this.tagName === 'BUTTON') {
                createRippleEffect(this, e);
            }
        });
        
        // Add hover glow effect
        button.addEventListener('mouseenter', function() {
            if (this.tagName === 'BUTTON' || this.classList.contains('cta-button')) {
                this.style.filter = 'brightness(1.15)';
            }
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.filter = 'brightness(1)';
        });
    });
}

function createRippleEffect(element, event) {
    // Prevent multiple ripples
    if (element.classList.contains('rippling')) return;
    
    element.classList.add('rippling');
    
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        transform: scale(0);
        animation: ripple-burst 0.8s ease-out;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
        element.classList.remove('rippling');
    }, 800);
}

// ===== ICON ANIMATIONS =====
function animateIcons() {
    const icons = document.querySelectorAll('.card-icon, .feature-number');
    
    icons.forEach((icon, index) => {
        // Hover effects
        icon.addEventListener('mouseenter', function() {
            this.style.animation = 'iconPulse 0.6s ease-in-out';
            this.style.transform = 'scale(1.2)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.animation = 'none';
            this.style.transform = 'scale(1)';
        });
    });
}

// ===== STAGGER ANIMATIONS FOR CARDS =====
function staggerCardAnimations() {
    const cards = document.querySelectorAll('.about-card, .feature-item, .fanfare-card, .quick-link-card');
    
    cards.forEach((card, index) => {
        card.style.animation = `slideInUp 0.6s ease-out ${index * 0.1}s backwards`;
    });
}

// ===== ENHANCED ANIMATIONS FOR PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    addRippleEffectToButtons();
    animateIcons();
    staggerCardAnimations();
    setupMobileMenu();
    
    // Add ripple animation keyframe if not already there
    if (!document.querySelector('style[data-advanced-ripple]')) {
        const style = document.createElement('style');
        style.setAttribute('data-advanced-ripple', 'true');
        style.textContent = `
            @keyframes ripple-burst {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes slideInUp {
                from {
                    transform: translateY(40px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
});

// ===== SMOOTH SCROLL ENHANCEMENT =====
document.addEventListener('wheel', (e) => {
    // This is just for tracking, actual scroll is smooth
}, { passive: true });

// ===== NAVBAR ENHANCEMENT ON SCROLL =====
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backdropFilter = 'blur(15px)';
        navbar.style.boxShadow = '0 5px 30px rgba(0, 0, 0, 0.25)';
    } else {
        navbar.style.backdropFilter = 'blur(10px)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
}, { passive: true });

setupMobileMenu();

// Initialize AOS-like effects
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// Tilt effect on cards on hover (optional)
document.querySelectorAll('.about-card, .feature-item').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
});
