// Gestione Compiti
class TasksManager {
  constructor() {
    this.tasks = storage.get('tasks') || [];
  }

  // Aggiungi compito
  addTask(taskData) {
    const task = {
      id: Utils.generateId(),
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority || 'normal', // low, normal, high
      status: 'pending', // pending, in-progress, completed
      dueDate: taskData.dueDate,
      assignedTo: taskData.assignedTo || null,
      eventId: taskData.eventId || null,
      tags: taskData.tags?.split(',').map(t => t.trim()) || [],
      createdAt: new Date().toISOString()
    };

    this.tasks.push(task);
    this.save();
    Utils.showAlert('Compito creato!', 'success');
    return task;
  }

  // Modifica compito
  updateTask(id, taskData) {
    this.tasks = Utils.updateById(this.tasks, id, taskData);
    this.save();
    Utils.showAlert('Compito aggiornato!', 'success');
  }

  // Elimina compito
  deleteTask(id) {
    this.tasks = Utils.removeById(this.tasks, id);
    this.save();
    Utils.showAlert('Compito eliminato!', 'success');
  }

  // Ottieni compito per ID
  getTask(id) {
    return Utils.findById(this.tasks, id);
  }

  // Ottieni tutti i compiti
  getAllTasks() {
    return this.tasks;
  }

  // Filtra per status
  getTasksByStatus(status) {
    return this.tasks.filter(t => t.status === status);
  }

  // Filtra per priorità
  getTasksByPriority(priority) {
    return this.tasks.filter(t => t.priority === priority);
  }

  // Filtra per assegnato
  getTasksByAssignee(volunteerId) {
    return this.tasks.filter(t => t.assignedTo === volunteerId);
  }

  // Compiti scaduti
  getOverdueTasks() {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks.filter(t => 
      t.status !== 'completed' && t.dueDate && t.dueDate < today
    );
  }

  // Compiti per evento
  getTasksByEvent(eventId) {
    return this.tasks.filter(t => t.eventId === eventId);
  }

  // Statistiche
  getStats() {
    return {
      total: this.tasks.length,
      pending: this.getTasksByStatus('pending').length,
      inProgress: this.getTasksByStatus('in-progress').length,
      completed: this.getTasksByStatus('completed').length,
      overdue: this.getOverdueTasks().length,
      highPriority: this.getTasksByPriority('high').length
    };
  }

  // Assegna compito
  assignTask(taskId, volunteerId) {
    const task = this.getTask(taskId);
    if (task) {
      task.assignedTo = volunteerId;
      this.save();
      Utils.showAlert('Compito assegnato!', 'success');
    }
  }

  // Cambia status
  updateTaskStatus(taskId, newStatus) {
    const task = this.getTask(taskId);
    if (task) {
      task.status = newStatus;
      this.save();
      return task;
    }
  }

  // Salva i dati
  save() {
    storage.set('tasks', this.tasks);
  }

  // Rendering HTML
  renderTaskCard(task) {
    const priorityColors = {
      low: 'info',
      normal: 'default',
      high: 'danger'
    };

    const priorityLabels = {
      low: 'Bassa',
      normal: 'Normale',
      high: 'Alta'
    };

    const statusLabels = {
      pending: 'In sospeso',
      'in-progress': 'In corso',
      completed: 'Completato'
    };

    const statusColors = {
      pending: 'warning',
      'in-progress': 'info',
      completed: 'success'
    };

    const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'completed';

    return `
      <div class="card task-card ${isOverdue ? 'overdue' : ''}" data-id="${task.id}">
        <div class="card-header">
          <div>
            <div class="card-title">${task.title}</div>
            <div>
              <span class="badge badge-${priorityColors[task.priority]}">${priorityLabels[task.priority]}</span>
              <span class="badge badge-${statusColors[task.status]}">${statusLabels[task.status]}</span>
            </div>
          </div>
          <div style="display: flex; gap: 5px;">
            <button class="btn btn-sm btn-primary" onclick="exportManager.exportTasksPDF()">📄 PDF</button>
            <button class="btn btn-sm btn-success" onclick="markTaskDone('${task.id}')">✓ Completa</button>
            <button class="btn btn-sm btn-secondary" onclick="editTask('${task.id}')">✏️ Modifica</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">🗑️ Elimina</button>
          </div>
        </div>
        <div class="card-body">
          <p><strong>📝 Descrizione:</strong></p>
          <p style="margin-top: 5px;">${task.description}</p>
          ${task.dueDate ? `<p><strong>📅 Scadenza:</strong> ${Utils.formatDate(task.dueDate)}</p>` : ''}
          ${task.assignedTo ? `<p><strong>👤 Assegnato a:</strong> <span id="volunteer-${task.assignedTo}">ID ${task.assignedTo}</span></p>` : '<p><strong>👤 Non assegnato</strong></p>'}
          ${task.tags.length > 0 ? `<p><strong>🏷️ Tag:</strong> ${task.tags.join(', ')}</p>` : ''}
        </div>
      </div>
    `;
  }
}

// Istanza globale
const tasksManager = new TasksManager();
