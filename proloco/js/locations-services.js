/**
 * LocationsServicesManager - Gestione Spazi e Fornitori Servizi
 * Location, Spazi, Service Provider
 */
class LocationsServicesManager {
  constructor() {
    this.locationsKey = 'locations';
    this.servicesKey = 'service-providers';
    this.locations = this.loadLocations();
    this.providers = this.loadProviders();
  }

  loadLocations() {
    return storage.get(this.locationsKey) || [];
  }

  saveLocations() {
    storage.set(this.locationsKey, this.locations);
  }

  loadProviders() {
    return storage.get(this.servicesKey) || [];
  }

  saveProviders() {
    storage.set(this.servicesKey, this.providers);
  }

  // ===== LOCATION MANAGEMENT =====

  addLocation(location) {
    location.id = Date.now();
    location.createdAt = new Date().toISOString();
    this.locations.push(location);
    this.saveLocations();
    return location;
  }

  updateLocation(id, updates) {
    const location = this.locations.find(l => l.id === id);
    if (location) {
      Object.assign(location, updates);
      this.saveLocations();
      return location;
    }
    return null;
  }

  deleteLocation(id) {
    this.locations = this.locations.filter(l => l.id !== id);
    this.saveLocations();
  }

  getLocation(id) {
    return this.locations.find(l => l.id === id);
  }

  getAllLocations() {
    return [...this.locations].sort((a, b) => a.name.localeCompare(b.name));
  }

  // ===== SERVICE PROVIDER MANAGEMENT =====

  addProvider(provider) {
    provider.id = Date.now();
    provider.createdAt = new Date().toISOString();
    this.providers.push(provider);
    this.saveProviders();
    return provider;
  }

  updateProvider(id, updates) {
    const provider = this.providers.find(p => p.id === id);
    if (provider) {
      Object.assign(provider, updates);
      this.saveProviders();
      return provider;
    }
    return null;
  }

  deleteProvider(id) {
    this.providers = this.providers.filter(p => p.id !== id);
    this.saveProviders();
  }

  getProvider(id) {
    return this.providers.find(p => p.id === id);
  }

  getAllProviders() {
    return [...this.providers].sort((a, b) => a.name.localeCompare(b.name));
  }

  getProvidersByCategory(category) {
    return this.providers.filter(p => p.category === category);
  }

  // ===== STATISTICS =====

  getStats() {
    const categories = [...new Set(this.providers.map(p => p.category))];
    return {
      totalLocations: this.locations.length,
      totalProviders: this.providers.length,
      categories: categories.length
    };
  }

  // ===== RENDERING =====

