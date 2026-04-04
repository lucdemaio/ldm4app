/**
 * EquipmentInventoryManager - Inventario Attrezzature
 * Gestione attrezzature, stock, beni
 */
class EquipmentInventoryManager {
  constructor() {
    this.storageKey = 'equipment-inventory';
    this.equipment = this.loadEquipment();
  }

  loadEquipment() {
    return storage.get(this.storageKey) || [];
  }

  saveEquipment() {
    storage.set(this.storageKey, this.equipment);
  }

  addEquipment(item) {
    item.id = Date.now();
    item.createdAt = new Date().toISOString();
    item.status = item.status || 'disponibile';
    item.lastMaintenance = item.lastMaintenance || new Date().toISOString();
    this.equipment.push(item);
    this.saveEquipment();
    return item;
  }

  updateEquipment(id, updates) {
    const item = this.equipment.find(e => e.id === id);
    if (item) {
      Object.assign(item, updates);
      this.saveEquipment();
      return item;
    }
    return null;
  }

  deleteEquipment(id) {
    this.equipment = this.equipment.filter(e => e.id !== id);
    this.saveEquipment();
  }

  getEquipment(id) {
    return this.equipment.find(e => e.id === id);
  }

  getAllEquipment() {
    return [...this.equipment].sort((a, b) => a.name.localeCompare(b.name));
  }

  getByCategory(category) {
    return this.equipment.filter(e => e.category === category);
  }

  getByStatus(status) {
    return this.equipment.filter(e => e.status === status);
  }

  getLowStockItems() {
    return this.equipment.filter(e => e.quantity && e.quantity <= 5);
  }

  getStats() {
    return {
      total: this.equipment.length,
      disponibile: this.getByStatus('disponibile').length,
      inuso: this.getByStatus('in-uso').length,
      manomesso: this.getByStatus('manomesso').length,
      totalValue: this.equipment.reduce((sum, e) => sum + (e.price || 0), 0),
      lowStock: this.getLowStockItems().length
    };
  }

