/**
 * SponsorshipManager - Gestione Sponsor e Contratti
 * Livelli sponsorship, commitment, vantaggi, contratti
 */
class SponsorshipManager {
  constructor() {
    this.storageKey = 'sponsors';
    this.sponsors = this.loadSponsors();
    this.sponsorLevels = {
      'Oro': { color: '#FFD700', commitment: 5000, benefits: ['Logo sito', 'Social media', 'Evento speciale'] },
      'Argento': { color: '#C0C0C0', commitment: 3000, benefits: ['Logo sito', 'Social media'] },
      'Bronzo': { color: '#CD7F32', commitment: 1000, benefits: ['Logo sito'] },
      'Partner': { color: '#6366f1', commitment: 500, benefits: ['Menzione'] }
    };
  }

  loadSponsors() {
    return storage.get(this.storageKey) || [];
  }

  saveSponsors() {
    storage.set(this.storageKey, this.sponsors);
  }

  // ===== CRUD =====

  addSponsor(sponsor) {
    sponsor.id = Date.now();
    sponsor.createdAt = new Date().toISOString();
    sponsor.contractFiles = sponsor.contractFiles || [];
    this.sponsors.push(sponsor);
    this.saveSponsors();
    return sponsor;
  }

  updateSponsor(id, updates) {
    const sponsor = this.sponsors.find(s => s.id === id);
    if (sponsor) {
      Object.assign(sponsor, updates);
      this.saveSponsors();
      return sponsor;
    }
    return null;
  }

  deleteSponsor(id) {
    this.sponsors = this.sponsors.filter(s => s.id !== id);
    this.saveSponsors();
  }

  getSponsor(id) {
    return this.sponsors.find(s => s.id === id);
  }

