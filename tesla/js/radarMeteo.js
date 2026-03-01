// Mappa Radar Meteo Interattiva
let radarMap = null;

function initializeRadarMap() {
    if (radarMap) return;
    
    // Crea la mappa
    radarMap = L.map('radarMapContainer', {
        center: [41.8719, 12.5674], // Roma
        zoom: 6,
        layers: [L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' })]
    });

    // Aggiungi layer radar pioggia (RainViewer)
    const rainLayerUrl = 'https://tilecache.rainviewer.com/v2/radar_400/{time}/256/{z}/{x}/{y}/6/1_1.png';
    const wmsLayer = L.tileLayer(rainLayerUrl, {
        transparent: true,
        attribution: 'RainViewer',
        tms: false
    });
    
    radarMap.addLayer(wmsLayer);

    // Aggiungi marker per città principali
    const citiesPrecip = {
        'Roma': [41.9028, 12.4964],
        'Milano': [45.4642, 9.1900],
        'Napoli': [40.8518, 14.2681],
        'Venezia': [45.4408, 12.3155],
        'Firenze': [43.7696, 11.2558],
        'Palermo': [38.1157, 13.3615]
    };

    Object.entries(citiesPrecip).forEach(([city, coords]) => {
        const marker = L.circleMarker(coords, {
            radius: 6,
            fillColor: '#00d4ff',
            color: '#0066ff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });
        marker.bindPopup(`<strong>${city}</strong><br>Clicca per meteo completo`);
        marker.addTo(radarMap);
    });
}

function updateRadarIntensity(data) {
    // Aggiorna colori in base a dati meteo
    if (!radarMap) return;
    
    // Interpola intensità pioggia su scale di colori
    const intensityColors = {
        0: '#4CAF50',    // Verde: assenza pioggia
        1: '#8BC34A',    // Giallo-verde: leggera
        2: '#FFC107',    // Giallo: moderata
        3: '#FF9800',    // Arancio: forte
        4: '#F44336'     // Rosso: molto forte
    };
    
    console.log('Radar aggiornato con dati:', data);
}

function toggleRadarVisibility(visible) {
    if (!radarMap) initializeRadarMap();
    const container = document.getElementById('radarMapContainer');
    if (container) {
        container.style.display = visible ? 'block' : 'none';
        if (visible && radarMap) {
            radarMap.invalidateSize();
        }
    }
}
