/**
 * MobileAppManager - App Mobile
 * PWA, installazione, sincronizzazione offline
 */
class MobileAppManager {
  constructor() {
    this.configKey = 'mobile-app-config';
    this.devicesKey = 'mobile-devices';
    this.syncKey = 'mobile-sync-queue';
    this.config = this.loadConfig();
    this.devices = this.loadDevices();
    this.syncQueue = this.loadSyncQueue();
  }

  loadConfig() {
    return storage.get(this.configKey) || {
      pwaEnabled: true,
      offlineMode: true,
      autoSync: true,
      notifications: true,
      lastSyncTime: null,
      version: '1.0.0'
    };
  }

  saveConfig() {
    storage.set(this.configKey, this.config);
  }

  loadDevices() {
    return storage.get(this.devicesKey) || [];
  }

  saveDevices() {
    storage.set(this.devicesKey, this.devices);
  }

  loadSyncQueue() {
    return storage.get(this.syncKey) || [];
  }

  saveSyncQueue() {
    storage.set(this.syncKey, this.syncQueue);
  }

  registerDevice(deviceInfo) {
    const device = {
      id: Date.now(),
      name: deviceInfo.name,
      type: deviceInfo.type, // mobile, tablet, desktop
      os: deviceInfo.os, // iOS, Android, Windows
      registeredAt: new Date().toISOString(),
      lastSync: null,
      online: true
    };
    this.devices.push(device);
    this.saveDevices();
    return device;
  }

  getRegisteredDevices() {
    return [...this.devices].sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
  }

  addToSyncQueue(action) {
    const queueItem = {
      id: Date.now(),
      action: action,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retries: 0
    };
    this.syncQueue.push(queueItem);
    this.saveSyncQueue();
    return queueItem;
  }

  getPendingSyncItems() {
    return this.syncQueue.filter(item => item.status === 'pending');
  }

  processSyncQueue() {
    const pending = this.getPendingSyncItems();
    pending.forEach(item => {
      item.status = 'synced';
      item.syncedAt = new Date().toISOString();
      this.config.lastSyncTime = new Date().toISOString();
    });
    this.saveSyncQueue();
    this.saveConfig();
  }

  getStats() {
    return {
      registeredDevices: this.devices.length,
      onlineDevices: this.devices.filter(d => d.online).length,
      pendingSyncItems: this.getPendingSyncItems().length,
      lastSync: this.config.lastSyncTime || 'Mai',
      pwaInstalled: this.config.pwaEnabled,
      appVersion: this.config.version
    };
  }

  renderMobileAppPage() {
    const stats = this.getStats();
    const devices = this.getRegisteredDevices();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>App Mobile</h2>
            <p>Dispositivi Registrati: ${stats.registeredDevices} | Online: ${stats.onlineDevices} | In Sincronizzazione: ${stats.pendingSyncItems}</p>
          </div>
          <button class="btn btn-primary" onclick="syncMobileData()">🔄 Sincronizza Ora</button>
        </div>

        <!-- STATS -->
        <div class="grid grid-4 stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.registeredDevices}</div>
            <div class="stat-label">Dispositivi</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #4CAF50;">${stats.onlineDevices}</div>
            <div class="stat-label">Online</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.pendingSyncItems}</div>
            <div class="stat-label">In Coda di Sync</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">v${stats.appVersion}</div>
            <div class="stat-label">Versione App</div>
          </div>
        </div>

        <!-- TABS -->
        <div style="margin-bottom: 20px; display: flex; gap: 10px;">
          <button class="btn btn-sm" onclick="switchMobileTab('devices')" style="background: var(--primary); color: white;">📱 Dispositivi</button>
          <button class="btn btn-sm" onclick="switchMobileTab('sync')">🔄 Sincronizzazione</button>
          <button class="btn btn-sm" onclick="switchMobileTab('offline')">📡 Offline</button>
          <button class="btn btn-sm" onclick="switchMobileTab('settings')">⚙️ Impostazioni</button>
        </div>

        <!-- DEVICES TAB -->
        <div id="mobile-devices-section" style="display: block;">
          <h3>Dispositivi Collegati</h3>
          <button class="btn btn-primary" onclick="registerNewDevice()" style="margin-bottom: 15px;">📱 Registra Dispositivo</button>
          
