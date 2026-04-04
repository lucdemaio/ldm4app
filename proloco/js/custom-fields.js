/**
 * CustomFieldsManager - Campi Personalizzati
 * Estendi datamodel con campi personalizzati
 */
class CustomFieldsManager {
  constructor() {
    this.fieldsKey = 'custom-fields';
    this.valuesKey = 'custom-field-values';
    this.fields = this.loadFields();
    this.values = this.loadValues();
  }

  loadFields() {
    return storage.get(this.fieldsKey) || [];
  }

  saveFields() {
    storage.set(this.fieldsKey, this.fields);
  }

  loadValues() {
    return storage.get(this.valuesKey) || [];
  }

  saveValues() {
    storage.set(this.valuesKey, this.values);
  }

  createField(field) {
    field.id = Date.now();
    field.createdAt = new Date().toISOString();
    field.required = field.required || false;
    field.visible = field.visible !== false;
    this.fields.push(field);
    this.saveFields();
    return field;
  }

  updateField(fieldId, updates) {
    const field = this.fields.find(f => f.id === fieldId);
    if (field) {
      Object.assign(field, updates);
      this.saveFields();
      return field;
    }
    return null;
  }

  deleteField(fieldId) {
    this.fields = this.fields.filter(f => f.id !== fieldId);
    this.values = this.values.filter(v => v.fieldId !== fieldId);
    this.saveFields();
    this.saveValues();
  }

  getFieldsByEntity(entityType) {
    return this.fields.filter(f => f.entityType === entityType && f.visible);
  }

  setFieldValue(entityId, fieldId, value) {
    let record = this.values.find(v => v.entityId === entityId && v.fieldId === fieldId);
    if (!record) {
      record = {
        id: Date.now(),
        entityId: entityId,
        fieldId: fieldId,
        value: value,
        createdAt: new Date().toISOString()
      };
      this.values.push(record);
    } else {
      record.value = value;
      record.updatedAt = new Date().toISOString();
    }
    this.saveValues();
    return record;
  }

  getFieldValue(entityId, fieldId) {
    const record = this.values.find(v => v.entityId === entityId && v.fieldId === fieldId);
    return record ? record.value : null;
  }

  getEntityValues(entityId) {
    return this.values.filter(v => v.entityId === entityId);
  }

  getStats() {
    const byType = {};
    this.fields.forEach(f => {
      byType[f.entityType] = (byType[f.entityType] || 0) + 1;
    });
    return {
      totalFields: this.fields.length,
      totalValues: this.values.length,
      byType: byType
    };
  }

