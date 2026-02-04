  /**
   * Aggiunge una ricevuta fiscale automatica per pagamento atleta (se non già presente)
   */
  function addAthletePaymentReceipt(athlete, payment) {
    if (!athlete || !payment || !payment.amount || !athlete.firstName) return;
    // Usa id combinato atleta+data+importo per evitare duplicati
    const receiptId = `athletefee-${athlete.id}-${payment.date}-${payment.amount}`;
    if (receipts.some(r => r.id === receiptId)) return; // già presente
    const year = new Date(payment.date).getFullYear();
    const nextNumber = getNextReceiptNumber();
    const receiptData = {
      id: receiptId,
      number: nextNumber,
      year,
      date: payment.date,
      payerName: `${athlete.firstName} ${athlete.lastName}`,
      fiscalCode: athlete.fiscalCode || '',
      amount: payment.amount,
      description: 'Quota associativa annuale',
      notes: payment.note || '',
      createdAt: new Date().toISOString()
    };
    receipts.push(receiptData);
    // Aggiungi anche a prima nota, con id univoco
    const ledgerId = `athletefee-ledger-${athlete.id}-${payment.date}-${payment.amount}`;
    if (!ledger.some(l => l.id === ledgerId)) {
      addToLedger({
        id: ledgerId,
        type: 'income',
        category: 'Quota atleta',
        amount: payment.amount,
        description: `Quota atleta ${athlete.firstName} ${athlete.lastName}`,
        date: payment.date,
        reference: receiptId
      });
    }
    saveData();
  }
/**
 * FISCAL-MANAGER.JS
 * Modulo Gestione Fiscale - Ricevute, Collaboratori, Prima Nota
 * Privacy-first: tutti i dati in LocalStorage
 * Developed by ldm4app
 */