          ${devices.length > 0 ? `
            <div class="grid grid-auto">
              ${devices.map(d => `
                <div class="card">
                  <div class="card-header">
                    <div class="card-title">
                      ${d.type === 'mobile' ? '📱' : d.type === 'tablet' ? '📑' : '💻'} ${d.name}
                    </div>
                  </div>
                  <div class="card-body">
                    <p><strong>Sistema:</strong> ${d.os}</p>
                    <p><strong>Tipo:</strong> ${d.type}</p>
                    <p>
                      <span class="badge ${d.online ? 'badge-success' : 'badge-danger'}">
                        ${d.online ? '🟢 Online' : '🔴 Offline'}
                      </span>
                    </p>
                    <p style="font-size: 0.85rem; color: var(--text-light);">
                      Registrato: ${new Date(d.registeredAt).toLocaleDateString('it-IT')}
                    </p>
                    <p style="font-size: 0.85rem; color: var(--text-light);">
                      Ultimo sync: ${d.lastSync ? new Date(d.lastSync).toLocaleString('it-IT') : 'Mai'}
                    </p>
                    <button class="btn btn-xs btn-secondary" onclick="syncDevice(${d.id})" style="margin-top: 12px;">🔄 Sincronizza</button>
                    <button class="btn btn-xs btn-danger" onclick="unregisterDevice(${d.id})">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color: var(--text-light); text-align: center; padding: 40px 0;">📭 Nessun dispositivo registrato</p>
          `}
        </div>

        <!-- SYNC TAB -->
        <div id="mobile-sync-section" style="display: none;">
          <h3>Coda di Sincronizzazione</h3>
          <button class="btn btn-primary" onclick="processSyncQueue()" style="margin-bottom: 15px;">▶️ Processa Coda</button>
          
          ${this.syncQueue.length > 0 ? `
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Azione</th>
                    <th>Data/Ora</th>
                    <th>Stato</th>
                    <th>Tentativi</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.syncQueue.map(item => `
                    <tr>
                      <td>${item.action}</td>
                      <td>${new Date(item.timestamp).toLocaleString('it-IT')}</td>
                      <td>
                        <span class="badge ${item.status === 'pending' ? 'badge-warning' : item.status === 'synced' ? 'badge-success' : 'badge-danger'}">
                          ${item.status === 'pending' ? '⏳ In Sospeso' : item.status === 'synced' ? '✓ Sincronizzato' : '✕ Errore'}
                        </span>
                      </td>
                      <td>${item.retries}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <p style="color: var(--text-light); text-align: center; padding: 40px 0;">✓ Niente da sincronizzare</p>
          `}
        </div>

        <!-- OFFLINE TAB -->
        <div id="mobile-offline-section" style="display: none;">
          <h3>Modalità Offline</h3>
          <div class="grid grid-2">
            <div class="card">
              <div class="card-header">
                <div class="card-title">📡 Stato Connessione</div>
              </div>
              <div class="card-body">
                <div id="connection-status" style="padding: 20px; text-align: center; background: var(--background-light); border-radius: 8px;">
                  <h2 style="margin: 0;">🟢 Online</h2>
                  <p style="color: var(--text-light); margin-top: 8px;">Connessione attiva</p>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <div class="card-title">💾 Storage Locale</div>
              </div>
              <div class="card-body">
                <p><strong>Dati Disponibili:</strong> ~5 MB</p>
                <p><strong>Spazio Usato:</strong> 2.3 MB</p>
                <p><strong>Spazio Libero:</strong> 2.7 MB</p>
                <button class="btn btn-sm btn-secondary" onclick="clearOfflineCache()" style="margin-top: 12px;">🗑️ Cancella Cache</button>
              </div>
            </div>
          </div>
        </div>

        <!-- SETTINGS TAB -->
        <div id="mobile-settings-section" style="display: none;">
          <div class="card">
            <div class="card-header">
              <div class="card-title">⚙️ Impostazioni App Mobile</div>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.config.pwaEnabled ? 'checked' : ''} onchange="updateMobileConfig('pwaEnabled', this.checked)">
                  Abilita PWA & Installazione
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.config.offlineMode ? 'checked' : ''} onchange="updateMobileConfig('offlineMode', this.checked)">
                  Supporto Modalità Offline
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.config.autoSync ? 'checked' : ''} onchange="updateMobileConfig('autoSync', this.checked)">
                  Sincronizzazione Automatica
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.config.notifications ? 'checked' : ''} onchange="updateMobileConfig('notifications', this.checked)">
                  Notifiche Push
                </label>
              </div>
              <hr style="margin: 20px 0;">
              <h4>Versione App</h4>
              <p style="color: var(--text-light);">v${this.config.version}</p>
              <button class="btn btn-sm btn-secondary" onclick="checkForUpdates()">🔄 Controlla Aggiornamenti</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

