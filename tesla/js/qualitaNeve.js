// Qualità Neve e Condizioni Montagne
const montagne = {
    dolomiti: { lat: 46.4138, lon: 11.7519, name: 'Dolomiti', altitudine: 3343 },
    alpesOccidentali: { lat: 45.8356, lon: 7.1729, name: 'Alpi Occidentali', altitudine: 4808 },
    alpesCentrali: { lat: 46.4104, lon: 11.9826, name: 'Alpi Centrali', altitudine: 3899 },
    alpesOrientali: { lat: 46.8066, lon: 12.8545, name: 'Alpi Orientali', altitudine: 3798 },
    appennini: { lat: 43.5225, lon: 11.8700, name: 'Appennini', altitudine: 2912 }
};

let qualitaNeveDati = {};

async function fetchQualitaNeve() {
    try {
        const oggi = new Date();
        const oggiStr = oggi.toISOString().split('T')[0];
        
        // Chiama i dati meteo per ogni montagna
        for (const [key, mountain] of Object.entries(montagne)) {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${mountain.lat}&longitude=${mountain.lon}&current=temperature_2m,weather_code,snow_depth&daily=temperature_2m_min,snowfall,weather_code&timezone=Europe/Rome`
            );
            const data = await response.json();
            
            // Verifica che i dati siano validi
            if (!data || !data.current) {
                console.warn(`Dati incompleti per ${mountain.name}`);
                continue;
            }
            
            qualitaNeveDati[key] = {
                ...mountain,
                current: data.current,
                daily: data.daily || {},
                quality: calculateSnowQuality(data.current, data.daily || {})
            };
        }

        displayQualitaNeve();
    } catch (error) {
        console.error('Errore caricamento qualità neve:', error);
    }
}

function calculateSnowQuality(current, daily) {
    // Validazione dati
    if (!current || !daily) {
        return { quality: 'N/A', color: 'text-gray-400', icon: '❓', snowDepth: 0, temp: 0, nextSnowfall: 0 };
    }
    
    const temp = current.temperature_2m || 0;
    const snowDepth = current.snow_depth || 0;
    const nextSnowfall = (daily && daily.snowfall && daily.snowfall[0]) || 0;
    const nextMinTemp = (daily && daily.temperature_2m_min && daily.temperature_2m_min[0]) || 0;

    let quality = 'Pessima';
    let color = 'text-red-400';
    let icon = '❌';

    if (temp < -10 && snowDepth > 100) {
        quality = 'Eccellente';
        color = 'text-green-400';
        icon = '⭐⭐⭐⭐⭐';
    } else if (temp < -5 && snowDepth > 50) {
        quality = 'Ottima';
        color = 'text-green-400';
        icon = '⭐⭐⭐⭐';
    } else if (temp < 0 && snowDepth > 30) {
        quality = 'Buona';
        color = 'text-green-300';
        icon = '⭐⭐⭐';
    } else if (snowDepth > 20 && nextMinTemp < -2) {
        quality = 'Discreta';
        color = 'text-yellow-400';
        icon = '⭐⭐';
    } else if (nextSnowfall > 5) {
        quality = 'In Arrivo';
        color = 'text-blue-400';
        icon = '❄️';
    } else {
        quality = 'Pessima';
        color = 'text-red-400';
        icon = '❌';
    }

    return { quality, color, icon, snowDepth, temp, nextSnowfall };
}

function displayQualitaNeve() {
    const container = document.getElementById('qualitaNeveContainer');
    if (!container) return;

    let html = '<div class="grid md:grid-cols-2 lg:grid-cols-5 gap-4">';

    Object.values(qualitaNeveDati).forEach(mountain => {
        const q = mountain.quality;
        html += `
            <div class="bg-gray-800 rounded-lg p-4">
                <p class="text-sm font-semibold text-white mb-2">${mountain.name}</p>
                <div class="text-center mb-3">
                    <span class="text-2xl">${q.icon}</span>
                    <p class="text-xs text-gray-400 mt-1">${q.quality}</p>
                </div>
                <div class="space-y-1">
                    <p class="text-xs"><span class="text-gray-400">Neve:</span> <span class="text-white font-semibold">${q.snowDepth.toFixed(0)} cm</span></p>
                    <p class="text-xs"><span class="text-gray-400">Temp:</span> <span class="text-white font-semibold">${Math.round(q.temp)}°C</span></p>
                    <p class="text-xs"><span class="text-gray-400">Prossima:</span> <span class="text-white font-semibold">${q.nextSnowfall.toFixed(1)} cm</span></p>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}
