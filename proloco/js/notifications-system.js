/**
 * NotificationsSystemManager - Sistema di Notifiche
 * In-app notifications, email alerts, reminders
 */
class NotificationsSystemManager {
  constructor() {
    this.notificationsKey = 'notifications-system';
    this.settingsKey = 'notification-settings';
    this.notifications = this.loadNotifications();
    this.settings = this.loadSettings();
  }

  loadNotifications() {
    return storage.get(this.notificationsKey) || [];
  }

  saveNotifications() {
    storage.set(this.notificationsKey, this.notifications);
  }

  loadSettings() {
    return storage.get(this.settingsKey) || {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      inAppNotifications: true,
      quietHours: false,
      quietStart: '22:00',
      quietEnd: '08:00'
    };
  }

  saveSettings() {
    storage.set(this.settingsKey, this.settings);
  }

  createNotification(notification) {
    notification.id = Date.now();
    notification.createdAt = new Date().toISOString();
    notification.read = false;
    notification.type = notification.type || 'info'; // info, success, warning, error
    this.notifications.push(notification);
    this.saveNotifications();
    return notification;
  }

  markAsRead(notificationId) {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
      this.saveNotifications();
      return true;
    }
    return false;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  deleteNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  deleteAllNotifications() {
    this.notifications = [];
    this.saveNotifications();
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  getAllNotifications() {
    return [...this.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createReminder(reminderData) {
    return this.createNotification({
      ...reminderData,
      type: 'reminder',
      dueDate: new Date(reminderData.dueDate).toISOString()
    });
  }

  getUpcomingReminders() {
    const now = new Date();
    return this.notifications
      .filter(n => n.type === 'reminder' && new Date(n.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  getStats() {
    return {
      total: this.notifications.length,
      unread: this.getUnreadCount(),
      reminders: this.notifications.filter(n => n.type === 'reminder').length,
      alerts: this.notifications.filter(n => n.type === 'warning').length
    };
  }

  renderNotificationsPage() {
    const notifications = this.getAllNotifications();
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Centro Notifiche</h2>
            <p>Non lette: ${stats.unread} | Totale: ${stats.total}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-secondary" onclick="markAllNotificationsRead()">✓ Segna Tutte Lette</button>
            <button class="btn btn-danger" onclick="clearAllNotifications()">🗑️ Cancella Tutte</button>
          </div>
        </div>

        <!-- SETTINGS BUTTON -->
        <div style="margin-bottom: 20px;">
          <button class="btn btn-secondary" onclick="switchNotificationTab('notifications')">📬 Notifiche</button>
          <button class="btn btn-secondary" onclick="switchNotificationTab('reminders')">⏰ Promemoria</button>
          <button class="btn btn-secondary" onclick="switchNotificationTab('settings')">⚙️ Impostazioni</button>
        </div>

        <!-- NOTIFICATIONS TAB -->
        <div id="notifications-list-section" style="display: block;">
          ${notifications.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${notifications.map(n => `
                <div class="notification-item" style="padding: 16px; background: ${!n.read ? 'var(--background-light)' : 'var(--background)'}; border-left: 4px solid ${this.getTypeColor(n.type)}; border-radius: 8px; cursor: pointer;" onclick="markNotificationRead(${n.id})">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                      <h4 style="margin: 0 0 8px 0; ${!n.read ? 'font-weight: bold;' : ''}">${this.getTypeIcon(n.type)} ${n.title}</h4>
                      <p style="margin: 0 0 8px 0; color: var(--text-light);">${n.message}</p>
                      <small style="color: var(--text-light);">${new Date(n.createdAt).toLocaleString('it-IT')}</small>
                    </div>
                    <button class="btn btn-xs btn-danger" onclick="deleteNotification(event, ${n.id})" style="margin-left: 8px;">✕</button>
                  </div>
                  ${n.action ? `<button class="btn btn-sm btn-primary" onclick="handleNotificationAction(event, '${n.action}')" style="margin-top: 8px;">Azione</button>` : ''}
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color: var(--text-light); text-align: center; padding: 40px 0;">📭 Nessuna notifica</p>
          `}
        </div>

        <!-- REMINDERS TAB -->
        <div id="notifications-reminders-section" style="display: none;">
          <button class="btn btn-primary" onclick="showReminderModal()" style="margin-bottom: 15px;">➕ Nuovo Promemoria</button>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${this.getUpcomingReminders().map(r => `
              <div class="card">
                <div class="card-body">
                  <h4>⏰ ${r.title}</h4>
                  <p>${r.message}</p>
                  <p style="color: var(--primary); font-weight: bold;">Scadenza: ${new Date(r.dueDate).toLocaleString('it-IT')}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- SETTINGS TAB -->
        <div id="notifications-settings-section" style="display: none;">
          <div class="card">
            <div class="card-header">
              <div class="card-title">⚙️ Preferenze Notifiche</div>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.settings.emailNotifications ? 'checked' : ''} onchange="updateNotificationSetting('emailNotifications', this.checked)">
                  Notifiche Email
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.settings.pushNotifications ? 'checked' : ''} onchange="updateNotificationSetting('pushNotifications', this.checked)">
                  Notifiche Push
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.settings.smsNotifications ? 'checked' : ''} onchange="updateNotificationSetting('smsNotifications', this.checked)">
                  Notifiche SMS
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.settings.inAppNotifications ? 'checked' : ''} onchange="updateNotificationSetting('inAppNotifications', this.checked)">
                  Notifiche In-App
                </label>
              </div>
              <hr style="margin: 20px 0;">
              <h4>Ore Silenziose</h4>
              <div class="form-group">
                <label>
                  <input type="checkbox" ${this.settings.quietHours ? 'checked' : ''} onchange="updateNotificationSetting('quietHours', this.checked)">
                  Abilita Ore Silenziose
                </label>
              </div>
              ${this.settings.quietHours ? `
                <div class="form-row">
                  <div class="form-group">
                    <label>Inizio</label>
                    <input type="time" value="${this.settings.quietStart}" onchange="updateNotificationSetting('quietStart', this.value)">
                  </div>
                  <div class="form-group">
                    <label>Fine</label>
                    <input type="time" value="${this.settings.quietEnd}" onchange="updateNotificationSetting('quietEnd', this.value)">
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getTypeIcon(type) {
    const icons = {
      'info': 'ℹ️',
      'success': '✓',
      'warning': '⚠️',
      'error': '❌',
      'reminder': '⏰'
    };
    return icons[type] || '📢';
  }

  getTypeColor(type) {
    const colors = {
      'info': '#2196F3',
      'success': '#4CAF50',
      'warning': '#FF9800',
      'error': '#F44336',
      'reminder': '#9C27B0'
    };
    return colors[type] || '#9E9E9E';
  }
}

const notificationsManager = new NotificationsSystemManager();

function switchNotificationTab(tab) {
  document.getElementById('notifications-list-section').style.display = tab === 'notifications' ? 'block' : 'none';
  document.getElementById('notifications-reminders-section').style.display = tab === 'reminders' ? 'block' : 'none';
  document.getElementById('notifications-settings-section').style.display = tab === 'settings' ? 'block' : 'none';
}

function markNotificationRead(notificationId) {
  notificationsManager.markAsRead(notificationId);
  navigationManager.loadPageContent('notifications');
}

function markAllNotificationsRead() {
  notificationsManager.markAllAsRead();
  navigationManager.loadPageContent('notifications');
  Utils.showAlert('Tutte le notifiche segnate come lette!', 'success');
}

function deleteNotification(event, notificationId) {
  event.stopPropagation();
  notificationsManager.deleteNotification(notificationId);
  navigationManager.loadPageContent('notifications');
}

function clearAllNotifications() {
  if (confirm('Eliminare tutte le notifiche?')) {
    notificationsManager.deleteAllNotifications();
    navigationManager.loadPageContent('notifications');
    Utils.showAlert('Tutte le notifiche eliminate!', 'success');
  }
}

function showReminderModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Promemoria</h3>
          <button class="modal-close" onclick="closeReminderModal()">✕</button>
        </div>
        <form onsubmit="saveReminder(event);">
          <div class="form-group">
            <label>Titolo *</label>
            <input type="text" id="reminder-title" required>
          </div>
          <div class="form-group">
            <label>Descrizione *</label>
            <textarea id="reminder-message" rows="4" required></textarea>
          </div>
          <div class="form-group">
            <label>Data e Ora *</label>
            <input type="datetime-local" id="reminder-duedate" required>
          </div>
          <div class="form-group">
            <label>Priorità</label>
            <select id="reminder-priority">
              <option value="low">Bassa</option>
              <option value="medium" selected>Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeReminderModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Crea Promemoria</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeReminderModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveReminder(event) {
  event.preventDefault();
  const reminder = notificationsManager.createReminder({
    title: document.getElementById('reminder-title').value,
    message: document.getElementById('reminder-message').value,
    dueDate: document.getElementById('reminder-duedate').value,
    priority: document.getElementById('reminder-priority').value
  });
  closeReminderModal();
  navigationManager.loadPageContent('notifications');
  Utils.showAlert('Promemoria creato!', 'success');
}

function updateNotificationSetting(settingName, value) {
  notificationsManager.settings[settingName] = value;
  notificationsManager.saveSettings();
  Utils.showAlert('Impostazioni aggiornate!', 'success');
}

function handleNotificationAction(event, action) {
  event.stopPropagation();
  Utils.showAlert(`Azione: ${action}`, 'info');
}
