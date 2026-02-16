// team-manager.js
// Gestione locale squadra e atleti, persistenza e esportazione

let current_team;
try {
  const raw = localStorage.getItem('current_team');
  if (typeof Utils !== 'undefined' && typeof Utils.safeJSONParse === 'function') {
    current_team = Utils.safeJSONParse(raw, { clubName: '', season: '', category: '', players: [] });
  } else {
    current_team = raw ? JSON.parse(raw) : { clubName: '', season: '', category: '', players: [] };
  }
  if (!current_team || typeof current_team !== 'object') current_team = { clubName: '', season: '', category: '', players: [] };
} catch (e) {
  console.warn('team-manager init parse error', e);
  current_team = { clubName: '', season: '', category: '', players: [] };
}

function saveTeamToStorage() {
  localStorage.setItem('current_team', JSON.stringify(current_team));
}

function renderPlayersTable() {
  const tbody = document.querySelector('#playersTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  current_team.players.forEach(player => {
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

document.addEventListener('DOMContentLoaded', () => {
  // Popola i campi squadra se già salvati
  if (document.getElementById('clubName'))
    document.getElementById('clubName').value = current_team.clubName || '';
  if (document.getElementById('season'))
    document.getElementById('season').value = current_team.season || '';
  if (document.getElementById('category'))
    document.getElementById('category').value = current_team.category || '';
  renderPlayersTable();

  // Salva squadra
  if (document.getElementById('saveTeamBtn')) {
    document.getElementById('saveTeamBtn').onclick = function() {
      current_team.clubName = document.getElementById('clubName').value.trim();
      current_team.season = document.getElementById('season').value.trim();
      current_team.category = document.getElementById('category').value.trim();
      saveTeamToStorage();
      alert('Squadra salvata!');
    };
  }

  // Aggiungi atleta
  if (document.getElementById('addPlayerBtn')) {
    document.getElementById('addPlayerBtn').onclick = function() {
      const name = document.getElementById('playerName').value.trim();
      const role = document.getElementById('playerRole').value.trim();
      const number = document.getElementById('playerNumber').value.trim();
      const notes = document.getElementById('playerNotes').value.trim();
      if (!name || !role || !number) {
        alert('Compila tutti i campi obbligatori!');
        return;
      }
      current_team.players.push({ name, role, number, notes });
      saveTeamToStorage();
      renderPlayersTable();
      document.getElementById('playerName').value = '';
      document.getElementById('playerRole').value = '';
      document.getElementById('playerNumber').value = '';
      document.getElementById('playerNotes').value = '';
    };
  }

  // Esporta database squadra
  if (document.getElementById('exportTeamBtn')) {
    document.getElementById('exportTeamBtn').onclick = function() {
      const dataStr = JSON.stringify(current_team, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `squadra_${current_team.clubName || 'ldm'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }
});
