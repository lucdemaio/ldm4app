/**
 * TeamManagementManager - Assegnazione Task, Turni, Competenze Volontari
 */
class TeamManagementManager {
  constructor() {
    this.tasksKey = 'team-tasks';
    this.shiftsKey = 'team-shifts';
    this.skillsKey = 'volunteer-skills';
    this.tasks = this.loadTasks();
    this.shifts = this.loadShifts();
    this.skills = this.loadSkills();
  }

  loadTasks() {
    return storage.get(this.tasksKey) || [];
  }

  loadShifts() {
    return storage.get(this.shiftsKey) || [];
  }

  loadSkills() {
    return storage.get(this.skillsKey) || [];
  }

  saveTasks() {
    storage.set(this.tasksKey, this.tasks);
  }

  saveShifts() {
    storage.set(this.shiftsKey, this.shifts);
  }

  saveSkills() {
    storage.set(this.skillsKey, this.skills);
  }

  // ===== TASK MANAGEMENT =====

  addTask(task) {
    task.id = Date.now();
    task.createdAt = new Date().toISOString();
    task.status = task.status || 'pending';
    this.tasks.push(task);
    this.saveTasks();
    return task;
  }

  updateTask(id, updates) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      this.saveTasks();
      return task;
    }
    return null;
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
  }

  getTask(id) {
    return this.tasks.find(t => t.id === id);
  }

  getAllTasks() {
    return [...this.tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getTasksByVolunteer(volunteerId) {
    return this.tasks.filter(t => t.assignedTo === volunteerId);
  }

  getTasksByEvent(eventId) {
    return this.tasks.filter(t => t.eventId === eventId);
  }

  getTaskStats() {
    return {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      inProgress: this.tasks.filter(t => t.status === 'in_progress').length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      overdue: this.tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length
    };
  }

  // ===== SHIFT MANAGEMENT =====

  addShift(shift) {
    shift.id = Date.now();
    shift.createdAt = new Date().toISOString();
    this.shifts.push(shift);
    this.saveShifts();
    return shift;
  }

  updateShift(id, updates) {
    const shift = this.shifts.find(s => s.id === id);
    if (shift) {
      Object.assign(shift, updates);
      this.saveShifts();
      return shift;
    }
    return null;
  }

  deleteShift(id) {
    this.shifts = this.shifts.filter(s => s.id !== id);
    this.saveShifts();
  }

  getShift(id) {
    return this.shifts.find(s => s.id === id);
  }

  getAllShifts() {
    return [...this.shifts].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getShiftsByDate(date) {
    return this.shifts.filter(s => s.date === date);
  }

  getShiftsByVolunteer(volunteerId) {
    return this.shifts.filter(s => s.volunteers.includes(volunteerId));
  }

  // ===== SKILLS MANAGEMENT =====

  addSkill(volunteerId, skill) {
    let volunteerSkills = this.skills.find(s => s.volunteerId === volunteerId);
    if (!volunteerSkills) {
      volunteerSkills = {
        volunteerId,
        skills: [],
        updatedAt: new Date().toISOString()
      };
      this.skills.push(volunteerSkills);
    }
    
    if (!volunteerSkills.skills.includes(skill)) {
      volunteerSkills.skills.push(skill);
      volunteerSkills.updatedAt = new Date().toISOString();
      this.saveSkills();
    }
    return volunteerSkills;
  }

  removeSkill(volunteerId, skill) {
    const volunteerSkills = this.skills.find(s => s.volunteerId === volunteerId);
    if (volunteerSkills) {
      volunteerSkills.skills = volunteerSkills.skills.filter(s => s !== skill);
      this.saveSkills();
    }
  }

  getVolunteerSkills(volunteerId) {
    const volunteerSkills = this.skills.find(s => s.volunteerId === volunteerId);
    return volunteerSkills?.skills || [];
  }

  getAvailableSkills() {
    return [
      'Fotografia',
      'Video',
      'Social Media',
      'Contabilità',
      'Comunicazione',
      'Logistica',
      'Guida Turistica',
      'Traduzioni',
      'Catering',
      'Setup Tecnico',
      'Regia Video',
      'Web Design'
    ];
  }

  // ===== RENDERING =====

  renderTeamPage() {
    const taskStats = this.getTaskStats();
    const shifts = this.getAllShifts();
    const tasks = this.getAllTasks();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Gestione Team</h2>
            <p>Task: ${taskStats.total} | Completati: ${taskStats.completed} | Scaduti: ${taskStats.overdue}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="switchTeamTab('tasks')">📋 Task</button>
            <button class="btn btn-secondary" onclick="switchTeamTab('shifts')">⏰ Turni</button>
            <button class="btn btn-secondary" onclick="switchTeamTab('skills')">🎯 Competenze</button>
          </div>
        </div>

        <!-- Statistiche Task -->
        <div class="grid grid-4" style="margin-bottom: 20px;">
          <div class="stat-box">
            <div class="stat-label">Task In Sospeso</div>
            <div class="stat-value">${taskStats.pending}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">In Corso</div>
            <div class="stat-value">${taskStats.inProgress}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Completati</div>
            <div class="stat-value">${taskStats.completed}</div>
          </div>
          <div class="stat-box" style="border-left-color: var(--danger);">
            <div class="stat-label">Scaduti ⚠️</div>
            <div class="stat-value">${taskStats.overdue}</div>
          </div>
        </div>

        <!-- TASK SECTION -->
        <div id="team-tasks-section">
          <h3 style="margin: 20px 0 15px 0;">
            Task Assegnati (${tasks.length})
            <button class="btn btn-sm btn-primary" onclick="showTaskAssignmentModal()" style="float: right;">➕ Nuovo Task</button>
          </h3>

          <div class="grid grid-auto">
            ${tasks.length > 0 ? tasks.map(t => this.renderTaskCard(t)).join('') : '<p style="grid-column: 1/-1; color: var(--text-light);">Nessun task</p>'}
          </div>
        </div>

        <!-- SHIFT SECTION (nascosto di default) -->
        <div id="team-shifts-section" style="display: none;">
          <h3 style="margin: 20px 0 15px 0;">
            Turni (${shifts.length})
            <button class="btn btn-sm btn-primary" onclick="showShiftModal()" style="float: right;">➕ Nuovo Turno</button>
          </h3>

          <div class="grid grid-auto">
            ${shifts.length > 0 ? shifts.map(s => this.renderShiftCard(s)).join('') : '<p style="grid-column: 1/-1; color: var(--text-light);">Nessun turno</p>'}
          </div>
        </div>

        <!-- SKILLS SECTION (nascosto di default) -->
        <div id="team-skills-section" style="display: none;">
          <h3 style="margin: 20px 0 15px 0;">Competenze Volontari</h3>
          <p style="color: var(--text-light);">Assegna competenze ai volontari nella gestione Volontari</p>
        </div>
      </div>
    `;
  }

  renderTaskCard(task) {
    const statusColors = {
      'pending': '#f59e0b',
      'in_progress': '#3b82f6',
      'completed': '#10b981'
    };

    const statusNames = {
      'pending': 'In Sospeso',
      'in_progress': 'In Corso',
      'completed': 'Completato'
    };

    const volunteer = task.assignedTo ? volunteersManager.getVolunteer(task.assignedTo) : null;
    const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();

    return `
      <div class="card ${isOverdue ? 'overdue' : ''}">
        <div class="card-header">
          <div>
            <div class="card-title">${task.title}</div>
            <div class="card-subtitle">${volunteer ? `👤 ${volunteer.name}` : 'Non assegnato'}</div>
          </div>
          <div>
            <span class="badge" style="background: ${statusColors[task.status]}30; color: ${statusColors[task.status]};">${statusNames[task.status]}</span>
          </div>
        </div>

        <div class="card-body">
          ${task.description ? `<p>${task.description}</p>` : ''}
          <p><strong>Scadenza:</strong> ${task.dueDate}</p>
          ${task.priority ? `<p><strong>Priorità:</strong> ${task.priority}</p>` : ''}
          
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="btn btn-sm btn-secondary" onclick="updateTaskStatus('${task.id}', 'in_progress')">▶️ Avvia</button>
            <button class="btn btn-sm btn-success" onclick="updateTaskStatus('${task.id}', 'completed')">✓ Completa</button>
            <button class="btn btn-sm btn-secondary" onclick="editTask('${task.id}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }

  renderShiftCard(shift) {
    const volunteersCount = shift.volunteers?.length || 0;

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">📅 ${shift.date}</div>
            <div class="card-subtitle">${shift.name}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-secondary" onclick="editShift('${shift.id}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteShift('${shift.id}')">🗑️</button>
          </div>
        </div>

        <div class="card-body">
          <p><strong>Orario:</strong> ${shift.startTime} - ${shift.endTime}</p>
          <p><strong>Volontari Assegnati:</strong> ${volunteersCount}</p>
          ${shift.notes ? `<p><strong>Note:</strong> ${shift.notes}</p>` : ''}
        </div>
      </div>
    `;
  }




}

// Istanza globale
const teamManagementManager = new TeamManagementManager();

// ===== GLOBAL FUNCTIONS =====

function switchTeamTab(tab) {
  document.getElementById('team-tasks-section').style.display = tab === 'tasks' ? 'block' : 'none';
  document.getElementById('team-shifts-section').style.display = tab === 'shifts' ? 'block' : 'none';
  document.getElementById('team-skills-section').style.display = tab === 'skills' ? 'block' : 'none';
}

function showTaskAssignmentModal() {
  const volunteers = volunteersManager.getAllVolunteers();
  const html = `
    <div class="modal active" id="taskAssignmentModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Assegna Task</h3>
          <button class="modal-close" onclick="closeTaskAssignmentModal()">✕</button>
        </div>
        <form onsubmit="saveTaskAssignment(event);">
          <div class="form-group">
            <label>Titolo Task *</label>
            <input type="text" id="task-title" required>
          </div>
          <div class="form-group">
            <label>Descrizione</label>
            <textarea id="task-description"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Assegna a *</label>
              <select id="task-volunteer" required>
                <option value="">-- Seleziona Volontario --</option>
                ${volunteers.map(v => `<option value="${v.id}">${v.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Priorità</label>
              <select id="task-priority">
                <option value="Normale">Normale</option>
                <option value="Alta">Alta</option>
                <option value="Critica">Critica</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Data Scadenza *</label>
            <input type="date" id="task-due-date" required>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeTaskAssignmentModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Assegna</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeTaskAssignmentModal() {
  document.getElementById('modal-container').style.display = 'none';
  document.getElementById('modal-container').classList.remove('visible');
}

function saveTaskAssignment(event) {
  event.preventDefault();

  const task = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-description').value,
    assignedTo: document.getElementById('task-volunteer').value,
    priority: document.getElementById('task-priority').value,
    dueDate: document.getElementById('task-due-date').value
  };

  if (!task.title || !task.assignedTo) {
    Utils.showAlert('Compila i campi obbligatori!', 'danger');
    return;
  }

  teamManagementManager.addTask(task);
  closeTaskAssignmentModal();
  navigationManager.loadPageContent('team');
  Utils.showAlert('Task assegnato!', 'success');
}

function updateTaskStatus(taskId, newStatus) {
  teamManagementManager.updateTask(taskId, { status: newStatus });
  navigationManager.loadPageContent('team');
}

function editTask(taskId) {
  // TODO: Implementare modifica task
  console.log('Edit task:', taskId);
}

function deleteTask(taskId) {
  if (confirm('Elimina questo task?')) {
    teamManagementManager.deleteTask(taskId);
    navigationManager.loadPageContent('team');
    Utils.showAlert('Task eliminato!', 'success');
  }
}

function showShiftModal() {
  const volunteers = volunteersManager.getAllVolunteers();
  const html = `
    <div class="modal active" id="shiftModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Turno</h3>
          <button class="modal-close" onclick="closeShiftModal()">✕</button>
        </div>
        <form onsubmit="saveShift(event);">
          <div class="form-group">
            <label>Nome Turno *</label>
            <input type="text" id="shift-name" placeholder="Es: Accoglienza Mattutina" required>
          </div>
          <div class="form-group">
            <label>Data *</label>
            <input type="date" id="shift-date" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Orario Inizio *</label>
              <input type="time" id="shift-start-time" required>
            </div>
            <div class="form-group">
              <label>Orario Fine *</label>
              <input type="time" id="shift-end-time" required>
            </div>
          </div>
          <div class="form-group">
            <label>Volontari (seleziona più)</label>
            <div style="border: 1px solid var(--border); border-radius: 8px; padding: 10px; max-height: 150px; overflow-y: auto;">
              ${volunteers.map(v => `
                <label style="display: flex; gap: 8px; padding: 5px; cursor: pointer;">
                  <input type="checkbox" value="${v.id}" class="shift-volunteer-checkbox">
                  ${v.name}
                </label>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Note</label>
            <textarea id="shift-notes"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeShiftModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva Turno</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeShiftModal() {
  document.getElementById('modal-container').style.display = 'none';
  document.getElementById('modal-container').classList.remove('visible');
}

function saveShift(event) {
  event.preventDefault();

  const volunteers = Array.from(document.querySelectorAll('.shift-volunteer-checkbox:checked')).map(el => el.value);

  const shift = {
    name: document.getElementById('shift-name').value,
    date: document.getElementById('shift-date').value,
    startTime: document.getElementById('shift-start-time').value,
    endTime: document.getElementById('shift-end-time').value,
    volunteers: volunteers,
    notes: document.getElementById('shift-notes').value
  };

  if (!shift.name || !shift.date || !shift.startTime || !shift.endTime) {
    Utils.showAlert('Compila i campi obbligatori!', 'danger');
    return;
  }

  teamManagementManager.addShift(shift);
  closeShiftModal();
  navigationManager.loadPageContent('team');
  Utils.showAlert('Turno creato!', 'success');
}

function editShift(shiftId) {
  console.log('Edit shift:', shiftId);
}

function deleteShift(shiftId) {
  if (confirm('Elimina questo turno?')) {
    teamManagementManager.deleteShift(shiftId);
    navigationManager.loadPageContent('team');
    Utils.showAlert('Turno eliminato!', 'success');
  }
}
