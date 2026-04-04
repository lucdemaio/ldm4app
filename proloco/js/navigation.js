// Gestione Navigazione
class NavigationManager {
  constructor() {
    this.currentPage = 'dashboard';
  }

  // Cambia pagina
  switchPage(pageName) {
    // Nascondi tutte le pagine
    document.querySelectorAll('[data-page]').forEach(page => {
      Utils.hide(page);
    });

    // Mostra la pagina selezionata
    const selectedPage = document.querySelector(`[data-page="${pageName}"]`);
    if (selectedPage) {
      Utils.show(selectedPage);
      this.currentPage = pageName;
      this.updateActiveNavItem();
      this.loadPageContent(pageName);
    }
  }

  // Aggiorna item navigazione attivo
  updateActiveNavItem() {
    document.querySelectorAll('.nav-item').forEach(item => {
      Utils.removeClass(item, 'active');
    });
    const activeItem = document.querySelector(`[data-nav="${this.currentPage}"]`);
    if (activeItem) {
      Utils.addClass(activeItem, 'active');
    }
  }

  // Carica contenuto pagina
  loadPageContent(pageName) {
    // Usa l'id del contenitore specifico per la pagina
    const contentId = `${pageName}-content`;
    const contentContainer = document.getElementById(contentId);
    if (!contentContainer) return;

    let content = '';
    switch (pageName) {
      case 'dashboard':
        content = dashboardManager.renderDashboard();
        break;
      case 'events':
        content = this.renderEventsPage();
        break;
      case 'volunteers':
        content = this.renderVolunteersPage();
        break;
      case 'budget':
        content = this.renderBudgetPage();
        break;
      case 'tasks':
        content = this.renderTasksPage();
        break;
      case 'reports':
        content = reportsManager.renderComprehensiveReport();
        break;
      case 'settings':
        content = settingsManager.renderSettings();
        break;
      case 'contacts':
        content = contactsManager.renderContactsPage();
        break;
      case 'sponsors':
        content = sponsorshipManager.renderSponsorsPage();
        break;
      case 'team':
        content = teamManagementManager.renderTeamPage();
        break;
      case 'finance':
        content = financeManager.renderFinancePage();
        break;
      case 'gallery':
        content = mediaGalleryManager.renderGalleryPage();
        break;
      case 'editorial':
        content = editorialManager.renderEditorialCalendarPage();
        break;
      case 'qrcode':
        content = qrcodeManager.renderQRCodesPage();
        break;
      case 'locations-services':
        content = locationsServicesManager.renderLocationsServicesPage();
        break;
      case 'event-checklist':
        content = eventChecklistManager.renderChecklistPage();
        break;
      case 'history':
        content = historyManager.renderHistoryPage();
        break;
      case 'knowledge-base':
        content = knowledgeBaseManager.renderKnowledgeBasePage();
        break;
      case 'equipment-inventory':
        content = equipmentManager.renderEquipmentPage();
        break;
      case 'advanced-reporting':
        content = advancedReporting.renderAdvancedReportingPage();
        break;
      case 'custom-fields':
        content = customFieldsManager.renderCustomFieldsPage();
        break;
      case 'backup-export':
        content = backupExportManager.renderBackupExportPage();
        break;
      case 'marketing':
        content = marketingCampaignManager.renderMarketingPage();
        break;
    }
    
    contentContainer.innerHTML = content;
  }

  // Rendering pagina eventi
  renderEventsPage() {
    const events = eventsManager.getAllEvents();
    const event_stats = eventsManager.getStats();
    
    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Gestione Eventi</h2>
            <p>Totale: ${event_stats.total} | Pianificati: ${event_stats.planned} | Completati: ${event_stats.completed}</p>
          </div>
          <button class="btn btn-primary" onclick="showEventModal()">➕ Nuovo Evento</button>
        </div>

        <div class="grid grid-auto">
          ${events.length > 0 ? 
            events.map(e => eventsManager.renderEventCard(e)).join('') :
            '<p style="grid-column: 1/-1;">Nessun evento</p>'
          }
        </div>
      </div>

      ${this.renderEventModal()}
    `;
  }

  // Rendering pagina volontari
  renderVolunteersPage() {
    const volunteers = volunteersManager.getAllVolunteers();
    const vol_stats = volunteersManager.getStats();
    
    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Gestione Volontari</h2>
            <p>Totale: ${vol_stats.total} | Attivi: ${vol_stats.active} | Ore: ${vol_stats.totalHours}h</p>
          </div>
          <button class="btn btn-primary" onclick="showVolunteerModal()">➕ Nuovo Volontario</button>
        </div>

        <div class="grid grid-auto">
          ${volunteers.length > 0 ? 
            volunteers.map(v => volunteersManager.renderVolunteerCard(v)).join('') :
            '<p style="grid-column: 1/-1;">Nessun volontario</p>'
          }
        </div>
      </div>

      ${this.renderVolunteerModal()}
    `;
  }

