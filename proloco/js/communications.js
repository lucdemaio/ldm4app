/**
 * CommunicationsManager - Gestione Comunicazioni
 * Email, SMS, Notifiche push, Avvisi
 */
class CommunicationsManager {
  constructor() {
    this.storageKey = 'communications';
    this.communications = this.loadCommunications();
    this.templates = this.loadTemplates();
  }

  loadCommunications() {
    return storage.get(this.storageKey) || [];
  }

  saveCommunications() {
    storage.set(this.storageKey, this.communications);
  }

  loadTemplates() {
    return storage.get('communication-templates') || [
      {
        id: 1,
        name: 'Invito Evento',
        type: 'email',
        subject: 'Sei invitato a {{eventName}}',
        body: 'Caro {{recipientName}},\n\nTi invitiamo a {{eventName}} che si terrà il {{eventDate}} presso {{location}}.\n\nNon perdere!'
      },
      {
        id: 2,
        name: 'Promemoria',
        type: 'sms',
        body: 'Promemoria: {{eventName}} il {{eventDate}} alle {{eventTime}}'
      }
    ];
  }

  saveTemplates() {
    storage.set('communication-templates', this.templates);
  }

  // ===== EMAIL MANAGEMENT =====

  sendEmail(email) {
    email.id = Date.now();
    email.type = 'email';
    email.createdAt = new Date().toISOString();
    email.status = 'sent';
    email.sentAt = new Date().toISOString();
    this.communications.push(email);
    this.saveCommunications();
    return email;
  }

  // ===== SMS MANAGEMENT =====

  sendSMS(sms) {
    sms.id = Date.now();
    sms.type = 'sms';
    sms.createdAt = new Date().toISOString();
    sms.status = 'sent';
    sms.sentAt = new Date().toISOString();
    this.communications.push(sms);
    this.saveCommunications();
    return sms;
  }

  // ===== NOTIFICATIONS =====

  sendNotification(notification) {
    notification.id = Date.now();
    notification.type = 'notification';
    notification.createdAt = new Date().toISOString();
    notification.status = 'sent';
    notification.read = false;
    this.communications.push(notification);
    this.saveCommunications();
    return notification;
  }

  // ===== CRUD =====

  updateCommunication(id, updates) {
    const comm = this.communications.find(c => c.id === id);
    if (comm) {
      Object.assign(comm, updates);
      this.saveCommunications();
      return comm;
    }
    return null;
  }

  deleteCommunication(id) {
    this.communications = this.communications.filter(c => c.id !== id);
    this.saveCommunications();
  }

  getCommunication(id) {
    return this.communications.find(c => c.id === id);
  }