  renderEquipmentPage() {
    const equipment = this.getAllEquipment();
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Inventario Attrezzature</h2>
            <p>Totale: ${stats.total} | Disponibili: ${stats.disponibile} | In uso: ${stats.inuso} | Valore: €${stats.totalValue.toFixed(2)}</p>
          </div>
          <button class="btn btn-primary" onclick="showEquipmentModal()">➕ Nuova Attrezzatura</button>
        </div>

        <!-- STATS -->
        <div class="grid grid-4 stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Totale Attrezzature</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #4CAF50;">${stats.disponibile}</div>
            <div class="stat-label">Disponibili</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #FF9800;">${stats.inuso}</div>
            <div class="stat-label">In Uso</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #F44336;">${stats.lowStock}</div>
            <div class="stat-label">Stock Ridotto</div>
          </div>
        </div>

        <!-- FILTERS -->
        <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-sm" onclick="filterEquipment('all')" style="background: var(--primary); color: white;">Tutti</button>
          <button class="btn btn-sm" onclick="filterEquipment('disponibile')">Disponibili</button>
          <button class="btn btn-sm" onclick="filterEquipment('in-uso')">In Uso</button>
          <button class="btn btn-sm" onclick="filterEquipment('manomesso')">Guasti</button>
        </div>

        <!-- EQUIPMENT TABLE -->
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Quantità</th>
                <th>Condizione</th>
                <th>Prezzo</th>
                <th>Ultimo Controllo</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              ${equipment.length > 0 ? 
                equipment.map(e => this.renderEquipmentRow(e)).join('') :
                '<tr><td colspan="7" style="text-align: center; color: var(--text-light);">Nessuna attrezzatura</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderEquipmentRow(item) {
    const statusBadge = {
      'disponibile': '<span class="badge badge-success">✓ Disponibile</span>',
      'in-uso': '<span class="badge badge-warning">⟳ In Uso</span>',
      'manomesso': '<span class="badge badge-danger">⚠ Guasto</span>'
    }[item.status] || '<span class="badge">Sconosciuto</span>';

    const lastCheck = new Date(item.lastMaintenance).toLocaleDateString('it-IT');

    return `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${item.category}</td>
        <td>${item.quantity || 1}</td>
        <td>${statusBadge}</td>
        <td>€${(item.price || 0).toFixed(2)}</td>
        <td>${lastCheck}</td>
        <td>
          <button class="btn btn-xs btn-secondary" onclick="editEquipment(${item.id})">✏️</button>
          <button class="btn btn-xs btn-danger" onclick="deleteEquipment(${item.id})">🗑️</button>
        </td>
      </tr>
    `;
  }
}

const equipmentManager = new EquipmentInventoryManager();

function filterEquipment(status) {
  if (status === 'all') {
    // Show all
    document.querySelectorAll('tbody tr').forEach(row => row.style.display = '');
  } else {
    document.querySelectorAll('tbody tr').forEach(row => {
      const cellContent = row.innerHTML;
      row.style.display = cellContent.includes(getStatusText(status)) ? '' : 'none';
    });
  }
}

function getStatusText(status) {
  const map = {
    'disponibile': 'Disponibile',
    'in-uso': 'In Uso',
    'manomesso': 'Guasto'
  };
  return map[status] || status;
}

function showEquipmentModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuova Attrezzatura</h3>
          <button class="modal-close" onclick="closeEquipmentModal()">✕</button>
        </div>
        <form onsubmit="saveEquipment(event);">
          <div class="form-row">
            <div class="form-group">
              <label>Nome *</label>
              <input type="text" id="eq-name" required>
            </div>
            <div class="form-group">
              <label>Categoria *</label>
              <select id="eq-category" required>
                <option value="">-- Seleziona --</option>
                <option value="Strutture">Strutture</option>
                <option value="Audio/Video">Audio/Video</option>
                <option value="Illuminazione">Illuminazione</option>
                <option value="Arredo">Arredo</option>
                <option value="Utensili">Utensili</option>
                <option value="Altro">Altro</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Quantità</label>
              <input type="number" id="eq-quantity" value="1" min="1">
            </div>
            <div class="form-group">
              <label>Prezzo Unitario</label>
              <input type="number" id="eq-price" step="0.01">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Condition</label>
              <select id="eq-status">
                <option value="disponibile">Disponibile</option>
                <option value="in-uso">In Uso</option>
                <option value="manomesso">Guasto</option>
              </select>
            </div>
            <div class="form-group">
              <label>Posizione</label>
              <input type="text" id="eq-location" placeholder="Es. Magazzino A">
            </div>
          </div>
          <div class="form-group">
            <label>Note</label>
            <textarea id="eq-notes" rows="3"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeEquipmentModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva Attrezzatura</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeEquipmentModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveEquipment(event) {
  event.preventDefault();
  const item = {
    name: document.getElementById('eq-name').value,
    category: document.getElementById('eq-category').value,
    quantity: parseInt(document.getElementById('eq-quantity').value) || 1,
    price: parseFloat(document.getElementById('eq-price').value) || 0,
    status: document.getElementById('eq-status').value,
    location: document.getElementById('eq-location').value,
    notes: document.getElementById('eq-notes').value
  };
  equipmentManager.addEquipment(item);
  closeEquipmentModal();
  navigationManager.loadPageContent('equipment-inventory');
  Utils.showAlert('Attrezzatura aggiunta!', 'success');
}

function editEquipment(equipmentId) {
  const item = equipmentManager.getEquipment(equipmentId);
  if (item) {
    const html = `
      <div class="modal active">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Modifica Attrezzatura</h3>
            <button class="modal-close" onclick="closeEquipmentModal()">✕</button>
          </div>
          <form onsubmit="updateEquipment(event, ${equipmentId});">
            <div class="form-row">
              <div class="form-group">
                <label>Nome *</label>
                <input type="text" id="eq-name" value="${item.name}" required>
              </div>
              <div class="form-group">
                <label>Categoria *</label>
                <select id="eq-category" required>
                  <option value="Strutture" ${item.category === 'Strutture' ? 'selected' : ''}>Strutture</option>
                  <option value="Audio/Video" ${item.category === 'Audio/Video' ? 'selected' : ''}>Audio/Video</option>
                  <option value="Illuminazione" ${item.category === 'Illuminazione' ? 'selected' : ''}>Illuminazione</option>
                  <option value="Arredo" ${item.category === 'Arredo' ? 'selected' : ''}>Arredo</option>
                  <option value="Utensili" ${item.category === 'Utensili' ? 'selected' : ''}>Utensili</option>
                  <option value="Altro" ${item.category === 'Altro' ? 'selected' : ''}>Altro</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Quantità</label>
                <input type="number" id="eq-quantity" value="${item.quantity || 1}" min="1">
              </div>
              <div class="form-group">
                <label>Prezzo Unitario</label>
                <input type="number" id="eq-price" value="${item.price || 0}" step="0.01">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Condition</label>
                <select id="eq-status">
                  <option value="disponibile" ${item.status === 'disponibile' ? 'selected' : ''}>Disponibile</option>
                  <option value="in-uso" ${item.status === 'in-uso' ? 'selected' : ''}>In Uso</option>
                  <option value="manomesso" ${item.status === 'manomesso' ? 'selected' : ''}>Guasto</option>
                </select>
              </div>
              <div class="form-group">
                <label>Posizione</label>
                <input type="text" id="eq-location" value="${item.location || ''}">
              </div>
            </div>
            <div class="form-group">
              <label>Note</label>
              <textarea id="eq-notes" rows="3">${item.notes || ''}</textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeEquipmentModal()">Annulla</button>
              <button type="submit" class="btn btn-primary">Salva Cambiamenti</button>
            </div>
          </form>
        </div>
      </div>
    `;
    const container = document.getElementById('modal-container');
    container.innerHTML = html;
    container.classList.add('visible');
  }
}

function updateEquipment(event, equipmentId) {
  event.preventDefault();
  const updates = {
    name: document.getElementById('eq-name').value,
    category: document.getElementById('eq-category').value,
    quantity: parseInt(document.getElementById('eq-quantity').value) || 1,
    price: parseFloat(document.getElementById('eq-price').value) || 0,
    status: document.getElementById('eq-status').value,
    location: document.getElementById('eq-location').value,
    notes: document.getElementById('eq-notes').value
  };
  equipmentManager.updateEquipment(equipmentId, updates);
  closeEquipmentModal();
  navigationManager.loadPageContent('equipment-inventory');
  Utils.showAlert('Attrezzatura aggiornata!', 'success');
}

function deleteEquipment(equipmentId) {
  if (confirm('Eliminare questa attrezzatura?')) {
    equipmentManager.deleteEquipment(equipmentId);
    navigationManager.loadPageContent('equipment-inventory');
    Utils.showAlert('Attrezzatura eliminata!', 'success');
  }
}