  renderLocationsServicesPage() {
    const locations = this.getAllLocations();
    const providers = this.getAllProviders();
    const stats = this.getStats();
    const categories = [...new Set(providers.map(p => p.category))];

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Spazi e Fornitori Servizi</h2>
            <p>Spazi: ${stats.totalLocations} | Fornitori: ${stats.totalProviders} | Categorie: ${stats.categories}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="switchLocServTab('locations')">📍 Spazi</button>
            <button class="btn btn-secondary" onclick="switchLocServTab('providers')">👔 Fornitori</button>
          </div>
        </div>

        <!-- LOCATIONS TAB -->
        <div id="locsrv-locations-section" style="display: block;">
          <h3>Gestione Spazi e Location</h3>
          <button class="btn btn-primary" onclick="showLocationModal()" style="margin-bottom: 15px;">➕ Nuovo Spazio</button>
          
          <div class="grid grid-auto">
            ${locations.length > 0 ? 
              locations.map(l => this.renderLocationCard(l)).join('') :
              '<p style="grid-column: 1/-1; color: var(--text-light);">Nessuno spazio</p>'
            }
          </div>
        </div>

        <!-- PROVIDERS TAB -->
        <div id="locsrv-providers-section" style="display: none;">
          <button class="btn btn-primary" onclick="showProviderModal()" style="margin-bottom: 15px;">➕ Nuovo Fornitore</button>
          
          ${categories.length > 0 ? categories.map(cat => `
            <h3>${cat}</h3>
            <div class="grid grid-auto" style="margin-bottom: 30px;">
              ${this.getProvidersByCategory(cat).map(p => this.renderProviderCard(p)).join('')}
            </div>
          `).join('') : '<p style="grid-column: 1/-1; color: var(--text-light);">Nessun fornitore</p>'}
        </div>
      </div>
    `;
  }

  renderLocationCard(location) {
    const capacityClass = location.capacity > 500 ? 'success' : location.capacity > 200 ? 'warning' : 'info';
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">📍 ${location.name}</div>
            <div class="card-subtitle">${location.city || 'Provincia'}</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteLocation(${location.id})">🗑️</button>
        </div>
        <div class="card-body">
          <p><strong>Indirizzo:</strong> ${location.address}</p>
          <p><strong>Città:</strong> ${location.city}</p>
          <p><strong>Capienza:</strong> <span class="badge badge-${capacityClass}">${location.capacity} persone</span></p>
          ${location.phone ? `<p><strong>Telefono:</strong> <a href="tel:${location.phone}" style="color: var(--primary);">${location.phone}</a></p>` : ''}
          ${location.email ? `<p><strong>Email:</strong> <a href="mailto:${location.email}" style="color: var(--primary);">${location.email}</a></p>` : ''}
          ${location.facilities ? `<p><strong>Servizi:</strong> ${location.facilities}</p>` : ''}
          <button class="btn btn-sm btn-secondary" onclick="editLocation(${location.id})" style="margin-top: 10px;">✏️ Modifica</button>
        </div>
      </div>
    `;
  }

