// Gestione Dashboard
class DashboardManager {
  constructor() {
    this.eventsManager = eventsManager;
    this.volunteersManager = volunteersManager;
    this.budgetManager = budgetManager;
    this.tasksManager = tasksManager;
  }

  // Ottieni dati dashboard
  getDashboardData() {
    return {
      stats: this.getStats(),
      upcomingEvents: this.eventsManager.getUpcomingEvents(5),
      recentTasks: this.getRecentTasks(5),
      alerts: this.getAlerts()
    };
  }

  // Statistiche principali
  getStats() {
    return {
      totalEvents: this.eventsManager.getStats().total,
      plannedEvents: this.eventsManager.getStats().planned,
      activeVolunteers: this.volunteersManager.getStats().active,
      totalVolunteerHours: this.volunteersManager.getStats().totalHours,
      budgetBalance: this.budgetManager.getTotals().balance,
      pendingTasks: this.tasksManager.getStats().pending,
      completedTasks: this.tasksManager.getStats().completed
    };
  }

  // Compiti recenti
  getRecentTasks(limit = 5) {
    return this.tasksManager.getAllTasks()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  // Avvisi
  getAlerts() {
    const alerts = [];

    // Avviso scadenze
    const overdue = this.tasksManager.getOverdueTasks();
    if (overdue.length > 0) {
      alerts.push({
        type: 'danger',
        icon: '⏰',
        message: `${overdue.length} compito/i scaduto/i`
      });
    }

    // Avviso budget
    const budgetHealth = this.budgetManager.getTotals();
    if (budgetHealth.balance < 0) {
      alerts.push({
        type: 'danger',
        icon: '💰',
        message: `Budget in deficit: ${Utils.formatCurrency(budgetHealth.balance)}`
      });
    }

    // Avviso volontari
    if (this.volunteersManager.getStats().active === 0) {
      alerts.push({
        type: 'warning',
        icon: '👥',
        message: 'Nessun volontario attivo registrato'
      });
    }

    // Avviso eventi
    if (this.eventsManager.getStats().planned === 0) {
      alerts.push({
        type: 'info',
        icon: '📅',
        message: 'Nessun evento pianificato'
      });
    }

    return alerts;
  }

  // Rendering dashboard
  renderDashboard() {
    const data = this.getDashboardData();
    const stats = data.stats;

    return `
      <div class="dashboard-container">
        <!-- Alerts -->
        ${this.renderAlerts(data.alerts)}

        <!-- Main Stats -->
        <div class="grid grid-4">
          <div class="card stats-card">
            <div class="card-body" style="padding: 20px; text-align: center;">
              <div style="font-size: 2.5em; color: var(--primary);">📅</div>
              <p style="font-size: 0.9em; color: var(--text-secondary); margin: 10px 0 5px;">Eventi</p>
              <p style="font-size: 2em; font-weight: bold;">${stats.totalEvents}</p>
              <p style="font-size: 0.8em; color: var(--text-secondary);">${stats.plannedEvents} pianificati</p>
            </div>
          </div>

          <div class="card stats-card">
            <div class="card-body" style="padding: 20px; text-align: center;">
              <div style="font-size: 2.5em; color: var(--secondary);">👥</div>
              <p style="font-size: 0.9em; color: var(--text-secondary); margin: 10px 0 5px;">Volontari</p>
              <p style="font-size: 2em; font-weight: bold;">${stats.activeVolunteers}</p>
              <p style="font-size: 0.8em; color: var(--text-secondary);">${stats.totalVolunteerHours}h</p>
            </div>
          </div>

          <div class="card stats-card">
            <div class="card-body" style="padding: 20px; text-align: center;">
              <div style="font-size: 2.5em; color: ${stats.budgetBalance >= 0 ? 'var(--success)' : 'var(--danger)'};">💰</div>
              <p style="font-size: 0.9em; color: var(--text-secondary); margin: 10px 0 5px;">Budget</p>
              <p style="font-size: 2em; font-weight: bold; color: ${stats.budgetBalance >= 0 ? 'var(--success)' : 'var(--danger)'};">
                ${Utils.formatCurrency(stats.budgetBalance)}
              </p>
            </div>
          </div>

          <div class="card stats-card">
            <div class="card-body" style="padding: 20px; text-align: center;">
              <div style="font-size: 2.5em; color: var(--info);">✅</div>
              <p style="font-size: 0.9em; color: var(--text-secondary); margin: 10px 0 5px;">Compiti</p>
              <p style="font-size: 2em; font-weight: bold;">${stats.completedTasks}</p>
              <p style="font-size: 0.8em; color: var(--text-secondary);">${stats.pendingTasks} in sospeso</p>
            </div>
          </div>
        </div>

        <!-- Upcoming Events -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Prossimi Eventi</div>
            <a href="#" onclick="switchPage('events')" class="link">Vedi tutti</a>
          </div>
          <div class="card-body">
            ${data.upcomingEvents.length > 0 ? `
              <div style="display: grid; gap: 10px;">
                ${data.upcomingEvents.map(e => `
                  <div style="padding: 10px; background: var(--light); border-radius: var(--radius); cursor: pointer;" onclick="viewEvent('${e.id}')">
                    <p style="font-weight: bold; margin: 0;">${e.title}</p>
                    <p style="font-size: 0.9em; color: var(--text-secondary); margin: 5px 0 0;">
                      📅 ${Utils.formatDate(e.date)} | 📍 ${e.location}
                    </p>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: var(--text-secondary);">Nessun evento pianificato</p>'}
          </div>
        </div>

        <!-- Recent Tasks -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Compiti Recenti</div>
            <a href="#" onclick="switchPage('tasks')" class="link">Vedi tutti</a>
          </div>
          <div class="card-body">
            ${data.recentTasks.length > 0 ? `
              <table class="table">
                <thead>
                  <tr>
                    <th>Titolo</th>
                    <th>Priorità</th>
                    <th>Status</th>
                    <th>Scadenza</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.recentTasks.map(t => `
                    <tr>
                      <td>${t.title}</td>
                      <td><span class="badge badge-${t.priority === 'high' ? 'danger' : t.priority === 'low' ? 'info' : 'default'}">${t.priority}</span></td>
                      <td><span class="badge badge-${t.status === 'completed' ? 'success' : t.status === 'in-progress' ? 'info' : 'warning'}">${t.status}</span></td>
                      <td>${t.dueDate ? Utils.formatDate(t.dueDate) : 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color: var(--text-secondary);">Nessun compito</p>'}
          </div>
        </div>
      </div>
    `;
  }

  // Rendering avvisi
  renderAlerts(alerts) {
    if (alerts.length === 0) return '';

    return `
      <div style="margin-bottom: 20px; display: grid; gap: 10px;">
        ${alerts.map(alert => `
          <div style="padding: 15px; background: var(--light-${alert.type}); border-left: 4px solid var(--${alert.type}); border-radius: var(--radius);">
            <strong>${alert.icon} ${alert.message}</strong>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// Istanza globale
const dashboardManager = new DashboardManager();
