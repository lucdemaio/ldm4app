// Condivisione Social Meteo
function shareMeteoOnWhatsApp(cityName, weatherData) {
    const temp = Math.round(weatherData.current.temperature_2m);
    const humidity = weatherData.current.relative_humidity_2m;
    const windSpeed = Math.round(weatherData.current.wind_speed_10m);
    const weatherCode = weatherData.current.weather_code;
    const weatherInfo = getWeatherInfoShare(weatherCode);

    const message = encodeURIComponent(
        `🌡️ *Meteo ${cityName}*\n\n` +
        `${weatherInfo.emoji} ${weatherInfo.description}\n` +
        `🌡️ Temperatura: ${temp}°C\n` +
        `💧 Umidità: ${humidity}%\n` +
        `💨 Vento: ${windSpeed} km/h\n\n` +
        `📱 Visualizza il meteo completo su LDM4APP!`
    );

    const whatsappURL = `https://wa.me/?text=${message}`;
    window.open(whatsappURL, '_blank');
}

function shareMeteoOnTelegram(cityName, weatherData) {
    const temp = Math.round(weatherData.current.temperature_2m);
    const humidity = weatherData.current.relative_humidity_2m;
    const windSpeed = Math.round(weatherData.current.wind_speed_10m);
    const weatherCode = weatherData.current.weather_code;
    const weatherInfo = getWeatherInfoShare(weatherCode);

    const message = encodeURIComponent(
        `🌡️ <b>Meteo ${cityName}</b>\n\n` +
        `${weatherInfo.emoji} ${weatherInfo.description}\n` +
        `🌡️ Temperatura: ${temp}°C\n` +
        `💧 Umidità: ${humidity}%\n` +
        `💨 Vento: ${windSpeed} km/h\n\n` +
        `📱 Visualizza su LDM4APP!`
    );

    const telegramURL = `https://t.me/share/url?url=https://www.ldm4app.com&text=${message}`;
    window.open(telegramURL, '_blank');
}

function shareMeteoOnTwitter(cityName, weatherData) {
    const temp = Math.round(weatherData.current.temperature_2m);
    const weatherCode = weatherData.current.weather_code;
    const weatherInfo = getWeatherInfoShare(weatherCode);

    const message = encodeURIComponent(
        `${weatherInfo.emoji} Meteo a ${cityName}: ${temp}°C - ${weatherInfo.description}\n\n` +
        `Con @LDM4APP 🌡️ #Meteo #Previsioni`
    );

    const twitterURL = `https://twitter.com/intent/tweet?text=${message}`;
    window.open(twitterURL, '_blank');
}

function copyMeteoToClipboard(cityName, weatherData) {
    const temp = Math.round(weatherData.current.temperature_2m);
    const humidity = weatherData.current.relative_humidity_2m;
    const windSpeed = Math.round(weatherData.current.wind_speed_10m);
    const weatherCode = weatherData.current.weather_code;
    const weatherInfo = getWeatherInfoShare(weatherCode);

    const text = 
        `Meteo ${cityName}\n` +
        `${weatherInfo.emoji} ${weatherInfo.description}\n` +
        `Temperatura: ${temp}°C\n` +
        `Umidità: ${humidity}%\n` +
        `Vento: ${windSpeed} km/h`;

    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Dati meteo copiati! Incolla dove preferisci.');
    }).catch(() => {
        alert('Errore nella copia. Prova di nuovo.');
    });
}

function getWeatherInfoShare(code) {
    const weatherMap = {
        0: { emoji: '☀️', description: 'Cielo sereno' },
        1: { emoji: '🌤️', description: 'Prevalentemente sereno' },
        2: { emoji: '⛅', description: 'Parzialmente nuvoloso' },
        3: { emoji: '☁️', description: 'Nuvoloso' },
        45: { emoji: '🌫️', description: 'Nebbiosa' },
        48: { emoji: '🌫️', description: 'Nebbia con brina' },
        51: { emoji: '🌧️', description: 'Leggera pioggerella' },
        53: { emoji: '🌧️', description: 'Pioggerella moderata' },
        55: { emoji: '🌧️', description: 'Pioggerella forte' },
        61: { emoji: '🌧️', description: 'Leggera pioggia' },
        63: { emoji: '🌧️', description: 'Pioggia moderata' },
        65: { emoji: '⛈️', description: 'Pioggia forte' },
        71: { emoji: '❄️', description: 'Leggera nevicata' },
        73: { emoji: '❄️', description: 'Nevicata moderata' },
        75: { emoji: '❄️', description: 'Nevicata forte' },
        80: { emoji: '⛈️', description: 'Temporale' },
        81: { emoji: '⛈️', description: 'Temporale forte' },
        82: { emoji: '⛈️', description: 'Temporale violento' },
        95: { emoji: '⛈️', description: 'Temporale con grandine' }
    };
    return weatherMap[code] || { emoji: '❓', description: 'Condizioni varie' };
}

function createShareButtons(cityName, weatherData) {
    return `
        <div class="flex gap-2 flex-wrap mt-4">
            <button onclick="shareMeteoOnWhatsApp('${cityName}', ${JSON.stringify(weatherData).replace(/'/g, "\\'")})" 
                class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-full text-xs font-semibold transition">
                <i class="fab fa-whatsapp mr-1"></i> WhatsApp
            </button>
            <button onclick="shareMeteoOnTelegram('${cityName}', ${JSON.stringify(weatherData).replace(/'/g, "\\'")})" 
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-full text-xs font-semibold transition">
                <i class="fab fa-telegram mr-1"></i> Telegram
            </button>
            <button onclick="shareMeteoOnTwitter('${cityName}', ${JSON.stringify(weatherData).replace(/'/g, "\\'")})" 
                class="bg-sky-400 hover:bg-sky-500 text-white px-3 py-2 rounded-full text-xs font-semibold transition">
                <i class="fab fa-twitter mr-1"></i> Twitter
            </button>
            <button onclick="copyMeteoToClipboard('${cityName}', ${JSON.stringify(weatherData).replace(/'/g, "\\'")})" 
                class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-full text-xs font-semibold transition">
                <i class="fas fa-copy mr-1"></i> Copia
            </button>
        </div>
    `;
}
