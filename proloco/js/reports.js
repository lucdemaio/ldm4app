// Gestione Rapporti
class ReportsManager {
  constructor() {
    this.eventsManager = eventsManager;
    this.volunteersManager = volunteersManager;
    this.budgetManager = budgetManager;
    this.tasksManager = tasksManager;
  }

  // Rapporto complessivo
  getComprehensiveReport() {
    return {
      events: this.getEventsReport(),
      volunteers: this.getVolunteersReport(),
      budget: this.getBudgetReport(),
      tasks: this.getTasksReport(),
      summary: this.getSummaryReport(),
      generatedAt: new Date().toISOString()
    };
  }

  // Rapporto eventi
  getEventsReport() {
    const stats = this.eventsManager.getStats();
    const events = this.eventsManager.getAllEvents();
    
    return {
      ...stats,
      averageVisitors: events.length > 0 ? 
        Utils.average(events, 'expectedVisitors') : 0,
      upcomingEvents: this.eventsManager.getUpcomingEvents(),
      eventsByCategory: Utils.groupBy(events, 'category')
    };
  }

  // Rapporto volontari
  getVolunteersReport() {
    const stats = this.volunteersManager.getStats();
    const volunteers = this.volunteersManager.getAllVolunteers();
    
    return {
      ...stats,
      byRole: Utils.groupBy(volunteers, 'role'),
      skillsAvailable: this.getAvailableSkills(),
      topVolunteers: this.getTopVolunteersByHours(5)
    };
  }

  // Rapporto budget
  getBudgetReport() {
    const stats = this.budgetManager.getStatisticsByType();
    const totals = this.budgetManager.getTotals();
    const categoriesStats = this.budgetManager.getStatisticsByCategory();
    
    return {
      ...stats,
      ...totals,
      byCategory: categoriesStats,
      budgetHealth: this.getBudgetHealth()
    };
  }

  // Rapporto compiti
  getTasksReport() {
    const stats = this.tasksManager.getStats();
    const tasks = this.tasksManager.getAllTasks();
    
    return {
      ...stats,
      byPriority: Utils.groupBy(tasks, 'priority'),
      completionRate: tasks.length > 0 ? 
        (this.tasksManager.getTasksByStatus('completed').length / tasks.length * 100).toFixed(2) : 0,
      overdueTasks: this.tasksManager.getOverdueTasks()
    };
  }

  // Rapporto di sintesi
  getSummaryReport() {
    return {
      totalEvents: this.eventsManager.getStats().total,
      activeVolunteers: this.volunteersManager.getStats().active,
      totalHours: this.volunteersManager.getStats().totalHours,
      budgetBalance: this.budgetManager.getTotals().balance,
      completedTasks: this.tasksManager.getStats().completed,
      pendingTasks: this.tasksManager.getStats().pending
    };
  }

  // Abilità disponibili
  getAvailableSkills() {
    const volunteers = this.volunteersManager.getAllVolunteers();
    const allSkills = volunteers.flatMap(v => v.skills);
    const skillsCount = Utils.groupBy(allSkills, v => v);
    
    const result = {};
    for (const [skill, count] of Object.entries(skillsCount)) {
      result[skill] = count.length;
    }
    return result;
  }

