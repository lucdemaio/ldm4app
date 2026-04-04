/**
 * MarketingCampaignManager - Campagne di Marketing
 * Email marketing, newsletter, segmentazione
 */
class MarketingCampaignManager {
  constructor() {
    this.campaignsKey = 'marketing-campaigns';
    this.subscribersKey = 'newsletter-subscribers';
    this.templatesKey = 'marketing-templates';
    this.campaigns = this.loadCampaigns();
    this.subscribers = this.loadSubscribers();
    this.templates = this.loadTemplates();
  }

  loadCampaigns() {
    return storage.get(this.campaignsKey) || [];
  }

  saveCampaigns() {
    storage.set(this.campaignsKey, this.campaigns);
  }

  loadSubscribers() {
    return storage.get(this.subscribersKey) || [];
  }

  saveSubscribers() {
    storage.set(this.subscribersKey, this.subscribers);
  }

  loadTemplates() {
    return storage.get(this.templatesKey) || [
      { id: 1, name: 'Newsletter', subject: 'Pro Loco Newsletter', icon: '📰' },
      { id: 2, name: 'Evento Promozionale', subject: 'Scopri il nostro prossimo evento', icon: '📢' },
      { id: 3, name: 'Raccolta Fondi', subject: 'Aiutaci a sostenere i nostri progetti', icon: '💰' },
      { id: 4, name: 'Feedback', subject: 'Cosa ne pensi di noi?', icon: '💬' }
    ];
  }

  saveTemplates() {
    storage.set(this.templatesKey, this.templates);
  }

  addSubscriber(subscriber) {
    subscriber.id = Date.now();
    subscriber.subscribedAt = new Date().toISOString();
    subscriber.status = subscriber.status || 'active';
    this.subscribers.push(subscriber);
    this.saveSubscribers();
    return subscriber;
  }

  removeSubscriber(subscriberId) {
    this.subscribers = this.subscribers.filter(s => s.id !== subscriberId);
    this.saveSubscribers();
  }

  createCampaign(campaign) {
    campaign.id = Date.now();
    campaign.createdAt = new Date().toISOString();
    campaign.status = campaign.status || 'draft';
    campaign.sent = false;
    campaign.stats = {
      sent: 0,
      opened: 0,
      clicked: 0,
      bounced: 0
    };
    this.campaigns.push(campaign);
    this.saveCampaigns();
    return campaign;
  }