  getAllCommunications() {
    return [...this.communications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getCommunicationsByType(type) {
    return this.communications.filter(c => c.type === type);
  }

  // ===== STATISTICS =====

  getStats() {
    return {
      total: this.communications.length,
      emails: this.getCommunicationsByType('email').length,
      sms: this.getCommunicationsByType('sms').length,
      notifications: this.getCommunicationsByType('notification').length
    };
  }

  // ===== RENDERING =====

  renderCommunicationsPage() {
    const communications = this.getAllCommunications();
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Comunicazioni</h2>
            <p>Totale: ${stats.total} | Email: ${stats.emails} | SMS: ${stats.sms} | Notifiche: ${stats.notifications}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="switchCommTab('emails')">📧 Email</button>
            <button class="btn btn-secondary" onclick="switchCommTab('sms')">💬 SMS</button>
            <button class="btn btn-secondary" onclick="switchCommTab('notifications')">🔔 Notifiche</button>
            <button class="btn btn-secondary" onclick="switchCommTab('templates')">📋 Template</button>
          </div>
        </div>

        <!-- EMAILS TAB -->
        <div id="comm-emails-section" style="display: block;">
          <h3>Gestione Email</h3>
          <button class="btn btn-primary" onclick="showEmailModal()" style="margin-bottom: 15px;">✉️ Nuova Email</button>
          
          <div class="grid grid-auto">
            ${this.getCommunicationsByType('email').map(e => this.renderEmailCard(e)).join('') || '<p>Nessuna email</p>'}
          </div>
        </div>

        <!-- SMS TAB -->
        <div id="comm-sms-section" style="display: none;">
          <h3>Gestione SMS</h3>
          <button class="btn btn-primary" onclick="showSMSModal()" style="margin-bottom: 15px;">💬 Nuovo SMS</button>
          
          <div class="grid grid-auto">
            ${this.getCommunicationsByType('sms').map(s => this.renderSMSCard(s)).join('') || '<p>Nessun SMS</p>'}
          </div>
        </div>

        <!-- NOTIFICATIONS TAB -->
        <div id="comm-notifications-section" style="display: none;">
          <h3>Notifiche Push</h3>
          <button class="btn btn-primary" onclick="showNotificationModal()" style="margin-bottom: 15px;">🔔 Nuova Notifica</button>
          
          <div class="grid grid-auto">
            ${this.getCommunicationsByType('notification').map(n => this.renderNotificationCard(n)).join('') || '<p>Nessuna notifica</p>'}
          </div>
        </div>

        <!-- TEMPLATES TAB -->
        <div id="comm-templates-section" style="display: none;">
          <h3>Template Messaggi</h3>
          <button class="btn btn-primary" onclick="showTemplateModal()" style="margin-bottom: 15px;">📋 Nuovo Template</button>
          
          <div class="grid grid-auto">
            ${this.templates.map(t => this.renderTemplateCard(t)).join('') || '<p>Nessun template</p>'}
          </div>
        </div>
      </div>
    `;
  }

  renderEmailCard(email) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">📧 ${email.to || 'Email'}</div>
            <div class="card-subtitle">${email.subject || 'Senza oggetto'}</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteCommunication(${email.id})">🗑️</button>
        </div>
        <div class="card-body">
          <p><strong>A:</strong> ${email.to}</p>
          <p><strong>Stato:</strong> <span class="badge badge-primary">${email.status}</span></p>
          <p><strong>Inviato:</strong> ${new Date(email.sentAt).toLocaleDateString('it-IT')} ${new Date(email.sentAt).toLocaleTimeString('it-IT')}</p>
          <p style="margin-top: 10px; color: var(--text-light);">${email.body?.substring(0, 100)}...</p>
        </div>
      </div>
    `;
  }

  renderSMSCard(sms) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">💬 ${sms.to}</div>
            <div class="card-subtitle">SMS</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteCommunication(${sms.id})">🗑️</button>
        </div>
        <div class="card-body">
          <p><strong>A:</strong> ${sms.to}</p>
          <p><strong>Stato:</strong> <span class="badge badge-primary">${sms.status}</span></p>
          <p><strong>Inviato:</strong> ${new Date(sms.sentAt).toLocaleDateString('it-IT')}</p>
          <p style="margin-top: 10px; color: var(--text-light);">${sms.body}</p>
        </div>
      </div>
    `;
  }

  renderNotificationCard(notif) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">🔔 ${notif.title}</div>
            <div class="card-subtitle">${notif.read ? '✓ Letta' : 'Non letta'}</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteCommunication(${notif.id})">🗑️</button>
        </div>
        <div class="card-body">
          <p>${notif.message}</p>
          <p style="margin-top: 10px; color: var(--text-light); font-size: 0.9rem;">${new Date(notif.createdAt).toLocaleDateString('it-IT')}</p>
        </div>
      </div>
    `;
  }

  renderTemplateCard(template) {
    const typeEmoji = { 'email': '📧', 'sms': '💬' };
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${typeEmoji[template.type] || '📋'} ${template.name}</div>
            <div class="card-subtitle">${template.type}</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteTemplate(${template.id})">🗑️</button>
        </div>
        <div class="card-body">
          ${template.subject ? `<p><strong>Oggetto:</strong> ${template.subject}</p>` : ''}
          <p style="color: var(--text-light); font-size: 0.9rem;">${template.body?.substring(0, 80)}...</p>
        </div>
      </div>
    `;
  }
}

// Istanza globale
const communicationsManager = new CommunicationsManager();

// ===== GLOBAL FUNCTIONS =====

function switchCommTab(tab) {
  document.getElementById('comm-emails-section').style.display = tab === 'emails' ? 'block' : 'none';
  document.getElementById('comm-sms-section').style.display = tab === 'sms' ? 'block' : 'none';
  document.getElementById('comm-notifications-section').style.display = tab === 'notifications' ? 'block' : 'none';
  document.getElementById('comm-templates-section').style.display = tab === 'templates' ? 'block' : 'none';
}

function showEmailModal() {
  const html = `
    <div class="modal active" id="emailModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuova Email</h3>
          <button class="modal-close" onclick="closeEmailModal()">✕</button>
        </div>
        <form onsubmit="sendNewEmail(event);">
          <div class="form-group">
            <label>A (Email) *</label>
            <input type="email" id="email-to" required>
          </div>
          <div class="form-group">
            <label>Oggetto *</label>
            <input type="text" id="email-subject" required>
          </div>
          <div class="form-group">
            <label>Corpo Email *</label>
            <textarea id="email-body" rows="8" required></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeEmailModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Invia Email</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeEmailModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function sendNewEmail(event) {
  event.preventDefault();
  const email = {
    to: document.getElementById('email-to').value,
    subject: document.getElementById('email-subject').value,
    body: document.getElementById('email-body').value
  };
  communicationsManager.sendEmail(email);
  closeEmailModal();
  navigationManager.loadPageContent('communications');
  Utils.showAlert('Email inviata!', 'success');
}

function showSMSModal() {
  const html = `
    <div class="modal active" id="smsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo SMS</h3>
          <button class="modal-close" onclick="closeSMSModal()">✕</button>
        </div>
        <form onsubmit="sendNewSMS(event);">
          <div class="form-group">
            <label>A (Numero) *</label>
            <input type="tel" id="sms-to" placeholder="+39XXXXXXXXXX" required>
          </div>
          <div class="form-group">
            <label>Messaggio *</label>
            <textarea id="sms-body" rows="4" maxlength="160" required></textarea>
            <small id="sms-length">0/160 caratteri</small>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeSMSModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Invia SMS</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
  
  // Counter SMS
  const textarea = document.getElementById('sms-body');
  textarea.addEventListener('input', () => {
    document.getElementById('sms-length').textContent = textarea.value.length + '/160 caratteri';
  });
}

function closeSMSModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function sendNewSMS(event) {
  event.preventDefault();
  const sms = {
    to: document.getElementById('sms-to').value,
    body: document.getElementById('sms-body').value
  };
  communicationsManager.sendSMS(sms);
  closeSMSModal();
  navigationManager.loadPageContent('communications');
  Utils.showAlert('SMS inviato!', 'success');
}

function showNotificationModal() {
  const html = `
    <div class="modal active" id="notificationModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuova Notifica</h3>
          <button class="modal-close" onclick="closeNotificationModal()">✕</button>
        </div>
        <form onsubmit="sendNewNotification(event);">
          <div class="form-group">
            <label>Titolo *</label>
            <input type="text" id="notif-title" required>
          </div>
          <div class="form-group">
            <label>Messaggio *</label>
            <textarea id="notif-message" rows="4" required></textarea>
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select id="notif-type">
              <option value="info">Info</option>
              <option value="warning">Avviso</option>
              <option value="success">Successo</option>
              <option value="error">Errore</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeNotificationModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Invia Notifica</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeNotificationModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function sendNewNotification(event) {
  event.preventDefault();
  const notif = {
    title: document.getElementById('notif-title').value,
    message: document.getElementById('notif-message').value,
    type: document.getElementById('notif-type').value
  };
  communicationsManager.sendNotification(notif);
  closeNotificationModal();
  navigationManager.loadPageContent('communications');
  Utils.showAlert('Notifica inviata!', 'success');
}

function showTemplateModal() {
  const html = `
    <div class="modal active" id="templateModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Template</h3>
          <button class="modal-close" onclick="closeTemplateModal()">✕</button>
        </div>
        <form onsubmit="saveTemplate(event);">
          <div class="form-group">
            <label>Nome Template *</label>
            <input type="text" id="template-name" required>
          </div>
          <div class="form-group">
            <label>Tipo *</label>
            <select id="template-type" required>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div id="template-email-fields">
            <div class="form-group">
              <label>Oggetto Email</label>
              <input type="text" id="template-subject">
            </div>
          </div>
          <div class="form-group">
            <label>Corpo *</label>
            <textarea id="template-body" rows="6" required></textarea>
            <small style="color: var(--text-light);">Usa {{variabile}} per placeholder (es: {{eventName}}, {{recipientName}})</small>
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

function saveTemplate(event) {
  event.preventDefault();
  const template = {
    id: Date.now(),
    name: document.getElementById('template-name').value,
    type: document.getElementById('template-type').value,
    subject: document.getElementById('template-subject')?.value || '',
    body: document.getElementById('template-body').value
  };
  communicationsManager.templates.push(template);
  communicationsManager.saveTemplates();
  closeTemplateModal();
  navigationManager.loadPageContent('communications');
  Utils.showAlert('Template salvato!', 'success');
}

function deleteTemplate(templateId) {
  if (confirm('Elimina questo template?')) {
    communicationsManager.templates = communicationsManager.templates.filter(t => t.id !== templateId);
    communicationsManager.saveTemplates();
    navigationManager.loadPageContent('communications');
    Utils.showAlert('Template eliminato!', 'success');
  }
}

function deleteCommunication(commId) {
  if (confirm('Elimina questa comunicazione?')) {
    communicationsManager.deleteCommunication(commId);
    navigationManager.loadPageContent('communications');
    Utils.showAlert('Comunicazione eliminata!', 'success');
  }
}