  // Top volontari per ore
  getTopVolunteersByHours(limit = 5) {
    return this.volunteersManager.getAllVolunteers()
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, limit);
  }

  // Stato budget
  getBudgetHealth() {
    const totals = this.budgetManager.getTotals();
    if (totals.balance < 0) {
      return {
        status: 'critical',
        message: 'Budget in deficit',
        color: 'danger'
      };
    } else if (totals.balance < totals.income * 0.2) {
      return {
        status: 'warning',
        message: 'Budget basso',
        color: 'warning'
      };
    } else {
      return {
        status: 'healthy',
        message: 'Budget stabile',
        color: 'success'
      };
    }
  }

  // Esporta rapporto in JSON
  exportReportJSON() {
    const report = this.getComprehensiveReport();
    const json = JSON.stringify(report, null, 2);
    this.downloadFile(json, 'rapporto-proloco.json', 'application/json');
  }

  // Esporta rapporto in CSV
  exportReportCSV() {
    let csv = 'Rapporto Pro Loco\n\n';
    
    // Summary
    const summary = this.getSummaryReport();
    csv += 'RIEPILOGO\n';
    csv += `Totale Eventi,${summary.totalEvents}\n`;
    csv += `Volontari Attivi,${summary.activeVolunteers}\n`;
    csv += `Ore Totali,${summary.totalHours}\n`;
    csv += `Saldo Budget,${summary.budgetBalance}\n`;
    csv += `Compiti Completati,${summary.completedTasks}\n\n`;

    // Events
    const events = this.eventsManager.getAllEvents();
    csv += 'EVENTI\n';
    csv += 'Titolo,Data,Luogo,Status,Visitatori Attesi,Budget\n';
    events.forEach(e => {
      csv += `"${e.title}","${e.date}","${e.location}","${e.status}",${e.expectedVisitors},${e.budget}\n`;
    });

    this.downloadFile(csv, 'rapporto-proloco.csv', 'text/csv');
  }

  // Funzione di download
  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    Utils.showAlert('Rapporto scaricato!', 'success');
  }

  // Rendering rapporto HTML
  renderComprehensiveReport() {
    const report = this.getComprehensiveReport();
    const summary = report.summary;
    const eventReport = report.events;
    const volReport = report.volunteers;
    const budgetReport = report.budget;
    const taskReport = report.tasks;

    return `
      <div class="reports-container">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Rapporto Complessivo Pro Loco</div>
            <div>
              <button class="btn btn-sm btn-primary" onclick="reportsManager.exportReportJSON()">
                📥 Scarica JSON
              </button>
              <button class="btn btn-sm btn-primary" onclick="reportsManager.exportReportCSV()">
                📊 Scarica CSV
              </button>
            </div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Statistiche Generali</div>
          </div>
          <div class="card-body">
            <div class="grid grid-3">
              <div style="text-align: center;">
                <p style="font-size: 0.9em; color: var(--text-secondary);">Eventi</p>
                <p style="font-size: 2em; font-weight: bold;">${summary.totalEvents}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.9em; color: var(--text-secondary);">Volontari Attivi</p>
                <p style="font-size: 2em; font-weight: bold;">${summary.activeVolunteers}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.9em; color: var(--text-secondary);">Ore Totali</p>
                <p style="font-size: 2em; font-weight: bold;">${summary.totalHours}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Events Report -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Rapporto Eventi</div>
          </div>
          <div class="card-body">
            <div class="grid grid-4">
              <div style="text-align: center;">
                <p style="font-size: 0.9em;">Totale</p>
                <p style="font-size: 1.5em; font-weight: bold;">${eventReport.total}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.9em;">Pianificati</p>
                <p style="font-size: 1.5em; font-weight: bold;">${eventReport.planned}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.9em;">In Corso</p>
                <p style="font-size: 1.5em; font-weight: bold;">${eventReport.ongoing}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.9em;">Completati</p>
                <p style="font-size: 1.5em; font-weight: bold;">${eventReport.completed}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Volunteers Report -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Rapporto Volontari</div>
          </div>
          <div class="card-body">
            <div class="grid grid-3">
              <div>
                <p style="font-size: 0.9em; color: var(--text-secondary);">Media Ore</p>
                <p style="font-size: 1.5em; font-weight: bold;">${volReport.averageHours.toFixed(1)}h</p>
              </div>
              <div>
                <p style="font-size: 0.9em; color: var(--text-secondary);">Top Volontario</p>
                <p style="font-size: 1.5em; font-weight: bold;">${volReport.topVolunteers[0]?.name || 'N/A'}</p>
                <p style="font-size: 0.9em;">${volReport.topVolunteers[0]?.totalHours || 0}h</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Budget Report -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Rapporto Finanziario</div>
          </div>
          <div class="card-body">
            <div class="grid grid-3">
              <div style="text-align: center;">
                <p style="font-size: 0.9em; color: var(--text-secondary);">Entrate</p>
                <p style="font-size: 1.8em; font-weight: bold; color: var(--success);">
                  ${Utils.formatCurrency(budgetReport.income)}
                </p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.9em; color: var(--text-secondary);">Spese</p>
                <p style="font-size: 1.8em; font-weight: bold; color: var(--danger);">
                  ${Utils.formatCurrency(budgetReport.expenses)}
                </p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.9em; color: var(--text-secondary);">Saldo</p>
                <p style="font-size: 1.8em; font-weight: bold; color: var(--${budgetReport.budgetHealth.color});">
                  ${Utils.formatCurrency(budgetReport.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tasks Report -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Rapporto Compiti</div>
          </div>
          <div class="card-body">
            <div class="grid grid-4">
              <div style="text-align: center;">
                <p style="font-size: 0.9em;">Totale</p>
                <p style="font-size: 1.5em; font-weight: bold;">${taskReport.total}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.9em;">Completati</p>
                <p style="font-size: 1.5em; font-weight: bold; color: var(--success);">${taskReport.completed}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.9em;">In Corso</p>
                <p style="font-size: 1.5em; font-weight: bold; color: var(--info);">${taskReport.inProgress}</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 0.9em;">Scaduti</p>
                <p style="font-size: 1.5em; font-weight: bold; color: var(--danger);">${taskReport.overdue}</p>
              </div>
            </div>
            <p style="margin-top: 15px; text-align: center;">
              <strong>Percentuale Completamento:</strong> ${taskReport.completionRate}%
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

// Istanza globale
const reportsManager = new ReportsManager();
