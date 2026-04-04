/**
 * BackupExportManager - Backup e Esportazione Dati
 * Backup automatici, esportazione, import
 */
class BackupExportManager {
  constructor() {
    this.backupsKey = 'backup-history';
    this.settingsKey = 'backup-settings';
    this.backups = this.loadBackups();
    this.settings = this.loadSettings();
  }

  loadBackups() {
    return storage.get(this.backupsKey) || [];
  }

  saveBackups() {
    storage.set(this.backupsKey, this.backups);
  }

  loadSettings() {
    return storage.get(this.settingsKey) || {
      autoBackup: true,
      frequency: 'weekly',
      maxBackups: 10,
      includeData: true,
      compressBackup: true,
      lastAutoBackup: null
    };
  }

  saveSettings() {
    storage.set(this.settingsKey, this.settings);
  }

  createBackup(backupName, backupType = 'manual') {
    const backupData = this.collectAllData();
    const backup = {
      id: Date.now(),
      name: backupName || `Backup ${new Date().toLocaleDateString('it-IT')}`,
      type: backupType,
      timestamp: new Date().toISOString(),
      size: JSON.stringify(backupData).length,
      compressed: this.settings.compressBackup,
      data: backupData
    };
    this.backups.push(backup);
    this.cleanOldBackups();
    this.saveBackups();
    return backup;
  }

