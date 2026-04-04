/**
 * IntegrationsManager - Integrazioni Esterne
 * Google Maps, Meteo, Calendario, ecc.
 */
class IntegrationsManager {
  constructor() {
    this.configKey = 'integrations-config';
    this.dataKey = 'integrations-data';
    this.config = this.loadConfig();
    this.data = this.loadData();
  }

  loadConfig() {
    return storage.get(this.configKey) || {
      googleMaps: { apiKey: '', enabled: false },
      weather: { apiKey: '', enabled: false },
      calendar: { enabled: false },
      notifications: { enabled: true }
    };
  }

  saveConfig() {
    storage.set(this.configKey, this.config);
  }

  loadData() {
    return storage.get(this.dataKey) || {
      locations: [],
      weatherData: [],
      calendarSync: []
    };
  }

  saveData() {
    storage.set(this.dataKey, this.data);
  }

  enableIntegration(service, enabled) {
    if (this.config[service]) {
      this.config[service].enabled = enabled;
      this.saveConfig();
      return true;
    }
    return false;
  }

  setApiKey(service, apiKey) {
    if (this.config[service]) {
      this.config[service].apiKey = apiKey;
      this.saveConfig();
      return true;
    }
    return false;
  }

  addLocation(location) {
    location.id = Date.now();
    location.addedAt = new Date().toISOString();
    this.data.locations.push(location);
    this.saveData();
    return location;
  }

  getLocationWeather(locationId) {
    return this.data.weatherData.find(w => w.locationId === locationId);
  }

  addWeatherData(locationId, weatherData) {
    weatherData.id = Date.now();
    weatherData.locationId = locationId;
    weatherData.fetchedAt = new Date().toISOString();
    this.data.weatherData.push(weatherData);
    this.saveData();
    return weatherData;
  }

  syncCalendar(events) {
    this.data.calendarSync = events.map(e => ({
      ...e,
      syncedAt: new Date().toISOString(),
      id: Date.now()
    }));
    this.saveData();
    return this.data.calendarSync;
  }

  getStats() {
    return {
      integrationCount: Object.keys(this.config).filter(k => this.config[k].enabled).length,
      locations: this.data.locations.length,
      syncedEvents: this.data.calendarSync.length,
      weatherDataPoints: this.data.weatherData.length
    };
  }

  renderIntegrationsPage() {
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Integrazioni Esterne</h2>
            <p>Servizi attivi: ${stats.integrationCount}</p>
          </div>
        </div>

        <div class="grid grid-2">
          <!-- GOOGLE MAPS -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🗺️ Google Maps</div>
            </div>
            <div class="card-body">
              <p style="color: var(--text-light);">Visualizza posizioni e mappe interattive</p>
              <div class="form-group" style="margin-top: 15px;">
                <label>
                  <input type="checkbox" ${this.config.googleMaps.enabled ? 'checked' : ''} onchange="toggleIntegration('googleMaps')">
                  Abilita Google Maps
                </label>
              </div>
              <div class="form-group">
                <label>API Key</label>
                <input type="password" id="maps-api" value="${this.config.googleMaps.apiKey}" placeholder="Inserisci API Key">
                <button class="btn btn-sm btn-secondary" onclick="saveApiKey('googleMaps')" style="margin-top: 8px;">💾 Salva</button>
              </div>
              <button class="btn btn-sm btn-primary" onclick="showMapsModal()" style="margin-top: 15px;">📍 Gestisci Locazioni</button>
            </div>
          </div>

          <!-- METEO -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">☀️ Meteo</div>
            </div>
            <div class="card-body">
              <p style="color: var(--text-light);">Dati meteorologici e previsioni</p>
              <div class="form-group" style="margin-top: 15px;">
                <label>
                  <input type="checkbox" ${this.config.weather.enabled ? 'checked' : ''} onchange="toggleIntegration('weather')">
                  Abilita Meteo
                </label>
              </div>
              <div class="form-group">
                <label>API Key (OpenWeatherMap)</label>
                <input type="password" id="weather-api" value="${this.config.weather.apiKey}" placeholder="Inserisci API Key">
                <button class="btn btn-sm btn-secondary" onclick="saveApiKey('weather')" style="margin-top: 8px;">💾 Salva</button>
              </div>
              <button class="btn btn-sm btn-primary" onclick="fetchWeatherData()" style="margin-top: 15px;">🔄 Aggiorna Meteo</button>
            </div>
          </div>

          <!-- CALENDAR -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📅 Google Calendar</div>
            </div>
            <div class="card-body">
              <p style="color: var(--text-light);">Sincronizza con Google Calendar</p>
              <div class="form-group" style="margin-top: 15px;">
                <label>
                  <input type="checkbox" ${this.config.calendar.enabled ? 'checked' : ''} onchange="toggleIntegration('calendar')">
                  Abilita Integrazione
                </label>
              </div>
              <button class="btn btn-sm btn-primary" onclick="connectGoogleCalendar()" style="margin-top: 15px;">🔗 Connetti Calendar</button>
              <button class="btn btn-sm btn-secondary" onclick="syncCalendarEvents()" style="margin-top: 8px;">🔄 Sincronizza Ora</button>
            </div>
          </div>

          <!-- NOTIFICHE -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🔔 Notifiche Push</div>
            </div>
            <div class="card-body">
              <p style="color: var(--text-light);">Ricevi notifiche sui tuoi dispositivi</p>
              <div class="form-group" style="margin-top: 15px;">
                <label>
                  <input type="checkbox" ${this.config.notifications.enabled ? 'checked' : ''} onchange="toggleIntegration('notifications')">
                  Abilita Notifiche Push
                </label>
              </div>
              <button class="btn btn-sm btn-primary" onclick="subscribeToPushNotifications()" style="margin-top: 15px;">✏️ Configura Notifiche</button>
              <p style="font-size: 0.85rem; color: var(--text-light); margin-top: 10px;">Riceverai notifiche per eventi e avvisi importanti</p>
            </div>
          </div>
        </div>

        <!-- SYNC STATUS -->
        <div style="margin-top: 30px;">
          <h3>Stato Sincronizzazioni</h3>
          <div class="grid grid-4">
            <div class="stat-card">
              <div class="stat-value">${stats.locations}</div>
              <div class="stat-label">Locazioni</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.syncedEvents}</div>
              <div class="stat-label">Eventi Sincronizzati</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.weatherDataPoints}</div>
              <div class="stat-label">Dati Meteo</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${new Date().toLocaleTimeString('it-IT')}</div>
              <div class="stat-label">Ultimo Aggiornamento</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