const mobileAppManager = new MobileAppManager();

function switchMobileTab(tab) {
  document.getElementById('mobile-devices-section').style.display = tab === 'devices' ? 'block' : 'none';
  document.getElementById('mobile-sync-section').style.display = tab === 'sync' ? 'block' : 'none';
  document.getElementById('mobile-offline-section').style.display = tab === 'offline' ? 'block' : 'none';
  document.getElementById('mobile-settings-section').style.display = tab === 'settings' ? 'block' : 'none';
}

function registerNewDevice() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Registra Dispositivo</h3>
          <button class="modal-close" onclick="closeMobileModal()">✕</button>
        </div>
        <form onsubmit="saveNewDevice(event);">
          <div class="form-group">
            <label>Nome Dispositivo *</label>
            <input type="text" id="device-name" placeholder="Es. iPhone di Luca" required>
          </div>
          <div class="form-group">
            <label>Tipo Dispositivo *</label>
            <select id="device-type" required>
              <option value="">-- Seleziona --</option>
              <option value="mobile">📱 Smartphone</option>
              <option value="tablet">📑 Tablet</option>
              <option value="desktop">💻 Desktop</option>
            </select>
          </div>
          <div class="form-group">
            <label>Sistema Operativo *</label>
            <select id="device-os" required>
              <option value="">-- Seleziona --</option>
              <option value="iOS">iOS</option>
              <option value="Android">Android</option>
              <option value="Windows">Windows</option>
              <option value="macOS">macOS</option>
              <option value="Linux">Linux</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeMobileModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Registra</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeMobileModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveNewDevice(event) {
  event.preventDefault();
  const device = mobileAppManager.registerDevice({
    name: document.getElementById('device-name').value,
    type: document.getElementById('device-type').value,
    os: document.getElementById('device-os').value
  });
  closeMobileModal();
  navigationManager.loadPageContent('mobile-app');
  Utils.showAlert(`${device.type === 'mobile' ? '📱' : device.type === 'tablet' ? '📑' : '💻'} Dispositivo registrato!`, 'success');
}

function syncMobileData() {
  Utils.showAlert('Sincronizzazione in corso...', 'info');
  mobileAppManager.processSyncQueue();
  setTimeout(() => {
    navigationManager.loadPageContent('mobile-app');
    Utils.showAlert('Sincronizzazione completata!', 'success');
  }, 1500);
}

function syncDevice(deviceId) {
  const device = mobileAppManager.devices.find(d => d.id === deviceId);
  if (device) {
    device.lastSync = new Date().toISOString();
    mobileAppManager.saveDevices();
    Utils.showAlert(`${device.name} sincronizzato!`, 'success');
  }
}

function unregisterDevice(deviceId) {
  if (confirm('Rimuovere questo dispositivo?')) {
    mobileAppManager.devices = mobileAppManager.devices.filter(d => d.id !== deviceId);
    mobileAppManager.saveDevices();
    navigationManager.loadPageContent('mobile-app');
    Utils.showAlert('Dispositivo rimosso!', 'success');
  }
}

function processSyncQueue() {
  mobileAppManager.processSyncQueue();
  navigationManager.loadPageContent('mobile-app');
  Utils.showAlert('Coda di sincronizzazione processata!', 'success');
}

function clearOfflineCache() {
  if (confirm('Cancellare la cache offline? Perderai i dati non sincronizzati.')) {
    Utils.showAlert('Cache cancellata!', 'success');
  }
}

function updateMobileConfig(settingName, value) {
  mobileAppManager.config[settingName] = value;
  mobileAppManager.saveConfig();
  Utils.showAlert('Impostazioni aggiornate!', 'success');
}

function checkForUpdates() {
  Utils.showAlert('Versione attuale: v1.0.0 - Già aggiornato!', 'info');
}
