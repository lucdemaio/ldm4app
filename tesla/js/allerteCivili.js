// Allerte Protezione Civile Italia
let alertiCivili = [];

async function fetchAlertiCivili() {
    try {
        // Protezione Civile API ha problemi CORS - usiamo fallback diretto
        loadFallbackAlerts();
    } catch (error) {
        console.log('Servizio allerte Protezione Civile non disponibile - usando dati simulati');
        loadFallbackAlerts();
    }
}

function loadFallbackAlerts() {
    // Dati di fallback basati su meteo attuale - semplificato
    alertiCivili = [
        {
            region: 'Sistema',
            level: 'green',
            description: 'Sistema di allerte Protezione Civile disponibile online su protezionecivile.it',
            until: '24:00'
        }
    ];
    displayAlertiCivili();
}

function displayAlertiCivili() {
    const container = document.getElementById('alertiCiviliContainer');
    if (!container) return;

    if (alertiCivili.length === 0) {
        container.innerHTML = `
            <div class="alert-info p-4 rounded-lg">
                <p class="text-sm"><i class="fas fa-shield-alt mr-2"></i>Nessun avviso meteo dalla Protezione Civile</p>
            </div>
        `;
        return;
    }

    let html = '<div class="space-y-3">';
    alertiCivili.forEach(alert => {
        const colors = {
            'green': 'alert-info',
            'yellow': 'alert-warning',
            'orange': 'alert-warning',
            'red': 'alert-danger'
        };
        
        const levelIcons = {
            'green': '✅',
            'yellow': '⚠️',
            'orange': '🔴',
            'red': '🛑'
        };

        html += `
            <div class="${colors[alert.level] || 'alert-info'} p-4 rounded-lg">
                <p class="text-sm font-semibold">${levelIcons[alert.level]} ${alert.region}</p>
                <p class="text-xs mt-2">${alert.description}</p>
                <p class="text-xs text-gray-400 mt-1">Fino a: ${alert.until}</p>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}
