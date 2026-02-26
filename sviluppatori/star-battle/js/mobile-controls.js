// Mobile Controls Integration
// Questo file assicura che i controlli touch funzionino come fallback diretto

(function() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tesla/i.test(navigator.userAgent);
    
    if (!isMobile && window.innerWidth > 768) {
        return; // Non è mobile
    }

    // Aggiungi il polling per i controlli mobile
    window.addEventListener('load', function() {
        if (!window.mobileControlState) return;

        // Registra il polling nel raf per i movimenti
        raf.reg('mobile_controls_polling', function() {
            if (!window.currentGame || !window.currentGame.scene) return;
            
            const scene = window.currentGame.scene;
            if (!scene.player || !scene.player.run || scene.pauseFlag || window.currentGame.data.end) return;

            const state = window.mobileControlState;
            const player = scene.player;
            
            // Applica i movimenti continuamente
            if (state.w) player.up();
            if (state.a) player.left();
            if (state.s) player.down();
            if (state.d) player.right();
        });

        // Gestione del fire button - come evento continuo
        const fireButton = document.querySelector('.fire-btn');
        if (fireButton) {
            let isFirePressed = false;
            let fireInterval = null;

            function startFiring() {
                if (isFirePressed) return;
                isFirePressed = true;
                
                // Fire immediatamente
                if (window.currentGame && window.currentGame.scene && window.currentGame.scene.player) {
                    window.currentGame.scene.player.fire();
                }
                
                // Continua a sparare
                fireInterval = setInterval(function() {
                    if (isFirePressed && window.currentGame && window.currentGame.scene && window.currentGame.scene.player) {
                        window.currentGame.scene.player.fire();
                    }
                }, 30);
            }

            function stopFiring() {
                isFirePressed = false;
                if (fireInterval) {
                    clearInterval(fireInterval);
                    fireInterval = null;
                }
            }

            // Touch Events
            fireButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                startFiring();
            }, { passive: false });

            fireButton.addEventListener('touchend', function(e) {
                e.preventDefault();
                stopFiring();
            }, { passive: false });

            fireButton.addEventListener('touchcancel', stopFiring, { passive: false });

            // Pointer Events (tablet/auto)
            fireButton.addEventListener('pointerdown', function(e) {
                e.preventDefault();
                startFiring();
            }, { passive: false });

            fireButton.addEventListener('pointerup', function(e) {
                e.preventDefault();
                stopFiring();
            }, { passive: false });

            fireButton.addEventListener('pointercancel', stopFiring, { passive: false });

            // Mouse Events
            fireButton.addEventListener('mousedown', function(e) {
                e.preventDefault();
                startFiring();
            });

            fireButton.addEventListener('mouseup', function(e) {
                e.preventDefault();
                stopFiring();
            });

            fireButton.addEventListener('mouseleave', stopFiring);
        }
    });

})();
