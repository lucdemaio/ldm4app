/* ============================================================
   NAVBAR SUPREME FIX - Z-Index Forzato via JavaScript
   ============================================================ */

// Inizializza navbar animations con fix forzato
function initModernNavbar() {
    const navbar = document.querySelector('.top-navbar');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navbarMain = document.getElementById('navbar-main');
    const navButtons = document.querySelectorAll('.nav-btn');

    // FORZA z-index massimi via JavaScript (override qualsiasi CSS)
    if (navbar) {
        navbar.style.zIndex = '999999';
        navbar.style.position = 'fixed';
    }

    // Forza z-index su tutti i dropdown
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    dropdowns.forEach((dropdown, index) => {
        dropdown.style.zIndex = '9999999';
        dropdown.style.position = 'relative';

        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
            // Forza stili inline che hanno priorità massima
            menu.style.position = 'fixed';
            menu.style.zIndex = '99999999';
            menu.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            menu.style.backdropFilter = 'blur(20px)';
            menu.style.border = '1px solid rgba(200, 200, 220, 0.5)';
            menu.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.4)';

            console.log(`Dropdown ${index + 1} z-index forzato a:`, menu.style.zIndex);
        }
    });

    // Effetto scroll - navbar compatta
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Auto-hide su scroll down (opzionale - commentato per ora)
        // if (currentScroll > lastScroll && currentScroll > 200) {
        //     navbar.style.transform = 'translateY(-100%)';
        // } else {
        //     navbar.style.transform = 'translateY(0)';
        // }

        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    if (mobileToggle && navbarMain) {
        mobileToggle.addEventListener('click', () => {
            navbarMain.classList.toggle('active');

            // Anima icona
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                const isMenu = icon.getAttribute('data-lucide') === 'menu';
                icon.setAttribute('data-lucide', isMenu ? 'x' : 'menu');
                if (window.lucide) {
                    lucide.createIcons();
                }
            }
        });

        // Chiudi menu quando si clicca su un link
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navbarMain.classList.remove('active');
                    const icon = mobileToggle.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'menu');
                        if (window.lucide) {
                            lucide.createIcons();
                        }
                    }
                }
            });
        });
    }

    // Posizionamento dinamico dropdown con position: fixed
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');

        if (toggle && menu) {
            // Calcola posizione dropdown quando si fa hover
            dropdown.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) {
                    const rect = toggle.getBoundingClientRect();
                    const menuWidth = 220; // min-width del dropdown

                    // Posiziona il menu sotto il bottone, centrato
                    menu.style.top = (rect.bottom + 8) + 'px';
                    menu.style.left = (rect.left + rect.width / 2 - menuWidth / 2) + 'px';

                    // Verifica se esce dallo schermo a destra
                    if (rect.left + rect.width / 2 + menuWidth / 2 > window.innerWidth) {
                        menu.style.left = (window.innerWidth - menuWidth - 16) + 'px';
                    }

                    // Verifica se esce dallo schermo a sinistra
                    if (rect.left + rect.width / 2 - menuWidth / 2 < 0) {
                        menu.style.left = '16px';
                    }

                    // LOG per debug
                    console.log('Dropdown posizionato:', {
                        top: menu.style.top,
                        left: menu.style.left,
                        zIndex: menu.style.zIndex
                    });
                }
            });

            // Su mobile, click per aprire/chiudere
            toggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.stopPropagation();
                    const isOpen = menu.style.opacity === '1';

                    menu.style.position = 'static';
                    menu.style.opacity = isOpen ? '0' : '1';
                    menu.style.visibility = isOpen ? 'hidden' : 'visible';
                    menu.style.pointerEvents = isOpen ? 'none' : 'all';
                    menu.style.maxHeight = isOpen ? '0' : '500px';
                }
            });
        }
    });

    // Ricalcola posizioni dropdown quando si ridimensiona la finestra
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            dropdowns.forEach(dropdown => {
                const menu = dropdown.querySelector('.dropdown-menu');
                if (menu && window.innerWidth <= 768) {
                    menu.style.position = 'static';
                }
            });
        }, 250);
    });

    // Attiva il pulsante corrente
    function setActiveNavButton(viewName) {
        navButtons.forEach(btn => {
            btn.classList.remove('active');

            const onclick = btn.getAttribute('onclick');
            if (onclick && onclick.includes(viewName)) {
                btn.classList.add('active');
            }
        });
    }

    // Esporta funzione globale
    window.setActiveNavButton = setActiveNavButton;

    // Verifica z-index della dashboard e altri elementi
    setTimeout(() => {
        const allElements = document.querySelectorAll('*');
        let maxZIndex = 0;
        let elementWithMaxZ = null;

        allElements.forEach(el => {
            const zIndex = parseInt(window.getComputedStyle(el).zIndex);
            if (!isNaN(zIndex) && zIndex > maxZIndex && el.className !== 'dropdown-menu') {
                maxZIndex = zIndex;
                elementWithMaxZ = el;
            }
        });

        console.log('🔍 Z-Index massimo nella pagina:', maxZIndex);
        if (elementWithMaxZ) {
            console.log('🔍 Elemento con z-index massimo:', elementWithMaxZ.className || elementWithMaxZ.tagName);
        }

        // Se troviamo un z-index più alto, aumenta i dropdown
        if (maxZIndex >= 99999999) {
            console.warn('⚠️ Trovato z-index molto alto! Aumento dropdown a:', maxZIndex + 1000);
            dropdowns.forEach(dropdown => {
                const menu = dropdown.querySelector('.dropdown-menu');
                if (menu) {
                    menu.style.zIndex = (maxZIndex + 1000).toString();
                }
            });
        }
    }, 1000);

    console.log('✨ Modern Navbar 2026 (SUPREME FIX) initialized!');
    console.log('📊 Dropdown z-index impostati a: 99999999');
}

// Inizializza quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModernNavbar);
} else {
    initModernNavbar();
}

// Re-inizializza dopo un secondo per sicurezza (in caso altri script modifichino il DOM)
setTimeout(() => {
    console.log('🔄 Re-inizializzazione navbar...');
    initModernNavbar();
}, 2000);
