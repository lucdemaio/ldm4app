// Condizioni Mari e Maree
const costeItaliane = {
    liguria: { lat: 44.2506, lon: 8.3013, name: 'Liguria', mare: 'Ligure' },
    toscana: { lat: 42.8182, lon: 10.4730, name: 'Toscana', mare: 'Tirreno' },
    campania: { lat: 40.8518, lon: 14.2681, name: 'Campania (Napoli)', mare: 'Tirreno' },
    puglia: { lat: 41.1173, lon: 16.8706, name: 'Puglia', mare: 'Ionio' },
    sicilia: { lat: 38.1157, lon: 13.3615, name: 'Sicilia (Palermo)', mare: 'Tirreno' },
    sardegna: { lat: 40.7238, lon: 8.4695, name: 'Sardegna', mare: 'Tirreno' },
    veneto: { lat: 45.4408, lon: 12.3155, name: 'Veneto (Venezia)', mare: 'Adriatico' },
    romagna: { lat: 44.3373, lon: 12.1991, name: 'Romagna', mare: 'Adriatico' }
};

let condizioniMariDati = {};

async function fetchCondizioniMari() {
    try {
        for (const [key, costa] of Object.entries(costeItaliane)) {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${costa.lat}&longitude=${costa.lon}&current=temperature_2m,weather_code,wind_speed_10m&marine=wave_height,wave_period,wind_wave_height,swell_wave_height&timezone=Europe/Rome`
            );
            const data = await response.json();
            
            condizioniMariDati[key] = {
                ...costa,
                current: data.current,
                marine: data.current,
                conditions: calculateMareConditions(data.current)
            };
        }

        displayCondizioniMari();
    } catch (error) {
        console.error('Errore caricamento condizioni mari:', error);
        // Fallback: mostra dati simulati
        displayCondizioniMariSimulated();
    }
}

function calculateMareConditions(current) {
    const wind = current.wind_speed_10m || 0;
    const waveHeight = 1.5; // Simulation se API non disponibile
    
    let condition = 'Calmo';
    let color = 'text-green-400';
    let icon = '🌊';
    let activity = 'Perfetto';

    if (wind < 10 && waveHeight < 1) {
        condition = 'Calmo';
        color = 'text-green-400';
        icon = '⛱️';
        activity = 'Balneazione ideale';
    } else if (wind < 20 && waveHeight < 2) {
        condition = 'Moderato';
        color = 'text-blue-400';
        icon = '🌊';
        activity = 'Balneazione possibile';
    } else if (wind < 30 && waveHeight < 3) {
        condition = 'Agitato';
        color = 'text-yellow-400';
        icon = '⛵';
        activity = 'Cautela';
    } else {
        condition = 'Molto Agitato';
        color = 'text-red-400';
        icon = '🚫';
        activity = 'Sconsigliato';
    }

    return { condition, color, icon, activity, wind };
}

function displayCondizioniMari() {
    const container = document.getElementById('condizioniMariContainer');
    if (!container) return;

    let html = '<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">';

    Object.values(condizioniMariDati).forEach(costa => {
        const c = costa.conditions;
        html += `
            <div class="bg-gray-800 rounded-lg p-4">
                <p class="text-sm font-semibold text-white mb-2">${costa.name}</p>
                <div class="text-center mb-3">
                    <span class="text-2xl">${c.icon}</span>
                    <p class="text-xs text-gray-400 mt-1">${c.condition}</p>
                </div>
                <div class="space-y-1">
                    <p class="text-xs"><span class="text-gray-400">Vento:</span> <span class="text-white font-semibold">${Math.round(c.wind)} km/h</span></p>
                    <p class="text-xs"><span class="text-gray-400">Mare:</span> <span class="${c.color} font-semibold">${c.condition}</span></p>
                    <p class="text-xs text-accent font-semibold">${c.activity}</p>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function displayCondizioniMariSimulated() {
    const container = document.getElementById('condizioniMariContainer');
    if (!container) return;

    let html = '<div class="alert-info p-4 rounded-lg">';
    html += '<p class="text-sm"><i class="fas fa-water mr-2"></i>Dati mari non disponibili al momento. Consulta le previsioni locali.</p>';
    html += '</div>';
    container.innerHTML = html;
}
