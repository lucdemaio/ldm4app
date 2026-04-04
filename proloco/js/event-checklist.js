/**
 * EventChecklistManager - Gestione Checklists Evento
 * Pre-evento, Durante evento, Post-evento
 */
class EventChecklistManager {
  constructor() {
    this.storageKey = 'event-checklists';
    this.checklists = this.loadChecklists();
  }

  loadChecklists() {
    return storage.get(this.storageKey) || [];
  }

  saveChecklists() {
    storage.set(this.storageKey, this.checklists);
  }

  // ===== CHECKLIST CRUD =====

  addChecklist(checklist) {
    checklist.id = Date.now();
    checklist.createdAt = new Date().toISOString();
    checklist.items = checklist.items || [];
    this.checklists.push(checklist);
    this.saveChecklists();
    return checklist;
  }

  updateChecklist(id, updates) {
    const checklist = this.checklists.find(c => c.id === id);
    if (checklist) {
      Object.assign(checklist, updates);
      this.saveChecklists();
      return checklist;
    }
    return null;
  }

  deleteChecklist(id) {
    this.checklists = this.checklists.filter(c => c.id !== id);
    this.saveChecklists();
  }

  getChecklist(id) {
    return this.checklists.find(c => c.id === id);
  }

  getAllChecklists() {
    return [...this.checklists].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getChecklistsByType(type) {
    return this.checklists.filter(c => c.type === type);
  }

  // ===== ITEM MANAGEMENT =====

  addItemToChecklist(checklistId, item) {
    const checklist = this.getChecklist(checklistId);
    if (checklist) {
      item.id = Date.now();
      item.completed = false;
      checklist.items.push(item);
      this.saveChecklists();
      return item;
    }
    return null;
  }

  toggleItemCompletion(checklistId, itemId) {
    const checklist = this.getChecklist(checklistId);
    if (checklist) {
      const item = checklist.items.find(i => i.id === itemId);
      if (item) {
        item.completed = !item.completed;
        this.saveChecklists();
        return item;
      }
    }
    return null;
  }

  deleteItemFromChecklist(checklistId, itemId) {
    const checklist = this.getChecklist(checklistId);
    if (checklist) {
      checklist.items = checklist.items.filter(i => i.id !== itemId);
      this.saveChecklists();
    }
  }

  // ===== STATISTICS =====

  getStats() {
    const preEvent = this.getChecklistsByType('pre-event');
    const duringEvent = this.getChecklistsByType('during-event');
    const postEvent = this.getChecklistsByType('post-event');

    return {
      total: this.checklists.length,
      preEvent: preEvent.length,
      duringEvent: duringEvent.length,
      postEvent: postEvent.length
    };
  }

  getChecklistProgress(checklistId) {
    const checklist = this.getChecklist(checklistId);
    if (!checklist || checklist.items.length === 0) return 0;
    const completed = checklist.items.filter(i => i.completed).length;
    return Math.round((completed / checklist.items.length) * 100);
  }

  // ===== RENDERING =====

  renderChecklistPage() {
    const checklists = this.getAllChecklists();
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Checklists Evento</h2>
            <p>Totale: ${stats.total} | Pre-evento: ${stats.preEvent} | Durante: ${stats.duringEvent} | Post: ${stats.postEvent}</p>
          </div>
          <button class="btn btn-primary" onclick="showChecklistModal()">➕ Nuova Checklist</button>
        </div>

        <!-- PRE-EVENT CHECKLISTS -->
        ${stats.preEvent > 0 ? `
          <h3>📋 Checklists Pre-Evento (${stats.preEvent})</h3>
          <div class="grid grid-auto" style="margin-bottom: 30px;">
            ${this.getChecklistsByType('pre-event').map(c => this.renderChecklistCard(c)).join('')}
          </div>
        ` : ''}

        <!-- DURING-EVENT CHECKLISTS -->
        ${stats.duringEvent > 0 ? `
          <h3>⏱️ Checklists Durante l'Evento (${stats.duringEvent})</h3>
          <div class="grid grid-auto" style="margin-bottom: 30px;">
            ${this.getChecklistsByType('during-event').map(c => this.renderChecklistCard(c)).join('')}
          </div>
        ` : ''}

        <!-- POST-EVENT CHECKLISTS -->
        ${stats.postEvent > 0 ? `
          <h3>✅ Checklists Post-Evento (${stats.postEvent})</h3>
          <div class="grid grid-auto" style="margin-bottom: 30px;">
            ${this.getChecklistsByType('post-event').map(c => this.renderChecklistCard(c)).join('')}
          </div>
        ` : ''}

        ${checklists.length === 0 ? `<p style="color: var(--text-light); text-align: center;">Nessuna checklist creata. Inizia aggiungendone una!</p>` : ''}
      </div>
    `;
  }

  renderChecklistCard(checklist) {
    const progress = this.getChecklistProgress(checklist.id);
    const completed = checklist.items.filter(i => i.completed).length;
    
    const typeLabels = {
      'pre-event': '📋 Pre-Evento',
      'during-event': '⏱️ Durante',
      'post-event': '✅ Post-Evento'
    };

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${typeLabels[checklist.type] || 'Checklist'}</div>
            <div class="card-subtitle">${checklist.title}</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteChecklist(${checklist.id})">🗑️</button>
        </div>
        <div class="card-body">
          <p><strong>Progresso:</strong> ${completed}/${checklist.items.length} completati</p>
          <div style="width: 100%; height: 8px; background: var(--border); border-radius: 4px; margin: 10px 0;">
            <div style="height: 100%; width: ${progress}%; background: var(--primary); border-radius: 4px;"></div>
          </div>
          <p style="color: var(--text-light); text-align: center;">${progress}%</p>
          <button class="btn btn-sm btn-primary" onclick="expandChecklist(${checklist.id})" style="width: 100%; margin-top: 10px;">📋 Visualizza Dettagli</button>
        </div>
      </div>
    `;
  }
}

// Istanza globale
const eventChecklistManager = new EventChecklistManager();

// ===== GLOBAL FUNCTIONS =====

function showChecklistModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuova Checklist</h3>
          <button class="modal-close" onclick="closeChecklistModal()">✕</button>
        </div>
        <form onsubmit="saveChecklist(event);">
          <div class="form-group">
            <label>Titolo Checklist *</label>
            <input type="text" id="checklist-title" placeholder="Es: Preparazione Evento" required>
          </div>
          <div class="form-group">
            <label>Tipo *</label>
            <select id="checklist-type" required>
              <option value="">-- Seleziona --</option>
              <option value="pre-event">📋 Pre-Evento</option>
              <option value="during-event">⏱️ Durante l'Evento</option>
              <option value="post-event">✅ Post-Evento</option>
            </select>
          </div>
          <div class="form-group">
            <label>Descrizione</label>
            <textarea id="checklist-description" placeholder="Descrizione della checklist"></textarea>
          </div>
          <div class="form-group">
            <label>Evento Correlato (opzionale)</label>
            <select id="checklist-event">
              <option value="">-- Nessun evento --</option>
            </select>
          </div>
          <div class="form-group">
            <label>Elementi Iniziali (inserisci uno per riga)</label>
            <textarea id="checklist-items" placeholder="Elemento 1\nElemento 2\nElemento 3" rows="6"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeChecklistModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Crea Checklist</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeChecklistModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveChecklist(event) {
  event.preventDefault();
  
  const itemsText = document.getElementById('checklist-items').value;
  const items = itemsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(text => ({ text, completed: false }));

  const checklist = {
    title: document.getElementById('checklist-title').value,
    type: document.getElementById('checklist-type').value,
    description: document.getElementById('checklist-description').value,
    eventId: document.getElementById('checklist-event').value || null,
    items: items
  };

  if (!checklist.title || !checklist.type) {
    Utils.showAlert('Completa i campi obbligatori!', 'danger');
    return;
  }

  eventChecklistManager.addChecklist(checklist);
  closeChecklistModal();
  navigationManager.loadPageContent('event-checklist');
  Utils.showAlert('Checklist creata!', 'success');
}

function expandChecklist(checklistId) {
  const checklist = eventChecklistManager.getChecklist(checklistId);
  if (!checklist) return;

  const itemsHtml = checklist.items.map(item => `
    <div style="display: flex; gap: 10px; padding: 10px; border-bottom: 1px solid var(--border); align-items: center;">
      <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleChecklistItem(${checklistId}, ${item.id})" style="width: 20px; height: 20px; cursor: pointer;">
      <span style="flex: 1; ${item.completed ? 'text-decoration: line-through; color: var(--text-light);' : ''}">${item.text}</span>
      <button class="btn btn-sm btn-danger" onclick="deleteChecklistItem(${checklistId}, ${item.id})">🗑️</button>
    </div>
  `).join('');

  const html = `
    <div class="modal active">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">${checklist.title}</h3>
          <button class="modal-close" onclick="closeChecklistExpandModal()">✕</button>
        </div>
        <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
          ${itemsHtml}
        </div>
        <div style="padding: 15px; border-top: 1px solid var(--border);">
          <span style="color: var(--text-light);">Completamento: ${eventChecklistManager.getChecklistProgress(checklistId)}%</span>
          <input type="text" id="new-item-text" placeholder="Aggiungi nuovo elemento..." style="width: 100%; padding: 8px; margin-top: 10px; border: 1px solid var(--border); border-radius: 4px;">
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeChecklistExpandModal()">Chiudi</button>
          <button type="button" class="btn btn-primary" onclick="addChecklistItem(${checklistId})">➕ Aggiungi Elemento</button>
        </div>
      </div>
    </div>
  `;
  
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeChecklistExpandModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function toggleChecklistItem(checklistId, itemId) {
  eventChecklistManager.toggleItemCompletion(checklistId, itemId);
  expandChecklist(checklistId);
  Utils.showAlert('Elemento aggiornato!', 'success');
}

function deleteChecklistItem(checklistId, itemId) {
  eventChecklistManager.deleteItemFromChecklist(checklistId, itemId);
  expandChecklist(checklistId);
  Utils.showAlert('Elemento eliminato!', 'success');
}

function addChecklistItem(checklistId) {
  const text = document.getElementById('new-item-text').value.trim();
  if (!text) {
    Utils.showAlert('Inserisci il testo dell\'elemento!', 'danger');
    return;
  }
  eventChecklistManager.addItemToChecklist(checklistId, { text });
  expandChecklist(checklistId);
  Utils.showAlert('Elemento aggiunto!', 'success');
}

function deleteChecklist(checklistId) {
  if (confirm('Eliminare questa checklist?')) {
    eventChecklistManager.deleteChecklist(checklistId);
    navigationManager.loadPageContent('event-checklist');
    Utils.showAlert('Checklist eliminata!', 'success');
  }
}