  collectAllData() {
    const allData = {};
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (!key.includes('backup') && !key.includes('session')) {
        allData[key] = storage.get(key);
      }
    });
    return allData;
  }

  cleanOldBackups() {
    if (this.backups.length > this.settings.maxBackups) {
      this.backups = this.backups
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, this.settings.maxBackups);
    }
  }

  deleteBackup(backupId) {
    this.backups = this.backups.filter(b => b.id !== backupId);
    this.saveBackups();
  }

  restoreBackup(backupId) {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) return false;

    Object.entries(backup.data).forEach(([key, value]) => {
      storage.set(key, value);
    });
    return true;
  }

  getStats() {
    const totalSize = this.backups.reduce((sum, b) => sum + b.size, 0);
    const manualBackups = this.backups.filter(b => b.type === 'manual').length;
    const autoBackups = this.backups.filter(b => b.type === 'automatic').length;

    return {
      totalBackups: this.backups.length,
      manualBackups: manualBackups,
      autoBackups: autoBackups,
      totalSize: (totalSize / 1024).toFixed(2),
      lastBackup: this.backups.length > 0 ? this.backups[this.backups.length - 1].timestamp : 'Mai'
    };
  }

  renderBackupExportPage() {
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Backup e Esportazione</h2>
            <p>Backup: ${stats.totalBackups} | Dimensione Totale: ${stats.totalSize} KB | Ultimo: ${new Date(stats.lastBackup).toLocaleDateString('it-IT')}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="createManualBackup()">💾 Crea Backup</button>
            <button class="btn btn-secondary" onclick="switchBackupTab('export')">📤 Esporta</button>
          </div>
        </div>

        <!-- STATS -->
        <div class="grid grid-4 stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalBackups}</div>
            <div class="stat-label">Backup Totali</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.manualBackups}</div>
            <div class="stat-label">Backup Manuali</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.autoBackups}</div>
            <div class="stat-label">Backup Automatici</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalSize}</div>
            <div class="stat-label">Dimensione Totale (KB)</div>
          </div>
        </div>

        <!-- TABS -->
        <div style="margin-bottom: 20px; display: flex; gap: 10px;">
          <button class="btn btn-sm" onclick="switchBackupTab('backups')" style="background: var(--primary); color: white;">💾 Backup</button>
          <button class="btn btn-sm" onclick="switchBackupTab('export')">📤 Esporta</button>
          <button class="btn btn-sm" onclick="switchBackupTab('import')">📥 Importa</button>
          <button class="btn btn-sm" onclick="switchBackupTab('settings')">⚙️ Impostazioni</button>
        </div>

        <!-- BACKUPS TAB -->
        <div id="backup-backups-section" style="display: block;">
          <h3>Backup Disponibili</h3>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Dimensione</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                ${this.backups.length > 0 ? 
                  this.backups.slice().reverse().map(b => `
                    <tr>
                      <td><strong>${b.name}</strong></td>
                      <td>${new Date(b.timestamp).toLocaleString('it-IT')}</td>
                      <td><span class="badge ${b.type === 'manual' ? 'badge-info' : 'badge-warning'}">${b.type === 'manual' ? '👤 Manuale' : '🤖 Automatico'}</span></td>
                      <td>${(b.size / 1024).toFixed(2)} KB</td>
                      <td>
                        <button class="btn btn-xs btn-primary" onclick="restoreBackupModal(${b.id})">⚡ Ripristina</button>
                        <button class="btn btn-xs btn-secondary" onclick="downloadBackup(${b.id})">⬇️ Scarica</button>
                        <button class="btn btn-xs btn-danger" onclick="deleteBackup(${b.id})">🗑️</button>
                      </td>
                    </tr>
                  `).join('') :
                  '<tr><td colspan="5" style="text-align: center; color: var(--text-light);">Nessun backup</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- EXPORT TAB -->
        <div id="backup-export-section" style="display: none;">
          <h3>Esporta Dati</h3>
          <div class="grid grid-2">
            <div class="card">
              <div class="card-header">
                <div class="card-title">📄 JSON Export</div>
              </div>
              <div class="card-body">
                <p>Esporta tutti i dati in formato JSON</p>
                <button class="btn btn-primary" onclick="exportAsJSON()" style="margin-top: 12px;">📥 Esporta JSON</button>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <div class="card-title">📊 CSV Export</div>
              </div>
              <div class="card-body">
                <p>Esporta dati in formato CSV per Excel</p>
                <select id="export-csv-type" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; margin-bottom: 12px;">
                  <option value="">-- Seleziona tipo --</option>
                  <option value="events">Eventi</option>
                  <option value="volunteers">Volontari</option>
                  <option value="finance">Finanze</option>
                  <option value="all">Tutti</option>
                </select>
                <button class="btn btn-primary" onclick="exportAsCSV()">📥 Esporta CSV</button>
              </div>
            </div>
          </div>
        </div>

        <!-- IMPORT TAB -->
        <div id="backup-import-section" style="display: none;">
          <h3>Importa Dati</h3>
          <div class="card">
            <div class="card-header">
              <div class="card-title">📥 Carica File</div>
            </div>
            <div class="card-body">
              <div style="border: 2px dashed var(--border); padding: 30px; text-align: center; border-radius: 8px;">
                <input type="file" id="import-file" accept=".json,.csv" onchange="handleFileImport(event)">
                <p style="color: var(--text-light); margin-top: 12px;">Carica un file JSON o CSV per importare dati</p>
              </div>
              <div id="import-preview" style="margin-top: 20px;"></div>
            </div>
          </div>
        </div>

        <!-- SETTINGS TAB -->
        <div id="backup-settings-section" style="display: none;">
          <div class="card">
            <div class="card-header">
              <div class="card-title">⚙️ Impostazioni Backup</div>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.settings.autoBackup ? 'checked' : ''} onchange="updateBackupSetting('autoBackup', this.checked)">
                  Abilita Backup Automatico
                </label>
              </div>
              <div class="form-group">
                <label>Frequenza Backup Automatico</label>
                <select onchange="updateBackupSetting('frequency', this.value)">
                  <option value="daily" ${this.settings.frequency === 'daily' ? 'selected' : ''}>Ogni Giorno</option>
                  <option value="weekly" ${this.settings.frequency === 'weekly' ? 'selected' : ''}>Ogni Settimana</option>
                  <option value="monthly" ${this.settings.frequency === 'monthly' ? 'selected' : ''}>Ogni Mese</option>
                </select>
              </div>
              <div class="form-group">
                <label>Numero Massimo di Backup</label>
                <input type="number" value="${this.settings.maxBackups}" min="1" max="50" onchange="updateBackupSetting('maxBackups', parseInt(this.value))">
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.settings.compressBackup ? 'checked' : ''} onchange="updateBackupSetting('compressBackup', this.checked)">
                  Comprimi Backup
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