  getAllSponsors() {
    return [...this.sponsors].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ===== FILTERING =====

  getSponsorsByLevel(level) {
    return this.sponsors.filter(s => s.level === level);
  }

  getActiveSponsorships(eventId = null) {
    return this.sponsors.filter(s => {
      const endDate = new Date(s.endDate);
      const isActive = endDate > new Date();
      return !eventId ? isActive : isActive && s.eventId === eventId;
    });
  }

  // ===== STATISTICS =====

  getStats() {
    return {
      total: this.sponsors.length,
      active: this.getActiveSponsorships().length,
      totalCommitment: this.sponsors.reduce((sum, s) => {
        const level = this.sponsorLevels[s.level];
        return sum + (level?.commitment || 0);
      }, 0),
      byLevel: {
        Oro: this.getSponsorsByLevel('Oro').length,
        Argento: this.getSponsorsByLevel('Argento').length,
        Bronzo: this.getSponsorsByLevel('Bronzo').length,
        Partner: this.getSponsorsByLevel('Partner').length
      }
    };
  }

  // ===== BENEFITS =====

  getBenefitsByLevel(level) {
    return this.sponsorLevels[level]?.benefits || [];
  }

  getCommitmentByLevel(level) {
    return this.sponsorLevels[level]?.commitment || 0;
  }

  // ===== RENDERING =====

  renderSponsorsPage() {
    const sponsors = this.getAllSponsors();
    const stats = this.getStats();
    const active = this.getActiveSponsorships();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Gestione Sponsor</h2>
            <p>Totale: ${stats.total} | Attivi: ${stats.active} | Commitment: €${stats.totalCommitment}</p>
          </div>
          <button class="btn btn-primary" onclick="showSponsorModal()">➕ Nuovo Sponsor</button>
        </div>

        <!-- Statistiche Livelli -->
        <div class="grid grid-4" style="margin-bottom: 20px;">
          <div class="stat-box">
            <div class="stat-label">Oro</div>
            <div class="stat-value">${stats.byLevel.Oro}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Argento</div>
            <div class="stat-value">${stats.byLevel.Argento}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Bronzo</div>
            <div class="stat-value">${stats.byLevel.Bronzo}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Partner</div>
            <div class="stat-value">${stats.byLevel.Partner}</div>
          </div>
        </div>

        <!-- Sponsor Attivi -->
        <h3 style="margin: 30px 0 15px 0;">Sponsor Attivi (${active.length})</h3>
        <div class="grid grid-auto">
          ${active.length > 0 ? 
            active.map(s => this.renderSponsorCard(s)).join('') :
            '<p style="grid-column: 1/-1; color: var(--text-light);">Nessuno sponsor attivo</p>'
          }
        </div>

        <!-- Tutti gli Sponsor -->
        <h3 style="margin: 30px 0 15px 0;">Tutti i Sponsor (${sponsors.length})</h3>
        <div class="grid grid-auto">
          ${sponsors.length > 0 ? 
            sponsors.map(s => this.renderSponsorCard(s)).join('') :
            '<p style="grid-column: 1/-1; color: var(--text-light);">Nessuno sponsor</p>'
          }
        </div>
      </div>

    `;
  }

  renderSponsorCard(sponsor) {
    const level = this.sponsorLevels[sponsor.level];
    const endDate = new Date(sponsor.endDate);
    const isActive = endDate > new Date();
    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title" style="color: ${level?.color};">💼 ${sponsor.name}</div>
            <div class="card-subtitle">
              <span class="badge" style="background: ${level?.color}30; color: ${level?.color};">${sponsor.level}</span>
              ${isActive ? `<span class="badge badge-success" style="margin-left: 8px;">✓ Attivo</span>` : '<span class="badge badge-danger">✗ Scaduto</span>'}
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-secondary" onclick="editSponsor('${sponsor.id}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSponsor('${sponsor.id}')">🗑️</button>
          </div>
        </div>

        <div class="card-body">
          <p><strong>Contatto:</strong> ${sponsor.contactName}</p>
          <p><strong>Email:</strong> <a href="mailto:${sponsor.email}" style="color: var(--primary);">${sponsor.email}</a></p>
          <p><strong>Importo Commitment:</strong> €${sponsor.commitment}</p>
          <p><strong>Scadenza:</strong> ${sponsor.endDate} ${!isActive ? '(Scaduto)' : `(${daysLeft} giorni)`}</p>
          
          <p><strong>Vantaggi:</strong></p>
          <ul style="margin: 8px 0; padding-left: 20px;">
            ${this.getBenefitsByLevel(sponsor.level).map(b => `<li>${b}</li>`).join('')}
          </ul>

          ${sponsor.contractFiles?.length > 0 ? `
            <p><strong>📄 Contratti: (${sponsor.contractFiles.length})</strong></p>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderSponsorModal() {
    return `
      <div id="modal-container" style="display: none;">
        <div class="modal" id="sponsorModal">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">Nuovo Sponsor</h3>
              <button class="modal-close" onclick="closeSponsorModal()">&times;</button>
            </div>

            <form onsubmit="saveSponsor(event);">
              <div class="form-group">
                <label>Nome Azienda *</label>
                <input type="text" id="sponsor-name" required>
              </div>

              <div class="form-group">
                <label>Livello di Sponsorship *</label>
                <select id="sponsor-level" required>
                  <option value="">-- Seleziona --</option>
                  <option value="Oro">Oro (€5000)</option>
                  <option value="Argento">Argento (€3000)</option>
                  <option value="Bronzo">Bronzo (€1000)</option>
                  <option value="Partner">Partner (€500)</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Contatto (Nome)</label>
                  <input type="text" id="sponsor-contact-name">
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" id="sponsor-email" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Importo Commitment €</label>
                  <input type="number" id="sponsor-commitment" step="100" min="0">
                </div>
                <div class="form-group">
                  <label>Data Scadenza *</label>
                  <input type="date" id="sponsor-end-date" required>
                </div>
              </div>

              <div class="form-group">
                <label>Note/Dettagli</label>
                <textarea id="sponsor-notes"></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeSponsorModal()">Annulla</button>
                <button type="submit" class="btn btn-primary">Salva</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }
}

// Istanza globale
const sponsorshipManager = new SponsorshipManager();

// ===== GLOBAL FUNCTIONS =====

function showSponsorModal(sponsorId = null) {
  const sponsor = sponsorId ? sponsorshipManager.getSponsor(sponsorId) : null;
  
  const html = `
    <div class="modal active" id="sponsorModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">${sponsor ? 'Modifica Sponsor' : 'Nuovo Sponsor'}</h3>
          <button class="modal-close" onclick="closeSponsorModal()">✕</button>
        </div>
        <form onsubmit="saveSponsor(event);">
          <div class="form-group">
            <label>Nome Azienda *</label>
            <input type="text" id="sponsor-name" value="${sponsor?.name || ''}" required>
          </div>
          <div class="form-group">
            <label>Livello di Sponsorship *</label>
            <select id="sponsor-level" required>
              <option value="">-- Seleziona --</option>
              <option value="Oro" ${sponsor?.level === 'Oro' ? 'selected' : ''}>Oro (€5000)</option>
              <option value="Argento" ${sponsor?.level === 'Argento' ? 'selected' : ''}>Argento (€3000)</option>
              <option value="Bronzo" ${sponsor?.level === 'Bronzo' ? 'selected' : ''}>Bronzo (€1000)</option>
              <option value="Partner" ${sponsor?.level === 'Partner' ? 'selected' : ''}>Partner (€500)</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Contatto (Nome)</label>
              <input type="text" id="sponsor-contact-name" value="${sponsor?.contactName || ''}">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="sponsor-email" value="${sponsor?.email || ''}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Importo Commitment €</label>
              <input type="number" id="sponsor-commitment" step="100" min="0" value="${sponsor?.commitment || ''}">
            </div>
            <div class="form-group">
              <label>Data Scadenza *</label>
              <input type="date" id="sponsor-end-date" value="${sponsor?.endDate || ''}" required>
            </div>
          </div>
          <div class="form-group">
            <label>Note/Dettagli</label>
            <textarea id="sponsor-notes">${sponsor?.notes || ''}</textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeSponsorModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva Sponsor</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeSponsorModal() {
  const container = document.getElementById('modal-container');
  container.style.display = 'none';
  container.classList.remove('visible');
}

function saveSponsor(event) {
  event.preventDefault();

  const level = document.getElementById('sponsor-level').value;
  const levelData = sponsorshipManager.sponsorLevels[level];
  
  const sponsor = {
    name: document.getElementById('sponsor-name').value,
    level: level,
    contactName: document.getElementById('sponsor-contact-name').value,
    email: document.getElementById('sponsor-email').value,
    commitment: parseInt(document.getElementById('sponsor-commitment').value) || levelData?.commitment,
    endDate: document.getElementById('sponsor-end-date').value,
    notes: document.getElementById('sponsor-notes').value
  };

  if (!sponsor.name || !sponsor.level || !sponsor.email) {
    Utils.showAlert('Compila i campi obbligatori!', 'danger');
    return;
  }

  sponsorshipManager.addSponsor(sponsor);
  closeSponsorModal();
  navigationManager.loadPageContent('sponsors');
  Utils.showAlert('Sponsor salvato!', 'success');
}

function editSponsor(sponsorId) {
  showSponsorModal(sponsorId);
}

function deleteSponsor(sponsorId) {
  if (confirm('Sei sicuro di voler eliminare questo sponsor?')) {
    sponsorshipManager.deleteSponsor(sponsorId);
    navigationManager.loadPageContent('sponsors');
    Utils.showAlert('Sponsor eliminato!', 'success');
  }
}