  // Rendering pagina budget
  renderBudgetPage() {
    const entries = budgetManager.getAllEntries();
    
    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Gestione Budget</h2>
          </div>
          <button class="btn btn-primary" onclick="showBudgetModal()">➕ Nuova Voce</button>
        </div>

        ${budgetManager.renderTotalsSummary()}

        <div class="grid grid-auto" style="margin-top: 20px;">
          ${entries.length > 0 ? 
            entries.map(e => budgetManager.renderEntryCard(e)).join('') :
            '<p style="grid-column: 1/-1;">Nessuna voce di budget</p>'
          }
        </div>
      </div>

      ${this.renderBudgetModal()}
    `;
  }

  // Rendering pagina compiti
  renderTasksPage() {
    const tasks = tasksManager.getAllTasks();
    const task_stats = tasksManager.getStats();
    
    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Gestione Compiti</h2>
            <p>Totale: ${task_stats.total} | Completati: ${task_stats.completed} | Scaduti: ${task_stats.overdue}</p>
          </div>
          <button class="btn btn-primary" onclick="showTaskModal()">➕ Nuovo Compito</button>
        </div>

        <div class="grid grid-auto">
          ${tasks.length > 0 ? 
            tasks.map(t => tasksManager.renderTaskCard(t)).join('') :
            '<p style="grid-column: 1/-1;">Nessun compito</p>'
          }
        </div>
      </div>

      ${this.renderTaskModal()}
    `;
  }

  // Modal generici - placeholder
  renderEventModal() {
    return '';
  }

  renderVolunteerModal() {
    return '';
  }

  renderBudgetModal() {
    return '';
  }

  renderTaskModal() {
    return '';
  }
}

// Istanza globale
const navigationManager = new NavigationManager();

// Funzioni globali
function switchPage(pageName) {
  navigationManager.switchPage(pageName);
}

