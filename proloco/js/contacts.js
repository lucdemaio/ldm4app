/**
 * ContactsManager - Gestione Rubrica Contatti
 * Fornitori, Sponsor, Enti Locali, Media
 */
class ContactsManager {
  constructor() {
    this.storageKey = 'contacts';
    this.contacts = this.loadContacts();
  }

  loadContacts() {
    return storage.get(this.storageKey) || [];
  }

  saveContacts() {
    storage.set(this.storageKey, this.contacts);
  }

  // ===== CRUD OPERATIONS =====
  
  addContact(contact) {
    contact.id = Date.now();
    contact.createdAt = new Date().toISOString();
    this.contacts.push(contact);
    this.saveContacts();
    return contact;
  }

  updateContact(id, updates) {
    const contact = this.contacts.find(c => c.id === id);
    if (contact) {
      Object.assign(contact, updates);
      this.saveContacts();
      return contact;
    }
    return null;
  }

  deleteContact(id) {
    this.contacts = this.contacts.filter(c => c.id !== id);
    this.saveContacts();
  }

  getContact(id) {
    return this.contacts.find(c => c.id === id);
  }

  getAllContacts() {
    return [...this.contacts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ===== FILTERING =====

  getContactsByType(type) {
    // Types: 'fornitore', 'sponsor', 'ente_locale', 'media'
    return this.contacts.filter(c => c.type === type);
  }

  searchContacts(query) {
    const q = query.toLowerCase();
    return this.contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.company?.toLowerCase().includes(q)
    );
  }

  // ===== STATISTICS =====

  getStats() {
    return {
      total: this.contacts.length,
      fornitori: this.getContactsByType('fornitore').length,
      sponsor: this.getContactsByType('sponsor').length,
      enti: this.getContactsByType('ente_locale').length,
      media: this.getContactsByType('media').length
    };
  }

  // ===== RENDERING =====

  renderContactsPage() {
    const contacts = this.getAllContacts();
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Rubrica Contatti</h2>
            <p>Totale: ${stats.total} | Fornitori: ${stats.fornitori} | Sponsor: ${stats.sponsor} | Enti: ${stats.enti} | Media: ${stats.media}</p>
          </div>
          <button class="btn btn-primary" onclick="showContactModal()">➕ Nuovo Contatto</button>
        </div>

        <!-- Filtri -->
        <div class="grid grid-4" style="margin-bottom: 20px;">
          <button class="btn btn-secondary" onclick="filterContactsByType('')">Tutti (${stats.total})</button>
          <button class="btn btn-secondary" onclick="filterContactsByType('fornitore')">Fornitori (${stats.fornitori})</button>
          <button class="btn btn-secondary" onclick="filterContactsByType('sponsor')">Sponsor (${stats.sponsor})</button>
          <button class="btn btn-secondary" onclick="filterContactsByType('media')">Media (${stats.media})</button>
        </div>

        <!-- Search -->
        <div style="margin-bottom: 20px;">
          <input type="text" id="contact-search" placeholder="🔍 Cerca contatti..." onkeyup="searchContactsUI();" style="width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 0.95rem;">
        </div>

        <!-- Lista Contatti -->
        <div class="grid grid-auto" id="contacts-list">
          ${contacts.length > 0 ? 
            contacts.map(c => this.renderContactCard(c)).join('') :
            '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light);">Nessun contatto</p>'
          }
        </div>
      </div>
    `;
  }

  renderContactCard(contact) {
    const typeEmoji = {
      'fornitore': '🏪',
      'sponsor': '💼',
      'ente_locale': '🏛️',
      'media': '📰'
    };

    const icon = typeEmoji[contact.type] || '👤';
    const typeName = {
      'fornitore': 'Fornitore',
      'sponsor': 'Sponsor',
      'ente_locale': 'Ente Locale',
      'media': 'Media'
    }[contact.type] || 'Contatto';

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${icon} ${contact.name}</div>
            <div class="card-subtitle">${typeName}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-secondary" onclick="editContact('${contact.id}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteContact('${contact.id}')">🗑️</button>
          </div>
        </div>

        <div class="card-body">
          ${contact.company ? `<p><strong>Azienda:</strong> ${contact.company}</p>` : ''}
          ${contact.email ? `<p><strong>Email:</strong> <a href="mailto:${contact.email}" style="color: var(--primary);">${contact.email}</a></p>` : ''}
          ${contact.phone ? `<p><strong>Telefono:</strong> <a href="tel:${contact.phone}" style="color: var(--primary);">${contact.phone}</a></p>` : ''}
          ${contact.address ? `<p><strong>Indirizzo:</strong> ${contact.address}</p>` : ''}
          ${contact.notes ? `<p><strong>Note:</strong> ${contact.notes}</p>` : ''}
          
          ${contact.type === 'sponsor' && contact.sponsorLevel ? `
            <p><strong>Livello:</strong> <span class="badge badge-primary">${contact.sponsorLevel}</span></p>
          ` : ''}
        </div>
      </div>
    `;
  }


}

// Istanza globale
const contactsManager = new ContactsManager();

// ===== GLOBAL FUNCTIONS =====

function showContactModal(contactId = null) {
  const contact = contactId ? contactsManager.getContact(contactId) : null;
  
  const html = `
    <div class="modal active" id="contactModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">${contact ? 'Modifica Contatto' : 'Nuovo Contatto'}</h3>
          <button class="modal-close" onclick="closeContactModal()">✕</button>
        </div>
        <form onsubmit="saveContact(event);">
          <div class="form-group">
            <label>Nome *</label>
            <input type="text" id="contact-name" value="${contact?.name || ''}" required>
          </div>
          <div class="form-group">
            <label>Tipo *</label>
            <select id="contact-type" required>
              <option value="">-- Seleziona --</option>
              <option value="fornitore" ${contact?.type === 'fornitore' ? 'selected' : ''}>Fornitore</option>
              <option value="sponsor" ${contact?.type === 'sponsor' ? 'selected' : ''}>Sponsor</option>
              <option value="ente_locale" ${contact?.type === 'ente_locale' ? 'selected' : ''}>Ente Locale</option>
              <option value="media" ${contact?.type === 'media' ? 'selected' : ''}>Media</option>
            </select>
          </div>
          <div class="form-group">
            <label>Azienda/Ente</label>
            <input type="text" id="contact-company" value="${contact?.company || ''}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="contact-email" value="${contact?.email || ''}">
            </div>
            <div class="form-group">
              <label>Telefono</label>
              <input type="tel" id="contact-phone" value="${contact?.phone || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Indirizzo</label>
            <input type="text" id="contact-address" value="${contact?.address || ''}">
          </div>
          <div class="form-group">
            <label>Livello Sponsor (se sponsor)</label>
            <select id="contact-sponsor-level">
              <option value="">-- Seleziona --</option>
              <option value="Oro" ${contact?.sponsorLevel === 'Oro' ? 'selected' : ''}>Oro</option>
              <option value="Argento" ${contact?.sponsorLevel === 'Argento' ? 'selected' : ''}>Argento</option>
              <option value="Bronzo" ${contact?.sponsorLevel === 'Bronzo' ? 'selected' : ''}>Bronzo</option>
              <option value="Partner" ${contact?.sponsorLevel === 'Partner' ? 'selected' : ''}>Partner</option>
            </select>
          </div>
          <div class="form-group">
            <label>Note</label>
            <textarea id="contact-notes">${contact?.notes || ''}</textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeContactModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeContactModal() {
  const container = document.getElementById('modal-container');
  container.style.display = 'none';
  container.classList.remove('visible');
}

function saveContact(event) {
  event.preventDefault();
  
  const contact = {
    name: document.getElementById('contact-name').value,
    type: document.getElementById('contact-type').value,
    company: document.getElementById('contact-company').value,
    email: document.getElementById('contact-email').value,
    phone: document.getElementById('contact-phone').value,
    address: document.getElementById('contact-address').value,
    sponsorLevel: document.getElementById('contact-sponsor-level').value || null,
    notes: document.getElementById('contact-notes').value
  };

  if (!contact.name || !contact.type) {
    Utils.showAlert('Compila i campi obbligatori!', 'danger');
    return;
  }

  contactsManager.addContact(contact);
  closeContactModal();
  navigationManager.loadPageContent('contacts');
  Utils.showAlert('Contatto salvato!', 'success');
}

function editContact(contactId) {
  showContactModal(contactId);
}

function deleteContact(contactId) {
  contactId = parseInt(contactId);
  if (confirm('Sei sicuro di voler eliminare questo contatto?')) {
    contactsManager.deleteContact(contactId);
    navigationManager.loadPageContent('contacts');
    Utils.showAlert('Contatto eliminato!', 'success');
  }
}

function filterContactsByType(type) {
  // Funzione da implementare nel rendering
  const filtered = type ? contactsManager.getContactsByType(type) : contactsManager.getAllContacts();
  console.log('Filtered contacts:', filtered);
  navigationManager.loadPageContent('contacts');
}

function searchContactsUI() {
  const query = document.getElementById('contact-search').value;
  // TODO: Implementare filtro live
  console.log('Search:', query);
}
