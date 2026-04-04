// Gestione Budget
class BudgetManager {
  constructor() {
    this.budget = storage.get('budget') || {
      entries: [],
      categories: ['Materiali', 'Servizi', 'Personale', 'Affitti', 'Marketing', 'Logistica', 'Altro']
    };
  }

  // Aggiungi voce di budget
  addEntry(entryData) {
    const entry = {
      id: Utils.generateId(),
      description: entryData.description,
      type: entryData.type, // income, expense
      amount: parseFloat(entryData.amount) || 0,
      category: entryData.category,
      date: entryData.date,
      notes: entryData.notes || '',
      eventId: entryData.eventId || null,
      createdAt: new Date().toISOString()
    };

    if (entry.amount <= 0) {
      Utils.showAlert('L\'ammontare deve essere positivo!', 'danger');
      return null;
    }

    this.budget.entries.push(entry);
    this.save();
    Utils.showAlert('Voce di budget aggiunta!', 'success');
    return entry;
  }

  // Modifica voce
  updateEntry(id, entryData) {
    const entry = Utils.findById(this.budget.entries, id);
    if (entry) {
      Object.assign(entry, entryData);
      this.save();
      Utils.showAlert('Voce aggiornata!', 'success');
    }
  }

  // Elimina voce
  deleteEntry(id) {
    this.budget.entries = Utils.removeById(this.budget.entries, id);
    this.save();
    Utils.showAlert('Voce eliminata!', 'success');
  }

  // Ottieni voce per ID
  getEntry(id) {
    return Utils.findById(this.budget.entries, id);
  }

  // Ottieni tutte le voci
  getAllEntries() {
    return this.budget.entries;
  }

  // Filtra per tipo
  getEntriesByType(type) {
    return this.budget.entries.filter(e => e.type === type);
  }

  // Filtra per categoria
  getEntriesByCategory(category) {
    return this.budget.entries.filter(e => e.category === category);
  }

  // Filtra per data
  getEntriesByDateRange(startDate, endDate) {
    return this.budget.entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });
  }

  // Calcola totali
  getTotals() {
    const income = Utils.sum(this.getEntriesByType('income'), 'amount');
    const expenses = Utils.sum(this.getEntriesByType('expense'), 'amount');
    return {
      income,
      expenses,
      balance: income - expenses
    };
}

  // Statistiche per categoria
  getStatisticsByCategory() {
    const grouped = Utils.groupBy(this.budget.entries, 'category');
    const stats = {};
    for (const [category, entries] of Object.entries(grouped)) {
      stats[category] = {
        count: entries.length,
        total: Utils.sum(entries, 'amount'),
        average: entries.length > 0 ? Utils.average(entries, 'amount') : 0
      };
    }
    return stats;
  }

  // Statistiche per tipo
  getStatisticsByType() {
    return {
      income: {
        total: Utils.sum(this.getEntriesByType('income'), 'amount'),
        count: this.getEntriesByType('income').length
      },
      expense: {
        total: Utils.sum(this.getEntriesByType('expense'), 'amount'),
        count: this.getEntriesByType('expense').length
      }
    };
  }

  // Aggiungi categoria
  addCategory(category) {
    if (!this.budget.categories.includes(category)) {
      this.budget.categories.push(category);
      this.save();
      Utils.showAlert('Categoria aggiunta!', 'success');
    }
  }

  // Salva i dati
  save() {
    storage.set('budget', this.budget);
  }

  // Rendering HTML
  renderEntryCard(entry) {
    const typeLabel = entry.type === 'income' ? '💰 Entrata' : '💸 Spesa';
    const typeColor = entry.type === 'income' ? 'success' : 'danger';

    return `
      <div class="card budget-card" data-id="${entry.id}">
        <div class="card-header">
          <div>
            <div class="card-title">${entry.description}</div>
            <span class="badge badge-${typeColor}">${typeLabel}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.2em; font-weight: bold; color: var(--${typeColor});">
              ${entry.type === 'income' ? '+' : '-'}${Utils.formatCurrency(entry.amount)}
            </div>
          </div>
        </div>
        <div class="card-body">
          <p><strong>📂 Categoria:</strong> ${entry.category}</p>
          <p><strong>📅 Data:</strong> ${Utils.formatDate(entry.date)}</p>
          ${entry.notes ? `<p><strong>📝 Note:</strong> ${entry.notes}</p>` : ''}
          <div style="margin-top: 10px; display: flex; gap: 5px;">
            <button class="btn btn-sm btn-primary" onclick="exportManager.exportBudgetPDF()">📄 PDF</button>
            <button class="btn btn-sm btn-secondary" onclick="editBudgetEntry('${entry.id}')">✏️ Modifica</button>
            <button class="btn btn-sm btn-danger" onclick="deleteBudgetEntry('${entry.id}')">🗑️ Elimina</button>
          </div>
        </div>
      </div>
    `;
  }

  // Rendering tabella totali
  renderTotalsSummary() {
    const totals = this.getTotals();
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Riepilogo Finanziario</div>
        </div>
        <div class="card-body">
          <div class="grid grid-3">
            <div style="text-align: center;">
              <p style="font-size: 0.9em; color: var(--text-secondary);">Entrate</p>
              <p style="font-size: 1.8em; font-weight: bold; color: var(--success);">
                ${Utils.formatCurrency(totals.income)}
              </p>
            </div>
            <div style="text-align: center;">
              <p style="font-size: 0.9em; color: var(--text-secondary);">Spese</p>
              <p style="font-size: 1.8em; font-weight: bold; color: var(--danger);">
                ${Utils.formatCurrency(totals.expenses)}
              </p>
            </div>
            <div style="text-align: center;">
              <p style="font-size: 0.9em; color: var(--text-secondary);">Saldo</p>
              <p style="font-size: 1.8em; font-weight: bold; color: ${totals.balance >= 0 ? 'var(--success)' : 'var(--danger)'};">
                ${Utils.formatCurrency(totals.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Istanza globale
const budgetManager = new BudgetManager();
