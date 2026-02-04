/**
 * FINANCES.JS
 * Modulo Gestione Pagamenti e Quote
 * Gestisce quote annuali, pagamenti, saldi e stato finanziario atleti
 * Developed by ldm4app
 */

const FinancesModule = (() => {
  // Costanti
  const PAYMENT_STATUS = {
    PAID: 'paid',        // Verde: In regola
    PARTIAL: 'partial',  // Giallo: Acconto
    UNPAID: 'unpaid'     // Rosso: Nessun pagamento
  };

  /**
   * Inizializzazione modulo
   */
  function init() {
    console.log('FinancesModule initialized');
    
    // Subscribe agli eventi atleti per aggiornare finanze (nomenclatura uniforme con StateManager)
    appState.subscribe('athletes:added', updateFinancialStats);
    appState.subscribe('athletes:updated', updateFinancialStats);
    appState.subscribe('athletes:deleted', updateFinancialStats);
  }

  /**
   * Mostra modal gestione pagamenti atleta
   */
  function showPaymentModal(athleteId) {
    const athlete = appState.getAthlete(athleteId);
    if (!athlete) {
      UI.showToast('Atleta non trovato', 'error');
      return;
    }

    // Inizializza campi finanziari se non esistono
    if (!athlete.finance) {
      athlete.finance = {
        annualFee: 0,
        payments: []
      };
    }

    const totalPaid = calculateTotalPaid(athlete);
    const balance = athlete.finance.annualFee - totalPaid;
    const status = getPaymentStatus(athlete);

    const content = `
      <div class="finance-modal">
        <div class="athlete-finance-header">
          <h3>${athlete.firstName} ${athlete.lastName}</h3>
          <div class="payment-status-badge status-${status}">
            ${getStatusLabel(status)}
          </div>
        </div>

        <!-- Quota Annuale -->
        <div class="finance-section">
          <label class="finance-label">
            <i data-lucide="credit-card"></i>
            Quota Annuale (€)
          </label>
          <input 
            type="number" 
            id="annual-fee" 
            class="finance-input" 
            value="${athlete.finance.annualFee}" 
            min="0" 
            step="10"
            placeholder="Es: 500"
          />
        </div>

        <!-- Riepilogo Finanziario -->
        <div class="finance-summary">
          <div class="finance-summary-item">
            <span class="finance-summary-label">Totale Pagato:</span>
            <span class="finance-summary-value success">€ ${totalPaid.toFixed(2)}</span>
          </div>
          <div class="finance-summary-item">
            <span class="finance-summary-label">Saldo Rimanente:</span>
            <span class="finance-summary-value ${balance > 0 ? 'danger' : 'success'}">
              € ${balance.toFixed(2)}
            </span>
          </div>
        </div>

        <!-- Lista Pagamenti -->
        <div class="finance-section">
          <div class="finance-section-header">
            <h4><i data-lucide="list"></i> Storico Pagamenti</h4>
            <button class="btn-icon btn-success" onclick="FinancesModule.addPaymentRow('${athleteId}')" title="Aggiungi Pagamento">
              <i data-lucide="plus"></i>
            </button>
          </div>
          <div id="payments-list" class="payments-list">
            ${renderPaymentsList(athlete.finance.payments)}
          </div>
        </div>

        <!-- Azioni -->
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="UI.closeModal()">Annulla</button>
          <button class="btn btn-primary" onclick="FinancesModule.savePayments('${athleteId}')">
            <i data-lucide="save"></i>
            Salva
          </button>
        </div>
      </div>
    `;

    UI.showModal('Gestione Pagamenti', content, 'large');
    
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 50);
  }

  /**
   * Renderizza lista pagamenti
   */
  function renderPaymentsList(payments) {
    if (!payments || payments.length === 0) {
      return '<p class="empty-message">Nessun pagamento registrato</p>';
    }

    return payments.map((payment, index) => `
      <div class="payment-item" data-index="${index}">
        <div class="payment-item-info">
          <input 
            type="date" 
            class="payment-date" 
            value="${payment.date}" 
            data-index="${index}"
          />
          <input 
            type="number" 
            class="payment-amount" 
            value="${payment.amount}" 
            min="0" 
            step="10" 
            placeholder="Importo €"
            data-index="${index}"
          />
          <input 
            type="text" 
            class="payment-note" 
            value="${payment.note || ''}" 
            placeholder="Note (opzionale)"
            data-index="${index}"
          />
        </div>
        <button 
          class="btn-icon btn-danger" 
          onclick="FinancesModule.removePayment(${index})"
          title="Elimina"
        >
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `).join('');
  }

  /**
   * Aggiunge riga pagamento
   */
  function addPaymentRow(athleteId) {
    const list = document.getElementById('payments-list');
    const emptyMsg = list.querySelector('.empty-message');
    if (emptyMsg) emptyMsg.remove();

    const index = list.children.length;
    const today = new Date().toISOString().split('T')[0];

    const newRow = document.createElement('div');
    newRow.className = 'payment-item';
    newRow.dataset.index = index;
    newRow.innerHTML = `
      <div class="payment-item-info">
        <input type="date" class="payment-date" value="${today}" data-index="${index}" />
        <input type="number" class="payment-amount" value="" min="0" step="10" placeholder="Importo €" data-index="${index}" />
        <input type="text" class="payment-note" value="" placeholder="Note (opzionale)" data-index="${index}" />
      </div>
      <button class="btn-icon btn-danger" onclick="FinancesModule.removePayment(${index})" title="Elimina">
        <i data-lucide="trash-2"></i>
      </button>
    `;

    list.appendChild(newRow);
    
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 10);
  }

  /**
   * Rimuove pagamento
   */
  function removePayment(index) {
    const item = document.querySelector(`.payment-item[data-index="${index}"]`);
    if (item) {
      item.remove();
      
      // Se non ci sono più pagamenti, mostra messaggio
      const list = document.getElementById('payments-list');
      if (list.children.length === 0) {
        list.innerHTML = '<p class="empty-message">Nessun pagamento registrato</p>';
      }
    }
  }

  /**
   * Salva pagamenti atleta
   */
  function savePayments(athleteId) {
    const athlete = appState.getAthlete(athleteId);
    if (!athlete) return;

    // Leggi quota annuale
    const annualFee = parseFloat(document.getElementById('annual-fee').value) || 0;

    // Leggi tutti i pagamenti
    const paymentItems = document.querySelectorAll('.payment-item');
    const payments = Array.from(paymentItems).map(item => {
      const index = item.dataset.index;
      const date = item.querySelector('.payment-date')?.value || new Date().toISOString().split('T')[0];
      const amount = parseFloat(item.querySelector('.payment-amount')?.value) || 0;
      const note = item.querySelector('.payment-note')?.value || '';

      return { date, amount, note };
    }).filter(p => p.amount > 0); // Solo pagamenti con importo

    // Aggiorna atleta
    athlete.finance = {
      annualFee,
      payments
    };

    appState.updateAthlete(athleteId, athlete);
    UI.closeModal();
    UI.showToast('Pagamenti salvati con successo', 'success');
    
    // Aggiorna stats dashboard
    updateFinancialStats();
  }

  /**
   * Calcola totale pagato
   */
  function calculateTotalPaid(athlete) {
    if (!athlete.finance || !athlete.finance.payments) return 0;
    return athlete.finance.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }

  /**
   * Determina stato pagamento
   */
  function getPaymentStatus(athlete) {
    if (!athlete.finance || !athlete.finance.annualFee) {
      return PAYMENT_STATUS.UNPAID;
    }

    const totalPaid = calculateTotalPaid(athlete);
    const fee = athlete.finance.annualFee;

    if (totalPaid >= fee) return PAYMENT_STATUS.PAID;
    if (totalPaid > 0) return PAYMENT_STATUS.PARTIAL;
    return PAYMENT_STATUS.UNPAID;
  }

  /**
   * Label stato pagamento
   */
  function getStatusLabel(status) {
    switch(status) {
      case PAYMENT_STATUS.PAID: return '✓ In Regola';
      case PAYMENT_STATUS.PARTIAL: return '⚠ Acconto';
      case PAYMENT_STATUS.UNPAID: return '✗ Non Pagato';
      default: return 'N/D';
    }
  }

  /**
   * Calcola statistiche finanziarie globali
   */
  function calculateFinancialStats() {
    const athletes = (typeof appState !== 'undefined' && typeof appState.getAthletes === 'function') ? appState.getAthletes() : (appState && appState.state && appState.state.athletes ? appState.state.athletes : []);
    
    let totalExpected = 0;
    let totalCollected = 0;
    let totalCredit = 0;

    athletes.forEach(athlete => {
      if (athlete.finance) {
        const fee = athlete.finance.annualFee || 0;
        const paid = calculateTotalPaid(athlete);
        
        totalExpected += fee;
        totalCollected += paid;
        totalCredit += Math.max(0, fee - paid);
      }
    });

    return {
      totalExpected,
      totalCollected,
      totalCredit,
      athletesCount: athletes.length
    };
  }

  /**
   * Aggiorna statistiche finanziarie nella dashboard
   */
  function updateFinancialStats() {
    const stats = calculateFinancialStats();
    
    // Aggiorna card dashboard se esistono
    const collectedEl = document.getElementById('total-collected');
    const creditEl = document.getElementById('total-credit');
    
    if (collectedEl) {
      collectedEl.textContent = `€ ${stats.totalCollected.toFixed(0)}`;
    }
    
    if (creditEl) {
      creditEl.textContent = `€ ${stats.totalCredit.toFixed(0)}`;
    }
  }

  /**
   * Renderizza badge stato pagamento
   */
  function renderPaymentBadge(athleteId) {
    const athlete = appState.getAthlete(athleteId);
    if (!athlete) return '';

    const status = getPaymentStatus(athlete);
    const statusClass = status === PAYMENT_STATUS.PAID ? 'success' : 
                       status === PAYMENT_STATUS.PARTIAL ? 'warning' : 'danger';
    
    return `<span class="badge badge-${statusClass}">${getStatusLabel(status)}</span>`;
  }

  // Esposizione pubblica
  return {
    init,
    showPaymentModal,
    addPaymentRow,
    removePayment,
    savePayments,
    calculateFinancialStats,
    updateFinancialStats,
    getPaymentStatus,
    renderPaymentBadge
  };
})();

// Esposizione globale per onclick
window.FinancesModule = FinancesModule;
