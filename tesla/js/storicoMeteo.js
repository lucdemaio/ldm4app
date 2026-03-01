// Storico Meteorologico
let storicoData = {
    ieri: null,
    settimanascorsa: null,
    annoScorso: null
};

async function fetchStoricoMeteo(lat, lon) {
    try {
        const oggi = new Date();
        
        // Ieri
        const ieriDateStr = new Date(oggi.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // 7 giorni fa
        const settimanascorsaDateStr = new Date(oggi.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Anno scorso (stesso giorno)
        const annoScorsoDateStr = new Date(oggi.getFullYear() - 1, oggi.getMonth(), oggi.getDate()).toISOString().split('T')[0];

        // Ieri e settimana scorsa (ultimi 8 giorni)
        const responseRecent = await fetch(
            `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${settimanascorsaDateStr}&end_date=today&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=Europe/Rome`
        );
        const dataRecent = await responseRecent.json();
        
        // Anno scorso
        const endDateAnnoScorso = new Date(oggi.getFullYear() - 1, oggi.getMonth(), oggi.getDate() + 1).toISOString().split('T')[0];
        const responseAnnoScorso = await fetch(
            `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${annoScorsoDateStr}&end_date=${endDateAnnoScorso}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=Europe/Rome`
        );
        const dataAnnoScorso = await responseAnnoScorso.json();
        
        // Estrai dati specifici
        const indexIeri = dataRecent.daily.time.indexOf(ieriDateStr);
        const indexSettimanascorsa = dataRecent.daily.time.indexOf(settimanascorsaDateStr);
        const indexAnnoScorso = dataAnnoScorso.daily.time.indexOf(annoScorsoDateStr);

        storicoData.ieri = {
            date: ieriDateStr,
            tempMax: dataRecent.daily.temperature_2m_max[indexIeri],
            tempMin: dataRecent.daily.temperature_2m_min[indexIeri],
            weatherCode: dataRecent.daily.weather_code[indexIeri],
            precipitation: dataRecent.daily.precipitation_sum[indexIeri]
        };

        storicoData.settimanascorsa = {
            date: settimanascorsaDateStr,
            tempMax: dataRecent.daily.temperature_2m_max[indexSettimanascorsa],
            tempMin: dataRecent.daily.temperature_2m_min[indexSettimanascorsa],
            weatherCode: dataRecent.daily.weather_code[indexSettimanascorsa],
            precipitation: dataRecent.daily.precipitation_sum[indexSettimanascorsa]
        };

        if (indexAnnoScorso >= 0) {
            storicoData.annoScorso = {
                date: annoScorsoDateStr,
                tempMax: dataAnnoScorso.daily.temperature_2m_max[indexAnnoScorso],
                tempMin: dataAnnoScorso.daily.temperature_2m_min[indexAnnoScorso],
                weatherCode: dataAnnoScorso.daily.weather_code[indexAnnoScorso],
                precipitation: dataAnnoScorso.daily.precipitation_sum[indexAnnoScorso]
            };
        }

        displayStoricoMeteo();
    } catch (error) {
        console.error('Errore caricamento storico:', error);
    }
}

function displayStoricoMeteo() {
    const container = document.getElementById('storicoContainer');
    if (!container) return;

    let html = '<div class="grid md:grid-cols-3 gap-4">';

    // Ieri
    if (storicoData.ieri) {
        html += createStoricoCard('Ieri', storicoData.ieri);
    }

    // Settimana scorsa
    if (storicoData.settimanascorsa) {
        html += createStoricoCard('7 Giorni Fa', storicoData.settimanascorsa);
    }

    // Anno scorso
    if (storicoData.annoScorso) {
        html += createStoricoCard('Anno Scorso', storicoData.annoScorso);
    }

    html += '</div>';
    container.innerHTML = html;
}

function createStoricoCard(label, data) {
    return `
        <div class="bg-gray-800 rounded-lg p-4">
            <p class="text-sm font-semibold text-accent mb-3">${label}</p>
            <div class="space-y-2">
                <div class="flex justify-between text-xs">
                    <span class="text-gray-400">Max:</span>
                    <span class="text-white font-semibold">${Math.round(data.tempMax)}°C</span>
                </div>
                <div class="flex justify-between text-xs">
                    <span class="text-gray-400">Min:</span>
                    <span class="text-white font-semibold">${Math.round(data.tempMin)}°C</span>
                </div>
                <div class="flex justify-between text-xs">
                    <span class="text-gray-400">Pioggia:</span>
                    <span class="text-white font-semibold">${data.precipitation.toFixed(1)} mm</span>
                </div>
            </div>
        </div>
    `;
}
