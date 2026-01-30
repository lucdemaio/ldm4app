// auth.js - basic client-side authentication and role management (MVP)
const AuthModule = (function(){
    const defaultUsers = [
        {username:'admin', password:'admin', role:'admin', name:'Amministratore'},
        {username:'coord', password:'coord', role:'coordinator', name:'Coordinatore'}
    ];

    function init(){
        // seed users
        if (!Storage.load('users')) Storage.save('users', defaultUsers);
        const btn = document.getElementById('login-btn');
        const roleSpan = document.getElementById('current-role');
        if (btn) btn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (user) logout(); else showLogin();
        });
        applyRoleVisibility();
        updateRoleDisplay();
    }

    function showLogin(){
        const body = document.getElementById('modal-body'); document.getElementById('modal-title').textContent='Login';
        body.innerHTML = `
            <input id="username" placeholder="Username" style="width:100%;margin-bottom:8px;"/>
            <input id="password" type="password" placeholder="Password" style="width:100%;margin-bottom:8px;"/>
            <div style="display:flex;justify-content:space-between;align-items:center;"><small>Utente demo: admin/admin</small><div><button id="login-submit" class="btn btn-primary">Accedi</button> <button id="register-btn" class="btn btn-secondary">Registra</button></div></div>
        `;
        document.getElementById('modal').classList.add('open');
        document.querySelector('.modal-close').onclick = () => document.getElementById('modal').classList.remove('open');
        document.getElementById('login-submit').onclick = () => {
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            const users = Storage.load('users') || [];
            const found = users.find(x => x.username === u && x.password === p);
            if (found) {
                Storage.save('currentUser', found);
                document.getElementById('modal').classList.remove('open');
                showToast('Accesso effettuato', 'success');
                applyRoleVisibility();
                updateRoleDisplay();
            } else showToast('Credenziali non valide', 'error');
        };
        document.getElementById('register-btn').onclick = () => {
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            if (!u || !p) { showToast('Inserisci username e password', 'error'); return; }
            const users = Storage.load('users') || [];
            if (users.find(x=>x.username===u)) { showToast('Username già esistente', 'error'); return; }
            users.push({username:u, password:p, role:'volunteer', name:u}); Storage.save('users', users); showToast('Utente registrato', 'success');
        };
    }

    function logout(){ Storage.clear('currentUser'); showToast('Disconnesso'); applyRoleVisibility(); updateRoleDisplay(); }

    function getCurrentUser(){ return Storage.load('currentUser'); }

    function updateRoleDisplay(){ const r = getCurrentUser(); const el = document.getElementById('current-role'); const btn = document.getElementById('login-btn'); if (el) el.textContent = r ? `${r.name} (${r.role})` : ''; if (btn) btn.textContent = r ? 'Logout' : 'Login'; }

    function applyRoleVisibility(){ const r = getCurrentUser(); const role = r ? r.role : 'anonymous';
        // show/hide elements with data-role attribute
        document.querySelectorAll('[data-role]').forEach(el => {
            const allowed = el.getAttribute('data-role').split(',').map(s=>s.trim());
            if (allowed.includes(role) || (role==='admin' && allowed.includes('admin'))) el.style.display = ''; else el.style.display = 'none';
        });
    }

    return {init, showLogin, logout, getCurrentUser, applyRoleVisibility};
})();

document.addEventListener('DOMContentLoaded', AuthModule.init);