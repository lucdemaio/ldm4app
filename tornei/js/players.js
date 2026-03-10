/**
 * SISTEMA GESTIONE GIOCATORI
 * Gestione completa di giocatori, statistiche individuali e storia
 */

const AppGiocatori = (function(){
  const root = document.getElementById('app-root');

  // Crea una UI per elenco giocatori
  function tplList(giocatori) {
    return `
      <div class="d-flex mb-3 header-compact">
        <h3 class="me-auto">${I18n.t('giocatori')} <span class="badge-muted ms-2">${giocatori.length}</span></h3>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" id="refresh-players"><i class="fa-solid fa-arrows-rotate me-1"></i>Aggiorna</button>
          <button class="btn btn-primary" id="add-player"><i class="fa-solid fa-plus me-2"></i>${I18n.t('nuovo_giocatore')}</button>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <input type="text" class="form-control" id="search-player" placeholder="${I18n.t('search')} giocatore...">
        </div>
        <div class="col-md-3">
          <select class="form-select" id="filter-squad">
            <option value="">Tutte le Squadre</option>
            <!-- squad options populated dynamically -->
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select" id="filter-role">
            <option value="">Tutti i Ruoli</option>
            <option value="portiere">Portiere</option>
            <option value="difensore">Difensore</option>
            <option value="centrocampista">Centrocampista</option>
            <option value="attaccante">Attaccante</option>
          </select>
        </div>
      </div>

      <div class="card mud-paper">
        <div class="card-body p-0">
          <table class="table table-hover table-sm mb-0">
            <thead class="table-light">
              <tr>
                <th style="width:30%">Nome</th>
                <th style="width:15%">Squadra</th>
                <th style="width:15%">Ruolo</th>
                <th style="width:10%">Numero</th>
                <th style="width:15%">Presenze</th>
                <th style="width:15%"></th>
              </tr>
            </thead>
            <tbody>
              ${giocatori.length === 0 ? `<tr><td colspan="6" class="empty-state">${I18n.t('nessun_risultato')}</td></tr>` 
                : giocatori.map(g => `
                <tr data-id="${g.id}">
                  <td><strong>${escapeHtml(g.nome)}</strong><br><small class="text-muted">${escapeHtml(g.cognome)}</small></td>
                  <td>${escapeHtml(g.squadra_nome || '--')}</td>
                  <td><span class="badge badge-secondary">${escapeHtml(g.ruolo || '--')}</span></td>
                  <td class="text-center">${g.numero || '-'}</td>
                  <td class="text-center">${g.presenze || 0}</td>
                  <td class="text-end">
                    <button class="btn btn-icon btn-sm btn-outline-primary me-2" data-action="view" title="Dettagli">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn btn-icon btn-sm btn-outline-warning me-2" data-action="edit" title="${I18n.t('edit')}">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-icon btn-sm btn-outline-danger" data-action="delete" title="${I18n.t('delete')}">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Form per creare/modificare giocatore
  function tplForm(giocatore, squadre) {
    giocatore = giocatore || {};
    return `
      <div class="card mud-paper">
        <div class="card-body">
          <h4>${giocatore.id ? 'Modifica Giocatore' : I18n.t('nuovo_giocatore')}</h4>
          
          <form id="form-giocatore">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label form-required">Nome</label>
                <input type="text" class="form-control" name="nome" value="${escapeHtml(giocatore.nome || '')}" required>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label form-required">Cognome</label>
                <input type="text" class="form-control" name="cognome" value="${escapeHtml(giocatore.cognome || '')}" required>
              </div>
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Data di Nascita</label>
                <input type="date" class="form-control" name="data_nascita" value="${giocatore.data_nascita || ''}">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Telefono</label>
                <input type="tel" class="form-control" name="telefono" value="${escapeHtml(giocatore.telefono || '')}">
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" name="email" value="${escapeHtml(giocatore.email || '')}">
              </div>
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label form-required">Squadra</label>
                <select class="form-select" name="squadra_id" required>
                  <option value="">-- Seleziona --</option>
                  ${squadre.map(s => `<option value="${s.id}" ${giocatore.squadra_id === s.id ? 'selected' : ''}>${escapeHtml(s.nome)}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Ruolo</label>
                <select class="form-select" name="ruolo">
                  <option value="">-- Nessuno --</option>
                  <option value="portiere" ${giocatore.ruolo === 'portiere' ? 'selected' : ''}>Portiere</option>
                  <option value="difensore" ${giocatore.ruolo === 'difensore' ? 'selected' : ''}>Difensore</option>
                  <option value="centrocampista" ${giocatore.ruolo === 'centrocampista' ? 'selected' : ''}>Centrocampista</option>
                  <option value="attaccante" ${giocatore.ruolo === 'attaccante' ? 'selected' : ''}>Attaccante</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Numero Maglia</label>
                <input type="number" min="1" max="99" class="form-control" name="numero" value="${giocatore.numero || ''}">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Note / Informazioni Aggiuntive</label>
              <textarea class="form-control" name="note" rows="3" placeholder="Es: infortuni, squalifiche..."></textarea>
            </div>

            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check me-2"></i>${I18n.t('save')}</button>
              <button type="button" class="btn btn-outline-secondary" id="cancel-form">${I18n.t('cancel')}</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Visualizza dettagli giocatore con statistiche
  function tplDetail(giocatore, stats) {
    stats = stats || {};
    return `
      <div class="card mud-paper mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h3>${escapeHtml(giocatore.nome)} ${escapeHtml(giocatore.cognome)}</h3>
              <p class="text-muted mb-0">
                <i class="fa-solid fa-shield-halved me-2"></i>${escapeHtml(giocatore.squadra_nome || '--')} 
                ${giocatore.numero ? `<span class="badge bg-primary ms-2">#${giocatore.numero}</span>` : ''}
              </p>
            </div>
            <div class="text-end">
              <button class="btn btn-outline-warning btn-sm me-2" data-action="edit">
                <i class="fa-solid fa-pen me-1"></i>${I18n.t('edit')}
              </button>
              <button class="btn btn-outline-danger btn-sm" data-action="delete">
                <i class="fa-solid fa-trash me-1"></i>${I18n.t('delete')}
              </button>
            </div>
          </div>

          <div class="row">
            <div class="col-md-3">
              <strong>Ruolo:</strong> ${escapeHtml(giocatore.ruolo || '--')}
            </div>
            <div class="col-md-3">
              <strong>Data Nascita:</strong> ${formatDate(giocatore.data_nascita) || '--'}
            </div>
            <div class="col-md-3">
              <strong>Telefono:</strong> ${escapeHtml(giocatore.telefono || '--')}
            </div>
            <div class="col-md-3">
              <strong>Email:</strong> ${escapeHtml(giocatore.email || '--')}
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="card mud-paper mb-3">
            <div class="card-body">
              <h5>Statistiche</h5>
              <div class="stat-item d-flex justify-content-between py-2" style="border-bottom: 1px solid var(--border)">
                <span>Presenze</span>
                <strong>${stats.presenze || 0}</strong>
              </div>
              <div class="stat-item d-flex justify-content-between py-2">
                <span>Gol/Punti</span>
                <strong>${stats.gol || 0}</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card mud-paper mb-3">
            <div class="card-body">
              <h5>Recenti</h5>
              <p class="text-muted mb-0">Ultime partite giocate</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function render() {
    try {
      const giocatori = await IDB.getAll('giocatori');
      root.innerHTML = tplList(giocatori);
      
      // Bind events
      document.getElementById('add-player')?.addEventListener('click', () => showForm());
      document.getElementById('refresh-players')?.addEventListener('click', render);
      
      document.querySelectorAll('[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', e => {
          const id = e.currentTarget.closest('tr').dataset.id;
          viewDetail(id);
        });
      });
      
      document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', e => {
          const id = e.currentTarget.closest('tr').dataset.id;
          editGiocatore(id);
        });
      });
      
      document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', e => {
          const id = e.currentTarget.closest('tr').dataset.id;
          if(confirm(I18n.t('conferma_delete'))) deleteGiocatore(id);
        });
      });
    } catch(e) {
      console.error('Errore nel render giocatori:', e);
      root.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  async function showForm(giocatoreId = null) {
    const squadre = await IDB.getAll('squadre');
    const giocatore = giocatoreId ? await IDB.get('giocatori', giocatoreId) : null;
    
    root.innerHTML = tplForm(giocatore, squadre);
    
    document.getElementById('form-giocatore')?.addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      data.id = giocatore?.id || makeId('player');
      data.createdAt = giocatore?.createdAt || new Date().toISOString();
      data.updatedAt = new Date().toISOString();
      
      await IDB.put('giocatori', data);
      alert(I18n.t('salvato_successo'));
      render();
    });
    
    document.getElementById('cancel-form')?.addEventListener('click', render);
  }

  async function viewDetail(giocatoreId) {
    const giocatore = await IDB.get('giocatori', giocatoreId);
    if(!giocatore) return alert('Giocatore non trovato');
    
    // Get stats (placeholder for now)
    const stats = { presenze: 5, gol: 2 };
    
    root.innerHTML = tplDetail(giocatore, stats);
    
    document.querySelector('[data-action="edit"]')?.addEventListener('click', () => showForm(giocatoreId));
    document.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      if(confirm(I18n.t('conferma_delete'))) deleteGiocatore(giocatoreId);
    });
  }

  async function editGiocatore(giocatoreId) {
    showForm(giocatoreId);
  }

  async function deleteGiocatore(giocatoreId) {
    await IDB.delete('giocatori', giocatoreId);
    alert(I18n.t('salvato_successo'));
    render();
  }

  return {
    render
  };
})();

// Export to global scope
window.AppGiocatori = AppGiocatori;