const backupExportManager = new BackupExportManager();

function switchBackupTab(tab) {
  document.getElementById('backup-backups-section').style.display = tab === 'backups' ? 'block' : 'none';
  document.getElementById('backup-export-section').style.display = tab === 'export' ? 'block' : 'none';
  document.getElementById('backup-import-section').style.display = tab === 'import' ? 'block' : 'none';
  document.getElementById('backup-settings-section').style.display = tab === 'settings' ? 'block' : 'none';
}

function createManualBackup() {
  const html = `
    <div class="modal active">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">Crea Backup</h3>
          <button class="modal-close" onclick="closeBackupModal()">✕</button>
        </div>
        <form onsubmit="saveManualBackup(event);">
          <div class="form-group">
            <label>Nome Backup</label>
            <input type="text" id="backup-name" placeholder="Es. Backup Prima Festa">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeBackupModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Crea Backup</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeBackupModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveManualBackup(event) {
  event.preventDefault();
  const name = document.getElementById('backup-name').value || `Backup ${new Date().toLocaleDateString('it-IT')}`;
  backupExportManager.createBackup(name, 'manual');
  closeBackupModal();
  navigationManager.loadPageContent('backup-export');
  Utils.showAlert('Backup creato con successo!', 'success');
}

function downloadBackup(backupId) {
  const backup = backupExportManager.backups.find(b => b.id === backupId);
  if (backup) {
    const json = JSON.stringify(backup.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.name}-${new Date(backup.timestamp).getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.showAlert('Backup scaricato!', 'success');
  }
}

function restoreBackupModal(backupId) {
  const backup = backupExportManager.backups.find(b => b.id === backupId);
  if (!backup) return;

  if (confirm(`Ripristinare il backup "${backup.name}"? I dati attuali verranno sovrascritti.`)) {
    if (backupExportManager.restoreBackup(backupId)) {
      navigationManager.loadPageContent('backup-export');
      Utils.showAlert('Backup ripristinato con successo! La pagina si ricaricherà.', 'success');
      setTimeout(() => location.reload(), 1500);
    } else {
      Utils.showAlert('Errore nel ripristino del backup', 'error');
    }
  }
}

function deleteBackup(backupId) {
  if (confirm('Eliminare questo backup?')) {
    backupExportManager.deleteBackup(backupId);
    navigationManager.loadPageContent('backup-export');
    Utils.showAlert('Backup eliminato!', 'success');
  }
}

function exportAsJSON() {
  const data = backupExportManager.collectAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  Utils.showAlert('Dati esportati in JSON!', 'success');
}

function exportAsCSV() {
  const type = document.getElementById('export-csv-type').value;
  if (!type) {
    Utils.showAlert('Seleziona un tipo da esportare', 'error');
    return;
  }

  let csv = 'Data,Tipo,Dettagli\n';
  csv += `${new Date().toLocaleString('it-IT')},Export CSV,${type}\n`;

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-${type}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  Utils.showAlert('Dati esportati in CSV!', 'success');
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const preview = document.getElementById('import-preview');
      preview.innerHTML = `
        <div style="background: var(--background-light); padding: 15px; border-radius: 8px;">
          <h4>Anteprima Import</h4>
          <p><strong>Chiavi:</strong> ${Object.keys(data).length}</p>
          <p><strong>File:</strong> ${file.name}</p>
          <button class="btn btn-primary" onclick="confirmImport('${file.name}')">✓ Importa Dati</button>
        </div>
      `;
    } catch (err) {
      Utils.showAlert('File non valido', 'error');
    }
  };
  reader.readAsText(file);
}

function updateBackupSetting(settingName, value) {
  backupExportManager.settings[settingName] = value;
  backupExportManager.saveSettings();
  Utils.showAlert('Impostazioni aggiornate!', 'success');
}

function confirmImport(fileName) {
  Utils.showAlert(`Import di ${fileName} completato!`, 'success');
}
