// Gestione Impostazioni
class SettingsManager {
  constructor() {
    const stored = storage.get('proloco-info');
    // Se c'è dato salvato ma incompleto, merge con defaults
    if (stored && stored.colors) {
      this.settings = stored;
    } else {
      this.settings = this.getDefaultSettings();
    }
  }

  // Impostazioni predefinite
  getDefaultSettings() {
    return {
      name: 'Pro Loco Locale',
      email: 'info@proloco.local',
      phone: '+39 000 000 0000',
      website: 'https://www.proloco.local',
      address: 'Via Principale, 1',
      city: 'Città',
      province: 'Provincia',
      region: 'Regione',
      foundingYear: new Date().getFullYear(),
      description: 'Benvenuto nella nostra Pro Loco',
      logo: null,
      colors: {
        primary: '#6366f1',
        secondary: '#10b981'
      },
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: ''
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false
      }
    };
  }

  // Ottieni impostazioni
  getSettings() {
    // Assicura che settings sia sempre valido
    if (!this.settings || !this.settings.colors) {
      this.settings = this.getDefaultSettings();
      this.save();
    }
    return this.settings;
  }

  // Aggiorna impostazioni
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.save();
    Utils.showAlert('Impostazioni aggiornate!', 'success');
  }

  // Aggiorna informazioni base
  updateBasicInfo(data) {
    this.settings.name = data.name;
    this.settings.email = data.email;
    this.settings.phone = data.phone;
    this.settings.website = data.website;
    this.settings.address = data.address;
    this.settings.city = data.city;
    this.settings.province = data.province;
    this.settings.region = data.region;
    this.settings.foundingYear = parseInt(data.foundingYear);
    this.settings.description = data.description;
    this.save();
    Utils.showAlert('Informazioni aggiornate!', 'success');
  }

  // Aggiorna social media
  updateSocialMedia(data) {
    if (!this.settings.socialMedia) {
      this.settings.socialMedia = this.getDefaultSettings().socialMedia;
    }
    this.settings.socialMedia = {
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      twitter: data.twitter || '',
      linkedin: data.linkedin || ''
    };
    this.save();
    Utils.showAlert('Social media aggiornati!', 'success');
  }

  // Aggiorna notifiche
  updateNotifications(data) {
    if (!this.settings.notifications) {
      this.settings.notifications = this.getDefaultSettings().notifications;
    }
    this.settings.notifications = {
      emailNotifications: data.emailNotifications || false,
      smsNotifications: data.smsNotifications || false
    };
    this.save();
    Utils.showAlert('Notifiche aggiornate!', 'success');
  }

  // Aggiorna colori
  updateColors(data) {
    if (!this.settings.colors) {
      this.settings.colors = this.getDefaultSettings().colors;
    }
    this.settings.colors = {
      primary: data.primary || this.settings.colors.primary,
      secondary: data.secondary || this.settings.colors.secondary
    };
    this.save();
    this.applyColors();
    Utils.showAlert('Colori aggiornati!', 'success');
  }

  // Applica colori al tema
  applyColors() {
    // Assicura che colors esista
    if (!this.settings.colors) {
      this.settings.colors = this.getDefaultSettings().colors;
    }
    const root = document.documentElement;
    root.style.setProperty('--primary', this.settings.colors.primary);
    root.style.setProperty('--secondary', this.settings.colors.secondary);
  }

  // Upload logo
  uploadLogo(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.settings.logo = e.target.result;
      this.save();
      Utils.showAlert('Logo caricato!', 'success');
    };
    reader.readAsDataURL(file);
  }

  // Esporta dati
  exportSettings() {
    const json = JSON.stringify(this.settings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'impostazioni-proloco.json';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    Utils.showAlert('Impostazioni esportate!', 'success');
  }

  // Importa dati
  importSettings(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        this.settings = { ...this.settings, ...imported };
        this.save();
        this.applyColors();
        Utils.showAlert('Impostazioni importate!', 'success');
      } catch (error) {
        Utils.showAlert('Errore nell\'import!', 'danger');
      }
    };
    reader.readAsText(file);
  }

  // Ripristina predefiniti
  resetToDefaults() {
    if (confirm('Sei sicuro di voler ripristinare le impostazioni predefinite?')) {
      this.settings = this.getDefaultSettings();
      this.save();
      this.applyColors();
      Utils.showAlert('Impostazioni ripristinate!', 'success');
    }
  }

  // Salva i dati
  save() {
    storage.set('proloco-info', this.settings);
  }

  // Rendering impostazioni
  renderSettings() {
    // Assicura che settings sia sempre valido
    if (!this.settings || !this.settings.colors || !this.settings.socialMedia || !this.settings.notifications) {
      this.settings = this.getDefaultSettings();
      this.save();
    }
    const settings = this.settings;

    return `
      <div class="settings-container">
        <!-- Basic Info -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Informazioni Base</div>
          </div>
          <div class="card-body">
            <form id="basicInfoForm">
              <div class="form-group">
                <label>Nome Pro Loco</label>
                <input type="text" id="setting-name" value="${settings.name}" placeholder="Nome della Pro Loco">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="setting-email" value="${settings.email}" placeholder="email@proloco.it">
              </div>
              <div class="form-group">
                <label>Telefono</label>
                <input type="tel" id="setting-phone" value="${settings.phone}" placeholder="+39 000 000 0000">
              </div>
              <div class="form-group">
                <label>Sito Web</label>
                <input type="url" id="setting-website" value="${settings.website}" placeholder="https://www.proloco.it">
              </div>
              <div class="form-group">
                <label>Indirizzo</label>
                <input type="text" id="setting-address" value="${settings.address}" placeholder="Via Principale, 1">
              </div>
              <div class="form-row">
                <div class="form-group" style="flex: 1;">
                  <label>Città</label>
                  <input type="text" id="setting-city" value="${settings.city}" placeholder="Città">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Provincia</label>
                  <input type="text" id="setting-province" value="${settings.province}" placeholder="Provincia">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group" style="flex: 1;">
                  <label>Regione</label>
                  <input type="text" id="setting-region" value="${settings.region}" placeholder="Regione">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Anno Fondazione</label>
                  <input type="number" id="setting-foundingYear" value="${settings.foundingYear}" min="1900" max="${new Date().getFullYear()}">
                </div>
              </div>
              <div class="form-group">
                <label>Descrizione</label>
                <textarea id="setting-description" placeholder="Descrizione della Pro Loco" style="min-height: 120px;">${settings.description}</textarea>
              </div>
              <button type="button" class="btn btn-primary" onclick="saveBasicInfo()">Salva Informazioni</button>
            </form>
          </div>
        </div>

        <!-- Theme Colors -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Tema e Colori</div>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label>Colore Primario</label>
                <div style="display: flex; gap: 10px;">
                  <input type="color" id="setting-colorPrimary" value="${settings.colors.primary}" style="width: 50px; height: 40px; cursor: pointer;">
                  <input type="text" id="setting-colorPrimaryHex" value="${settings.colors.primary}" style="flex: 1;">
                </div>
              </div>
              <div class="form-group" style="flex: 1;">
                <label>Colore Secondario</label>
                <div style="display: flex; gap: 10px;">
                  <input type="color" id="setting-colorSecondary" value="${settings.colors.secondary}" style="width: 50px; height: 40px; cursor: pointer;">
                  <input type="text" id="setting-colorSecondaryHex" value="${settings.colors.secondary}" style="flex: 1;">
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-primary" onclick="saveColors()">Applica Colori</button>
          </div>
        </div>

        <!-- Social Media -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Social Media</div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>Facebook</label>
              <input type="url" id="setting-facebook" value="${settings.socialMedia.facebook}" placeholder="https://facebook.com/...">
            </div>
            <div class="form-group">
              <label>Instagram</label>
              <input type="url" id="setting-instagram" value="${settings.socialMedia.instagram}" placeholder="https://instagram.com/...">
            </div>
            <div class="form-group">
              <label>Twitter</label>
              <input type="url" id="setting-twitter" value="${settings.socialMedia.twitter}" placeholder="https://twitter.com/...">
            </div>
            <div class="form-group">
              <label>LinkedIn</label>
              <input type="url" id="setting-linkedin" value="${settings.socialMedia.linkedin}" placeholder="https://linkedin.com/...">
            </div>
            <button type="button" class="btn btn-primary" onclick="saveSocialMedia()">Salva Social Media</button>
          </div>
        </div>

        <!-- Notifications -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Notifiche</div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="setting-emailNotifications" ${settings.notifications.emailNotifications ? 'checked' : ''}>
                <span>Abilita notifiche email</span>
              </label>
            </div>
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="setting-smsNotifications" ${settings.notifications.smsNotifications ? 'checked' : ''}>
                <span>Abilita notifiche SMS</span>
              </label>
            </div>
            <button type="button" class="btn btn-primary" onclick="saveNotifications()">Salva Preferenze</button>
          </div>
        </div>

        <!-- Data Management -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Gestione Dati</div>
          </div>
          <div class="card-body">
            <div style="display: grid; gap: 10px;">
              <button type="button" class="btn btn-secondary" onclick="settingsManager.exportSettings()">
                📥 Esporta Impostazioni
              </button>
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('importFile').click()">
                📤 Importa Impostazioni
              </button>
              <input type="file" id="importFile" accept=".json" style="display: none;" onchange="handleImport(event)">
              <button type="button" class="btn btn-danger" onclick="settingsManager.resetToDefaults()">
                🔄 Ripristina Predefiniti
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Istanza globale
const settingsManager = new SettingsManager();

// Funzioni di supporto
function saveBasicInfo() {
  settingsManager.updateBasicInfo({
    name: document.getElementById('setting-name').value,
    email: document.getElementById('setting-email').value,
    phone: document.getElementById('setting-phone').value,
    website: document.getElementById('setting-website').value,
    address: document.getElementById('setting-address').value,
    city: document.getElementById('setting-city').value,
    province: document.getElementById('setting-province').value,
    region: document.getElementById('setting-region').value,
    foundingYear: document.getElementById('setting-foundingYear').value,
    description: document.getElementById('setting-description').value
  });
  location.reload();
}

function saveSocialMedia() {
  settingsManager.updateSocialMedia({
    facebook: document.getElementById('setting-facebook').value,
    instagram: document.getElementById('setting-instagram').value,
    twitter: document.getElementById('setting-twitter').value,
    linkedin: document.getElementById('setting-linkedin').value
  });
}

function saveNotifications() {
  settingsManager.updateNotifications({
    emailNotifications: document.getElementById('setting-emailNotifications').checked,
    smsNotifications: document.getElementById('setting-smsNotifications').checked
  });
}

function saveColors() {
  settingsManager.updateColors({
    primary: document.getElementById('setting-colorPrimary').value,
    secondary: document.getElementById('setting-colorSecondary').value
  });
}

function handleImport(event) {
  const file = event.target.files[0];
  if (file) {
    settingsManager.importSettings(file);
  }
}
