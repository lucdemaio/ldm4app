/**
 * SISTEMA STATISTICHE AVANZATE
 * Analytics complete con grafici, trend e analisi dettagliate
 */

const AppStatistics = (function(){
  const root = document.getElementById('app-root');

  function tplDashboard() {
    return `
      <div class="d-flex mb-3 header-compact">
        <h3 class="me-auto">${I18n.t('statistiche')}</h3>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm" id="filter-torneo" style="max-width:200px">
            <option value="">Tutti i Tornei</option>
          </select>
          <select class="form-select form-select-sm" id="filter-period" style="max-width:150px">
            <option value="7">Ultimi 7 giorni</option>
            <option value="30">Ultimi 30 giorni</option>
            <option value="90">Ultimi 90 giorni</option>
            <option value="all">Tutto</option>
          </select>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="row mb-3">
        <div class="col-md-3">
          <div class="card mud-paper border-left-primary">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="mb-1 small text-muted">Tornei Totali</p>
                  <h4 class="mb-0" id="stat-tornei">--</h4>
                </div>
                <div style="font-size: 2rem; opacity: 0.2;"><i class="fa-solid fa-trophy"></i></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card mud-paper border-left-success">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="mb-1 small text-muted">Squadre Registrate</p>
                  <h4 class="mb-0" id="stat-squadre">--</h4>
                </div>
                <div style="font-size: 2rem; opacity: 0.2;"><i class="fa-solid fa-users"></i></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card mud-paper border-left-info">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="mb-1 small text-muted">Giocatori</p>
                  <h4 class="mb-0" id="stat-giocatori">--</h4>
                </div>
                <div style="font-size: 2rem; opacity: 0.2;"><i class="fa-solid fa-person"></i></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card mud-paper border-left-warning">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="mb-1 small text-muted">Partite Giocate</p>
                  <h4 class="mb-0" id="stat-partite">--</h4>
                </div>
                <div style="font-size: 2rem; opacity: 0.2;"><i class="fa-solid fa-calendar-day"></i></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Statistics -->
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="card mud-paper">
            <div class="card-body">
              <h5>Tornei per Sport</h5>
              <canvas id="chart-sports" style="max-height: 220px;"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card mud-paper">
            <div class="card-body">
              <h5>Andamento Partite</h5>
              <canvas id="chart-matches" style="max-height: 220px;"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Performers -->
      <div class="row mb-3">
        <div class="col-md-4">
          <div class="card mud-paper">
            <div class="card-body">
              <h5>🏆 Top Squadre</h5>
              <div id="top-teams">
                <p class="text-muted small">Caricamento...</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card mud-paper">
            <div class="card-body">
              <h5>🎯 Miglior Attacco</h5>
              <div id="top-strikers">
                <p class="text-muted small">Caricamento...</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card mud-paper">
            <div class="card-body">
              <h5>⚡ Prestazioni Recenti</h5>
              <div id="recent-performance">
                <p class="text-muted small">Caricamento...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Heatmap Giocatori -->
      <div class="card mud-paper mb-3">
        <div class="card-body">
          <h5>Presenze Giocatori</h5>
          <table class="table table-sm table-hover mb-0" id="players-heatmap">
            <thead class="table-light">
              <tr>
                <th>Giocatore</th>
                <th class="text-center small">Partite</th>
                <th class="text-center small">%</th>
              </tr>
            </thead>
            <tbody id="heatmap-rows">
              <tr><td colspan="3" class="empty-state">Nessun dato</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function loadStatistics() {
    try {
      // Carica i dati
      const tornei = await IDB.getAll('tornei');
      const squadre = await IDB.getAll('squadre');
      const giocatori = await IDB.getAll('giocatori');
      const giornate = await IDB.getAll('giornate');

      // Aggiorna KPI
      document.getElementById('stat-tornei').textContent = tornei.length;
      document.getElementById('stat-squadre').textContent = squadre.length;
      document.getElementById('stat-giocatori').textContent = giocatori.length;
      document.getElementById('stat-partite').textContent = giornate.length;

      // Sportbook per torneo
      const sportCounts = {};
      tornei.forEach(t => {
        sportCounts[t.sport || 'Altro'] = (sportCounts[t.sport || 'Altro'] || 0) + 1;
      });

      // Renderizza top teams
      const topTeamsHtml = squadre
        .sort((a, b) => (b.punti || 0) - (a.punti || 0))
        .slice(0, 5)
        .map((s, i) => `
          <div class="d-flex justify-content-between align-items-center py-2">
            <span class="badge bg-primary me-2">${i + 1}</span>
            <strong>${escapeHtml(s.nome)}</strong>
            <span class="badge bg-success">${s.punti || 0}pt</span>
          </div>
        `)
        .join('');
      document.getElementById('top-teams').innerHTML = topTeamsHtml || '<p class="text-muted small">Nessun dato</p>';

      // Renderizza giocatori heatmap
      const heatmapHtml = giocatori
        .slice(0, 10)
        .map(g => `
          <tr>
            <td><strong>${escapeHtml(g.nome)} ${escapeHtml(g.cognome)}</strong></td>
            <td class="text-center">${g.presenze || 0}</td>
            <td>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar" style="width: ${((g.presenze || 0) / 10) * 100}%"></div>
              </div>
            </td>
          </tr>
        `)
        .join('');
      document.getElementById('heatmap-rows').innerHTML = heatmapHtml || '<tr><td colspan="3" class="empty-state">Nessun dato</td></tr>';

    } catch(e) {
      console.error('Errore caricamento statistiche:', e);
    }
  }

  async function render() {
    root.innerHTML = tplDashboard();
    await loadStatistics();
  }

  return {
    render
  };
})();
