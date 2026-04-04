/**
 * FinanceManager - Gestione Fatture, Preventivi, Rendiconti, Budget
 */
class FinanceManager {
  constructor() {
    this.invoicesKey = 'invoices';
    this.quotesKey = 'quotes';
    this.reportsKey = 'financial-reports';
    this.invoices = this.loadInvoices();
    this.quotes = this.loadQuotes();
    this.reports = this.loadReports();
  }

  loadInvoices() {
    return storage.get(this.invoicesKey) || [];
  }

  loadQuotes() {
    return storage.get(this.quotesKey) || [];
  }

  loadReports() {
    return storage.get(this.reportsKey) || [];
  }

  saveInvoices() {
    storage.set(this.invoicesKey, this.invoices);
  }

  saveQuotes() {
    storage.set(this.quotesKey, this.quotes);
  }

  saveReports() {
    storage.set(this.reportsKey, this.reports);
  }

  // ===== INVOICE MANAGEMENT =====

  addInvoice(invoice) {
    invoice.id = Date.now();
    invoice.number = `FAT-${new Date().getFullYear()}-${String(this.invoices.length + 1).padStart(4, '0')}`;
    invoice.createdAt = new Date().toISOString();
    invoice.status = invoice.status || 'draft';
    this.invoices.push(invoice);
    this.saveInvoices();
    return invoice;
  }

  updateInvoice(id, updates) {
    const invoice = this.invoices.find(i => i.id === id);
    if (invoice) {
      Object.assign(invoice, updates);
      this.saveInvoices();
      return invoice;
    }
    return null;
  }

  deleteInvoice(id) {
    this.invoices = this.invoices.filter(i => i.id !== id);
    this.saveInvoices();
  }

  getInvoice(id) {
    return this.invoices.find(i => i.id === id);
  }

