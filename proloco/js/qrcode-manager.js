/**
 * QRCodeManager - Gestione Codici QR
 * Generazione, tracking, statistiche di scansioni
 */
class QRCodeManager {
  constructor() {
    this.storageKey = 'qrcodes';
    this.qrcodes = this.loadQRCodes();
    this.scans = this.loadScans();
  }

  loadQRCodes() {
    return storage.get(this.storageKey) || [];
  }

  saveQRCodes() {
    storage.set(this.storageKey, this.qrcodes);
  }

  loadScans() {
    return storage.get('qrcode-scans') || [];
  }

  saveScans() {
    storage.set('qrcode-scans', this.scans);
  }

  // ===== QR CODE CRUD =====

  generateQRCode(data) {
    const qrcode = {
      id: Date.now(),
      name: data.name,
      url: data.url,
      type: data.type || 'url', // url, text, vcard, email
      content: data.content || this.generateContent(data),
      eventId: data.eventId || null,
      createdAt: new Date().toISOString(),
      active: true,
      scans: 0
    };
    this.qrcodes.push(qrcode);
    this.saveQRCodes();
    return qrcode;
  }

  generateContent(data) {
    switch (data.type) {
      case 'url':
        return data.url;
      case 'email':
        return `mailto:${data.email}?subject=${data.subject}`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name}\nTEL:${data.phone}\nEMAIL:${data.email}\nEND:VCARD`;
      case 'text':
        return data.text;
      default:
        return data.url || '';
    }
  }

  updateQRCode(id, updates) {
    const qr = this.qrcodes.find(q => q.id === id);
    if (qr) {
      Object.assign(qr, updates);
      this.saveQRCodes();
      return qr;
    }
    return null;
  }

  deleteQRCode(id) {
    this.qrcodes = this.qrcodes.filter(q => q.id !== id);
    this.saveQRCodes();
  }

  getQRCode(id) {
    return this.qrcodes.find(q => q.id === id);
  }

  getAllQRCodes() {
    return [...this.qrcodes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ===== SCAN TRACKING =====

  recordScan(qrcodeId, userAgent) {
    const scan = {
      id: Date.now(),
      qrcodeId: qrcodeId,
      scannedAt: new Date().toISOString(),
      userAgent: userAgent || 'unknown'
    };
    this.scans.push(scan);
    this.saveScans();
    
    // Update scan count
    const qr = this.getQRCode(qrcodeId);
    if (qr) {
      qr.scans = (qr.scans || 0) + 1;
      this.saveQRCodes();
    }
    
    return scan;
  }

  getScansByQRCode(qrcodeId) {
    return this.scans.filter(s => s.qrcodeId === qrcodeId);
  }

  // ===== STATISTICS =====

  getStats() {
    return {
      total: this.qrcodes.length,
      active: this.qrcodes.filter(q => q.active).length,
      totalScans: this.scans.length,
      averageScans: this.qrcodes.length > 0 ? Math.round(this.scans.length / this.qrcodes.length) : 0
    };
  }

  getTopQRCodes(limit = 5) {
    return [...this.qrcodes]
      .sort((a, b) => (b.scans || 0) - (a.scans || 0))
      .slice(0, limit);
  }

  // ===== RENDERING =====

  renderQRCodesPage() {
    const qrcodes = this.getAllQRCodes();
    const stats = this.getStats();
    const topQRs = this.getTopQRCodes(3);

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Gestione Codici QR</h2>
            <p>Totale: ${stats.total} | Attivi: ${stats.active} | Scansioni: ${stats.totalScans}</p>
          </div>
          <button class="btn btn-primary" onclick="showQRCodeGeneratorModal()">➕ Genera QR Code</button>
        </div>

        <!-- STATISTICS -->
        <div class="grid grid-4" style="margin-bottom: 30px;">
          <div class="stat-box">
            <div class="stat-label">QR Code Totali</div>
            <div class="stat-value">${stats.total}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">QR Code Attivi</div>
            <div class="stat-value">${stats.active}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Scansioni Totali</div>
            <div class="stat-value">${stats.totalScans}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Media Scansioni</div>
            <div class="stat-value">${stats.averageScans}</div>
          </div>
        </div>

        <!-- TOP QR CODES -->
        ${topQRs.length > 0 ? `
          <h3>Top QR Codes (Più Scansionati)</h3>
          <div class="grid grid-auto" style="margin-bottom: 30px;">
            ${topQRs.map(q => this.renderQRCodeCard(q, true)).join('')}
          </div>
        ` : ''}

        <!-- ALL QR CODES -->
        <h3>Tutti i QR Code</h3>
        <div class="grid grid-auto">
          ${qrcodes.length > 0 ? 
            qrcodes.map(q => this.renderQRCodeCard(q)).join('') :
            '<p style="grid-column: 1/-1; color: var(--text-light);">Nessun QR code generato</p>'
          }
        </div>
      </div>
    `;
  }

