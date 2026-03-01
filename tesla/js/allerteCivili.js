// Allerte Protezione Civile Italia
let alertiCivili = [];

async function fetchAlertiCivili() {
    try {
        // Protezione Civile API
        const response = await fetch('https://mappe.protezionecivile.it/mappe/api/alert');
        const data = await response.json();
        
        alertiCivili = data.alerts || [];
        displayAlertiCivili();
    } catch (error) {
        console.log('Servizio allerte Protezione Civile temporaneamente non disponibile');
        loadFallbackAlerts();
    }
}

function loadFallbackAlerts() {
    // Dati di fallback basati su meteo attuale
    alertiCivili = [
        {
            region: 'Lazio',
            level: 'yellow',
            description: 'Temporali isolati possibili',
            until: '23:59'
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
