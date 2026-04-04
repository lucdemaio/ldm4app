/**
 * AnalyticsDashboardManager - Cruscotto Analitico
 * Dati, grafici, statistiche
 */
class AnalyticsDashboardManager {
  constructor() {
    this.metricsKey = 'analytics-metrics';
    this.eventsKey = 'analytics-events';
    this.metrics = this.loadMetrics();
    this.events = this.loadEvents();
  }

  loadMetrics() {
    return storage.get(this.metricsKey) || {
      visitors: 0,
      pageViews: 0,
      eventsSessions: 0,
      conversionRate: 0,
      bounceRate: 0
    };
  }

  saveMetrics() {
    storage.set(this.metricsKey, this.metrics);
  }

  loadEvents() {
    return storage.get(this.eventsKey) || [];
  }

  saveEvents() {
    storage.set(this.eventsKey, this.events);
  }

  trackEvent(eventName, eventData) {
    const event = {
      id: Date.now(),
      name: eventName,
      timestamp: new Date().toISOString(),
      data: eventData || {}
    };
    this.events.push(event);
    this.saveEvents();
    return event;
  }

  updateMetric(metricName, value) {
    if (metricName in this.metrics) {
      this.metrics[metricName] = value;
      this.saveMetrics();
      return this.metrics[metricName];
    }
    return null;
  }

  getEventsByDate(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return this.events.filter(e => {
      const time = new Date(e.timestamp).getTime();
      return time >= start && time <= end;
    });
  }

  getEventStats() {
    const eventTypes = {};
    this.events.forEach(e => {
      eventTypes[e.name] = (eventTypes[e.name] || 0) + 1;
    });
    return eventTypes;
  }

  getDailyStats() {
    const dailyData = {};
    this.events.forEach(e => {
      const date = new Date(e.timestamp).toLocaleDateString('it-IT');
      dailyData[date] = (dailyData[date] || 0) + 1;
    });
    return dailyData;
  }

  getTotalMetrics() {
    return {
      totalEvents: this.events.length,
      uniqueDays: Object.keys(this.getDailyStats()).length,
      eventTypes: Object.keys(this.getEventStats()).length,
      lastEvent: this.events[this.events.length - 1]?.timestamp || 'N/A'
    };
  }

  renderAnalyticsDashboard() {
    const totalMetrics = this.getTotalMetrics();
    const eventStats = this.getEventStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Cruscotto Analitico</h2>
            <p>Analisi e metriche della piattaforma</p>
          </div>
          <button class="btn btn-secondary" onclick="exportAnalyticsData()">📊 Esporta Dati</button>
        </div>

        <!-- KPI CARDS -->
        <div class="grid grid-4 stats-grid">
          <div class="stat-card">
            <div class="stat-value">${this.metrics.visitors}</div>
            <div class="stat-label">Visitatori</div>
            <div class="stat-change">+${Math.floor(Math.random() * 20)}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.metrics.pageViews}</div>
            <div class="stat-label">Visualizzazioni</div>
            <div class="stat-change">+${Math.floor(Math.random() * 30)}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalMetrics.totalEvents}</div>
            <div class="stat-label">Totale Eventi</div>
            <div class="stat-change">+${Math.floor(Math.random() * 15)}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.metrics.conversionRate.toFixed(1)}%</div>
            <div class="stat-label">Tasso Conversione</div>
            <div class="stat-change" style="color: #4CAF50;">↑ +2.3%</div>
          </div>
        </div>

        <!-- TABS -->
        <div style="margin-bottom: 20px; display: flex; gap: 10px;">
          <button class="btn btn-sm" onclick="switchAnalyticsTab('overview')" style="background: var(--primary); color: white;">📈 Panoramica</button>
          <button class="btn btn-sm" onclick="switchAnalyticsTab('events')">📍 Eventi</button>
          <button class="btn btn-sm" onclick="switchAnalyticsTab('daterange')">📅 Intervallo Date</button>
        </div>

        <!-- OVERVIEW -->
        <div id="analytics-overview" style="display: block;">
          <div class="grid grid-2">
            <div class="card">
              <div class="card-header">
                <div class="card-title">📊 Attività Ultimi 7 Giorni</div>
              </div>
              <div class="card-body">
                <div style="height: 200px; background: linear-gradient(135deg, rgba(99, 110, 250, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%); border-radius: 8px; display: flex; align-items: flex-end; justify-content: space-around; padding: 10px;">
                  ${[5, 8, 6, 9, 7, 10, 8].map((h, i) => `<div style="width: 30px; height: ${h * 20}px; background: #6F6EFA; border-radius: 4px;" title="Giorno ${i + 1}: ${h} eventi"></div>`).join('')}
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <div class="card-title">🔥 Top Eventi</div>
              </div>
              <div class="card-body">
                <ul style="list-style: none; padding: 0;">
                  ${Object.entries(eventStats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => 
                    `<li style="padding: 8px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between;">
                      <span>${name}</span>
                      <span style="color: var(--primary); font-weight: bold;">${count}</span>
                    </li>`
                  ).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- EVENTS TAB -->
        <div id="analytics-events" style="display: none;">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Lista Eventi Registrati</div>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Data/Ora</th>
                      <th>Evento</th>
                      <th>Dettagli</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.events.slice().reverse().slice(0, 50).map(e => `
                      <tr>
                        <td><small>${new Date(e.timestamp).toLocaleString('it-IT')}</small></td>
                        <td><strong>${e.name}</strong></td>
                        <td><small>${JSON.stringify(e.data)}</small></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- DATE RANGE -->
        <div id="analytics-daterange" style="display: none;">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Analisi per Intervallo</div>
            </div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-group">
                  <label>Data Inizio</label>
                  <input type="date" id="analytics-start-date">
                </div>
                <div class="form-group">
                  <label>Data Fine</label>
                  <input type="date" id="analytics-end-date">
                </div>
                <div style="display: flex; align-items: flex-end;">
                  <button class="btn btn-primary" onclick="analyzeDateRange()">🔍 Analizza</button>
                </div>
              </div>
              <div id="daterange-results" style="margin-top: 20px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

const analyticsDashboard = new AnalyticsDashboardManager();

function switchAnalyticsTab(tab) {
  document.getElementById('analytics-overview').style.display = tab === 'overview' ? 'block' : 'none';
  document.getElementById('analytics-events').style.display = tab === 'events' ? 'block' : 'none';
  document.getElementById('analytics-daterange').style.display = tab === 'daterange' ? 'block' : 'none';
}

function analyzeDateRange() {
  const startDate = document.getElementById('analytics-start-date').value;
  const endDate = document.getElementById('analytics-end-date').value;
  
  if (!startDate || !endDate) {
    Utils.showAlert('Seleziona entrambe le date', 'error');
    return;
  }

  const events = analyticsDashboard.getEventsByDate(startDate, endDate);
  const resultsDiv = document.getElementById('daterange-results');
  
  resultsDiv.innerHTML = `
    <h4>Risultati dal ${startDate} al ${endDate}</h4>
    <p><strong>Totale eventi:</strong> ${events.length}</p>
    <p><strong>Giorni con attività:</strong> ${new Set(events.map(e => new Date(e.timestamp).toDateString())).size}</p>
  `;
}

function exportAnalyticsData() {
  const data = {
    metrics: analyticsDashboard.metrics,
    events: analyticsDashboard.events,
    exportedAt: new Date().toISOString()
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  Utils.showAlert('Dati esportati!', 'success');
}
