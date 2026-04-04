/**
 * HistoryManager - Archivio Storico
 * Timeline storica, Anniversari, Archivio eventi
 */
class HistoryManager {
  constructor() {
    this.storageKey = 'history';
    this.records = this.loadRecords();
  }

  loadRecords() {
    return storage.get(this.storageKey) || [];
  }

  saveRecords() {
    storage.set(this.storageKey, this.records);
  }

  addRecord(record) {
    record.id = Date.now();
    record.createdAt = new Date().toISOString();
    this.records.push(record);
    this.saveRecords();
    return record;
  }

  updateRecord(id, updates) {
    const record = this.records.find(r => r.id === id);
    if (record) {
      Object.assign(record, updates);
      this.saveRecords();
      return record;
    }
    return null;
  }

  deleteRecord(id) {
    this.records = this.records.filter(r => r.id !== id);
    this.saveRecords();
  }

  getRecord(id) {
    return this.records.find(r => r.id === id);
  }

  getAllRecords() {
    return [...this.records].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  getRecordsByYear(year) {
    return this.records.filter(r => new Date(r.date).getFullYear() === year);
  }

  getAnniversaries(daysAhead = 30) {
    const today = new Date();
    return this.records.filter(r => {
      const recordDate = new Date(r.date);
      const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      const recordDoy = dayOfYear(recordDate);
      const todayDoy = dayOfYear(today);
      return (recordDoy >= todayDoy && recordDoy <= todayDoy + daysAhead) && recordDate.getFullYear() !== today.getFullYear();
    });
  }

  getStats() {
    return {
      total: this.records.length,
      years: [...new Set(this.records.map(r => new Date(r.date).getFullYear()))].length
    };
  }

  renderHistoryPage() {
    const records = this.getAllRecords();
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Archivio Storico</h2>
            <p>Totale Record: ${stats.total} | Anni coperti: ${stats.years}</p>
          </div>
          <button class="btn btn-primary" onclick="showHistoryRecordModal()">➕ Nuovo Record</button>
        </div>

        <h3>Timeline Storica</h3>
        <div style="position: relative; padding: 20px 0;">
          <div style="border-left: 3px solid var(--primary); padding-left: 30px;">
            ${records.length > 0 ? 
              records.map(r => this.renderHistoryCard(r)).join('') :
              '<p style="color: var(--text-light);">Nessun record storico</p>'
            }
          </div>
        </div>
      </div>
    `;
  }

  renderHistoryCard(record) {
    const date = new Date(record.date);
    const dateStr = date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return `
      <div style="margin-bottom: 30px;">
        <div style="position: relative;">
          <div style="position: absolute; width: 16px; height: 16px; background: var(--primary); border-radius: 50%; left: -39px; top: 5px;"></div>
          <div style="background: white; border: 1px solid var(--border); border-radius: 8px; padding: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <div style="font-size: 1.1em; font-weight: bold;">${record.title}</div>
                <div style="color: var(--text-light); font-size: 0.9em;">${dateStr}</div>
              </div>
              <button class="btn btn-sm btn-danger" onclick="deleteHistoryRecord(${record.id})">🗑️</button>
            </div>
            <p style="margin-top: 10px; color: var(--text-dark);">${record.description}</p>
            ${record.images ? `<p style="color: var(--text-light); font-size: 0.85rem;">📸 Allegati: ${record.images}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

const historyManager = new HistoryManager();

function showHistoryRecordModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Record Storico</h3>
          <button class="modal-close" onclick="closeHistoryModal()">✕</button>
        </div>
        <form onsubmit="saveHistoryRecord(event);">
          <div class="form-group">
            <label>Titolo *</label>
            <input type="text" id="history-title" required>
          </div>
          <div class="form-group">
            <label>Data *</label>
            <input type="date" id="history-date" required>
          </div>
          <div class="form-group">
            <label>Descrizione *</label>
            <textarea id="history-description" rows="6" required></textarea>
          </div>
          <div class="form-group">
            <label>Tag/Categoria</label>
            <input type="text" id="history-tags" placeholder="Evento, Milestone, Anniversario">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeHistoryModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva Record</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeHistoryModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveHistoryRecord(event) {
  event.preventDefault();
  const record = {
    title: document.getElementById('history-title').value,
    date: document.getElementById('history-date').value,
    description: document.getElementById('history-description').value,
    tags: document.getElementById('history-tags').value
  };
  historyManager.addRecord(record);
  closeHistoryModal();
  navigationManager.loadPageContent('history');
  Utils.showAlert('Record storico salvato!', 'success');
}

function deleteHistoryRecord(recordId) {
  if (confirm('Eliminare questo record?')) {
    historyManager.deleteRecord(recordId);
    navigationManager.loadPageContent('history');
    Utils.showAlert('Record eliminato!', 'success');
  }
}
