/**
 * UserPermissionsManager - Gestione Permessi Utenti
 * Ruoli, Accesso, Autorizzazioni
 */
class UserPermissionsManager {
  constructor() {
    this.usersKey = 'users-list';
    this.rolesKey = 'user-roles';
    this.permissionsKey = 'system-permissions';
    this.users = this.loadUsers();
    this.roles = this.loadRoles();
    this.permissions = this.loadPermissions();
  }

  loadUsers() {
    return storage.get(this.usersKey) || [
      { id: 1, name: 'Admin', email: 'admin@proloco.it', role: 'admin', status: 'active', joinedAt: new Date().toISOString() }
    ];
  }

  saveUsers() {
    storage.set(this.usersKey, this.users);
  }

  loadRoles() {
    return storage.get(this.rolesKey) || [
      { id: 'admin', name: 'Amministratore', description: 'Accesso completo', permissions: ['all'] },
      { id: 'manager', name: 'Responsabile', description: 'Gestione eventi e volontari', permissions: ['events', 'volunteers', 'team'] },
      { id: 'volunteer', name: 'Volontario', description: 'Visualizzazione compiti', permissions: ['view:tasks'] },
      { id: 'viewer', name: 'Visualizzatore', description: 'Solo lettura', permissions: ['view:all'] }
    ];
  }

  saveRoles() {
    storage.set(this.rolesKey, this.roles);
  }

  loadPermissions() {
    return storage.get(this.permissionsKey) || [
      'events:create', 'events:edit', 'events:delete', 'events:view',
      'volunteers:create', 'volunteers:edit', 'volunteers:delete', 'volunteers:view',
      'finance:view', 'finance:edit', 'finance:export',
      'reports:view', 'reports:export', 'reports:schedule',
      'settings:edit', 'settings:view',
      'users:manage', 'users:create', 'users:edit', 'users:delete',
      'all'
    ];
  }

  savePermissions() {
    storage.set(this.permissionsKey, this.permissions);
  }

  addUser(user) {
    user.id = Date.now();
    user.status = user.status || 'active';
    user.joinedAt = new Date().toISOString();
    this.users.push(user);
    this.saveUsers();
    return user;
  }