  updateCampaign(campaignId, updates) {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      Object.assign(campaign, updates);
      this.saveCampaigns();
      return campaign;
    }
    return null;
  }

  sendCampaign(campaignId) {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      campaign.sent = true;
      campaign.sentAt = new Date().toISOString();
      campaign.status = 'sent';
      campaign.stats.sent = this.subscribers.filter(s => s.status === 'active').length;
      this.saveCampaigns();
      return campaign;
    }
    return null;
  }

  getSubscribersBySegment(segment) {
    return this.subscribers.filter(s => 
      s.status === 'active' && 
      (s.segment === segment || segment === 'all')
    );
  }

  getStats() {
    return {
      totalCampaigns: this.campaigns.length,
      activeCampaigns: this.campaigns.filter(c => c.status === 'sent').length,
      draftCampaigns: this.campaigns.filter(c => c.status === 'draft').length,
      totalSubscribers: this.subscribers.length,
      activeSubscribers: this.subscribers.filter(s => s.status === 'active').length,
      totalEmails: this.campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0)
    };
  }

  renderMarketingPage() {
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Campagne di Marketing</h2>
            <p>Campagne: ${stats.totalCampaigns} | Iscritti: ${stats.activeSubscribers}/${stats.totalSubscribers}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="switchMarketingTab('campaigns')">📧 Campagne</button>
            <button class="btn btn-secondary" onclick="switchMarketingTab('subscribers')">👥 Iscritti</button>
          </div>
        </div>

        <!-- STATS -->
        <div class="grid grid-4 stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalCampaigns}</div>
            <div class="stat-label">Campagne Totali</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #FF9800;">${stats.draftCampaigns}</div>
            <div class="stat-label">In Bozza</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #4CAF50;">${stats.activeCampaigns}</div>
            <div class="stat-label">Inviate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.activeSubscribers}</div>
            <div class="stat-label">Iscritti Attivi</div>
          </div>
        </div>

        <!-- TABS -->
        <div style="margin-bottom: 20px; display: flex; gap: 10px;">
          <button class="btn btn-sm" onclick="switchMarketingTab('campaigns')" style="background: var(--primary); color: white;">📧 Campagne</button>
          <button class="btn btn-sm" onclick="switchMarketingTab('subscribers')">👥 Iscritti</button>
          <button class="btn btn-sm" onclick="switchMarketingTab('templates')">📋 Template</button>
          <button class="btn btn-sm" onclick="switchMarketingTab('analytics')">📊 Analytics</button>
        </div>

        <!-- CAMPAIGNS TAB -->
        <div id="marketing-campaigns-section" style="display: block;">
          <h3>Campagne Email</h3>
          <button class="btn btn-primary" onclick="showNewCampaignModal()" style="margin-bottom: 15px;">➕ Nuova Campagna</button>

          <div class="grid grid-auto">
            ${this.campaigns.slice().reverse().map(c => `
              <div class="card">
                <div class="card-header">
                  <div class="card-title">📧 ${c.subject}</div>
                  <span class="badge ${c.status === 'draft' ? 'badge-warning' : c.status === 'sent' ? 'badge-success' : 'badge-info'}">
                    ${c.status === 'draft' ? '📝 Bozza' : c.status === 'sent' ? '✓ Inviata' : '⏱️ Programmata'}
                  </span>
                </div>
                <div class="card-body">
                  <p style="color: var(--text-light);">${c.content?.substring(0, 100)}...</p>
                  <p style="font-size: 0.85rem; color: var(--text-light);">Creata: ${new Date(c.createdAt).toLocaleDateString('it-IT')}</p>
                  ${c.sent ? `
                    <div style="margin-top: 12px; padding: 12px; background: var(--background-light); border-radius: 6px;">
                      <p style="margin: 0; font-size: 0.85rem;"><strong>Inviato:</strong> ${c.stats?.sent}</p>
                      <p style="margin: 0; font-size: 0.85rem;"><strong>Aperti:</strong> ${c.stats?.opened} (${c.stats?.sent ? Math.round((c.stats.opened / c.stats.sent) * 100) : 0}%)</p>
                      <p style="margin: 0; font-size: 0.85rem;"><strong>Click:</strong> ${c.stats?.clicked}</p>
                    </div>
                  ` : ''}
                  <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="btn btn-sm btn-secondary" onclick="editCampaign(${c.id})">✏️</button>
                    ${c.status === 'draft' ? `
                      <button class="btn btn-sm btn-primary" onclick="sendCampaignModal(${c.id})">📤 Invia</button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteCampaign(${c.id})">🗑️</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- SUBSCRIBERS TAB -->
        <div id="marketing-subscribers-section" style="display: none;">
          <h3>Gestione Iscritti</h3>
          <button class="btn btn-primary" onclick="showAddSubscriberModal()" style="margin-bottom: 15px;">➕ Nuovo Iscritto</button>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nome</th>
                  <th>Segmento</th>
                  <th>Stato</th>
                  <th>Iscritto</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                ${this.subscribers.length > 0 ? 
                  this.subscribers.map(s => `
                    <tr>
                      <td>${s.email}</td>
                      <td>${s.name || '-'}</td>
                      <td><span class="badge badge-info">${s.segment || 'Generale'}</span></td>
                      <td>
                        <span class="badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}">
                          ${s.status === 'active' ? '✓ Attivo' : '❌ Disattivato'}
                        </span>
                      </td>
                      <td>${new Date(s.subscribedAt).toLocaleDateString('it-IT')}</td>
                      <td>
                        <button class="btn btn-xs btn-danger" onclick="removeSubscriber(${s.id})">🗑️</button>
                      </td>
                    </tr>
                  `).join('') :
                  '<tr><td colspan="6" style="text-align: center; color: var(--text-light);">Nessun iscritto</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- TEMPLATES TAB -->
        <div id="marketing-templates-section" style="display: none;">
          <h3>Template Campagne</h3>
          <div class="grid grid-auto">
            ${this.templates.map(t => `
              <div class="card">
                <div class="card-header">
                  <div class="card-title">${t.icon} ${t.name}</div>
                </div>
                <div class="card-body">
                  <p style="color: var(--text-light);">Oggetto: ${t.subject}</p>
                  <button class="btn btn-sm btn-primary" onclick="createCampaignFromTemplate(${t.id})" style="margin-top: 12px;">📧 Usa Template</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- ANALYTICS TAB -->
        <div id="marketing-analytics-section" style="display: none;">
          <h3>Statistiche Campagne</h3>
          <div class="grid grid-2">
            <div class="card">
              <div class="card-header">
                <div class="card-title">📊 Performance Medie</div>
              </div>
              <div class="card-body">
                <p><strong>Tasso Apertura Medio:</strong> ${this.campaigns.length > 0 ? Math.round((this.campaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0) / this.campaigns.length)) : 0}%</p>
                <p><strong>Tasso Click Medio:</strong> ${this.campaigns.length > 0 ? Math.round((this.campaigns.reduce((sum, c) => sum + (c.stats?.clicked || 0), 0) / this.campaigns.length)) : 0}%</p>
                <p><strong>Tasso Rimbalzo:</strong> ${this.campaigns.length > 0 ? Math.round((this.campaigns.reduce((sum, c) => sum + (c.stats?.bounced || 0), 0) / this.campaigns.length)) : 0}%</p>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <div class="card-title">🎯 Segmentazione</div>
              </div>
              <div class="card-body">
                <p><strong>Generale:</strong> ${this.getSubscribersBySegment('general').length}</p>
                <p><strong>VIP:</strong> ${this.getSubscribersBySegment('vip').length}</p>
                <p><strong>Potenziali:</strong> ${this.getSubscribersBySegment('prospects').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

const marketingCampaignManager = new MarketingCampaignManager();

function switchMarketingTab(tab) {
  document.getElementById('marketing-campaigns-section').style.display = tab === 'campaigns' ? 'block' : 'none';
  document.getElementById('marketing-subscribers-section').style.display = tab === 'subscribers' ? 'block' : 'none';
  document.getElementById('marketing-templates-section').style.display = tab === 'templates' ? 'block' : 'none';
  document.getElementById('marketing-analytics-section').style.display = tab === 'analytics' ? 'block' : 'none';
}

function showNewCampaignModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuova Campagna Email</h3>
          <button class="modal-close" onclick="closeMarketingModal()">✕</button>
        </div>
        <form onsubmit="saveNewCampaign(event);">
          <div class="form-group">
            <label>Oggetto Email *</label>
            <input type="text" id="campaign-subject" required>
          </div>
          <div class="form-group">
            <label>Contenuto *</label>
            <textarea id="campaign-content" rows="8" required></textarea>
          </div>
          <div class="form-group">
            <label>Destinatari *</label>
            <select id="campaign-segment" required>
              <option value="">-- Seleziona --</option>
              <option value="all">Tutti</option>
              <option value="general">Generale</option>
              <option value="vip">VIP</option>
              <option value="prospects">Potenziali</option>
            </select>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="campaign-draft"> Salva come bozza
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeMarketingModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Crea Campagna</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeMarketingModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveNewCampaign(event) {
  event.preventDefault();
  const campaign = marketingCampaignManager.createCampaign({
    subject: document.getElementById('campaign-subject').value,
    content: document.getElementById('campaign-content').value,
    segment: document.getElementById('campaign-segment').value,
    status: document.getElementById('campaign-draft').checked ? 'draft' : 'sent'
  });
  closeMarketingModal();
  navigationManager.loadPageContent('marketing');
  Utils.showAlert('Campagna creata!', 'success');
}

function sendCampaignModal(campaignId) {
  const campaign = marketingCampaignManager.campaigns.find(c => c.id === campaignId);
  if (!campaign) return;

  const html = `
    <div class="modal active">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">Invia Campagna</h3>
          <button class="modal-close" onclick="closeMarketingModal()">✕</button>
        </div>
        <div style="padding: 20px;">
          <p>Sei sicuro di voler inviare questa campagna a <strong>${campaign.stats?.sent || 'molti'}</strong> iscritti?</p>
          <p style="color: var(--text-light); margin-top: 15px;">Oggetto: <strong>${campaign.subject}</strong></p>
          <div class="modal-footer" style="margin-top: 20px;">
            <button type="button" class="btn btn-secondary" onclick="closeMarketingModal()">Annulla</button>
            <button type="button" class="btn btn-primary" onclick="confirmSendCampaign(${campaignId})">📤 Invia Ora</button>
          </div>
        </div>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function confirmSendCampaign(campaignId) {
  const campaign = marketingCampaignManager.sendCampaign(campaignId);
  closeMarketingModal();
  navigationManager.loadPageContent('marketing');
  Utils.showAlert(`Campagna inviata a ${campaign.stats.sent} iscritti!`, 'success');
}

function editCampaign(campaignId) {
  const campaign = marketingCampaignManager.campaigns.find(c => c.id === campaignId);
  if (campaign) Utils.showAlert('Modifica campagna: ' + campaign.subject, 'info');
}

function deleteCampaign(campaignId) {
  if (confirm('Eliminare questa campagna?')) {
    marketingCampaignManager.campaigns = marketingCampaignManager.campaigns.filter(c => c.id !== campaignId);
    marketingCampaignManager.saveCampaigns();
    navigationManager.loadPageContent('marketing');
    Utils.showAlert('Campagna eliminata!', 'success');
  }
}

function showAddSubscriberModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">Aggiungi Iscritto</h3>
          <button class="modal-close" onclick="closeMarketingModal()">✕</button>
        </div>
        <form onsubmit="saveNewSubscriber(event);">
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="subscriber-email" required>
          </div>
          <div class="form-group">
            <label>Nome</label>
            <input type="text" id="subscriber-name">
          </div>
          <div class="form-group">
            <label>Segmento</label>
            <select id="subscriber-segment">
              <option value="general">Generale</option>
              <option value="vip">VIP</option>
              <option value="prospects">Potenziali</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeMarketingModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Aggiungi</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function saveNewSubscriber(event) {
  event.preventDefault();
  const subscriber = marketingCampaignManager.addSubscriber({
    email: document.getElementById('subscriber-email').value,
    name: document.getElementById('subscriber-name').value,
    segment: document.getElementById('subscriber-segment').value
  });
  closeMarketingModal();
  navigationManager.loadPageContent('marketing');
  Utils.showAlert(`${subscriber.email} iscritto!`, 'success');
}

function removeSubscriber(subscriberId) {
  if (confirm('Rimuovere questo iscritto?')) {
    marketingCampaignManager.removeSubscriber(subscriberId);
    navigationManager.loadPageContent('marketing');
    Utils.showAlert('Iscritto rimosso!', 'success');
  }
}

function createCampaignFromTemplate(templateId) {
  const template = marketingCampaignManager.templates.find(t => t.id === templateId);
  if (template) {
    const campaign = marketingCampaignManager.createCampaign({
      subject: template.subject,
      content: `Contenuto dalla template: ${template.name}`,
      segment: 'all',
      status: 'draft'
    });
    navigationManager.loadPageContent('marketing');
    Utils.showAlert(`Campagna creata dal template "${template.name}"!`, 'success');
  }
}
