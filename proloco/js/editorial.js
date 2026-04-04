/**
 * EditorialManager - Gestione Calendario Editoriale
 * Pianificazione contenuti social, calendari, template social
 */
class EditorialManager {
  constructor() {
    this.storageKey = 'editorial-calendar';
    this.events = this.loadEvents();
    this.socialTemplates = this.loadSocialTemplates();
  }

  loadEvents() {
    return storage.get(this.storageKey) || [];
  }

  saveEvents() {
    storage.set(this.storageKey, this.events);
  }

  loadSocialTemplates() {
    return storage.get('social-templates') || [
      {
        id: 1,
        name: 'Evento Standard',
        platform: 'facebook',
        template: '📢 Non perdete {{eventName}}!\n📅 {{eventDate}} alle {{eventTime}}\n📍 {{location}}\n🎉 Vi aspettiamo!'
      },
      {
        id: 2,
        name: 'Evento Standard',
        platform: 'instagram',
        template: '🎉 {{eventName}} {{eventDate}} 📍 {{location}} link in bio ✨'
      }
    ];
  }

  saveSocialTemplates() {
    storage.set('social-templates', this.socialTemplates);
  }

  // ===== EDITORIAL EVENTS =====

  addEditorialEvent(event) {
    event.id = Date.now();
    event.createdAt = new Date().toISOString();
    event.status = 'planned';
    this.events.push(event);
    this.saveEvents();
    return event;
  }

  updateEditorialEvent(id, updates) {
    const event = this.events.find(e => e.id === id);
    if (event) {
      Object.assign(event, updates);
      this.saveEvents();
      return event;
    }
    return null;
  }

  deleteEditorialEvent(id) {
    this.events = this.events.filter(e => e.id !== id);
    this.saveEvents();
  }

  getEditorialEvent(id) {
    return this.events.find(e => e.id === id);
  }

