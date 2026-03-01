// Comparatore Meteo Città
let citta_comparator_lista = [];
let citta_comparator_meteo = {};

async function comparaCitta() {
    const input1 = document.getElementById('comparaCitta1')?.value.trim();
    const input2 = document.getElementById('comparaCitta2')?.value.trim();
    const input3 = document.getElementById('comparaCitta3')?.value.trim();

    const citta = [input1, input2, input3].filter(c => c);

    if (citta.length < 2) {
        alert('Inserisci almeno 2 città per il confronto!');
        return;
    }

    try {
        citta_comparator_meteo = {};
        
        for (const cityName of citta) {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?city=${cityName}&country=Italy&format=json&limit=1`
            );
            const data = await response.json();
            
            if (data.length === 0) continue;

            const location = data[0];
            const lat = parseFloat(location.lat);
            const lon = parseFloat(location.lon);

            // Fetch meteo
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe/Rome`
            );
            const weatherData = await weatherResponse.json();

            citta_comparator_meteo[cityName] = {
                name: location.name,
                coords: { lat, lon },
                weather: weatherData
            };
        }

        displayComparazioneMeteo();
    } catch (error) {
        console.error('Errore comparazione:', error);
        alert('Errore nel caricamento delle città!');
    }
}

function displayComparazioneMeteo() {
    const container = document.getElementById('comparazioneContainer');
    if (!container) return;

    if (Object.keys(citta_comparator_meteo).length < 2) {
        container.innerHTML = '<p class="text-gray-400">Nessun dato disponibile</p>';
        return;
    }

    let html = '<div class="overflow-x-auto"><table class="w-full text-sm">';
    
    // Header
    html += '<thead><tr class="border-b border-gray-700">';
    html += '<th class="text-left p-3 text-gray-300">Parametro</th>';
    
    Object.keys(citta_comparator_meteo).forEach(city => {
        const data = citta_comparator_meteo[city];
        html += `<th class="text-left p-3 font-semibold text-accent">${data.name}</th>`;
    });
    html += '</tr></thead>';

    // Body
    html += '<tbody>';

    // Temperatura
    html += '<tr class="border-b border-gray-800 hover:bg-gray-800">';
    html += '<td class="p-3 text-gray-400">Temperatura</td>';
    Object.keys(citta_comparator_meteo).forEach(city => {
        const temp = Math.round(citta_comparator_meteo[city].weather.current.temperature_2m);
        html += `<td class="p-3 font-semibold text-white">${temp}°C</td>`;
    });
    html += '</tr>';

    // Umidità
    html += '<tr class="border-b border-gray-800 hover:bg-gray-800">';
    html += '<td class="p-3 text-gray-400">Umidità</td>';
    Object.keys(citta_comparator_meteo).forEach(city => {
        const humidity = citta_comparator_meteo[city].weather.current.relative_humidity_2m;
        html += `<td class="p-3 font-semibold text-white">${humidity}%</td>`;
    });
    html += '</tr>';

    // Vento
    html += '<tr class="border-b border-gray-800 hover:bg-gray-800">';
    html += '<td class="p-3 text-gray-400">Vento</td>';
    Object.keys(citta_comparator_meteo).forEach(city => {
        const wind = Math.round(citta_comparator_meteo[city].weather.current.wind_speed_10m);
        html += `<td class="p-3 font-semibold text-white">${wind} km/h</td>`;
    });
    html += '</tr>';

    // Descrizione
    html += '<tr class="border-b border-gray-800 hover:bg-gray-800">';
    html += '<td class="p-3 text-gray-400">Meteo</td>';
    Object.keys(citta_comparator_meteo).forEach(city => {
        const weatherCode = citta_comparator_meteo[city].weather.current.weather_code;
        const weatherInfo = getWeatherCompareInfo(weatherCode);
        html += `<td class="p-3 font-semibold text-white">${weatherInfo.emoji} ${weatherInfo.description}</td>`;
    });
    html += '</tr>';

    // Max/Min
    html += '<tr class="hover:bg-gray-800">';
    html += '<td class="p-3 text-gray-400">Max/Min</td>';
    Object.keys(citta_comparator_meteo).forEach(city => {
        const max = Math.round(citta_comparator_meteo[city].weather.daily.temperature_2m_max[0]);
        const min = Math.round(citta_comparator_meteo[city].weather.daily.temperature_2m_min[0]);
        html += `<td class="p-3 font-semibold text-white">${max}°/${min}°</td>`;
    });
    html += '</tr>';

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function getWeatherCompareInfo(code) {
    const weatherMap = {
        0: { emoji: '☀️', description: 'Sereno' },
        1: { emoji: '🌤️', description: 'Sereno' },
        2: { emoji: '⛅', description: 'Nuvoloso' },
        3: { emoji: '☁️', description: 'Nuvole' },
        45: { emoji: '🌫️', description: 'Nebbia' },
        61: { emoji: '🌧️', description: 'Pioggia' },
        80: { emoji: '⛈️', description: 'Temporale' },
        95: { emoji: '⛈️', description: 'Temporale' }
    };
    return weatherMap[code] || { emoji: '❓', description: 'Vario' };
}
