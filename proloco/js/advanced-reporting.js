/**
 * AdvancedReportingManager - Reportistica Avanzata
 * Report personalizzati, esportazione, scheduling
 */
class AdvancedReportingManager {
  constructor() {
    this.templatesKey = 'report-templates';
    this.reportsKey = 'generated-reports';
    this.templates = this.loadTemplates();
    this.reports = this.loadReports();
  }

  loadTemplates() {
    return storage.get(this.templatesKey) || [
      { id: 1, name: 'Bilancio Mensile', type: 'financial', icon: '💰' },
      { id: 2, name: 'Attività Volontari', type: 'volunteers', icon: '👥' },
      { id: 3, name: 'Resoconto Eventi', type: 'events', icon: '📅' },
      { id: 4, name: 'Performance Sponsor', type: 'sponsorship', icon: '🤝' },
      { id: 5, name: 'Inventario Attrezzature', type: 'equipment', icon: '📦' }
    ];
  }

  saveTemplates() {
    storage.set(this.templatesKey, this.templates);
  }

  loadReports() {
    return storage.get(this.reportsKey) || [];
  }

  saveReports() {
    storage.set(this.reportsKey, this.reports);
  }

  addTemplate(template) {
    template.id = Date.now();
    template.createdAt = new Date().toISOString();
    this.templates.push(template);
    this.saveTemplates();
    return template;
  }

  generateReport(templateId, data) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return null;