// EVENTS MODAL
function showEventModal() {
  const html = `
    <div class="modal active" id="eventModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Evento</h3>
          <button class="modal-close" onclick="closeEventModal()">✕</button>
        </div>
        <form>
          <div class="form-group">
            <label>Titolo</label>
            <input type="text" id="event-title" placeholder="Nome evento" required>
          </div>
          <div class="form-group">
            <label>Descrizione</label>
            <textarea id="event-description" placeholder="Dettagli evento"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Data</label>
              <input type="date" id="event-date" required>
            </div>
            <div class="form-group">
              <label>Ora</label>
              <input type="time" id="event-time" required>
            </div>
          </div>
          <div class="form-group">
            <label>Luogo</label>
            <input type="text" id="event-location" placeholder="Es: Piazza Duomo" required>
          </div>
          <div class="form-group">
            <label>Categoria</label>
            <input type="text" id="event-category" placeholder="Es: Festival" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Visitatori Attesi</label>
              <input type="number" id="event-visitors" placeholder="0" min="0">
            </div>
            <div class="form-group">
              <label>Budget (€)</label>
              <input type="number" id="event-budget" placeholder="0.00" min="0" step="0.01">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeEventModal()">Annulla</button>
            <button type="button" class="btn btn-primary" onclick="saveEvent()">Salva Evento</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const container = document.getElementById('modal-container');
  console.log('Modal container:', container);
  
  container.innerHTML = html;
  container.classList.add('visible');
  
  console.log('Container visible class added');
  console.log('Modal content:', document.getElementById('eventModal'));
}

function closeEventModal() {
  const container = document.getElementById('modal-container');
  container.classList.remove('visible');
  container.innerHTML = '';
}

function saveEvent() {
  const event = {
    title: document.getElementById('event-title').value,
    description: document.getElementById('event-description').value,
    date: document.getElementById('event-date').value,
    time: document.getElementById('event-time').value,
    location: document.getElementById('event-location').value,
    category: document.getElementById('event-category').value,
    expectedVisitors: document.getElementById('event-visitors').value,
    budget: document.getElementById('event-budget').value
  };

  if (!event.title || !event.date || !event.time || !event.location) {
    Utils.showAlert('Compila tutti i campi obbligatori!', 'danger');
    return;
  }

  eventsManager.addEvent(event);
  closeEventModal();
  navigationManager.loadPageContent('events');
}

// VOLUNTEERS MODAL
function showVolunteerModal(volunteerId = null) {
  const volunteer = volunteerId ? volunteersManager.getVolunteer(volunteerId) : null;
  
  const html = `
    <div class="modal active" id="volunteerModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">${volunteer ? 'Modifica Volontario' : 'Nuovo Volontario'}</h3>
          <button class="modal-close" onclick="closeVolunteerModal()">✕</button>
        </div>
        <form>
          <div class="form-group">
            <label>Nome</label>
            <input type="text" id="vol-name" placeholder="Nome Cognome" value="${volunteer?.name || ''}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="vol-email" placeholder="email@example.com" value="${volunteer?.email || ''}" required>
            </div>
            <div class="form-group">
              <label>Telefono</label>
              <input type="tel" id="vol-phone" placeholder="+39 340 123 4567" value="${volunteer?.phone || ''}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Ruolo</label>
              <input type="text" id="vol-role" placeholder="Es: Coordinatore" value="${volunteer?.role || ''}" required>
            </div>
            <div class="form-group">
              <label>Abilità (comma separated)</label>
              <input type="text" id="vol-skills" placeholder="Es: Organizzazione, Comunicazione" value="${volunteer?.skills?.join(', ') || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Giorni Disponibili (comma separated)</label>
            <input type="text" id="vol-days" placeholder="Es: Lunedì, Mercoledì, Venerdì" value="${volunteer?.availableDays?.join(', ') || ''}">
          </div>
          <div class="form-group">
            <label>Note</label>
            <textarea id="vol-notes" placeholder="Note aggiuntive">${volunteer?.notes || ''}</textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeVolunteerModal()">Annulla</button>
            <button type="button" class="btn btn-primary" onclick="saveVolunteer(${volunteerId || 'null'})">Salva Volontario</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function saveVolunteer(volunteerId = null) {
  const volunteer = {
    name: document.getElementById('vol-name').value,
    email: document.getElementById('vol-email').value,
    phone: document.getElementById('vol-phone').value,
    role: document.getElementById('vol-role').value,
    skills: document.getElementById('vol-skills').value,
    availableDays: document.getElementById('vol-days').value,
    notes: document.getElementById('vol-notes').value
  };

  if (!volunteer.name || !volunteer.email || !volunteer.phone || !volunteer.role) {
    Utils.showAlert('Compila tutti i campi obbligatori!', 'danger');
    return;
  }

  if (volunteerId) {
    // Update existing
    volunteersManager.updateVolunteer(volunteerId, volunteer);
  } else {
    // Add new
    volunteersManager.addVolunteer(volunteer);
  }
  closeVolunteerModal();
  navigationManager.loadPageContent('volunteers');
}

function closeVolunteerModal() {
  const container = document.getElementById('modal-container');
  container.classList.remove('visible');
  container.innerHTML = '';
}

// BUDGET MODAL
function showBudgetModal() {
  const html = `
    <div class="modal active" id="budgetModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuova Voce Budget</h3>
          <button class="modal-close" onclick="closeBudgetModal()">✕</button>
        </div>
        <form>
          <div class="form-group">
            <label>Descrizione</label>
            <input type="text" id="budget-description" placeholder="Es: Catering evento" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Tipo</label>
              <select id="budget-type" required>
                <option value="">-- Seleziona --</option>
                <option value="income">Entrata</option>
                <option value="expense">Spesa</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ammontare (€)</label>
              <input type="number" id="budget-amount" placeholder="0.00" min="0" step="0.01" required>
            </div>
          </div>
          <div class="form-group">
            <label>Categoria</label>
            <select id="budget-category" required>
              <option value="">-- Seleziona --</option>
              <option value="Materiali">Materiali</option>
              <option value="Servizi">Servizi</option>
              <option value="Personale">Personale</option>
              <option value="Affitti">Affitti</option>
              <option value="Marketing">Marketing</option>
              <option value="Logistica">Logistica</option>
              <option value="Altro">Altro</option>
            </select>
          </div>
          <div class="form-group">
            <label>Data</label>
            <input type="date" id="budget-date" required>
          </div>
          <div class="form-group">
            <label>Note</label>
            <textarea id="budget-notes" placeholder="Note aggiuntive"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeBudgetModal()">Annulla</button>
            <button type="button" class="btn btn-primary" onclick="saveBudget()">Salva Voce</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function saveBudget() {
  const entry = {
    description: document.getElementById('budget-description').value,
    type: document.getElementById('budget-type').value,
    amount: document.getElementById('budget-amount').value,
    category: document.getElementById('budget-category').value,
    date: document.getElementById('budget-date').value,
    notes: document.getElementById('budget-notes').value
  };

  if (!entry.description || !entry.type || !entry.amount || !entry.category || !entry.date) {
    Utils.showAlert('Compila tutti i campi obbligatori!', 'danger');
    return;
  }

  budgetManager.addEntry(entry);
  closeBudgetModal();
  navigationManager.loadPageContent('budget');
}

function closeBudgetModal() {
  const container = document.getElementById('modal-container');
  container.classList.remove('visible');
  container.innerHTML = '';
}

// TASKS MODAL
function showTaskModal() {
  const html = `
    <div class="modal active" id="taskModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Compito</h3>
          <button class="modal-close" onclick="closeTaskModal()">✕</button>
        </div>
        <form>
          <div class="form-group">
            <label>Titolo</label>
            <input type="text" id="task-title" placeholder="Nome compito" required>
          </div>
          <div class="form-group">
            <label>Descrizione</label>
            <textarea id="task-description" placeholder="Dettagli del compito"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Priorità</label>
              <select id="task-priority">
                <option value="normal">Normale</option>
                <option value="low">Bassa</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div class="form-group">
              <label>Scadenza</label>
              <input type="date" id="task-duedate" required>
            </div>
          </div>
          <div class="form-group">
            <label>Tag (comma separated)</label>
            <input type="text" id="task-tags" placeholder="Es: Urgente, Marketing">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeTaskModal()">Annulla</button>
            <button type="button" class="btn btn-primary" onclick="saveTask()">Salva Compito</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function saveTask() {
  const task = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-description').value,
    priority: document.getElementById('task-priority').value,
    dueDate: document.getElementById('task-duedate').value,
    tags: document.getElementById('task-tags').value
  };

  if (!task.title || !task.dueDate) {
    Utils.showAlert('Compila i campi obbligatori!', 'danger');
    return;
  }

  tasksManager.addTask(task);
  closeTaskModal();
  navigationManager.loadPageContent('tasks');
}

function closeTaskModal() {
  const container = document.getElementById('modal-container');
  container.classList.remove('visible');
  container.innerHTML = '';
}

// HELPER FUNCTIONS - Edit & Delete
function editEvent(eventId) {
  Utils.showAlert('Funzione modifica in sviluppo', 'info');
}

function deleteEvent(eventId) {
  if (confirm('Sei sicuro di voler eliminare questo evento?')) {
    eventsManager.deleteEvent(eventId);
    navigationManager.loadPageContent('events');
  }
}

function editVolunteer(volunteerId) {
  showVolunteerModal(volunteerId);
}

function deleteVolunteer(volunteerId) {
  if (confirm('Sei sicuro di voler eliminare questo volontario?')) {
    volunteersManager.deleteVolunteer(volunteerId);
    navigationManager.loadPageContent('volunteers');
  }
}

function editBudgetEntry(entryId) {
  Utils.showAlert('Funzione modifica in sviluppo', 'info');
}

function deleteBudgetEntry(entryId) {
  if (confirm('Sei sicuro di voler eliminare questa voce?')) {
    budgetManager.deleteEntry(entryId);
    navigationManager.loadPageContent('budget');
  }
}

function editTask(taskId) {
  Utils.showAlert('Funzione modifica in sviluppo', 'info');
}

function deleteTask(taskId) {
  if (confirm('Sei sicuro di voler eliminare questo compito?')) {
    tasksManager.deleteTask(taskId);
    navigationManager.loadPageContent('tasks');
  }
}

function markTaskDone(taskId) {
  tasksManager.updateTask(taskId, { status: 'completed' });
  navigationManager.loadPageContent('tasks');
}

// MESSAGIG AND COMMUNICATION
function sendMessageVolunteer(volunteerId) {
  const volunteer = volunteersManager.getVolunteer(volunteerId);
  if (!volunteer) return;
  
  const message = prompt('Scrivi un messaggio per ' + volunteer.name + ':', '');
  if (message) {
    // In futuro: integrare con sistema di messaging real-time
    const msg = {
      id: Utils.generateId(),
      from: 'organizzatore',
      to: volunteerId,
      text: message,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    const messages = storage.get('messages') || [];
    messages.push(msg);
    storage.set('messages', messages);
    
    Utils.showAlert('Messaggio inviato a ' + volunteer.name, 'success');
  }
}

// EVENT ID GETTER
function getEventById(eventId) {
  return eventsManager.getEvent(eventId);
}

// EDIT SIDEBAR TITLE
function editSidebarTitle() {
  const currentTitle = document.getElementById('sidebar-title').innerText;
  
  const newTitle = prompt('Modifica il nome della Pro Loco:', currentTitle);
  
  if (newTitle && newTitle.trim()) {
    const cleanTitle = newTitle.trim();
    document.getElementById('sidebar-title').innerText = cleanTitle;
    
    // Salva nel localStorage
    const settings = storage.get('settings') || {};
    settings.proLocoName = cleanTitle;
    storage.set('settings', settings);
    
    Utils.showAlert('Nome aggiornato con successo!', 'success');
  }
}

// LOAD SIDEBAR TITLE
function loadSidebarTitle() {
  const settings = storage.get('settings') || {};
  if (settings.proLocoName) {
    document.getElementById('sidebar-title').innerText = settings.proLocoName;
  }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  loadSidebarTitle();
  navigationManager.switchPage('dashboard');
});