  updateUser(userId, updates) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      this.saveUsers();
      return user;
    }
    return null;
  }

  deleteUser(userId) {
    this.users = this.users.filter(u => u.id !== userId);
    this.saveUsers();
  }

  getUsersByRole(roleId) {
    return this.users.filter(u => u.role === roleId);
  }

  getPermissionsForRole(roleId) {
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.permissions : [];
  }

  checkUserPermission(userId, permission) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;
    const role = this.roles.find(r => r.id === user.role);
    if (!role) return false;
    return role.permissions.includes('all') || role.permissions.includes(permission);
  }

  addRole(role) {
    role.id = String(Date.now());
    this.roles.push(role);
    this.saveRoles();
    return role;
  }

  updateRole(roleId, updates) {
    const role = this.roles.find(r => r.id === roleId);
    if (role) {
      Object.assign(role, updates);
      this.saveRoles();
      return role;
    }
    return null;
  }

  getStats() {
    return {
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.status === 'active').length,
      totalRoles: this.roles.length,
      adminCount: this.users.filter(u => u.role === 'admin').length
    };
  }

  renderPermissionsPage() {
    const stats = this.getStats();

    return `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h2>Gestione Permessi</h2>
            <p>Utenti: ${stats.totalUsers} | Ruoli: ${stats.totalRoles} | Amministratori: ${stats.adminCount}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="switchPermissionsTab('users')">👥 Utenti</button>
            <button class="btn btn-secondary" onclick="switchPermissionsTab('roles')">🔐 Ruoli</button>
          </div>
        </div>

        <!-- USERS TAB -->
        <div id="permissions-users-section" style="display: block;">
          <h3>Gestione Utenti</h3>
          <button class="btn btn-primary" onclick="showAddUserModal()" style="margin-bottom: 15px;">➕ Nuovo Utente</button>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Ruolo</th>
                  <th>Stato</th>
                  <th>Iscritto</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                ${this.users.map(u => `
                  <tr>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-primary">${this.getRoleNameById(u.role)}</span></td>
                    <td>
                      <span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}">
                        ${u.status === 'active' ? '✓ Attivo' : '🔒 Bloccato'}
                      </span>
                    </td>
                    <td>${new Date(u.joinedAt).toLocaleDateString('it-IT')}</td>
                    <td>
                      <button class="btn btn-xs btn-secondary" onclick="editUserModal(${u.id})">✏️</button>
                      <button class="btn btn-xs btn-danger" onclick="deleteUserPermission(${u.id})">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- ROLES TAB -->
        <div id="permissions-roles-section" style="display: none;">
          <h3>Gestione Ruoli</h3>
          <button class="btn btn-primary" onclick="showAddRoleModal()" style="margin-bottom: 15px;">➕ Nuovo Ruolo</button>

          <div class="grid grid-auto">
            ${this.roles.map(r => `
              <div class="card">
                <div class="card-header">
                  <div class="card-title">🔐 ${r.name}</div>
                  <button class="btn btn-sm btn-secondary" onclick="editRoleModal(${JSON.stringify(r).replace(/"/g, '&quot;')})">✏️</button>
                </div>
                <div class="card-body">
                  <p>${r.description}</p>
                  <h4 style="margin-top: 12px; margin-bottom: 8px;">Permessi:</h4>
                  <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${r.permissions.map(p => `<span class="badge badge-info">${p}</span>`).join('')}
                  </div>
                  <p style="margin-top: 12px; color: var(--text-light); font-size: 0.85rem;">
                    Utenti: ${this.getUsersByRole(r.id).length}
                  </p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  getRoleNameById(roleId) {
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  }
}

const userPermissionsManager = new UserPermissionsManager();

function switchPermissionsTab(tab) {
  document.getElementById('permissions-users-section').style.display = tab === 'users' ? 'block' : 'none';
  document.getElementById('permissions-roles-section').style.display = tab === 'roles' ? 'block' : 'none';
}

function showAddUserModal() {
  const roles = userPermissionsManager.roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Aggiungi Utente</h3>
          <button class="modal-close" onclick="closeUserModal()">✕</button>
        </div>
        <form onsubmit="saveNewUser(event);">
          <div class="form-group">
            <label>Nome *</label>
            <input type="text" id="user-name" required>
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="user-email" required>
          </div>
          <div class="form-group">
            <label>Ruolo *</label>
            <select id="user-role" required>
              ${roles}
            </select>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="user-active" checked>
              Attivo
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeUserModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Aggiungi Utente</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeUserModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveNewUser(event) {
  event.preventDefault();
  const user = {
    name: document.getElementById('user-name').value,
    email: document.getElementById('user-email').value,
    role: document.getElementById('user-role').value,
    status: document.getElementById('user-active').checked ? 'active' : 'inactive'
  };
  userPermissionsManager.addUser(user);
  closeUserModal();
  navigationManager.loadPageContent('permissions');
  Utils.showAlert('Utente aggiunto!', 'success');
}

function editUserModal(userId) {
  const user = userPermissionsManager.users.find(u => u.id === userId);
  if (!user) return;

  const roles = userPermissionsManager.roles.map(r => 
    `<option value="${r.id}" ${user.role === r.id ? 'selected' : ''}>${r.name}</option>`
  ).join('');

  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Modifica Utente</h3>
          <button class="modal-close" onclick="closeUserModal()">✕</button>
        </div>
        <form onsubmit="updateUserPermission(event, ${userId});">
          <div class="form-group">
            <label>Nome *</label>
            <input type="text" id="user-name" value="${user.name}" required>
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="user-email" value="${user.email}" required>
          </div>
          <div class="form-group">
            <label>Ruolo *</label>
            <select id="user-role" required>
              ${roles}
            </select>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="user-active" ${user.status === 'active' ? 'checked' : ''}>
              Attivo
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeUserModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Salva Cambiamenti</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function updateUserPermission(event, userId) {
  event.preventDefault();
  const updates = {
    name: document.getElementById('user-name').value,
    email: document.getElementById('user-email').value,
    role: document.getElementById('user-role').value,
    status: document.getElementById('user-active').checked ? 'active' : 'inactive'
  };
  userPermissionsManager.updateUser(userId, updates);
  closeUserModal();
  navigationManager.loadPageContent('permissions');
  Utils.showAlert('Utente aggiornato!', 'success');
}

function deleteUserPermission(userId) {
  if (confirm('Eliminare questo utente?')) {
    userPermissionsManager.deleteUser(userId);
    navigationManager.loadPageContent('permissions');
    Utils.showAlert('Utente eliminato!', 'success');
  }
}

function showAddRoleModal() {
  const permissions = userPermissionsManager.permissions.map(p => 
    `<label style="display: block; margin: 8px 0;"><input type="checkbox" class="role-permission" value="${p}"> ${p}</label>`
  ).join('');

  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Nuovo Ruolo</h3>
          <button class="modal-close" onclick="closeRoleModal()">✕</button>
        </div>
        <form onsubmit="saveNewRole(event);">
          <div class="form-group">
            <label>Nome Ruolo *</label>
            <input type="text" id="role-name" required>
          </div>
          <div class="form-group">
            <label>Descrizione</label>
            <textarea id="role-description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Permessi</label>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border); padding: 12px; border-radius: 8px;">
              ${permissions}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeRoleModal()">Annulla</button>
            <button type="submit" class="btn btn-primary">Crea Ruolo</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.classList.add('visible');
}

function closeRoleModal() {
  document.getElementById('modal-container').classList.remove('visible');
}

function saveNewRole(event) {
  event.preventDefault();
  const permissions = Array.from(document.querySelectorAll('.role-permission:checked')).map(cb => cb.value);
  const role = {
    name: document.getElementById('role-name').value,
    description: document.getElementById('role-description').value,
    permissions: permissions.length > 0 ? permissions : ['view:all']
  };
  userPermissionsManager.addRole(role);
  closeRoleModal();
  navigationManager.loadPageContent('permissions');
  Utils.showAlert('Ruolo creato!', 'success');
}

function editRoleModal(roleData) {
  const role = JSON.parse(JSON.stringify(roleData));
  closeRoleModal();
  Utils.showAlert('Modifica ruolo: ' + role.name, 'info');
}