  getAllInvoices() {
    return [...this.invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ===== QUOTE MANAGEMENT =====

  addQuote(quote) {
    quote.id = Date.now();
    quote.number = `PREV-${new Date().getFullYear()}-${String(this.quotes.length + 1).padStart(4, '0')}`;
    quote.createdAt = new Date().toISOString();
    quote.expirationDate = quote.expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    quote.status = quote.status || 'pending';
    this.quotes.push(quote);
    this.saveQuotes();
    return quote;
  }

  updateQuote(id, updates) {
    const quote = this.quotes.find(q => q.id === id);
    if (quote) {
      Object.assign(quote, updates);
      this.saveQuotes();
      return quote;
    }
    return null;
  }

  deleteQuote(id) {
    this.quotes = this.quotes.filter(q => q.id !== id);
    this.saveQuotes();
  }

  getQuote(id) {
    return this.quotes.find(q => q.id === id);
  }

  getAllQuotes() {
    return [...this.quotes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ===== FINANCIAL REPORTS =====

  generateReport(eventId, period = 'event') {
    const entries = budgetManager.getAllEntries().filter(e => 
      period === 'event' ? e.eventId === eventId : true
    );

    const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalExpense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const balance = totalIncome - totalExpense;

    const report = {
      id: Date.now(),
      eventId,
      period,
      createdAt: new Date().toISOString(),
      totalIncome,
      totalExpense,
      balance,
      entries: entries,
      summary: {
        byCategory: this.groupByCategory(entries),
        trend: this.calculateTrend(entries)
      }
    };

    this.reports.push(report);
    this.saveReports();
    return report;
  }

  groupByCategory(entries) {
    const grouped = {};
    entries.forEach(e => {
      if (!grouped[e.category]) grouped[e.category] = 0;
      grouped[e.category] += parseFloat(e.amount || 0);
    });
    return grouped;
  }

  calculateTrend(entries) {
    // Calcola trend spese per settimana
    const trend = {};
    entries.forEach(e => {
      const week = this.getWeekNumber(new Date(e.date));
      if (!trend[week]) trend[week] = { income: 0, expense: 0 };
      if (e.type === 'income') trend[week].income += parseFloat(e.amount || 0);
      else trend[week].expense += parseFloat(e.amount || 0);
    });
    return trend;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  getStats() {
    const totalInvoiced = this.invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const pendingInvoices = this.invoices.filter(i => i.status === 'pending' || i.status === 'sent').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    
    return {
      totalInvoices: this.invoices.length,
      totalQuotes: this.quotes.length,
      totalInvoiced,
      pendingPayments: pendingInvoices,
      paidInvoices: this.invoices.filter(i => i.status === 'paid').length
    };
  }

  // ===== RENDERING =====

  renderFinancePage() {
    const invoices = this.getAllInvoices();
    const quotes = this.getAllQuotes();
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Gestione Finanziaria</h2>
            <p>Fatture: ${stats.totalInvoices} | Preventivi: ${stats.totalQuotes} | Incassato: €${stats.totalInvoiced.toFixed(2)}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="switchFinanceTab('invoices')">📄 Fatture</button>
            <button class="btn btn-secondary" onclick="switchFinanceTab('quotes')">💼 Preventivi</button>
            <button class="btn btn-secondary" onclick="switchFinanceTab('reports')">📊 Rendiconti</button>
          </div>
        </div>

        <!-- Statistiche -->
        <div class="grid grid-4" style="margin-bottom: 20px;">
          <div class="stat-box">
            <div class="stat-label">Fatture Emesse</div>
            <div class="stat-value">${stats.totalInvoices}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Incassato</div>
            <div class="stat-value">€${stats.totalInvoiced.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">In Sospeso</div>
            <div class="stat-value">€${stats.pendingPayments.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Preventivi</div>
            <div class="stat-value">${stats.totalQuotes}</div>
          </div>
        </div>

        <!-- INVOICES SECTION -->
        <div id="finance-invoices-section">
          <h3 style="margin: 20px 0 15px 0;">
            Fatture (${invoices.length})
            <button class="btn btn-sm btn-primary" onclick="showInvoiceModal()" style="float: right;">➕ Nuova Fattura</button>
          </h3>
          <div class="grid grid-auto">
            ${invoices.length > 0 ? invoices.map(i => this.renderInvoiceCard(i)).join('') : '<p style="grid-column: 1/-1; color: var(--text-light);">Nessuna fattura</p>'}
          </div>
        </div>

        <!-- QUOTES SECTION -->
        <div id="finance-quotes-section" style="display: none;">
          <h3 style="margin: 20px 0 15px 0;">
            Preventivi (${quotes.length})
            <button class="btn btn-sm btn-primary" onclick="showQuoteModal()" style="float: right;">➕ Nuovo Preventivo</button>
          </h3>
          <div class="grid grid-auto">
            ${quotes.length > 0 ? quotes.map(q => this.renderQuoteCard(q)).join('') : '<p style="grid-column: 1/-1; color: var(--text-light);">Nessun preventivo</p>'}
          </div>
        </div>

        <!-- REPORTS SECTION -->
        <div id="finance-reports-section" style="display: none;">
          <h3 style="margin: 20px 0 15px 0;">Rendiconti</h3>
          <button class="btn btn-primary" onclick="generateFinancialReport()">📊 Genera Rendiconto</button>
        </div>
      </div>
    `;
  }

  renderInvoiceCard(invoice) {
    const statusColors = {
      'draft': '#9ca3af',
      'sent': '#f59e0b',
      'paid': '#10b981',
      'overdue': '#ef4444'
    };

    const statusNames = {
      'draft': 'Bozza',
      'sent': 'Inviata',
      'paid': 'Pagata',
      'overdue': 'Scaduta'
    };

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${invoice.number}</div>
            <div class="card-subtitle">${invoice.clientName}</div>
          </div>
          <div>
            <span class="badge" style="background: ${statusColors[invoice.status]}30; color: ${statusColors[invoice.status]};">${statusNames[invoice.status]}</span>
          </div>
        </div>

        <div class="card-body">
          <p><strong>Importo:</strong> €${parseFloat(invoice.amount || 0).toFixed(2)}</p>
          <p><strong>Data Emissione:</strong> ${invoice.issueDate}</p>
          ${invoice.dueDate ? `<p><strong>Data Scadenza:</strong> ${invoice.dueDate}</p>` : ''}
          ${invoice.description ? `<p><strong>Descrizione:</strong> ${invoice.description}</p>` : ''}
          
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="btn btn-sm btn-secondary" onclick="downloadInvoice('${invoice.id}')">⬇️ Scarica</button>
            <button class="btn btn-sm btn-secondary" onclick="editInvoice('${invoice.id}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteInvoice('${invoice.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }

  renderQuoteCard(quote) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${quote.number}</div>
            <div class="card-subtitle">${quote.clientName}</div>
          </div>
          <span class="badge badge-primary">${quote.status === 'accepted' ? '✓ Accettato' : 'In Attesa'}</span>
        </div>

        <div class="card-body">
          <p><strong>Importo:</strong> €${parseFloat(quote.amount || 0).toFixed(2)}</p>
          <p><strong>Data Creazione:</strong> ${quote.createdAt.split('T')[0]}</p>
          <p><strong>Scade il:</strong> ${quote.expirationDate}</p>
          
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="btn btn-sm btn-secondary" onclick="downloadQuote('${quote.id}')">⬇️ Scarica</button>
            <button class="btn btn-sm btn-success" onclick="convertToInvoice('${quote.id}')">✓ Converti a Fattura</button>
            <button class="btn btn-sm btn-danger" onclick="deleteQuote('${quote.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }


}

// Istanza globale
const financeManager = new FinanceManager();

// ===== GLOBAL FUNCTIONS =====

function switchFinanceTab(tab) {
  document.getElementById('finance-invoices-section').style.display = tab === 'invoices' ? 'block' : 'none';
  document.getElementById('finance-quotes-section').style.display = tab === 'quotes' ? 'block' : 'none';
  document.getElementById('finance-reports-section').style.display = tab === 'reports' ? 'block' : 'none';
}

function showInvoiceModal() {
  const today = new Date().toISOString().split('T')[0];
  const html = `
    <div class="modal active" id="invoiceModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuova Fattura</h3>
          <button class="modal-close" onclick="closeInvoiceModal()">✕</button>
        </div>
        <form onsubmit="saveInvoice(event);">
          <div class="form-group">
            <label>Cliente *</label>
            <input type="text" id="invoice-client" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Data Emissione *</label>
              <input type="date" id="invoice-issue-date" value="${today}" required>
            </div>
            <div class="form-group">
              <label>Data Scadenza *</label>
              <input type="date" id="invoice-due-date" required>
            </div>
          </div>
          <div class="form-group">
            <label>Importo *</label>
            <input type="number" id="invoice-amount" step="0.01" min="0" required>
          </div>
          <div class="form-group">
            <label>Descrizione</label>
            <textarea id="invoice-description"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeInvoiceModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Crea Fattura</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeInvoiceModal() {
  document.getElementById('modal-container').style.display = 'none';
  document.getElementById('modal-container').classList.remove('visible');
}

function saveInvoice(event) {
  event.preventDefault();

  const invoice = {
    clientName: document.getElementById('invoice-client').value,
    issueDate: document.getElementById('invoice-issue-date').value,
    dueDate: document.getElementById('invoice-due-date').value,
    amount: document.getElementById('invoice-amount').value,
    description: document.getElementById('invoice-description').value
  };

  financeManager.addInvoice(invoice);
  closeInvoiceModal();
  navigationManager.loadPageContent('finance');
  Utils.showAlert('Fattura creata!', 'success');
}

function editInvoice(invoiceId) {
  console.log('Edit invoice:', invoiceId);
}

function downloadInvoice(invoiceId) {
  const invoice = financeManager.getInvoice(invoiceId);
  console.log('Download:', invoice);
  Utils.showAlert('Funzione download in sviluppo', 'info');
}

function deleteInvoice(invoiceId) {
  if (confirm('Elimina questa fattura?')) {
    financeManager.deleteInvoice(invoiceId);
    navigationManager.loadPageContent('finance');
    Utils.showAlert('Fattura eliminata!', 'success');
  }
}

function showQuoteModal() {
  const html = `
    <div class="modal active" id="quoteModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Preventivo</h3>
          <button class="modal-close" onclick="closeQuoteModal()">✕</button>
        </div>
        <form onsubmit="saveQuote(event);">
          <div class="form-group">
            <label>Cliente *</label>
            <input type="text" id="quote-client" required>
          </div>
          <div class="form-group">
            <label>Importo *</label>
            <input type="number" id="quote-amount" step="0.01" min="0" required>
          </div>
          <div class="form-group">
            <label>Descrizione *</label>
            <textarea id="quote-description" required></textarea>
          </div>
          <div class="form-group">
            <label>Validità (giorni)</label>
            <input type="number" id="quote-validity" value="30" min="1">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeQuoteModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Crea Preventivo</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeQuoteModal() {
  document.getElementById('modal-container').style.display = 'none';
  document.getElementById('modal-container').classList.remove('visible');
}

function saveQuote(event) {
  event.preventDefault();

  const validity = parseInt(document.getElementById('quote-validity').value) || 30;
  const expirationDate = new Date(Date.now() + validity * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const quote = {
    clientName: document.getElementById('quote-client').value,
    amount: document.getElementById('quote-amount').value,
    description: document.getElementById('quote-description').value,
    expirationDate
  };

  financeManager.addQuote(quote);
  closeQuoteModal();
  navigationManager.loadPageContent('finance');
  Utils.showAlert('Preventivo creato!', 'success');
}

function downloadQuote(quoteId) {
  const quote = financeManager.getQuote(quoteId);
  console.log('Download:', quote);
  Utils.showAlert('Funzione download in sviluppo', 'info');
}

function convertToInvoice(quoteId) {
  const quote = financeManager.getQuote(quoteId);
  if (quote) {
    const invoice = {
      clientName: quote.clientName,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: quote.expirationDate,
      amount: quote.amount,
      description: quote.description
    };
    financeManager.addInvoice(invoice);
    financeManager.deleteQuote(quoteId);
    navigationManager.loadPageContent('finance');
    Utils.showAlert('Preventivo convertito a fattura!', 'success');
  }
}

function deleteQuote(quoteId) {
  if (confirm('Elimina questo preventivo?')) {
    financeManager.deleteQuote(quoteId);
    navigationManager.loadPageContent('finance');
    Utils.showAlert('Preventivo eliminato!', 'success');
  }
}

function generateFinancialReport() {
  Utils.showAlert('Rendiconto in sviluppo', 'info');
}