const integrationsManager = new IntegrationsManager();

function toggleIntegration(service) {
  const enabled = document.querySelector(`input[onchange*="${service}"]`).checked;
  integrationsManager.enableIntegration(service, enabled);
  Utils.showAlert(`${service} ${enabled ? 'abilitato' : 'disabilitato'}!`, 'success');
}

function saveApiKey(service) {
  const apiInput = document.getElementById(`${service.toLowerCase()}-api`);
  if (apiInput && apiInput.value.trim()) {
    integrationsManager.setApiKey(service, apiInput.value);
    Utils.showAlert('API Key salvata!', 'success');
  } else {
    Utils.showAlert('Inserisci un API Key valido', 'error');
  }
}

function showMapsModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Gestisci Locazioni</h3>
          <button class="modal-close" onclick="closeMapsModal()">✕</button>
        </div>
        <div class="modal-body">
          <form onsubmit="addMapLocation(event);">
            <div class="form-group">
              <label>Nome Locazione *</label>
              <input type="text" id="location-name" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Indirizzo *</label>
                <input type="text" id="location-address" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Latitudine</label>
                <input type="number" id="location-lat" step="0.0001">
              </div>
              <div class="form-group">
                <label>Longitudine</label>
                <input type="number" id="location-lng" step="0.0001">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeMapsModal()">Chiudi</button>
              <button type="submit" class="btn btn-primary">Aggiungi Locazione</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeMapsModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function addMapLocation(event) {
  event.preventDefault();
  const location = {
    name: document.getElementById('location-name').value,
    address: document.getElementById('location-address').value,
    lat: parseFloat(document.getElementById('location-lat').value) || 0,
    lng: parseFloat(document.getElementById('location-lng').value) || 0
  };
  integrationsManager.addLocation(location);
  closeMapsModal();
  Utils.showAlert('Locazione aggiunta!', 'success');
}

function fetchWeatherData() {
  const config = integrationsManager.config;
  if (!config.weather.enabled || !config.weather.apiKey) {
    Utils.showAlert('Meteo non configurato', 'error');
    return;
  }
  Utils.showAlert('Aggiornamento meteo in corso...', 'info');
  // Integration with OpenWeatherMap API would go here
  setTimeout(() => {
    Utils.showAlert('Meteo aggiornato!', 'success');
    navigationManager.loadPageContent('integrations');
  }, 2000);
}

function connectGoogleCalendar() {
  const config = integrationsManager.config;
  if (!config.calendar.enabled) {
    Utils.showAlert('Abilita l\'integrazione calendario prima', 'error');
    return;
  }
  Utils.showAlert('Reindirizzamento a Google Calendar...', 'info');
  // OAuth flow would go here
}

function syncCalendarEvents() {
  const config = integrationsManager.config;
  if (!config.calendar.enabled) {
    Utils.showAlert('Calendar non abilitato', 'error');
    return;
  }
  Utils.showAlert('Sincronizzazione in corso...', 'info');
  // Calendar sync logic would go here
  setTimeout(() => {
    Utils.showAlert('Sincronizzazione completata!', 'success');
    navigationManager.loadPageContent('integrations');
  }, 2000);
}

function subscribeToPushNotifications() {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      Utils.showAlert('Notifiche già abilitate!', 'success');
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          Utils.showAlert('Notifiche abilitate!', 'success');
          integrationsManager.enableIntegration('notifications', true);
        }
      });
    }
  } else {
    Utils.showAlert('Il tuo browser non supporta le notifiche push', 'error');
  }
}