  getAllEditorialEvents() {
    return [...this.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getEventsByMonth(year, month) {
    return this.events.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  getEventsByPlatform(platform) {
    return this.events.filter(e => e.platform === platform);
  }

  // ===== STATISTICS =====

  getStats() {
    return {
      total: this.events.length,
      planned: this.events.filter(e => e.status === 'planned').length,
      published: this.events.filter(e => e.status === 'published').length,
      facebook: this.getEventsByPlatform('facebook').length,
      instagram: this.getEventsByPlatform('instagram').length,
      twitter: this.getEventsByPlatform('twitter').length
    };
  }

  // ===== RENDERING =====

  renderEditorialCalendarPage() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthName = new Date(year, month).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    const stats = this.getStats();
    const monthEvents = this.getEventsByMonth(year, month);

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Calendario Editoriale</h2>
            <p>${monthName} | Totale: ${stats.total} | Pianificati: ${stats.planned} | Pubblicati: ${stats.published}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="showEditorialEventModal()">📅 Nuovo Post</button>
            <button class="btn btn-secondary" onclick="switchEditorialTab('calendar')">📆 Calendario</button>
            <button class="btn btn-secondary" onclick="switchEditorialTab('social')">📱 Social</button>
            <button class="btn btn-secondary" onclick="switchEditorialTab('templates')">📋 Template</button>
          </div>
        </div>

        <!-- CALENDAR TAB -->
        <div id="editorial-calendar-section" style="display: block;">
          <h3>${monthName}</h3>
          <div class="calendar-grid">
            ${this.renderMiniCalendar(year, month)}
          </div>
          <h3 style="margin-top: 30px;">Contenuti di ${monthName}</h3>
          <div class="grid grid-auto">
            ${monthEvents.length > 0 ?
              monthEvents.map(e => this.renderEditorialCard(e)).join('') :
              '<p style="grid-column: 1/-1; color: var(--text-light);">Nessun contenuto pianificato</p>'
            }
          </div>
        </div>

        <!-- SOCIAL TAB -->
        <div id="editorial-social-section" style="display: none;">
          <h3>Gestione Social Media</h3>
          
          <div style="margin-bottom: 20px;">
            <h4>📘 Facebook (${stats.facebook})</h4>
            <div class="grid grid-auto">
              ${this.getEventsByPlatform('facebook').map(e => this.renderSocialCard(e)).join('') || '<p>Nessun post Facebook</p>'}
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h4>📷 Instagram (${stats.instagram})</h4>
            <div class="grid grid-auto">
              ${this.getEventsByPlatform('instagram').map(e => this.renderSocialCard(e)).join('') || '<p>Nessun post Instagram</p>'}
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h4>𝕏 Twitter (${stats.twitter})</h4>
            <div class="grid grid-auto">
              ${this.getEventsByPlatform('twitter').map(e => this.renderSocialCard(e)).join('') || '<p>Nessun post Twitter</p>'}
            </div>
          </div>
        </div>

        <!-- TEMPLATES TAB -->
        <div id="editorial-templates-section" style="display: none;">
          <h3>Template Social</h3>
          <button class="btn btn-primary" onclick="showSocialTemplateModal()" style="margin-bottom: 15px;">📋 Nuovo Template</button>
          
          <div class="grid grid-auto">
            ${this.socialTemplates.map(t => this.renderSocialTemplateCard(t)).join('') || '<p>Nessun template</p>'}
          </div>
        </div>
      </div>
    `;
  }

  renderMiniCalendar(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let html = '<div class="mini-calendar" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;">';
    
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    days.forEach(d => html += `<div style="text-align: center; font-weight: bold; font-size: 0.8rem;">${d}</div>`);
    
    for (let i = 0; i < firstDay; i++) html += '<div></div>';
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasEvents = this.events.some(e => new Date(e.date).toDateString() === date.toDateString());
      html += `<div style="text-align: center; padding: 8px; background: ${hasEvents ? 'var(--primary)' : 'var(--bg-light)'}; border-radius: 4px; color: ${hasEvents ? 'white' : 'inherit'};">${day}</div>`;
    }
    
    html += '</div>';
    return html;
  }

  renderEditorialCard(event) {
    const statusColors = { 'planned': '#f59e0b', 'published': '#10b981', 'draft': '#6b7280' };
    const platformEmoji = { 'facebook': '📘', 'instagram': '📷', 'twitter': '𝕏' };
    
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${platformEmoji[event.platform] || '📱'} ${event.title}</div>
            <div class="card-subtitle">${new Date(event.date).toLocaleDateString('it-IT')}</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteEditorialEvent(${event.id})">🗑️</button>
        </div>
        <div class="card-body">
          <p><strong>Piattaforma:</strong> ${event.platform} <span class="badge" style="background: ${statusColors[event.status]};">${event.status}</span></p>
          <p><strong>Contenuto:</strong> ${event.content?.substring(0, 100)}...</p>
          ${event.imageUrl ? `<p><strong>Immagine:</strong> ✓ Caricata</p>` : ''}
          ${event.scheduledTime ? `<p><strong>Orario:</strong> ${event.scheduledTime}</p>` : ''}
        </div>
      </div>
    `;
  }

  renderSocialCard(event) {
    const platformEmoji = { 'facebook': '📘', 'instagram': '📷', 'twitter': '𝕏' };
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${platformEmoji[event.platform] || '📱'} ${event.title}</div>
            <div class="card-subtitle">${new Date(event.date).toLocaleDateString('it-IT')}</div>
          </div>
        </div>
        <div class="card-body">
          <p>${event.content}</p>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 0.9rem;">
            <button class="btn btn-sm btn-secondary" onclick="editEditorialEvent(${event.id})">✏️ Modifica</button>
            <button class="btn btn-sm btn-success" onclick="publishEditorialEvent(${event.id})">📤 Pubblica</button>
          </div>
        </div>
      </div>
    `;
  }

  renderSocialTemplateCard(template) {
    const platformEmoji = { 'facebook': '📘', 'instagram': '📷', 'twitter': '𝕏' };
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${platformEmoji[template.platform] || '📋'} ${template.name}</div>
            <div class="card-subtitle">${template.platform}</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteSocialTemplate(${template.id})">🗑️</button>
        </div>
        <div class="card-body">
          <p style="color: var(--text-light); font-size: 0.9rem; white-space: pre-wrap;">${template.template}</p>
        </div>
      </div>
    `;
  }
}

// Istanza globale
const editorialManager = new EditorialManager();

// ===== GLOBAL FUNCTIONS =====

function switchEditorialTab(tab) {
  document.getElementById('editorial-calendar-section').style.display = tab === 'calendar' ? 'block' : 'none';
  document.getElementById('editorial-social-section').style.display = tab === 'social' ? 'block' : 'none';
  document.getElementById('editorial-templates-section').style.display = tab === 'templates' ? 'block' : 'none';
}

function showEditorialEventModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Contenuto Editoriale</h3>
          <button class="modal-close" onclick="closeEditorialEventModal()">✕</button>
        </div>
        <form onsubmit="saveEditorialEvent(event);">
          <div class="form-group">
            <label>Titolo *</label>
            <input type="text" id="editorial-title" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Data *</label>
              <input type="date" id="editorial-date" required>
            </div>
            <div class="form-group">
              <label>Orario (opzionale)</label>
              <input type="time" id="editorial-time">
            </div>
          </div>
          <div class="form-group">
            <label>Piattaforma *</label>
            <select id="editorial-platform" required>
              <option value="">-- Seleziona --</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>
          <div class="form-group">
            <label>Contenuto *</label>
            <textarea id="editorial-content" rows="6" required></textarea>
          </div>
          <div class="form-group">
            <label>Immagine/Video (opzionale)</label>
            <input type="file" id="editorial-media" accept="image/*,video/*">
          </div>
          <div class="form-group">
            <label>Stato</label>
            <select id="editorial-status">
              <option value="planned">Pianificato</option>
              <option value="draft">Bozza</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeEditorialEventModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva Contenuto</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeEditorialEventModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveEditorialEvent(event) {
  event.preventDefault();
  const editorialEvent = {
    title: document.getElementById('editorial-title').value,
    date: document.getElementById('editorial-date').value,
    scheduledTime: document.getElementById('editorial-time').value,
    platform: document.getElementById('editorial-platform').value,
    content: document.getElementById('editorial-content').value,
    status: document.getElementById('editorial-status').value
  };
  editorialManager.addEditorialEvent(editorialEvent);
  closeEditorialEventModal();
  navigationManager.loadPageContent('editorial');
  Utils.showAlert('Contenuto salvato!', 'success');
}

function editEditorialEvent(eventId) {
  console.log('Edit:', eventId);
  Utils.showAlert('Funzione disponibile prossimamente', 'info');
}

function publishEditorialEvent(eventId) {
  editorialManager.updateEditorialEvent(eventId, { status: 'published' });
  navigationManager.loadPageContent('editorial');
  Utils.showAlert('Contenuto pubblicato!', 'success');
}

function deleteEditorialEvent(eventId) {
  if (confirm('Elimina questo contenuto?')) {
    editorialManager.deleteEditorialEvent(eventId);
    navigationManager.loadPageContent('editorial');
    Utils.showAlert('Contenuto eliminato!', 'success');
  }
}

function showSocialTemplateModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Template Social</h3>
          <button class="modal-close" onclick="closeSocialTemplateModal()">✕</button>
        </div>
        <form onsubmit="saveSocialTemplate(event);">
          <div class="form-group">
            <label>Nome Template *</label>
            <input type="text" id="social-template-name" required>
          </div>
          <div class="form-group">
            <label>Piattaforma *</label>
            <select id="social-template-platform" required>
              <option value="">-- Seleziona --</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>
          <div class="form-group">
            <label>Template Testo *</label>
            <textarea id="social-template-body" rows="6" required></textarea>
            <small style="color: var(--text-light);">Usa {{variabili}} per placeholder</small>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeSocialTemplateModal()">Annulla</button>
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

function closeSocialTemplateModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveSocialTemplate(event) {
  event.preventDefault();
  const template = {
    id: Date.now(),
    name: document.getElementById('social-template-name').value,
    platform: document.getElementById('social-template-platform').value,
    template: document.getElementById('social-template-body').value
  };
  editorialManager.socialTemplates.push(template);
  editorialManager.saveSocialTemplates();
  closeSocialTemplateModal();
  navigationManager.loadPageContent('editorial');
  Utils.showAlert('Template salvato!', 'success');
}

function deleteSocialTemplate(templateId) {
  if (confirm('Elimina questo template?')) {
    editorialManager.socialTemplates = editorialManager.socialTemplates.filter(t => t.id !== templateId);
    editorialManager.saveSocialTemplates();
    navigationManager.loadPageContent('editorial');
    Utils.showAlert('Template eliminato!', 'success');
  }
}
