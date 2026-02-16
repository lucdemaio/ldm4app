// UTF-8 cleaned (no BOM)
// Aggiungi link Logistica Trasferte al caricamento
document.addEventListener('DOMContentLoaded', function() {
    const logisticaLink = document.querySelector('a[aria-label="Logistica Trasferte"]');
    if (logisticaLink) {
        logisticaLink.addEventListener('click', function(e) {
            e.preventDefault();
            showView('calendar');
        });
    }
});