    const report = {
      id: Date.now(),
      templateId: templateId,
      templateName: template.name,
      generatedAt: new Date().toISOString(),
      data: data,
      format: 'pdf'
    };
    this.reports.push(report);
    this.saveReports();
    return report;
  }

  getReportsByType(type) {
    return this.reports.filter(r => {
      const template = this.templates.find(t => t.id === r.templateId);
      return template && template.type === type;
    });
  }

  deleteReport(reportId) {
    this.reports = this.reports.filter(r => r.id !== reportId);
    this.saveReports();
  }

  scheduleReport(templateId, schedule) {
    return {
      id: Date.now(),
      templateId: templateId,
      schedule: schedule,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: this.calculateNextRun(schedule)
    };
  }

  calculateNextRun(schedule) {
    const now = new Date();
    if (schedule === 'daily') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(6, 0, 0, 0);
      return tomorrow.toISOString();
    } else if (schedule === 'weekly') {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + (1 - nextWeek.getDay() + 7) % 7);
      nextWeek.setHours(6, 0, 0, 0);
      return nextWeek.toISOString();
    } else if (schedule === 'monthly') {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(6, 0, 0, 0);
      return nextMonth.toISOString();
    }
    return null;
  }

  renderAdvancedReportingPage() {
    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Reportistica Avanzata</h2>
            <p>Crea, gestisci e pianifica report personalizzati</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="switchReportTab('templates')">📋 Template</button>
            <button class="btn btn-secondary" onclick="switchReportTab('generated')">📊 Report Generati</button>
          </div>
        </div>

        <!-- TEMPLATES TAB -->
        <div id="report-templates-section" style="display: block;">
          <h3>Template Disponibili</h3>
          <button class="btn btn-primary" onclick="showTemplateModal()" style="margin-bottom: 15px;">➕ Nuovo Template</button>
          
          <div class="grid grid-auto">
            ${this.templates.map(t => `
              <div class="card">
                <div class="card-header">
                  <div class="card-title">${t.icon} ${t.name}</div>
                </div>
                <div class="card-body">
                  <p style="color: var(--text-light);">Tipo: ${t.type}</p>
                  <p style="font-size: 0.85rem; color: var(--text-light);">Creato: ${new Date(t.createdAt || new Date()).toLocaleDateString('it-IT')}</p>
                  <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="btn btn-sm btn-primary" onclick="generateReportFromTemplate(${t.id})">📈 Genera</button>
                    <button class="btn btn-sm btn-secondary" onclick="scheduleReportModal(${t.id})">⏰ Pianifica</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- GENERATED REPORTS TAB -->
        <div id="report-generated-section" style="display: none;">
          <h3>Report Generati</h3>
          <div style="margin-bottom: 20px;">
            <input type="text" placeholder="🔍 Filtra report..." style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
          </div>

          ${this.reports.length > 0 ? `
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Generato</th>
                    <th>Formato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.reports.slice().reverse().slice(0, 20).map(r => `
                    <tr>
                      <td><strong>${r.templateName}</strong></td>
                      <td>${new Date(r.generatedAt).toLocaleString('it-IT')}</td>
                      <td><span class="badge badge-info">${r.format.toUpperCase()}</span></td>
                      <td>
                        <button class="btn btn-xs btn-secondary" onclick="downloadReport(${r.id})">⬇️</button>
                        <button class="btn btn-xs btn-danger" onclick="deleteGeneratedReport(${r.id})">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <p style="color: var(--text-light); text-align: center; padding: 40px 0;">Nessun report generato</p>
          `}
        </div>
      </div>
    `;
  }
}

const advancedReporting = new AdvancedReportingManager();

function switchReportTab(tab) {
  document.getElementById('report-templates-section').style.display = tab === 'templates' ? 'block' : 'none';
  document.getElementById('report-generated-section').style.display = tab === 'generated' ? 'block' : 'none';
}

function showTemplateModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Template Report</h3>
          <button class="modal-close" onclick="closeTemplateModal()">✕</button>
        </div>
        <form onsubmit="saveNewTemplate(event);">
          <div class="form-group">
            <label>Nome Template *</label>
            <input type="text" id="template-name" required>
          </div>
          <div class="form-group">
            <label>Tipo Report *</label>
            <select id="template-type" required>
              <option value="">-- Seleziona --</option>
              <option value="financial">Finanziario</option>
              <option value="volunteers">Volontari</option>
              <option value="events">Eventi</option>
              <option value="sponsorship">Sponsor</option>
              <option value="equipment">Attrezzature</option>
              <option value="custom">Personalizzato</option>
            </select>
          </div>
          <div class="form-group">
            <label>Icona</label>
            <input type="text" id="template-icon" value="📊" placeholder="Seleziona emoji">
          </div>
          <div class="form-group">
            <label>Descrizione</label>
            <textarea id="template-description" rows="4"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeTemplateModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva Template</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeTemplateModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveNewTemplate(event) {
  event.preventDefault();
  const template = {
    name: document.getElementById('template-name').value,
    type: document.getElementById('template-type').value,
    icon: document.getElementById('template-icon').value,
    description: document.getElementById('template-description').value
  };
  advancedReporting.addTemplate(template);
  closeTemplateModal();
  navigationManager.loadPageContent('advanced-reporting');
  Utils.showAlert('Template salvato!', 'success');
}

function generateReportFromTemplate(templateId) {
  const template = advancedReporting.templates.find(t => t.id === templateId);
  if (!template) return;

  const reportData = {
    title: template.name,
    generatedDate: new Date().toISOString(),
    sections: [
      { title: 'Riepilogo', content: 'Dati di riepilogo' },
      { title: 'Dettagli', content: 'Informazioni dettagliate' },
      { title: 'Conclusioni', content: 'Analisi conclusiva' }
    ]
  };

  advancedReporting.generateReport(templateId, reportData);
  navigationManager.loadPageContent('advanced-reporting');
  Utils.showAlert(`Report "${template.name}" generato!`, 'success');
}

function scheduleReportModal(templateId) {
  const template = advancedReporting.templates.find(t => t.id === templateId);
  if (!template) return;

  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Pianifica Report</h3>
          <button class="modal-close" onclick="closeScheduleModal()">✕</button>
        </div>
        <form onsubmit="saveSchedule(event, ${templateId});">
          <div class="form-group">
            <label>Report</label>
            <input type="text" value="${template.name}" disabled style="background: var(--background-light);">
          </div>
          <div class="form-group">
            <label>Frequenza *</label>
            <select id="schedule-frequency" required>
              <option value="">-- Seleziona --</option>
              <option value="daily">Ogni Giorno</option>
              <option value="weekly">Ogni Settimana</option>
              <option value="monthly">Ogni Mese</option>
            </select>
          </div>
          <div class="form-group">
            <label>Email Destinatario *</label>
            <input type="email" id="schedule-email" required placeholder="email@example.com">
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="schedule-backup"> Crea backup dopo generazione
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeScheduleModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Pianifica</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeScheduleModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveSchedule(event, templateId) {
  event.preventDefault();
  const schedule = advancedReporting.scheduleReport(templateId, document.getElementById('schedule-frequency').value);
  closeScheduleModal();
  Utils.showAlert('Report pianificato correttamente!', 'success');
}

function downloadReport(reportId) {
  const report = advancedReporting.reports.find(r => r.id === reportId);
  if (report) {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.templateName}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.showAlert('Report scaricato!', 'success');
  }
}

function deleteGeneratedReport(reportId) {
  if (confirm('Eliminare questo report?')) {
    advancedReporting.deleteReport(reportId);
    navigationManager.loadPageContent('advanced-reporting');
    Utils.showAlert('Report eliminato!', 'success');
  }
}
