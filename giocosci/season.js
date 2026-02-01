// season.js - gestione classifica stagionale con persistenza in localStorage
'use strict';

const Season = (function(){
  const STORAGE_KEY = 'coppa_mondo_leaderboard_v1';
  let seasonLeaderboard = []; // array di {name, discipline, rawTime, penalty, finalTime, points, date}

  // Punti in stile FIS per le prime posizioni
  const pointsByPosition = [100, 80, 60, 50, 45, 40, 36, 32, 29, 26];

  // Carica dal localStorage
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        seasonLeaderboard = JSON.parse(raw);
        seasonLeaderboard.sort((a,b) => a.finalTime - b.finalTime);
        assignPoints();
      }
    } catch (err) {
      console.warn('Season.load: errore caricamento localStorage', err);
      seasonLeaderboard = [];
    }
    updateLeaderboardUI();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seasonLeaderboard));
    } catch (err) {
      console.warn('Season.save: errore salvataggio localStorage', err);
    }
  }

  function assignPoints() {
    seasonLeaderboard.forEach((r, idx) => { r.points = pointsByPosition[idx] || 0; });
  }

  function addResult(record) {
    // Normalizza record e aggiungi timestamp
    const rec = Object.assign({}, record, { date: new Date().toISOString() });

    seasonLeaderboard.push(rec);
    seasonLeaderboard.sort((a,b) => a.finalTime - b.finalTime);
    assignPoints();
    save();
    updateLeaderboardUI();
    // porta il menu in vista
    const menu = document.getElementById('menu');
    if (menu && typeof menu.scrollIntoView === 'function') menu.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // mostra last result
    const last = document.getElementById('lastResult');
    if (last) last.textContent = `${rec.name} • ${rec.discipline} • ${formatTime(rec.finalTime)}`;
  }

  function clearLeaderboard() {
    seasonLeaderboard = [];
    save();
    updateLeaderboardUI();
    const last = document.getElementById('lastResult'); if (last) last.textContent = '—';
  }

  function getLeaderboard() { return seasonLeaderboard.slice(); }

  function formatTime(t) {
    if (typeof t !== 'number' || !isFinite(t)) return '-';
    const totalCentis = Math.floor(t * 100);
    const centis = totalCentis % 100;
    const totalSecs = Math.floor(totalCentis / 100);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);
    return `${mins}:${secs.toString().padStart(2,'0')}.${centis.toString().padStart(2,'0')}`;
  }

  function updateLeaderboardUI() {
    const tbody = document.querySelector('#leaderboard tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    seasonLeaderboard.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx+1}</td><td>${escapeHtml(r.name)} <small style="color: #6b7280">(${escapeHtml(r.discipline)})</small></td><td>${r.points || 0}</td><td>${r.date ? (new Date(r.date)).toLocaleDateString() : '—'}</td>`;
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

  // Inizializza all'import
  load();

  return { addResult, getLeaderboard, clearLeaderboard, updateLeaderboardUI };
})();

// espone globalmente
window.Season = Season;
