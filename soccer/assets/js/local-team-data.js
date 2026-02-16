// Cleaned local team data manager

// Notes, events, settings, collaborators, receipts (simple wrappers)
const note = JSON.parse(localStorage.getItem('note') || '[]');
const eventi = JSON.parse(localStorage.getItem('eventi') || '[]');
const impostazioni = JSON.parse(localStorage.getItem('impostazioni') || '{}');
const collaboratori = JSON.parse(localStorage.getItem('collaboratori') || '[]');
const ricevute = JSON.parse(localStorage.getItem('ricevute') || '[]');

const LOCAL_TEAM_KEY = 'local_team_data';

function showToast(message = 'Dati salvati correttamente', type = 'success') {
  let toast = document.getElementById('save-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'save-toast';
    toast.className = 'save-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span class="toast-icon">✓</span> ${message}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// Team & players management
let squadra = JSON.parse(localStorage.getItem('squadra') || '{}');
let atleti = JSON.parse(localStorage.getItem('atleti') || '[]');

function aggiornaCampiSquadra() {
  const club = document.getElementById('clubName');
  const season = document.getElementById('season');
  const category = document.getElementById('category');
  if (club) club.value = squadra.clubName || '';
  if (season) season.value = squadra.season || '';
  if (category) category.value = squadra.category || '';
}

function aggiornaTabella() {
  const tbody = document.querySelector('#playersTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  atleti.forEach(player => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${player.name}</td>
      <td>${player.role}</td>
      <td>${player.number}</td>
      <td>${player.notes || ''}</td>
    `;
    tbody.appendChild(tr);
  });
}

function salvaSquadra() {
  const club = document.getElementById('clubName');
  const season = document.getElementById('season');
  const category = document.getElementById('category');
  squadra.clubName = club ? club.value.trim() : (squadra.clubName || '');
  squadra.season = season ? season.value.trim() : (squadra.season || '');
  squadra.category = category ? category.value.trim() : (squadra.category || '');
  localStorage.setItem('squadra', JSON.stringify(squadra));
  showToast();
}

function salvaAtleti() {
  localStorage.setItem('atleti', JSON.stringify(atleti));
  showToast();
}

function initLocalTeamManager() {
  // add player
  const addBtn = document.getElementById('addPlayerBtn');
  if (addBtn) addBtn.addEventListener('click', () => {
    const nameEl = document.getElementById('playerName');
    const roleEl = document.getElementById('playerRole');
    const numberEl = document.getElementById('playerNumber');
    const notesEl = document.getElementById('playerNotes');
    const name = nameEl ? nameEl.value.trim() : '';
    const role = roleEl ? roleEl.value.trim() : '';
    const number = numberEl ? numberEl.value.trim() : '';
    const notes = notesEl ? notesEl.value.trim() : '';
    if (!name || !role || !number) return;
    atleti.push({ name, role, number, notes });
    salvaAtleti();
    aggiornaTabella();
    if (nameEl) nameEl.value = '';
    if (roleEl) roleEl.value = '';
    if (numberEl) numberEl.value = '';
    if (notesEl) notesEl.value = '';
  });

  // save team fields
  ['clubName','season','category'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', salvaSquadra);
  });
  const saveTeamBtn = document.getElementById('saveTeamBtn');
  if (saveTeamBtn) saveTeamBtn.addEventListener('click', salvaSquadra);

  // initial render
  aggiornaCampiSquadra();
  aggiornaTabella();
}

// Auto init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLocalTeamManager);
} else {
  initLocalTeamManager();
}