  renderCustomFieldsPage() {
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Campi Personalizzati</h2>
            <p>Campi: ${stats.totalFields} | Valori: ${stats.totalValues}</p>
          </div>
          <button class="btn btn-primary" onclick="showNewFieldModal()">➕ Nuovo Campo</button>
        </div>

        <!-- STATS -->
        <div class="grid grid-4 stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalFields}</div>
            <div class="stat-label">Campi Totali</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalValues}</div>
            <div class="stat-label">Valori Registrati</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Object.keys(stats.byType).length}</div>
            <div class="stat-label">Tipi di Entità</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.fields.filter(f => f.required).length}</div>
            <div class="stat-label">Campi Obbligatori</div>
          </div>
        </div>

        <!-- FIELDS TABLE -->
        <h3 style="margin-top: 30px;">Campi Definiti</h3>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Nome Campo</th>
                <th>Tipo</th>
                <th>Entità</th>
                <th>Obbligatorio</th>
                <th>Opzioni</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              ${this.fields.length > 0 ? 
                this.fields.map(f => `
                  <tr>
                    <td><strong>${f.name}</strong></td>
                    <td><span class="badge badge-info">${f.type}</span></td>
                    <td>${f.entityType}</td>
                    <td>${f.required ? '✓ Si' : 'No'}</td>
                    <td>
                      ${f.options ? `
                        <details>
                          <summary>Opzioni (${f.options.length})</summary>
                          <ul style="margin: 8px 0; padding-left: 20px;">
                            ${f.options.map(o => `<li>${o}</li>`).join('')}
                          </ul>
                        </details>
                      ` : 'N/A'}
                    </td>
                    <td>
                      <button class="btn btn-xs btn-secondary" onclick="editFieldModal(${f.id})">✏️</button>
                      <button class="btn btn-xs btn-danger" onclick="deleteField(${f.id})">🗑️</button>
                    </td>
                  </tr>
                `).join('') :
                '<tr><td colspan="6" style="text-align: center; color: var(--text-light);">Nessun campo personalizzato</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <!-- ENTITY TYPE BREAKDOWN -->
        <h3 style="margin-top: 30px;">Campi per Tipo di Entità</h3>
        <div class="grid grid-auto">
          ${Object.entries(stats.byType).map(([entityType, count]) => `
            <div class="card">
              <div class="card-header">
                <div class="card-title">${entityType}</div>
              </div>
              <div class="card-body">
                <p><strong>Campi:</strong> ${count}</p>
                <button class="btn btn-sm btn-primary" onclick="viewEntityFields('${entityType}')" style="margin-top: 12px;">Visualizza</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

const customFieldsManager = new CustomFieldsManager();

function showNewFieldModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Campo Personalizzato</h3>
          <button class="modal-close" onclick="closeFieldModal()">✕</button>
        </div>
        <form onsubmit="saveNewField(event);">
          <div class="form-group">
            <label>Nome Campo *</label>
            <input type="text" id="field-name" required placeholder="Es. Codice Fiscale">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Tipo Campo *</label>
              <select id="field-type" onchange="updateFieldTypeOptions()" required>
                <option value="">-- Seleziona --</option>
                <option value="text">Testo</option>
                <option value="number">Numero</option>
                <option value="date">Data</option>
                <option value="email">Email</option>
                <option value="phone">Telefono</option>
                <option value="select">Dropdown</option>
                <option value="checkbox">Checkbox</option>
                <option value="textarea">Area Testo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tipo Entità *</label>
              <select id="field-entity" required>
                <option value="">-- Seleziona --</option>
                <option value="events">Eventi</option>
                <option value="volunteers">Volontari</option>
                <option value="sponsors">Sponsor</option>
                <option value="contacts">Contatti</option>
                <option value="venue">Venue</option>
                <option value="custom">Personalizzato</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="field-required"> Obbligatorio
            </label>
          </div>
          <div id="field-options-group" style="display: none;">
            <label>Opzioni (una per riga)</label>
            <textarea id="field-options" rows="4" placeholder="Opzione 1&#10;Opzione 2&#10;Opzione 3"></textarea>
          </div>
          <div class="form-group">
            <label>Descrizione/Aiuto</label>
            <textarea id="field-description" rows="2"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeFieldModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Crea Campo</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeFieldModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function updateFieldTypeOptions() {
  const type = document.getElementById('field-type').value;
  const optionsGroup = document.getElementById('field-options-group');
  optionsGroup.style.display = (type === 'select' || type === 'checkbox') ? 'block' : 'none';
}

function saveNewField(event) {
  event.preventDefault();
  const fieldType = document.getElementById('field-type').value;
  const field = {
    name: document.getElementById('field-name').value,
    type: fieldType,
    entityType: document.getElementById('field-entity').value,
    required: document.getElementById('field-required').checked,
    description: document.getElementById('field-description').value
  };

  if ((fieldType === 'select' || fieldType === 'checkbox') && document.getElementById('field-options').value) {
    field.options = document.getElementById('field-options').value
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0);
  }

  customFieldsManager.createField(field);
  closeFieldModal();
  navigationManager.loadPageContent('custom-fields');
  Utils.showAlert('Campo personalizzato creato!', 'success');
}

function deleteField(fieldId) {
  if (confirm('Eliminare questo campo personalizzato? Verranno eliminati anche tutti i valori associati.')) {
    customFieldsManager.deleteField(fieldId);
    navigationManager.loadPageContent('custom-fields');
    Utils.showAlert('Campo eliminato!', 'success');
  }
}

function editFieldModal(fieldId) {
  const field = customFieldsManager.fields.find(f => f.id === fieldId);
  if (!field) return;

  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Modifica Campo</h3>
          <button class="modal-close" onclick="closeFieldModal()">✕</button>
        </div>
        <form onsubmit="updateField(event, ${fieldId});">
          <div class="form-group">
            <label>Nome Campo *</label>
            <input type="text" id="field-name" value="${field.name}" required>
          </div>
          <div class="form-group">
            <label>Descrizione</label>
            <textarea id="field-description" rows="2">${field.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="field-required" ${field.required ? 'checked' : ''}> Obbligatorio
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeFieldModal()">Annulla</button>
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

function updateField(event, fieldId) {
  event.preventDefault();
  const updates = {
    name: document.getElementById('field-name').value,
    description: document.getElementById('field-description').value,
    required: document.getElementById('field-required').checked
  };
  customFieldsManager.updateField(fieldId, updates);
  closeFieldModal();
  navigationManager.loadPageContent('custom-fields');
  Utils.showAlert('Campo aggiornato!', 'success');
}

function viewEntityFields(entityType) {
  const fields = customFieldsManager.getFieldsByEntity(entityType);
  const count = fields.length;
  Utils.showAlert(`${entityType}: ${count} campi personalizzati`, 'info');
}
