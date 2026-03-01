// Notifiche Meteo Push
let notificheAttive = false;
let monitoringIntervalId = null;

function requestNotifichePermesso() {
    if (!('Notification' in window)) {
        console.log('Browser non supporta notifiche');
        return;
    }

    if (Notification.permission === 'granted') {
        notificheAttive = true;
        startMonitoringMeteo();
        updateNotificheStatus(true);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                notificheAttive = true;
                startMonitoringMeteo();
                updateNotificheStatus(true);
            }
        });
    }
}

function startMonitoringMeteo() {
    if (monitoringIntervalId) clearInterval(monitoringIntervalId);
    
    // Controlla meteo ogni 30 minuti
    monitoringIntervalId = setInterval(() => {
        checkMeteoAlerts();
    }, 30 * 60 * 1000);
    
    // Controlla subito
    checkMeteoAlerts();
}

function stopMonitoringMeteo() {
    if (monitoringIntervalId) {
        clearInterval(monitoringIntervalId);
        monitoringIntervalId = null;
    }
    notificheAttive = false;
    updateNotificheStatus(false);
}

async function checkMeteoAlerts() {
    if (!navigator.geolocation || !notificheAttive) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=Europe/Rome`
            );
            const data = await response.json();
            const current = data.current;

            // Controlla condizioni pericolose
            let alerts = [];

            if (current.wind_speed_10m > 40) {
                alerts.push({
                    title: '⚠️ VENTO FORTE',
                    body: `Vento a ${Math.round(current.wind_speed_10m)} km/h - Guidare con cautela!`,
                    tag: 'vento-forte'
                });
            }

            if ([65, 71, 73, 75, 80, 81, 82, 95].includes(current.weather_code)) {
                const weatherName = {
                    65: 'PIOGGIA FORTE',
                    71: 'NEVE',
                    73: 'NEVICATA',
                    75: 'NEVICATA FORTE',
                    80: 'TEMPORALE',
                    81: 'TEMPORALE FORTE',
                    82: 'TEMPORALE VIOLENTO',
                    95: 'TEMPORALE CON GRANDINE'
                }[current.weather_code];

                alerts.push({
                    title: `🛑 ${weatherName}`,
                    body: 'Condizioni meteo pericolose - Massima cautela!',
                    tag: 'condizioni-pericolose'
                });
            }

            if (current.relative_humidity_2m > 95 && [45, 48].includes(current.weather_code)) {
                alerts.push({
                    title: '🌫️ NEBBIA FITTA',
                    body: 'Visibilità ridotta - Accendere i fari e ridurre velocità',
                    tag: 'nebbia'
                });
            }

            // Invia notifiche
            alerts.forEach(alert => {
                new Notification(alert.title, {
                    body: alert.body,
                    icon: '🌡️',
                    tag: alert.tag,
                    requireInteraction: true
                });
            });

            if (alerts.length === 0) {
                console.log('Monitoraggio meteo: nessun avviso');
            }
        } catch (error) {
            console.error('Errore monitoring meteo:', error);
        }
    });
}

function updateNotificheStatus(active) {
    const btn = document.getElementById('notificheMeteoBtn');
    if (!btn) return;

    if (active) {
        btn.innerHTML = '<i class="fas fa-bell-slash mr-2"></i> Disattiva Notifiche';
        btn.classList.remove('bg-gray-700');
        btn.classList.add('bg-green-700');
    } else {
        btn.innerHTML = '<i class="fas fa-bell mr-2"></i> Attiva Notifiche';
        btn.classList.remove('bg-green-700');
        btn.classList.add('bg-gray-700');
    }
}

function toggleNotificheMeteo() {
    if (notificheAttive) {
        stopMonitoringMeteo();
    } else {
        requestNotifichePermesso();
    }
}

// Controlla supporto notifiche al caricamento
document.addEventListener('DOMContentLoaded', () => {
    if (!('Notification' in window)) {
        const btn = document.getElementById('notificheMeteoBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-bell-off mr-2"></i> Notifiche non supportate';
        }
    }
});