  renderProviderCard(provider) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">👔 ${provider.name}</div>
            <div class="card-subtitle">${provider.category}</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteProvider(${provider.id})">🗑️</button>
        </div>
        <div class="card-body">
          <p><strong>Servizio:</strong> ${provider.service}</p>
          <p><strong>Contatto:</strong> ${provider.contactName}</p>
          ${provider.phone ? `<p><strong>Telefono:</strong> <a href="tel:${provider.phone}" style="color: var(--primary);">${provider.phone}</a></p>` : ''}
          ${provider.email ? `<p><strong>Email:</strong> <a href="mailto:${provider.email}" style="color: var(--primary);">${provider.email}</a></p>` : ''}
          ${provider.price ? `<p><strong>Prezzo:</strong> €${provider.price}</p>` : ''}
          ${provider.rating ? `<p><strong>Valutazione:</strong> ${'⭐'.repeat(Math.floor(provider.rating))}</p>` : ''}
          ${provider.notes ? `<p style="color: var(--text-light);">${provider.notes}</p>` : ''}
        </div>
      </div>
    `;
  }
}

// Istanza globale
const locationsServicesManager = new LocationsServicesManager();

// ===== GLOBAL FUNCTIONS =====

function switchLocServTab(tab) {
  document.getElementById('locsrv-locations-section').style.display = tab === 'locations' ? 'block' : 'none';
  document.getElementById('locsrv-providers-section').style.display = tab === 'providers' ? 'block' : 'none';
}

function showLocationModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Spazio</h3>
          <button class="modal-close" onclick="closeLocationModal()">✕</button>
        </div>
        <form onsubmit="saveLocation(event);">
          <div class="form-group">
            <label>Nome Spazio *</label>
            <input type="text" id="location-name" required>
          </div>
          <div class="form-group">
            <label>Indirizzo *</label>
            <input type="text" id="location-address" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Città *</label>
              <input type="text" id="location-city" required>
            </div>
            <div class="form-group">
              <label>CAP</label>
              <input type="text" id="location-zip">
            </div>
          </div>
          <div class="form-group">
            <label>Capienza (persone) *</label>
            <input type="number" id="location-capacity" min="1" required>
          </div>
          <div class="form-group">
            <label>Telefono</label>
            <input type="tel" id="location-phone">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="location-email">
          </div>
          <div class="form-group">
            <label>Servizi disponibili</label>
            <textarea id="location-facilities" placeholder="Es: WiFi, Parcheggio, Riscaldamento, Cucina"></textarea>
          </div>
          <div class="form-group">
            <label>Note</label>
            <textarea id="location-notes"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeLocationModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva Spazio</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeLocationModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveLocation(event) {
  event.preventDefault();
  const location = {
    name: document.getElementById('location-name').value,
    address: document.getElementById('location-address').value,
    city: document.getElementById('location-city').value,
    zip: document.getElementById('location-zip').value,
    capacity: parseInt(document.getElementById('location-capacity').value),
    phone: document.getElementById('location-phone').value,
    email: document.getElementById('location-email').value,
    facilities: document.getElementById('location-facilities').value,
    notes: document.getElementById('location-notes').value
  };
  locationsServicesManager.addLocation(location);
  closeLocationModal();
  navigationManager.loadPageContent('locations-services');
  Utils.showAlert('Spazio salvato!', 'success');
}

function editLocation(locationId) {
  Utils.showAlert('Funzione disponibile prossimamente', 'info');
}

function deleteLocation(locationId) {
  if (confirm('Eliminare questo spazio?')) {
    locationsServicesManager.deleteLocation(locationId);
    navigationManager.loadPageContent('locations-services');
    Utils.showAlert('Spazio eliminato!', 'success');
  }
}

function showProviderModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Fornitore Servizi</h3>
          <button class="modal-close" onclick="closeProviderModal()">✕</button>
        </div>
        <form onsubmit="saveProvider(event);">
          <div class="form-group">
            <label>Nome Ditta *</label>
            <input type="text" id="provider-name" required>
          </div>
          <div class="form-group">
            <label>Categoria *</label>
            <select id="provider-category" required>
              <option value="">-- Seleziona --</option>
              <option value="Catering">Catering</option>
              <option value="Musica e Intrattenimento">Musica e Intrattenimento</option>
              <option value="Fotografia e Video">Fotografia e Video</option>
              <option value="Decorazioni">Decorazioni</option>
              <option value="Trasporti">Trasporti</option>
              <option value="Pulizie">Pulizie</option>
              <option value="Altro">Altro</option>
            </select>
          </div>
          <div class="form-group">
            <label>Servizio *</label>
            <input type="text" id="provider-service" placeholder="Descrizione del servizio" required>
          </div>
          <div class="form-group">
            <label>Contatto (Nome) *</label>
            <input type="text" id="provider-contact" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Telefono</label>
              <input type="tel" id="provider-phone">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="provider-email">
            </div>
          </div>
          <div class="form-group">
            <label>Prezzo (€)</label>
            <input type="number" id="provider-price" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>Valutazione (1-5)</label>
            <input type="number" id="provider-rating" min="1" max="5" step="0.5">
          </div>
          <div class="form-group">
            <label>Note</label>
            <textarea id="provider-notes"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeProviderModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva Fornitore</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeProviderModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveProvider(event) {
  event.preventDefault();
  const provider = {
    name: document.getElementById('provider-name').value,
    category: document.getElementById('provider-category').value,
    service: document.getElementById('provider-service').value,
    contactName: document.getElementById('provider-contact').value,
    phone: document.getElementById('provider-phone').value,
    email: document.getElementById('provider-email').value,
    price: document.getElementById('provider-price').value ? parseFloat(document.getElementById('provider-price').value) : null,
    rating: document.getElementById('provider-rating').value ? parseFloat(document.getElementById('provider-rating').value) : null,
    notes: document.getElementById('provider-notes').value
  };
  locationsServicesManager.addProvider(provider);
  closeProviderModal();
  navigationManager.loadPageContent('locations-services');
  Utils.showAlert('Fornitore salvato!', 'success');
}

function deleteProvider(providerId) {
  if (confirm('Eliminare questo fornitore?')) {
    locationsServicesManager.deleteProvider(providerId);
    navigationManager.loadPageContent('locations-services');
    Utils.showAlert('Fornitore eliminato!', 'success');
  }
}