  renderQRCodeCard(qr, isTop = false) {
    const typeLabels = { 'url': '🔗 URL', 'email': '📧 Email', 'text': '📝 Testo', 'vcard': '👤 vCard' };
    const createdDate = new Date(qr.createdAt).toLocaleDateString('it-IT');
    
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${typeLabels[qr.type] || 'QR Code'}</div>
            <div class="card-subtitle">${qr.name}</div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-sm btn-secondary" onclick="downloadQRCode(${qr.id})" title="Scarica">⬇️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteQRCode(${qr.id})" title="Elimina">🗑️</button>
          </div>
        </div>
        <div class="card-body">
          <div style="width: 150px; height: 150px; background: white; border: 1px solid var(--border); margin: 10px 0; display: flex; align-items: center; justify-content: center;">
            <div id="qr-display-${qr.id}" style="width: 140px; height: 140px;"></div>
          </div>
          <p><strong>Tipo:</strong> ${qr.type}</p>
          <p><strong>Creato:</strong> ${createdDate}</p>
          <p><strong>Scansioni:</strong> <span style="font-size: 1.2em; color: var(--primary);">📊 ${qr.scans || 0}</span></p>
          <p><strong>Stato:</strong> ${qr.active ? '<span class="badge badge-success">Attivo</span>' : '<span class="badge badge-danger">Inattivo</span>'}</p>
          ${qr.url ? `<p style="word-break: break-all; color: var(--text-light); font-size: 0.85rem;">🔗 ${qr.url}</p>` : ''}
          <button class="btn btn-sm btn-primary" onclick="viewQRCodeScans(${qr.id})" style="margin-top: 10px;">📊 Statistiche</button>
        </div>
      </div>
    `;
  }
}

// Istanza globale
const qrcodeManager = new QRCodeManager();

// ===== GLOBAL FUNCTIONS =====

function showQRCodeGeneratorModal() {
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Genera Nuovo QR Code</h3>
          <button class="modal-close" onclick="closeQRCodeGeneratorModal()">✕</button>
        </div>
        <form onsubmit="generateNewQRCode(event);">
          <div class="form-group">
            <label>Nome QR Code *</label>
            <input type="text" id="qr-name" placeholder="Es: Evento 2024" required>
          </div>
          
          <div class="form-group">
            <label>Tipo *</label>
            <select id="qr-type" onchange="updateQRTypeForm()" required>
              <option value="url">URL / Sito Web</option>
              <option value="text">Testo Libero</option>
              <option value="email">Email</option>
              <option value="vcard">Contatto vCard</option>
            </select>
          </div>

          <!-- URL INPUT -->
          <div id="qr-url-section" class="form-group">
            <label>URL *</label>
            <input type="url" id="qr-url" placeholder="https://exemplo.com">
          </div>

          <!-- TEXT INPUT -->
          <div id="qr-text-section" class="form-group" style="display: none;">
            <label>Testo *</label>
            <textarea id="qr-text" rows="4"></textarea>
          </div>

          <!-- EMAIL INPUT -->
          <div id="qr-email-section" style="display: none;">
            <div class="form-group">
              <label>Email *</label>
              <input type="email" id="qr-email">
            </div>
            <div class="form-group">
              <label>Oggetto (opzionale)</label>
              <input type="text" id="qr-email-subject">
            </div>
          </div>

          <!-- VCARD INPUT -->
          <div id="qr-vcard-section" style="display: none;">
            <div class="form-group">
              <label>Nome *</label>
              <input type="text" id="qr-vcard-name">
            </div>
            <div class="form-group">
              <label>Telefono *</label>
              <input type="tel" id="qr-vcard-phone">
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" id="qr-vcard-email">
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeQRCodeGeneratorModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Genera QR Code</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function updateQRTypeForm() {
  const type = document.getElementById('qr-type').value;
  document.getElementById('qr-url-section').style.display = type === 'url' ? 'block' : 'none';
  document.getElementById('qr-text-section').style.display = type === 'text' ? 'block' : 'none';
  document.getElementById('qr-email-section').style.display = type === 'email' ? 'block' : 'none';
  document.getElementById('qr-vcard-section').style.display = type === 'vcard' ? 'block' : 'none';
}

function closeQRCodeGeneratorModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function generateNewQRCode(event) {
  event.preventDefault();
  
  const type = document.getElementById('qr-type').value;
  const name = document.getElementById('qr-name').value;
  
  let data = { name, type };
  
  switch(type) {
    case 'url':
      data.url = document.getElementById('qr-url').value;
      if (!data.url) {
        Utils.showAlert('Inserisci un URL!', 'danger');
        return;
      }
      break;
    case 'text':
      data.text = document.getElementById('qr-text').value;
      if (!data.text) {
        Utils.showAlert('Inserisci un testo!', 'danger');
        return;
      }
      break;
    case 'email':
      data.email = document.getElementById('qr-email').value;
      data.subject = document.getElementById('qr-email-subject').value;
      if (!data.email) {
        Utils.showAlert('Inserisci un\'email!', 'danger');
        return;
      }
      break;
    case 'vcard':
      data.name = document.getElementById('qr-vcard-name').value;
      data.phone = document.getElementById('qr-vcard-phone').value;
      data.email = document.getElementById('qr-vcard-email').value;
      if (!data.phone || !data.email) {
        Utils.showAlert('Completa il contatto!', 'danger');
        return;
      }
      break;
  }
  
  qrcodeManager.generateQRCode(data);
  closeQRCodeGeneratorModal();
  navigationManager.loadPageContent('qrcode');
  setTimeout(() => initializeQRCodeDisplays(), 200);
  Utils.showAlert('QR Code generato!', 'success');
}

function downloadQRCode(qrcodeId) {
  const qr = qrcodeManager.getQRCode(qrcodeId);
  if (!qr) return;
  
  // Crea QR code dinamicamente per il download
  const container = document.createElement('div');
  container.style.display = 'none';
  document.body.appendChild(container);
  
  new QRCode(container, {
    text: qr.content,
    width: 300,
    height: 300
  });
  
  setTimeout(() => {
    const image = container.querySelector('img');
    const link = document.createElement('a');
    link.href = image.src;
    link.download = `qrcode-${qr.name}.png`;
    link.click();
    document.body.removeChild(container);
  }, 500);
}

function deleteQRCode(qrcodeId) {
  if (confirm('Elimina questo QR Code?')) {
    qrcodeManager.deleteQRCode(qrcodeId);
    navigationManager.loadPageContent('qrcode');
    setTimeout(() => initializeQRCodeDisplays(), 200);
    Utils.showAlert('QR Code eliminato!', 'success');
  }
}

function initializeQRCodeDisplays() {
  // Inizializza i QR codes per tutti i div placeholder nella pagina
  const displayDivs = document.querySelectorAll('[id^="qr-display-"]');
  displayDivs.forEach(div => {
    // Svuota il div per evitare duplicati
    div.innerHTML = '';
    const qrId = parseInt(div.id.replace('qr-display-', ''));
    const qr = qrcodeManager.getQRCode(qrId);
    if (qr && qr.content) {
      try {
        new QRCode(div, {
          text: qr.content,
          width: 140,
          height: 140
        });
      } catch(e) {
        console.error('Errore generazione QR:', e);
      }
    }
  });
}

function viewQRCodeScans(qrcodeId) {
  const qr = qrcodeManager.getQRCode(qrcodeId);
  const scans = qrcodeManager.getScansByQRCode(qrcodeId);
  
  let scansInfo = 'Dettagli Scansioni:\\n\\n';
  scansInfo += `QR Code: ${qr.name}\\n`;
  scansInfo += `Tipo: ${qr.type}\\n`;
  scansInfo += `Scansioni Totali: ${scans.length}\\n\\n`;
  
  if (scans.length > 0) {
    scansInfo += 'Ultimi 5 scan:\\n';
    scans.slice(-5).forEach((scan, i) => {
      const date = new Date(scan.scannedAt).toLocaleString('it-IT');
      scansInfo += `${i+1}. ${date}\\n`;
    });
  } else {
    scansInfo += 'Nessuna scansione registrata ancora.';
  }
  
  Utils.showAlert(scansInfo, 'info');
}