const FiscalModule = (() => {
  // Strutture dati
  let receipts = [];        // Ricevute fiscali
  let collaborators = [];   // Collaboratori sportivi
  let ledger = [];          // Prima nota (entrate/uscite)

  // Filtri anno per visualizzazioni (numero anno o 'all')
  let receiptsYearFilter = new Date().getFullYear();
  let ledgerYearFilter = new Date().getFullYear();
  
  // Costanti fiscali
  const DEDUCTION_RATE = 0.19;  // Detrazione 19% per spese sportive
  const MAX_DEDUCTION = 210;     // Massimo detraibile per 730
  const MAX_EXPENSE_PER_CHILD = 1000;  // Max spesa per figlio

  /**
   * Inizializzazione modulo
   */
  function init() {
    console.log('FiscalModule initialized');
    loadData();
  }

  /**
   * Carica dati da LocalStorage
   */
  function loadData() {
    try {
      const fiscalData = localStorage.getItem('fiscalData');
      const data = (typeof Utils !== 'undefined' && typeof Utils.safeJSONParse === 'function') ? Utils.safeJSONParse(fiscalData, {}) : (fiscalData ? JSON.parse(fiscalData) : {});
      receipts = (data && data.receipts) ? data.receipts : [];
      collaborators = (data && data.collaborators) ? data.collaborators : [];
      ledger = (data && data.ledger) ? data.ledger : [];
    } catch (e) {
      console.warn('FiscalModule.loadData: parse error', e);
      receipts = [];
      collaborators = [];
      ledger = [];
    }
  }

  /**
   * Salva dati in LocalStorage
   */
  function saveData() {
    localStorage.setItem('fiscalData', JSON.stringify({
      receipts,
      collaborators,
      ledger,
      lastUpdate: new Date().toISOString()
    }));

    // Notifica il resto dell'app che i dati fiscali sono cambiati
    try {
      if (typeof appState !== 'undefined' && typeof appState.notify === 'function') {
        appState.notify('fiscal:updated');
      } else if (window.appState && typeof window.appState.notify === 'function') {
        // backward compatibility in case some code attaches appState to window
        window.appState.notify('fiscal:updated');
      }
    } catch (e) { /* ignore */ }
  }

  /**
   * Mostra dashboard fiscale
   */
  function showFiscalDashboard() {
    // Rimuove overlay residui e dropdown per evitare blocchi UI
    try {
      document.querySelectorAll('.nav-dropdown.active').forEach(d => d.classList.remove('active'));
      const modalOverlay = document.querySelector('.modal-overlay');
      if (modalOverlay && modalOverlay.parentElement) modalOverlay.parentElement.removeChild(modalOverlay);
      document.body.classList.remove('modal-open');
    } catch (e) { /* ignore */ }

    const content = `
      <div class="fiscal-dashboard">
        <div class="section-header">
          <h2><i data-lucide="receipt"></i> Gestione Fiscale</h2>
        </div>
        <div class="fiscal-tabs">
          <button class="fiscal-tab active" onclick="FiscalModule.showReceiptsTab()">
            <i data-lucide="file-text"></i> Ricevute Fiscali
          </button>
          <button class="fiscal-tab" onclick="FiscalModule.showCollaboratorsTab()">
            <i data-lucide="users"></i> Collaboratori
          </button>
          <button class="fiscal-tab" onclick="FiscalModule.showLedgerTab()">
            <i data-lucide="book-open"></i> Prima Nota
          </button>
        </div>

        <div id="fiscal-tab-content"></div>
      </div>
    `;

    document.getElementById('app-container').innerHTML = content;
    Utils.initLucideIcons();

    // Mostra la scheda predefinita
    updateTabContent(renderReceiptsTab());
    updateActiveTab(0);
  }

  /**
   * =====================================================
   * RICEVUTE FISCALI
   * =====================================================
   */

  function renderReceiptsTab() {
    const currentYear = new Date().getFullYear();
    // anni disponibili dalle ricevute
    const yearsSet = new Set(receipts.map(r => new Date(r.date).getFullYear()));
    const years = Array.from(yearsSet).sort((a,b) => b - a);
    const selectedYear = receiptsYearFilter === 'all' ? 'all' : receiptsYearFilter || currentYear;
    const yearReceipts = selectedYear === 'all' ? receipts.slice() : receipts.filter(r => new Date(r.date).getFullYear() === selectedYear);

    const totalAmount = yearReceipts.reduce((sum, r) => sum + r.amount, 0);
    const totalDeductible = Math.min(totalAmount * DEDUCTION_RATE, MAX_DEDUCTION);

    return `
      <div class="fiscal-section">
        <div class="fiscal-header">
          <div>
            <h3><i data-lucide="file-text"></i> Ricevute Fiscali ${selectedYear === 'all' ? 'Tutti gli anni' : selectedYear}</h3>
            <p class="text-secondary">Gestione ricevute per detrazioni fiscali 730</p>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <select id="receipts-year-select" class="input-premium" onchange="FiscalModule.setReceiptsYear(this.value)" title="Filtra per anno (o scegli Tutti gli anni per visualizzare tutto)" aria-label="Seleziona anno">
              <option value="all" ${selectedYear === 'all' ? 'selected' : ''}>Tutti gli anni</option>
              ${years.map(y => `<option value="${y}" ${selectedYear === y ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
            <span class="text-secondary small" style="margin-left:0.5rem" title="Scegli un anno per visualizzare o esportare i dati. 'Tutti gli anni' mostra tutte le registrazioni.">Seleziona anno per visualizzare/esportare</span>
            <button class="btn btn-primary btn-glass primary" onclick="FiscalModule.showReceiptForm()">
              <i data-lucide="plus"></i> Nuova Ricevuta
            </button>
            <button class="btn btn-success" onclick="FiscalModule.exportReceiptsCSV()">
              <i data-lucide="download"></i> Export CSV
            </button>
          </div>
        </div>

        <!-- Riepilogo fiscale -->
        <div class="fiscal-summary-cards">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-primary">
              <i data-lucide="euro"></i>
            </div>
            <div class="stat-card-value">€ ${totalAmount.toFixed(2)}</div>
            <div class="stat-card-label">Totale Incassato</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-success">
              <i data-lucide="percent"></i>
            </div>
            <div class="stat-card-value">€ ${totalDeductible.toFixed(2)}</div>
            <div class="stat-card-label">Detraibile 730 (19%)</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-info">
              <i data-lucide="file-check"></i>
            </div>
            <div class="stat-card-value">${yearReceipts.length}</div>
            <div class="stat-card-label">Ricevute Emesse</div>
          </div>
        </div>

        <!-- Lista ricevute -->
        <div class="fiscal-table-container">
          ${yearReceipts.length > 0 ? `
            <table class="fiscal-table">
              <thead>
                <tr>
                  <th>N° Ricevuta</th>
                  <th>Data</th>
                  <th>Intestatario</th>
                  <th>Causale</th>
                  <th>Importo</th>
                  <th>Detraibile</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                ${yearReceipts.map(receipt => `
                  <tr>
                    <td><strong>#${receipt.number}/${receipt.year}</strong></td>
                    <td>${formatDate(receipt.date)}</td>
                    <td>${receipt.payerName}</td>
                    <td>${receipt.description}</td>
                  addAthletePaymentReceipt,
                    <td><strong>€ ${receipt.amount.toFixed(2)}</strong></td>
                    <td class="text-success">€ ${(receipt.amount * DEDUCTION_RATE).toFixed(2)}</td>
                    <td>
                      <!-- Visualizza: Distinta di Gara SVG -->
                      <button class="btn-icon icon-page" onclick="FiscalModule.viewReceipt('${receipt.id}')" title="Visualizza">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#f59e42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="4" y="3" width="16" height="18" rx="3" fill="#38bdf8" opacity="0.18"/>
                          <rect x="4" y="3" width="16" height="18" rx="3"/>
                          <path d="M8 7h8" stroke="#fbbf24"/>
                          <path d="M8 11h4" stroke="#fbbf24"/>
                          <polyline points="8 15 10 17 16 11" stroke="#22c55e"/>
                        </svg>
                      </button>
                      <!-- PDF: Report SVG -->
                      <button class="btn-icon icon-page" onclick="FiscalModule.downloadReceipt('${receipt.id}')" title="PDF">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#f59e42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="9" fill="#fde047" opacity="0.18"/>
                          <circle cx="12" cy="12" r="9"/>
                          <path d="M12 12L12 3" stroke="#38bdf8"/>
                          <path d="M12 12L20.4 16.8" stroke="#fbbf24"/>
                        </svg>
                      </button>
                      <!-- Elimina: Modifica SVG -->
                      <button class="btn-icon icon-page" onclick="FiscalModule.deleteReceipt('${receipt.id}')" title="Elimina">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M19.4 7.34a2.4 2.4 0 0 1 0 3.4l-8.6 8.6a2 2 0 0 1-2.83 0l-1.51-1.51a2 2 0 0 1 0-2.83l8.6-8.6a2.4 2.4 0 0 1 3.4 0Z" fill="#38bdf8" opacity="0.18"/>
                          <path d="M19.4 7.34a2.4 2.4 0 0 1 0 3.4l-8.6 8.6a2 2 0 0 1-2.83 0l-1.51-1.51a2 2 0 0 1 0-2.83l8.6-8.6a2.4 2.4 0 0 1 3.4 0Z"/>
                          <path d="M15 6l3 3" stroke="#f59e42"/>
                          <path d="M7.5 17.5l-2 2" stroke="#fbbf24"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i data-lucide="file-text"></i>
              </div>
              <h4>Nessuna Ricevuta</h4>
              <p>Inizia a emettere ricevute fiscali per i pagamenti ricevuti</p>
            </div>
          `}
        </div>
      </div>
    `;
  }

  function showReceiptForm(receiptId = null) {
    const receipt = receiptId ? receipts.find(r => r.id === receiptId) : null;
    const isEdit = !!receipt;
    
    const nextNumber = isEdit ? receipt.number : getNextReceiptNumber();
    const year = new Date().getFullYear();

    const formContent = `
      <form id="receipt-form" onsubmit="FiscalModule.saveReceipt(event, '${receiptId || ''}')">
        <div class="form-grid">
          <div class="form-group">
            <label>Numero Ricevuta</label>
            <input type="text" value="#${nextNumber}/${year}" disabled class="input-premium">
          </div>

          <div class="form-group">
            <label>Data Emissione *</label>
            <input type="date" name="date" value="${receipt?.date || new Date().toISOString().split('T')[0]}" required class="input-premium">
          </div>

          <div class="form-group span-2">
            <label>Intestatario (Genitore/Atleta) *</label>
            <input type="text" name="payerName" value="${receipt?.payerName || ''}" required placeholder="Nome Cognome" class="input-premium">
          </div>

          <div class="form-group">
            <label>Codice Fiscale *</label>
            <input type="text" name="fiscalCode" value="${receipt?.fiscalCode || ''}" required placeholder="RSSMRA80A01H501U" pattern="[A-Z0-9]{16}" maxlength="16" class="input-premium">
          </div>

          <div class="form-group">
            <label>Importo (€) *</label>
            <input type="number" name="amount" value="${receipt?.amount || ''}" required step="0.01" min="0" placeholder="100.00" class="input-premium">
          </div>

          <div class="form-group span-2">
            <label>Causale *</label>
            <select name="description" required class="input-premium">
              <option value="">Seleziona causale</option>
              <option value="Quota associativa annuale" ${receipt?.description === 'Quota associativa annuale' ? 'selected' : ''}>Quota associativa annuale</option>
              <option value="Iscrizione corso calcio" ${receipt?.description === 'Iscrizione corso calcio' ? 'selected' : ''}>Iscrizione corso calcio</option>
              <option value="Abbonamento stagionale" ${receipt?.description === 'Abbonamento stagionale' ? 'selected' : ''}>Abbonamento stagionale</option>
              <option value="Partecipazione torneo" ${receipt?.description === 'Partecipazione torneo' ? 'selected' : ''}>Partecipazione torneo</option>
              <option value="Altro" ${receipt?.description === 'Altro' ? 'selected' : ''}>Altro</option>
            </select>
          </div>

          <div class="form-group span-2">
            <label>Note aggiuntive</label>
            <textarea name="notes" rows="2" placeholder="Note opzionali..." class="input-premium">${receipt?.notes || ''}</textarea>
          </div>
        </div>

        <div class="info-box">
          <i data-lucide="info"></i>
          <div>
            <strong>Detrazioni fiscali 730:</strong>
            <p>Le spese sportive per ragazzi fino a 18 anni sono detraibili al 19% fino a un massimo di € 210,00 per figlio.</p>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary btn-glass secondary" onclick="FiscalModule.showFiscalDashboard()">Annulla</button>
          <button type="submit" class="btn-premium">
            <i data-lucide="save"></i> ${isEdit ? 'Aggiorna' : 'Emetti'} Ricevuta
          </button>
        </div>
      </form>
    `;

    UI.showModal(isEdit ? 'Modifica Ricevuta' : 'Nuova Ricevuta Fiscale', formContent, 'large');
    
    setTimeout(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
  }

  function saveReceipt(event, receiptId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const receiptData = {
      id: receiptId || Utils.generateId('receipt-'),
      number: receiptId ? receipts.find(r => r.id === receiptId).number : getNextReceiptNumber(),
      year: new Date().getFullYear(),
      date: formData.get('date'),
      payerName: formData.get('payerName'),
      fiscalCode: formData.get('fiscalCode').toUpperCase(),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description'),
      notes: formData.get('notes'),
      createdAt: receiptId ? receipts.find(r => r.id === receiptId).createdAt : new Date().toISOString()
    };

    if (receiptId) {
      const index = receipts.findIndex(r => r.id === receiptId);
      receipts[index] = receiptData;
    } else {
      receipts.push(receiptData);
      
      // Aggiungi anche a prima nota
      addToLedger({
        type: 'income',
        category: 'Ricevuta fiscale',
        amount: receiptData.amount,
        description: `Ricevuta #${receiptData.number}/${receiptData.year} - ${receiptData.payerName}`,
        date: receiptData.date,
        reference: receiptData.id
      });
    }

    saveData();
    Utils.hapticFeedback('success');
    UI.showToast(receiptId ? 'Ricevuta aggiornata' : 'Ricevuta emessa', 'success');
    showFiscalDashboard();
    showReceiptsTab();
  }

  function getNextReceiptNumber() {
    const year = new Date().getFullYear();
    const yearReceipts = receipts.filter(r => r.year === year);
    return yearReceipts.length + 1;
  }

  function downloadReceipt(receiptId) {
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('RICEVUTA FISCALE', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`N° ${receipt.number}/${receipt.year}`, 105, 30, { align: 'center' });

    // Dati società (placeholder - da personalizzare)
    doc.setFontSize(10);
    doc.text('SoccerManager Pro - Società Sportiva', 20, 45);
    doc.text('Via dello Sport, 1 - 00100 Roma', 20, 50);
    doc.text('P.IVA: 12345678901', 20, 55);

    // Dati intestatario
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('INTESTATARIO:', 20, 70);
    doc.setFont(undefined, 'normal');
    doc.text(receipt.payerName, 20, 75);
    doc.text(`CF: ${receipt.fiscalCode}`, 20, 80);

    // Dettagli ricevuta
    doc.setFont(undefined, 'bold');
    doc.text('DATA:', 120, 70);
    doc.text('IMPORTO:', 120, 80);
    
    doc.setFont(undefined, 'normal');
    doc.text(formatDate(receipt.date), 145, 70);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`€ ${receipt.amount.toFixed(2)}`, 145, 80);

    // Causale
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('CAUSALE:', 20, 95);
    doc.setFont(undefined, 'normal');
    doc.text(receipt.description, 20, 100);

    if (receipt.notes) {
      doc.text('Note: ' + receipt.notes, 20, 105);
    }

    // Riquadro detrazioni
    doc.setDrawColor(34, 197, 94);
    doc.setFillColor(34, 197, 94, 20);
    doc.roundedRect(20, 120, 170, 30, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DETRAZIONI FISCALI 730:', 25, 128);
    doc.setFont(undefined, 'normal');
    doc.text('Le spese sportive per ragazzi fino a 18 anni sono detraibili al 19%', 25, 134);
    doc.text('fino a un massimo di € 210,00 per figlio.', 25, 139);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(22, 197, 94);
    doc.text(`Importo detraibile: € ${(receipt.amount * DEDUCTION_RATE).toFixed(2)}`, 25, 145);
    doc.setTextColor(0, 0, 0);

    // Footer (shared)
    if (window.PDFUtils && typeof window.PDFUtils.addStandardFooter === 'function') {
      // Non mostrare il branding né la stringa di supporto per le ricevute (richiesto dall'utente)
      window.PDFUtils.addStandardFooter(doc, { showBranding: false, showSupport: false });
    } else {
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.text('Documento valido ai fini fiscali', 105, 280, { align: 'center' });
      doc.text(`Emesso il ${new Date().toLocaleDateString('it-IT')}`, 105, 285, { align: 'center' });
    }

    // Download
    const filename = `ricevuta-${receipt.number}-${receipt.year}.pdf`;
    
    // Save to filesystem if available
    if (window.fileSystemManager && window.fileSystemManager.rootDirectoryHandle) {
      const pdfBlob = doc.output('blob');
      fileSystemManager.saveFile(filename, pdfBlob, 'Ricevute');
    } else {
      // Fallback to download
      doc.save(filename);
    }
    
    Utils.hapticFeedback('light');
    UI.showToast('PDF scaricato', 'success');
  }

  function deleteReceipt(receiptId) {
    if (!confirm('Sei sicuro di voler eliminare questa ricevuta?')) return;

    receipts = receipts.filter(r => r.id !== receiptId);
    
    // Rimuovi da prima nota
    ledger = ledger.filter(l => l.reference !== receiptId);
    
    saveData();
    Utils.hapticFeedback('medium');
    UI.showToast('Ricevuta eliminata', 'success');
    showReceiptsTab();
  }

  /**
   * =====================================================
   * COLLABORATORI SPORTIVI
   * =====================================================
   */

  function renderCollaboratorsTab() {
    const activeCollaborators = (collaborators || []).filter(c => c && c.active);
    const totalMonthly = activeCollaborators.reduce((sum, c) => sum + (Number(c.monthlyAmount) || 0), 0);
    const pendingPayments = getPendingPayments();
    const totalPending = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return `
      <div class="fiscal-section">
        <div class="fiscal-header">
          <div>
            <h3><i data-lucide="users"></i> Collaboratori Sportivi</h3>
            <p class="text-secondary">Gestione contratti co.co.co. e scadenziario pagamenti</p>
          </div>
          <button class="btn btn-primary btn-glass primary" onclick="FiscalModule.showCollaboratorForm()">
            <i data-lucide="user-plus"></i> Nuovo Collaboratore
          </button>
        </div>

        <!-- Statistiche collaboratori -->
        <div class="fiscal-summary-cards">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-info">
              <i data-lucide="users"></i>
            </div>
            <div class="stat-card-value">${activeCollaborators.length}</div>
            <div class="stat-card-label">Collaboratori Attivi</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-warning">
              <i data-lucide="euro"></i>
            </div>
            <div class="stat-card-value">€ ${totalMonthly.toFixed(0)}</div>
            <div class="stat-card-label">Totale Mensile</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-danger">
              <i data-lucide="clock"></i>
            </div>
            <div class="stat-card-value">${pendingPayments.length}</div>
            <div class="stat-card-label">Pagamenti In Scadenza</div>
          </div>
        </div>

        <!-- Scadenziario pagamenti -->
        ${pendingPayments.length > 0 ? `
          <div class="alert alert-warning">
            <i data-lucide="alert-triangle"></i>
            <div>
              <strong>Pagamenti in scadenza</strong>
              <p>${pendingPayments.length} pagamenti per un totale di € ${totalPending.toFixed(2)}</p>
            </div>
          </div>

          <div class="collaborators-payments">
            <h4>Scadenziario</h4>
            ${pendingPayments.map(payment => `
              <div class="payment-item-collab">
                <div class="payment-info">
                  <strong>${payment.collaboratorName}</strong>
                  <span class="text-secondary">${payment.description}</span>
                </div>
                <div class="payment-details">
                  <span class="payment-date">${formatDate(payment.dueDate)}</span>
                  <span class="payment-amount">€ ${payment.amount.toFixed(2)}</span>
                </div>

                <!-- Azioni visibili al passaggio del mouse: Modifica/Elimina Collaboratore, Segna Pagato -->
                <div class="payment-item-actions" role="group" aria-label="Azioni pagamento">
                  <button class="btn-icon icon-page" title="Modifica collaboratore" onclick="FiscalModule.showCollaboratorForm('${payment.collaboratorId}')">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19.4 7.34a2.4 2.4 0 0 1 0 3.4l-8.6 8.6a2 2 0 0 1-2.83 0l-1.51-1.51a2 2 0 0 1 0-2.83l8.6-8.6a2.4 2.4 0 0 1 3.4 0Z" fill="#38bdf8" opacity="0.18"/>
                      <path d="M19.4 7.34a2.4 2.4 0 0 1 0 3.4l-8.6 8.6a2 2 0 0 1-2.83 0l-1.51-1.51a2 2 0 0 1 0-2.83l8.6-8.6a2.4 2.4 0 0 1 3.4 0Z"/>
                      <path d="M15 6l3 3" stroke="#f59e42"/>
                      <path d="M7.5 17.5l-2 2" stroke="#fbbf24"/>
                    </svg>
                  </button>
                  <button class="btn-icon icon-page btn-danger" title="Elimina collaboratore" onclick="FiscalModule.confirmDeleteCollaborator('${payment.collaboratorId}')">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="6" width="18" height="14" rx="2" fill="#f87171" opacity="0.18"/>
                      <rect x="3" y="6" width="18" height="14" rx="2"/>
                      <path d="M9 10v4" stroke="#ef4444"/>
                      <path d="M15 10v4" stroke="#ef4444"/>
                      <path d="M4 6h16" stroke="#fbbf24"/>
                      <path d="M10 3h4" stroke="#f59e42"/>
                    </svg>
                  </button>
                  <button class="btn btn-sm btn-success" onclick="FiscalModule.markPaymentPaid('${payment.id}')" title="Segna Pagato">
                    <i data-lucide="check"></i> Segna Pagato
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Lista collaboratori -->
        <div class="collaborators-grid">
          ${activeCollaborators.length > 0 ? activeCollaborators.map(collab => `
            <div class="collaborator-card premium-card">
              <div class="collaborator-header">
                <h4>${collab.name}</h4>
                <span class="role-badge role-badge-info">${collab.role}</span>
              </div>

              <div class="collaborator-details">
                <div class="detail-item">
                  <i data-lucide="calendar"></i>
                  <span>Dal ${formatDate(collab.startDate)}</span>
                </div>
                <div class="detail-item">
                  <i data-lucide="euro"></i>
                  <span><strong>€ ${collab.monthlyAmount.toFixed(0)}</strong>/mese</span>
                </div>
                <div class="detail-item">
                  <i data-lucide="credit-card"></i>
                  <span>CF: ${collab.fiscalCode}</span>
                </div>
              </div>

              <div class="collaborator-actions">
                <button class="btn-icon icon-page" onclick="FiscalModule.viewCollaborator('${collab.id}')" title="Dettagli">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#f59e42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4" y="3" width="16" height="18" rx="3" fill="#38bdf8" opacity="0.18"/>
                    <rect x="4" y="3" width="16" height="18" rx="3"/>
                    <path d="M8 7h8" stroke="#fbbf24"/>
                    <path d="M8 11h4" stroke="#fbbf24"/>
                    <polyline points="8 15 10 17 16 11" stroke="#22c55e"/>
                  </svg>
                </button>
                <button class="btn-icon icon-page" onclick="FiscalModule.showCollaboratorForm('${collab.id}')" title="Modifica">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19.4 7.34a2.4 2.4 0 0 1 0 3.4l-8.6 8.6a2 2 0 0 1-2.83 0l-1.51-1.51a2 2 0 0 1 0-2.83l8.6-8.6a2.4 2.4 0 0 1 3.4 0Z" fill="#38bdf8" opacity="0.18"/>
                    <path d="M19.4 7.34a2.4 2.4 0 0 1 0 3.4l-8.6 8.6a2 2 0 0 1-2.83 0l-1.51-1.51a2 2 0 0 1 0-2.83l8.6-8.6a2.4 2.4 0 0 1 3.4 0Z"/>
                    <path d="M15 6l3 3" stroke="#f59e42"/>
                    <path d="M7.5 17.5l-2 2" stroke="#fbbf24"/>
                  </svg>
                </button>
                <button class="btn-icon icon-page" onclick="FiscalModule.confirmDeleteCollaborator('${collab.id}')" title="Elimina">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#f59e42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="9" fill="#fde047" opacity="0.18"/>
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 12L12 3" stroke="#38bdf8"/>
                    <path d="M12 12L20.4 16.8" stroke="#fbbf24"/>
                  </svg>
                </button>
                <button class="btn-icon btn-danger" onclick="FiscalModule.deactivateCollaborator('${collab.id}')" title="Disattiva">
                  <i data-lucide="user-x"></i>
                </button>
              </div>
            </div>
          `).join('') : `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i data-lucide="users"></i>
              </div>
              <h4>Nessun Collaboratore</h4>
              <p>Aggiungi collaboratori sportivi per gestire contratti e pagamenti</p>
            </div>
          `}
        </div>
      </div>
    `;
  }

  function showCollaboratorForm(collaboratorId = null) {
    const collab = collaboratorId ? collaborators.find(c => c.id === collaboratorId) : null;
    const isEdit = !!collab;

    const formContent = `
      <form id="collaborator-form" onsubmit="FiscalModule.saveCollaborator(event, '${collaboratorId || ''}')">
        <div class="form-grid">
          <div class="form-group span-2">
            <label>Nome Completo *</label>
            <input type="text" name="name" value="${collab?.name || ''}" required placeholder="Mario Rossi" class="input-premium">
          </div>

          <div class="form-group">
            <label>Codice Fiscale *</label>
            <input type="text" name="fiscalCode" value="${collab?.fiscalCode || ''}" required pattern="[A-Z0-9]{16}" maxlength="16" class="input-premium">
          </div>

          <div class="form-group">
            <label>Ruolo *</label>
            <select name="role" required class="input-premium">
              <option value="">Seleziona ruolo</option>
              <option value="Allenatore" ${collab?.role === 'Allenatore' ? 'selected' : ''}>Allenatore</option>
              <option value="Preparatore atletico" ${collab?.role === 'Preparatore atletico' ? 'selected' : ''}>Preparatore atletico</option>
              <option value="Dirigente" ${collab?.role === 'Dirigente' ? 'selected' : ''}>Dirigente</option>
              <option value="Segretario" ${collab?.role === 'Segretario' ? 'selected' : ''}>Segretario</option>
              <option value="Altro" ${collab?.role === 'Altro' ? 'selected' : ''}>Altro</option>
            </select>
          </div>

          <div class="form-group">
            <label>Data Inizio Contratto *</label>
            <input type="date" name="startDate" value="${collab?.startDate || ''}" required class="input-premium">
          </div>

          <div class="form-group">
            <label>Data Fine Contratto</label>
            <input type="date" name="endDate" value="${collab?.endDate || ''}" class="input-premium">
          </div>

          <div class="form-group">
            <label>Importo Mensile (€) *</label>
            <input type="number" name="monthlyAmount" value="${collab?.monthlyAmount || ''}" required step="0.01" min="0" class="input-premium">
          </div>

          <div class="form-group">
            <label>Giorno Pagamento (1-28)</label>
            <input type="number" name="paymentDay" value="${collab?.paymentDay || 1}" min="1" max="28" class="input-premium">
          </div>

          <div class="form-group">
            <label>Documento (fronte)</label>
            <input type="file" accept="image/*" name="idFront" class="input-premium">
            ${collab?.idFront ? `<img src="${collab.idFront}" alt="Fronte ID" style="max-width:120px;margin-top:0.5rem;border-radius:6px;">` : `<div class="file-preview" data-for="idFront"></div>`}
          </div>

          <div class="form-group">
            <label>Documento (retro)</label>
            <input type="file" accept="image/*" name="idBack" class="input-premium">
            ${collab?.idBack ? `<img src="${collab.idBack}" alt="Retro ID" style="max-width:120px;margin-top:0.5rem;border-radius:6px;">` : `<div class="file-preview" data-for="idBack"></div>`}
          </div>

          <div class="form-group span-2">
            <label>Note</label>
            <textarea name="notes" rows="2" class="input-premium">${collab?.notes || ''}</textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="FiscalModule.showCollaboratorsTab()">Annulla</button>
          <button type="submit" class="btn-premium">
            <i data-lucide="save"></i> ${isEdit ? 'Aggiorna' : 'Aggiungi'} Collaboratore
          </button>
        </div>
      </form>
    `;

    UI.showModal(isEdit ? 'Modifica Collaboratore' : 'Nuovo Collaboratore', formContent, 'large');
    
    setTimeout(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
  }

  async function saveCollaborator(event, collaboratorId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    // gestione file documento (fronte/retro)
    const idFrontFile = form.querySelector('[name="idFront"]')?.files?.[0] || null;
    const idBackFile = form.querySelector('[name="idBack"]')?.files?.[0] || null;

    const fileToDataURL = (file) => new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    let idFrontData = null;
    let idBackData = null;

    try {
      if (idFrontFile) idFrontData = await fileToDataURL(idFrontFile);
      if (idBackFile) idBackData = await fileToDataURL(idBackFile);
    } catch (err) {
      console.error('Errore lettura file documento', err);
      UI.showToast('Errore caricamento documento', 'danger');
      return;
    }

    const existing = collaboratorId ? collaborators.find(c => c.id === collaboratorId) : null;

    const collabData = {
      id: collaboratorId || Utils.generateId('collab-'),
      name: formData.get('name'),
      fiscalCode: formData.get('fiscalCode').toUpperCase(),
      role: formData.get('role'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate') || null,
      monthlyAmount: parseFloat(formData.get('monthlyAmount')),
      paymentDay: parseInt(formData.get('paymentDay')) || 1,
      notes: formData.get('notes'),
      idFront: idFrontData || (existing ? existing.idFront : null),
      idBack: idBackData || (existing ? existing.idBack : null),
      active: true,
      payments: existing ? (existing.payments || []) : [],
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };

    if (collaboratorId) {
      const index = collaborators.findIndex(c => c.id === collaboratorId);
      collaborators[index] = collabData;
    } else {
      collaborators.push(collabData);
    }

    saveData();
    Utils.hapticFeedback('success');
    UI.showToast(collaboratorId ? 'Collaboratore aggiornato' : 'Collaboratore aggiunto', 'success');
    showCollaboratorsTab();
  }

  function getPendingPayments() {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    const pending = [];
    
    collaborators.filter(c => c.active).forEach(collab => {
      const paymentDate = new Date(today.getFullYear(), today.getMonth(), collab.paymentDay);
      
      if (paymentDate <= nextMonth) {
        const isPaid = collab.payments?.some(p => {
          const pDate = new Date(p.date);
          return pDate.getMonth() === paymentDate.getMonth() && 
                 pDate.getFullYear() === paymentDate.getFullYear();
        });

        if (!isPaid) {
          pending.push({
            id: `${collab.id}-${paymentDate.getTime()}`,
            collaboratorId: collab.id,
            collaboratorName: collab.name,
            description: `Compenso ${collab.role}`,
            amount: collab.monthlyAmount,
            dueDate: paymentDate.toISOString().split('T')[0]
          });
        }
      }
    });

    return pending.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  function markPaymentPaid(paymentId) {
    const [collaboratorId, timestamp] = paymentId.split('-');
    const collab = collaborators.find(c => c.id === collaboratorId);
    
    if (!collab) return;

    if (!collab.payments) collab.payments = [];
    
    const payment = {
      date: new Date(parseInt(timestamp)).toISOString().split('T')[0],
      amount: collab.monthlyAmount,
      paid: true,
      paidAt: new Date().toISOString()
    };

    collab.payments.push(payment);

    // Aggiungi a prima nota
    addToLedger({
      type: 'expense',
      category: 'Collaboratori',
      amount: collab.monthlyAmount,
      description: `Pagamento ${collab.role} - ${collab.name}`,
      date: payment.date
    });

    saveData();
    Utils.hapticFeedback('success');
    UI.showToast('Pagamento registrato', 'success');
    showCollaboratorsTab();
  }

  function deactivateCollaborator(collaboratorId) {
    if (!confirm('Sei sicuro di voler disattivare questo collaboratore?')) return;

    const collab = collaborators.find(c => c.id === collaboratorId);
    if (collab) {
      collab.active = false;
      collab.endDate = new Date().toISOString().split('T')[0];
      saveData();
      Utils.hapticFeedback('medium');
      UI.showToast('Collaboratore disattivato', 'success');
      showCollaboratorsTab();
    }
  }

  function confirmDeleteCollaborator(collaboratorId) {
    const collab = collaborators.find(c => c.id === collaboratorId);
    if (!collab) { UI.showToast('Collaboratore non trovato', 'warning'); return; }

    const promptMsg = `Per eliminare definitivamente "${collab.name}" digita il NOME esatto per confermare:`;
    const input = prompt(promptMsg, '');
    if (input === null) { UI.showToast('Eliminazione annullata', 'info'); return; }

    if (input.trim() !== collab.name) {
      UI.showToast('Nome non corrispondente. Eliminazione annullata', 'warning');
      return;
    }

    if (!confirm(`Confermi l'eliminazione definitiva di ${collab.name}? Questa azione è IRREVERSIBILE.`)) return;

    // Procedi con eliminazione
    deleteCollaborator(collaboratorId);
  }

  function deleteCollaborator(collaboratorId) {
    if (!confirm('Sei sicuro di voler eliminare definitivamente questo collaboratore? Questa azione è irreversibile.')) return;

    // Trova nome per pulizia eventuale della prima nota
    const collab = collaborators.find(c => c.id === collaboratorId);
    const collabName = collab ? collab.name : null;

    // Rimuovi collaboratore dalla lista
    collaborators = collaborators.filter(c => c.id !== collaboratorId);

    // Rimuovi voci in prima nota che contengono il nome del collaboratore (se presente)
    if (collabName) {
      ledger = ledger.filter(l => !(l.description && l.description.includes(collabName)));
    }

    saveData();
    Utils.hapticFeedback('medium');
    UI.showToast('Collaboratore eliminato', 'success');
    showCollaboratorsTab();
  }

  /**
   * =====================================================
   * PRIMA NOTA (LEDGER)
   * =====================================================
   */

  function renderLedgerTab() {
    const currentYear = new Date().getFullYear();
    // anni disponibili dalla prima nota
    const yearsSet = new Set(ledger.map(l => new Date(l.date).getFullYear()));
    const years = Array.from(yearsSet).sort((a,b) => b - a);
    const selectedYear = ledgerYearFilter === 'all' ? 'all' : ledgerYearFilter || currentYear;
    const yearLedger = selectedYear === 'all' ? ledger.slice() : ledger.filter(l => new Date(l.date).getFullYear() === selectedYear);

    const totalIncome = yearLedger.filter(l => l.type === 'income').reduce((sum, l) => sum + l.amount, 0);
    const totalExpense = yearLedger.filter(l => l.type === 'expense').reduce((sum, l) => sum + l.amount, 0);
    const balance = totalIncome - totalExpense;

    return `
      <div class="fiscal-section">
        <div class="fiscal-header">
          <div>
            <h3><i data-lucide="book-open"></i> Prima Nota ${selectedYear === 'all' ? 'Tutti gli anni' : selectedYear}</h3>
            <p class="text-secondary">Registro entrate e uscite per il commercialista</p>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items:center;">
            <select id="ledger-year-select" class="input-premium" onchange="FiscalModule.setLedgerYear(this.value)" title="Filtra per anno (o scegli Tutti gli anni per visualizzare tutto)" aria-label="Seleziona anno">
              <option value="all" ${selectedYear === 'all' ? 'selected' : ''}>Tutti gli anni</option>
              ${years.map(y => `<option value="${y}" ${selectedYear === y ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
            <span class="text-secondary small" style="margin-left:0.5rem" title="Scegli un anno per visualizzare o esportare i dati. 'Tutti gli anni' mostra tutte le registrazioni.">Seleziona anno per visualizzare/esportare</span>
            <button class="btn btn-secondary" onclick="FiscalModule.showLedgerForm()">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;">
                <circle cx="12" cy="12" r="10" fill="#38bdf8" opacity="0.18"/>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16" stroke="#22c55e"/>
                <line x1="8" y1="12" x2="16" y2="12" stroke="#22c55e"/>
              </svg> Nuova Registrazione
            </button>
            <button class="btn btn-success" onclick="FiscalModule.exportLedgerCSV()">
              <i data-lucide="download"></i> Export CSV
            </button>
          </div>
        </div>

        <!-- Riepilogo finanziario -->
        <div class="fiscal-summary-cards">
          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-success">
              <i data-lucide="arrow-down-circle"></i>
            </div>
            <div class="stat-card-value">€ ${totalIncome.toFixed(2)}</div>
            <div class="stat-card-label">Entrate</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-danger">
              <i data-lucide="arrow-up-circle"></i>
            </div>
            <div class="stat-card-value">€ ${totalExpense.toFixed(2)}</div>
            <div class="stat-card-label">Uscite</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon stat-card-icon-info">
              <i data-lucide="trending-up"></i>
            </div>
            <div class="stat-card-value ${balance >= 0 ? 'text-success' : 'text-danger'}">
              € ${balance.toFixed(2)}
            </div>
            <div class="stat-card-label">Saldo</div>
          </div>
        </div>

        <!-- Tabella movimenti -->
        <div class="fiscal-table-container">
          ${yearLedger.length > 0 ? `
            <table class="fiscal-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Descrizione</th>
                  <th>Entrate</th>
                  <th>Uscite</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                ${yearLedger.sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => `
                  <tr>
                    <td>${formatDate(entry.date)}</td>
                    <td>
                      <span class="badge-premium badge-premium-${entry.type === 'income' ? 'success' : 'danger'}">
                        ${entry.type === 'income' ? 'Entrata' : 'Uscita'}
                      </span>
                    </td>
                    <td>${entry.category}</td>
                    <td>${entry.description}</td>
                    <td class="text-success">${entry.type === 'income' ? '€ ' + entry.amount.toFixed(2) : '-'}</td>
                    <td class="text-danger">${entry.type === 'expense' ? '€ ' + entry.amount.toFixed(2) : '-'}</td>
                    <td>
                      <button class="btn-icon btn-danger" onclick="FiscalModule.deleteLedgerEntry('${entry.id}')" title="Elimina">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="6" width="18" height="14" rx="2" fill="#f87171" opacity="0.18"/>
                          <rect x="3" y="6" width="18" height="14" rx="2"/>
                          <path d="M9 10v4" stroke="#ef4444"/>
                          <path d="M15 10v4" stroke="#ef4444"/>
                          <path d="M4 6h16" stroke="#fbbf24"/>
                          <path d="M10 3h4" stroke="#f59e42"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i data-lucide="book-open"></i>
              </div>
              <h4>Nessuna Registrazione</h4>
              <p>Inizia a registrare entrate e uscite nella prima nota</p>
            </div>
          `}
        </div>
      </div>
    `;
  }

  function showLedgerForm() {
    const formContent = `
      <form id="ledger-form" onsubmit="FiscalModule.saveLedgerEntry(event)">
        <div class="form-grid">
          <div class="form-group">
            <label>Tipo *</label>
            <select name="type" required class="input-premium" onchange="FiscalModule.updateLedgerCategories(this.value)">
              <option value="">Seleziona tipo</option>
              <option value="income">Entrata</option>
              <option value="expense">Uscita</option>
            </select>
          </div>

          <div class="form-group">
            <label>Data *</label>
            <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required class="input-premium">
          </div>

          <div class="form-group">
            <label>Categoria *</label>
            <select name="category" id="ledger-category" required class="input-premium">
              <option value="">Prima seleziona il tipo</option>
            </select>
          </div>

          <div class="form-group">
            <label>Importo (€) *</label>
            <input type="number" name="amount" required step="0.01" min="0" class="input-premium">
          </div>

          <div class="form-group span-2">
            <label>Descrizione *</label>
            <input type="text" name="description" required placeholder="Dettagli movimento..." class="input-premium">
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="FiscalModule.showLedgerTab()">Annulla</button>
          <button type="submit" class="btn-premium">
            <i data-lucide="save"></i> Registra Movimento
          </button>
        </div>
      </form>
    `;

    UI.showModal('Nuova Registrazione Prima Nota', formContent, 'medium');
    
    setTimeout(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
  }

  function updateLedgerCategories(type) {
    const categorySelect = document.getElementById('ledger-category');
    if (!categorySelect) return;

    const incomeCategories = [
      'Ricevuta fiscale',
      'Quote associative',
      'Sponsorizzazioni',
      'Contributi pubblici',
      'Eventi/Tornei',
      'Altro'
    ];

    const expenseCategories = [
      'Collaboratori',
      'Affitti campi',
      'Materiale sportivo',
      'Trasporti',
      'Assicurazioni',
      'Utenze',
      'Manutenzioni',
      'Altro'
    ];

    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    categorySelect.innerHTML = '<option value="">Seleziona categoria</option>' +
      categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }

  function saveLedgerEntry(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const type = formData.get('type');
    const category = formData.get('category');
    const amount = parseFloat(formData.get('amount'));
    const description = formData.get('description');
    const date = formData.get('date');

    // Validazione base dei campi per evitare valori non validi (es. amount NaN)
    if (!type || !category || !description || !date || isNaN(amount) || amount <= 0) {
      UI.showToast('Compila tutti i campi correttamente', 'warning');
      return;
    }

    try {
      addToLedger({
        type,
        category,
        amount,
        description,
        date
      });

      saveData();

      // Chiudi il modal corrente e ricarica la dashboard prima nota
      UI.closeModal();
      Utils.hapticFeedback('success');
      UI.showToast('Movimento registrato', 'success');
      showFiscalDashboard();
      showLedgerTab();
    } catch (err) {
      console.error('Errore salvataggio prima nota', err);
      const msg = (err && err.message) ? err.message : String(err);
      UI.showToast('Errore durante il salvataggio: ' + msg, 'danger');
    }
  }

  function addToLedger(data) {
    ledger.push({
      id: data.id || Utils.generateId('ledger-'),
      ...data,
      createdAt: new Date().toISOString()
    });
  }

  function deleteLedgerEntry(entryId) {
    if (!confirm('Sei sicuro di voler eliminare questo movimento?')) return;

    ledger = ledger.filter(l => l.id !== entryId);
    saveData();
    Utils.hapticFeedback('medium');
    UI.showToast('Movimento eliminato', 'success');
    showLedgerTab();
  }

  function exportLedgerCSV() {
    const selected = ledgerYearFilter;
    const yearLedger = selected === 'all' ? ledger.slice() : ledger.filter(l => new Date(l.date).getFullYear() === selected);

    if (yearLedger.length === 0) {
      UI.showToast('Nessun dato da esportare', 'warning');
      return;
    }

    // Header CSV
    let csv = 'Data,Tipo,Categoria,Descrizione,Entrate,Uscite\n';

    // Righe
    yearLedger.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(entry => {
      const income = entry.type === 'income' ? entry.amount.toFixed(2) : '';
      const expense = entry.type === 'expense' ? entry.amount.toFixed(2) : '';
      
      csv += `${entry.date},${entry.type === 'income' ? 'Entrata' : 'Uscita'},${entry.category},"${entry.description}",${income},${expense}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `prima-nota-${selected === 'all' ? 'tutti-anni' : selected}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Utils.hapticFeedback('success');
    UI.showToast('CSV esportato', 'success');
  }

  /**
   * =====================================================
   * SWITCH TABS
   * =====================================================
   */

  function showReceiptsTab() {
    updateTabContent(renderReceiptsTab());
    updateActiveTab(0);
  }

  function showCollaboratorsTab() {
    try {
      const content = renderCollaboratorsTab();
      updateTabContent(content);
      updateActiveTab(1);
    } catch (err) {
      console.error('Errore render Collaboratori', err);
      UI.showToast('Errore durante l\'apertura della pagina Collaboratori', 'danger');
    }
  }

  function showLedgerTab() {
    updateTabContent(renderLedgerTab());
    updateActiveTab(2);
  }

  function updateTabContent(content) {
    const container = document.getElementById('fiscal-tab-content');
    if (container) {
      container.innerHTML = content;
      setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
        // Re-inizializza elementi dinamici (anteprime file, listener, ecc.)
        try { initRenderedContent(); } catch (e) { /* ignore */ }
      }, 50);
    }
  }

  function updateActiveTab(index) {
    const tabs = document.querySelectorAll('.fiscal-tab');
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });
  }

  // Inizializza elementi dinamici inseriti nelle schede (anteprime file, listener, ecc.)
  function initRenderedContent() {
    // Anteprime per ID (fronte/retro)
    ['idFront','idBack'].forEach(name => {
      const input = document.querySelector(`[name="${name}"]`);
      if (!input) return;

      let preview = input.parentElement.querySelector('.file-preview');
      if (!preview) {
        preview = document.createElement('div');
        preview.className = 'file-preview';
        preview.setAttribute('data-for', name);
        input.parentElement.appendChild(preview);
      }

      // Aggiungi listener per mostrare l'anteprima (non duplicare listener se già presente)
      input.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) { preview.innerHTML = ''; return; }
        const reader = new FileReader();
        reader.onload = () => {
          preview.innerHTML = `<img src="${reader.result}" alt="${name}" style="max-width:120px;margin-top:0.5rem;border-radius:6px;">`;
        };
        reader.readAsDataURL(file);
      });
    });

    // Punto centrale per aggiungere ulteriori re-inizializzazioni (es. plugin datepicker)
  }

  /**
   * =====================================================
   * HELPERS
   * =====================================================
   */

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  }

  function setReceiptsYear(value) {
    receiptsYearFilter = value === 'all' ? 'all' : parseInt(value);
    updateTabContent(renderReceiptsTab());
  }

  function setLedgerYear(value) {
    ledgerYearFilter = value === 'all' ? 'all' : parseInt(value);
    updateTabContent(renderLedgerTab());
  }

  function exportReceiptsCSV() {
    const selected = receiptsYearFilter;
    const data = selected === 'all' ? receipts.slice() : receipts.filter(r => new Date(r.date).getFullYear() === selected);
    if (data.length === 0) { UI.showToast('Nessun dato da esportare', 'warning'); return; }
    let csv = 'Data,Descrizione,Categoria,Importo\n';
    data.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(r => {
      csv += `${r.date},"${r.description || ''}",${r.category || ''},${r.amount.toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ricevute-${selected === 'all' ? 'tutti-anni' : selected}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Utils.hapticFeedback('success');
    UI.showToast('CSV esportato', 'success');
  }

  // ========== RIEPILOGHI E API PER LA DASHBOARD ==========
  function getReceiptsSummary(year = new Date().getFullYear()) {
    const data = year === 'all' ? receipts.slice() : receipts.filter(r => new Date(r.date).getFullYear() === year);
    const totalAmount = data.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return { count: data.length, totalAmount };
  }

  function getLedgerSummary(year = new Date().getFullYear()) {
    const data = year === 'all' ? ledger.slice() : ledger.filter(l => new Date(l.date).getFullYear() === year);
    const income = data.filter(l => l.type === 'income').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const expense = data.filter(l => l.type === 'expense').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    return { income, expense, balance: income - expense, count: data.length };
  }

  function getCollaboratorsSummary() {
    const active = collaborators.filter(c => c.active);
    const totalMonthly = active.reduce((sum, c) => sum + (Number(c.monthlyAmount) || 0), 0);
    const pending = getPendingPayments();
    const pendingCount = pending.length;
    const pendingAmount = pending.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return { activeCount: active.length, totalMonthly, pendingCount, pendingAmount };
  }

  function viewReceipt(receiptId) {
    // Implementare visualizzazione dettagliata ricevuta
    console.log('View receipt:', receiptId);
  }

  function viewCollaborator(collaboratorId) {
    // Implementare visualizzazione dettagliata collaboratore
    console.log('View collaborator:', collaboratorId);
  }

  // Esposizione pubblica
  return {
    init,
    showFiscalDashboard,
    showReceiptsTab,
    showCollaboratorsTab,
    showLedgerTab,
    showReceiptForm,
    saveReceipt,
    downloadReceipt,
    deleteReceipt,
    showCollaboratorForm,
    saveCollaborator,
    deleteCollaborator,
    confirmDeleteCollaborator,
    deactivateCollaborator,
    markPaymentPaid,
    showLedgerForm,
    saveLedgerEntry,
    deleteLedgerEntry,
    updateLedgerCategories,
    exportLedgerCSV,
    exportReceiptsCSV,
    setReceiptsYear,
    setLedgerYear,
    getReceiptsSummary,
    getLedgerSummary,
    getCollaboratorsSummary,
    viewReceipt,
    viewCollaborator
  };
})();

// Esposizione globale
window.FiscalModule = FiscalModule;
