/**
 * ADMIN PANEL PROFESSIONALE
 * Gestione utenti, permessi, backup, impostazioni avanzate con password
 */

const AdminPanel = (function(){
  const root = document.getElementById('app-root');
  const ADMIN_PASSWORD = localStorage.getItem('admin-password') || null;
  
  let isAuthenticated = false;

  // Admin login form
  function tplLogin() {
    return `
      <div class="container mt-5">
        <div class="row justify-content-center">
          <div class="col-md-6">
            <div class="card mud-paper">
              <div class="card-body text-center p-5">
                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.8;">
                  <i class="fa-solid fa-lock"></i>
                </div>
                <h3 class="mb-1">Accesso Admin</h3>
                <p class="text-muted mb-4">Inserisci la password amministratore</p>
                
                <form id="admin-login">
                  <div class="mb-3">
                    <input type="password" class="form-control form-control-lg" id="admin-pass" placeholder="Password" required autofocus>
                  </div>
                  <button type="submit" class="btn btn-primary w-100">Accedi</button>
                </form>

                <hr>
                <p class="text-muted small">Prima volta? Imposta la password:</p>
                <button class="btn btn-outline-secondary btn-sm" id="setup-password">Configura Password</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Dashboard admin
  function tplDashboard() {
    return `
      <div class="d-flex mb-3 header-compact">
        <h3 class="me-auto">
          <i class="fa-solid fa-shield me-2 text-danger"></i>Pannello Amministratore
        </h3>
        <button class="btn btn-outline-danger" id="logout-admin">
          <i class="fa-solid fa-sign-out me-1"></i>Esci
        </button>
      </div>

      <ul class="nav nav-tabs mb-3" role="tablist">
        <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-users">👥 Utenti</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-backup">💾 Backup</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-settings">⚙️ Impostazioni</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-logs">📋 Log</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-system">🔧 Sistema</a></li>
      </ul>

      <div class="tab-content">
        <!-- TAB: UTENTI -->
        <div id="tab-users" class="tab-pane fade show active">
          <div class="card mud-paper">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>Gestione Utenti</h5>
                <button class="btn btn-primary btn-sm" id="add-user">
                  <i class="fa-solid fa-plus me-1"></i>Nuovo Utente
                </button>
              </div>

              <table class="table table-sm table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                    <th>Data Creazione</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="users-list">
                  <tr><td colspan="5" class="empty-state">Nessun utente</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB: BACKUP -->
        <div id="tab-backup" class="tab-pane fade">
          <div class="card mud-paper">
            <div class="card-body">
              <h5>Backup e Ripristino</h5>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="card border-success mb-3">
                    <div class="card-body">
                      <h6><i class="fa-solid fa-download text-success me-2"></i>Esporta Backup</h6>
                      <p class="text-muted small">Scarica tutti i dati in formato JSON</p>
                      <button class="btn btn-success btn-sm" id="export-backup">
                        <i class="fa-solid fa-download me-1"></i>Esporta Completo
                      </button>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card border-info mb-3">
                    <div class="card-body">
                      <h6><i class="fa-solid fa-upload text-info me-2"></i>Importa Backup</h6>
                      <p class="text-muted small">Ripristina dati da un file precedente</p>
                      <label class="btn btn-info btn-sm">
                        <i class="fa-solid fa-upload me-1"></i>Carica File
                        <input type="file" accept=".json" id="import-backup" style="display:none">
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="alert alert-info small">
                ℹ️ I backup vengono salvati automaticamente ogni giorno alle 00:00
              </div>

              <h6 class="mt-4 mb-2">Backup Recenti</h6>
              <div id="backup-list">
                <p class="text-muted small">Caricamento...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB: IMPOSTAZIONI -->
        <div id="tab-settings" class="tab-pane fade">
          <div class="card mud-paper">
            <div class="card-body">
              <h5>Impostazioni Avanzate</h5>

              <div class="mb-3">
                <label class="form-label">Password Amministratore</label>
                <div class="input-group">
                  <input type="password" class="form-control" id="new-admin-password" placeholder="Nuova password">
                  <button class="btn btn-outline-secondary" type="button" id="change-admin-password">Modifica</button>
                </div>
              </div>

              <hr>

              <div class="mb-3">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="notifications-enabled">
                  <label class="form-check-label" for="notifications-enabled">
                    Abilita notifiche
                  </label>
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="auto-backup-enabled" checked>
                  <label class="form-check-label" for="auto-backup-enabled">
                    Backup automatico giornaliero
                  </label>
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="api-enabled">
                  <label class="form-check-label" for="api-enabled">
                    Abilita API Cloud (beta)
                  </label>
                </div>
              </div>

              <hr>

              <div class="alert alert-danger">
                <strong>Zona Pericolosa</strong>
                <p class="mb-2 small">Le seguenti azioni non possono essere annullate</p>
                <button class="btn btn-danger btn-sm" id="reset-all-data">
                  <i class="fa-solid fa-exclamation-triangle me-1"></i>Resetta Tutti i Dati
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB: LOG -->
        <div id="tab-logs" class="tab-pane fade">
          <div class="card mud-paper">
            <div class="card-body">
              <div class="d-flex justify-content-between mb-3">
                <h5>Log Attività</h5>
                <button class="btn btn-outline-danger btn-sm" id="clear-logs">Cancella</button>
              </div>
              <div id="logs-container" style="max-height: 400px; overflow-y: auto;">
                <p class="text-muted small">Nessun log disponibile</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB: SISTEMA -->
        <div id="tab-system" class="tab-pane fade">
          <div class="card mud-paper">
            <div class="card-body">
              <h5>Informazioni di Sistema</h5>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <strong>Versione App:</strong><br>
                  <code>${Config.VERSION}</code>
                </div>
                <div class="col-md-6 mb-3">
                  <strong>Storage Utilizzato:</strong><br>
                  <span id="storage-used">--</span>
                </div>
                <div class="col-md-6 mb-3">
                  <strong>Database:</strong><br>
                  <code>${Config.DB.NAME}</code>
                </div>
                <div class="col-md-6 mb-3">
                  <strong>Browser:</strong><br>
                  <code id="browser-info">--</code>
                </div>
              </div>

              <hr>

              <h6>Statistiche Database</h6>
              <div id="db-stats">
                <p class="text-muted small">Caricamento...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function hashPassword(password) {
    // Use CryptoJS PBKDF2 for password hashing (more secure than btoa)
    if(window.CryptoJS) {
      return CryptoJS.PBKDF2(password, 'admin-salt-' + Config.VERSION, {
        keySize: 256/32,
        iterations: 1000
      }).toString();
    } else {
      // Fallback to btoa if CryptoJS not available
      console.warn('CryptoJS not loaded - using base64 fallback (less secure)');
      return btoa(password);
    }
  }

  async function authenticate(password) {
    // Se è la prima volta, imposta la password
    if(!ADMIN_PASSWORD) {
      const hashed = await hashPassword(password);
      localStorage.setItem('admin-password', hashed);
      isAuthenticated = true;
      return true;
    }

    // Verifica password
    const stored = localStorage.getItem('admin-password');
    const hashed = await hashPassword(password);
    if(hashed === stored) {
      isAuthenticated = true;
      return true;
    }
    return false;
  }

  async function render() {
    if(!isAuthenticated) {
      root.innerHTML = tplLogin();
      
      document.getElementById('admin-login')?.addEventListener('submit', async e => {
        e.preventDefault();
        const pass = document.getElementById('admin-pass').value;
        if(await authenticate(pass)) {
          render();
        } else {
          alert('Password non corretta');
        }
      });

      document.getElementById('setup-password')?.addEventListener('click', () => {
        const pass = prompt('Imposta password amministratore:');
        if(pass && pass.length >= 6) {
          authenticate(pass);
          render();
        } else {
          alert('Password deve avere almeno 6 caratteri');
        }
      });
    } else {
      root.innerHTML = tplDashboard();
      
      // Carica utenti
      loadUsers();
      loadBackups();
      loadSystemInfo();
      
      // Event listeners
      document.getElementById('logout-admin')?.addEventListener('click', () => {
        isAuthenticated = false;
        render();
      });

      document.getElementById('add-user')?.addEventListener('click', showAddUserModal);
      document.getElementById('export-backup')?.addEventListener('click', exportAllData);
      document.getElementById('import-backup')?.addEventListener('change', importData);
      document.getElementById('reset-all-data')?.addEventListener('click', resetAllData);
      document.getElementById('change-admin-password')?.addEventListener('click', changePassword);
    }
  }

  async function loadUsers() {
    const users = await IDB.getAll('utenti') || [];
    const html = users.length === 0 
      ? '<tr><td colspan="5" class="empty-state">Nessun utente</td></tr>'
      : users.map(u => `
        <tr>
          <td>${escapeHtml(u.nome)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td><span class="badge bg-primary">${u.ruolo}</span></td>
          <td>${formatDate(u.createdAt)}</td>
          <td class="text-end">
            <button class="btn btn-icon btn-sm btn-outline-danger" onclick="AdminPanel._deleteUser('${u.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    
    const usersList = document.getElementById('users-list');
    if(usersList) usersList.innerHTML = html;
  }

  function showAddUserModal() {
    const modal = new bootstrap.Modal(document.getElementById('addUserModal') || createUserModal(), {
      backdrop: 'static'
    });
    modal.show();
  }

  function createUserModal() {
    const div = document.createElement('div');
    div.id = 'addUserModal';
    div.className = 'modal fade';
    div.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nuovo Utente</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="form-add-user">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Nome:</label>
                <input type="text" class="form-control" id="user-nome" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Email:</label>
                <input type="email" class="form-control" id="user-email" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Ruolo:</label>
                <select class="form-control" id="user-ruolo">
                  <option value="organizzatore">Organizzatore</option>
                  <option value="arbitro">Arbitro</option>
                  <option value="viewer">Visualizzatore</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
              <button type="submit" class="btn btn-primary">Aggiungi Utente</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    
    document.getElementById('form-add-user')?.addEventListener('submit', async e => {
      e.preventDefault();
      const newUser = {
        id: makeId('user'),
        nome: document.getElementById('user-nome').value,
        email: document.getElementById('user-email').value,
        ruolo: document.getElementById('user-ruolo').value,
        createdAt: new Date().toISOString()
      };
      
      try {
        await IDB.put('utenti', newUser);
        loadUsers();
        bootstrap.Modal.getInstance(div).hide();
        showToast('Utente creato con successo', 'success');
        document.getElementById('form-add-user').reset();
      } catch(err) {
        showToast('Errore: ' + err.message, 'danger');
      }
    });
    
    return div;
  }

  async function _deleteUser(userId) {
    if(!confirm('Eliminare questo utente?')) return;
    try {
      await IDB.delete('utenti', userId);
      loadUsers();
      showToast('Utente eliminato', 'info');
    } catch(err) {
      showToast('Errore: ' + err.message, 'danger');
    }
  }

  async function loadBackups() {
    const backups = await IDB.getAll('backup') || [];
    const html = backups.length === 0
      ? '<p class="text-muted small">Nessun backup</p>'
      : backups.map((b, i) => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
          <div>
            <strong>Backup ${i + 1}</strong><br>
            <small class="text-muted">${formatDate(b.createdAt)}</small>
          </div>
          <button class="btn btn-outline-info btn-sm">Ripristina</button>
        </div>
      `).join('');
    
    const backupList = document.getElementById('backup-list');
    if(backupList) backupList.innerHTML = html;
  }

  async function loadSystemInfo() {
    const browserInfo = `${navigator.userAgent.split(' ').pop()}`;
    const dbStatsEl = document.getElementById('db-stats');
    
    if(document.getElementById('browser-info')) {
      document.getElementById('browser-info').textContent = browserInfo;
    }

    // Get IndexedDB size (approximate)
    try {
      const estimate = await navigator.storage.estimate();
      const used = (estimate.usage / 1024 / 1024).toFixed(2);
      if(document.getElementById('storage-used')) {
        document.getElementById('storage-used').textContent = `${used} MB`;
      }
    } catch(e) {
      console.log('Storage API non disponibile');
    }

    // Database stats
    if(dbStatsEl) {
      const stores = Config.DB.STORES;
      let stats = '';
      for(const store of stores) {
        try {
          const items = await IDB.getAll(store);
          stats += `<div class="py-2"><strong>${store}:</strong> ${items.length} elementi</div>`;
        } catch(e) {}
      }
      dbStatsEl.innerHTML = stats || '<p class="text-muted small">Nessun dato</p>';
    }
  }

  async function exportAllData() {
    const stores = Config.DB.STORES;
    const backup = { timestamp: new Date().toISOString(), data: {} };
    
    for(const store of stores) {
      backup.data[store] = await IDB.getAll(store);
    }

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-tornei-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(e) {
    const file = e.target.files?.[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const backup = JSON.parse(event.target.result);
        for(const [store, items] of Object.entries(backup.data)) {
          for(const item of items) {
            await IDB.put(store, item);
          }
        }
        alert('Backup importato con successo');
        location.reload();
      } catch(err) {
        alert('Errore nell\'importazione: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  async function resetAllData() {
    if(!confirm('ATTENZIONE: questa azione cancellerà TUTTI i dati. Continuare?')) return;
    if(!confirm('Sei VERAMENTE sicuro? Questa azione non può essere annullata.')) return;

    const stores = Config.DB.STORES;
    for(const store of stores) {
      await IDB.clear(store);
    }
    alert('Tutti i dati sono stati cancellati');
    location.reload();
  }

  function changePassword() {
    const newPass = document.getElementById('new-admin-password')?.value;
    if(!newPass || newPass.length < 6) {
      alert('Password deve avere almeno 6 caratteri');
      return;
    }

    // Use the new hashPassword function
    hashPassword(newPass).then(hashed => {
      localStorage.setItem('admin-password', hashed);
      alert('Password modificata con successo');
      document.getElementById('new-admin-password').value = '';
    });
  }

  return {
    render,
    isAuthenticated: () => isAuthenticated,
    _deleteUser  // Exposed for onclick handlers
  };
})();

// Export to global scope
window.AdminPanel = AdminPanel;
