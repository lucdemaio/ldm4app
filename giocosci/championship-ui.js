// championship-ui.js - Gestione interfaccia utente del campionato
'use strict';

(function() {
  // Elementi DOM
  const championshipBtn = document.getElementById('championshipBtn');
  const championshipPanel = document.getElementById('championshipPanel');
  const closeChampionshipBtn = document.getElementById('closeChampionship');
  
  // Sezioni del pannello
  const championshipStart = document.getElementById('championshipStart');
  const championshipCalendar = document.getElementById('championshipCalendar');
  const raceDetail = document.getElementById('raceDetail');
  
  // Controlli
  const playerNameInput = document.getElementById('playerName');
  const startChampionshipBtn = document.getElementById('startChampionshipBtn');
  const continueChampionshipBtn = document.getElementById('continueChampionshipBtn');
  const resetChampionshipBtn = document.getElementById('resetChampionshipBtn');
  
  // Calendario
  const racesList = document.getElementById('racesList');
  const progressFill = document.getElementById('progressFill');
  const progressRaces = document.getElementById('progressRaces');
  
  // Bottoni azioni
  const viewStandingsBtn = document.getElementById('viewStandingsBtn');
  const viewStatsBtn = document.getElementById('viewStatsBtn');
  const backToCalendar = document.getElementById('backToCalendar');
  const startRaceFromChampionship = document.getElementById('startRaceFromChampionship');
  
  // Modali
  const standingsModal = document.getElementById('standingsModal');
  const closeStandings = document.getElementById('closeStandings');
  const standingsContent = document.getElementById('standingsContent');
  
  const statsModal = document.getElementById('statsModal');
  const closeStats = document.getElementById('closeStats');
  const statsContent = document.getElementById('statsContent');
  
  const raceResultModal = document.getElementById('raceResultModal');
  const raceResultContent = document.getElementById('raceResultContent');
  const nextRaceBtn = document.getElementById('nextRaceBtn');
  const viewFullStandingsBtn = document.getElementById('viewFullStandingsBtn');
  
  // Variabili stato
  let selectedRaceId = null;
  let isChampionshipMode = false;
  
  // Inizializzazione
  function init() {
    console.log('ChampionshipUI: Inizializzazione...');
    console.log('Championship module disponibile:', !!window.Championship);
    console.log('championshipBtn trovato:', !!championshipBtn);
    console.log('championshipPanel trovato:', !!championshipPanel);
    
    if (!window.Championship) {
      console.error('Championship module non caricato');
      return;
    }
    
    // Event listeners
    if (championshipBtn) {
      championshipBtn.addEventListener('click', openChampionshipPanel);
    }
    
    if (closeChampionshipBtn) {
      closeChampionshipBtn.addEventListener('click', closeChampionshipPanel);
    }
    
    if (startChampionshipBtn) {
      startChampionshipBtn.addEventListener('click', handleStartChampionship);
    }
    
    if (continueChampionshipBtn) {
      continueChampionshipBtn.addEventListener('click', handleContinueChampionship);
    }
    
    if (resetChampionshipBtn) {
      resetChampionshipBtn.addEventListener('click', handleResetChampionship);
    }
    
    if (viewStandingsBtn) {
      viewStandingsBtn.addEventListener('click', () => showStandingsModal('general'));
    }
    
    if (viewStatsBtn) {
      viewStatsBtn.addEventListener('click', showStatsModal);
    }
    
    if (backToCalendar) {
      backToCalendar.addEventListener('click', showCalendar);
    }
    
    // Tasto indietro dal calendario alla schermata iniziale
    const backToChampionshipStart = document.getElementById('backToChampionshipStart');
    if (backToChampionshipStart) {
      backToChampionshipStart.addEventListener('click', showStart);
    }
    
    if (closeStandings) {
      closeStandings.addEventListener('click', () => standingsModal.hidden = true);
    }
    
    if (closeStats) {
      closeStats.addEventListener('click', () => statsModal.hidden = true);
    }
    
    if (nextRaceBtn) {
      nextRaceBtn.addEventListener('click', () => {
        raceResultModal.hidden = true;
        showCalendar();
      });
    }
    
    if (viewFullStandingsBtn) {
      viewFullStandingsBtn.addEventListener('click', () => {
        raceResultModal.hidden = true;
        showStandingsModal('general');
      });
    }
    
    // Tabs classifiche
    const tabBtns = document.querySelectorAll('.standings-tabs .tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        showStandingsModal(tab);
      });
    });
    
    // Chiudi modali cliccando fuori
    [standingsModal, statsModal, raceResultModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.hidden = true;
          }
        });
      }
    });
  }
  
  // Apri pannello campionato
  function openChampionshipPanel() {
    console.log('openChampionshipPanel chiamato');
    console.log('championshipPanel:', championshipPanel);
    console.log('Championship:', window.Championship);
    
    if (!championshipPanel) {
      console.error('championshipPanel non trovato!');
      return;
    }
    
    if (!window.Championship) {
      console.error('Championship module non disponibile!');
      return;
    }
    
    const data = Championship.getChampionshipData();
    
    if (data.isActive) {
      // Campionato in corso
      continueChampionshipBtn.hidden = false;
      resetChampionshipBtn.hidden = false;
      startChampionshipBtn.hidden = true;
      playerNameInput.value = data.playerName;
      playerNameInput.disabled = true;
    } else {
      // Nuovo campionato
      continueChampionshipBtn.hidden = true;
      resetChampionshipBtn.hidden = true;
      startChampionshipBtn.hidden = false;
      playerNameInput.disabled = false;
    }
    
    championshipPanel.hidden = false;
    championshipStart.style.display = 'block';
    championshipCalendar.style.display = 'none';
    raceDetail.style.display = 'none';
  }
  
  // Chiudi pannello
  function closeChampionshipPanel() {
    championshipPanel.hidden = true;
    isChampionshipMode = false;
  }
  
  // Mostra schermata iniziale campionato
  function showStart() {
    championshipStart.style.display = 'block';
    championshipCalendar.style.display = 'none';
    raceDetail.style.display = 'none';
  }
  
  // Inizia nuovo campionato
  function handleStartChampionship() {
    const playerName = playerNameInput.value.trim() || 'Sciatore Pro';
    Championship.startChampionship(playerName);
    isChampionshipMode = true;
    showCalendar();
  }
  
  // Continua campionato
  function handleContinueChampionship() {
    isChampionshipMode = true;
    showCalendar();
  }
  
  // Reset campionato
  function handleResetChampionship() {
    if (confirm('Sei sicuro di voler ricominciare il campionato? Tutti i progressi saranno persi.')) {
      Championship.resetChampionship();
      openChampionshipPanel();
    }
  }
  
  // Mostra calendario
  function showCalendar() {
    const data = Championship.getChampionshipData();
    const allRaces = Championship.getAllRaces();
    
    championshipStart.style.display = 'none';
    championshipCalendar.style.display = 'block';
    raceDetail.style.display = 'none';
    
    // Aggiorna progresso
    const progress = Championship.getProgress();
    progressFill.style.width = progress + '%';
    progressRaces.textContent = `${data.completedRaces}/${allRaces.length}`;
    
    // Renderizza lista gare
    racesList.innerHTML = '';
    allRaces.forEach((race, index) => {
      const isCompleted = data.raceResults.some(r => r.raceId === race.id);
      const isCurrent = index === data.currentRaceIndex;
      const isLocked = index > data.currentRaceIndex;
      
      const card = createRaceCard(race, isCompleted, isCurrent, isLocked);
      racesList.appendChild(card);
    });
  }
  
  // Crea card gara
  function createRaceCard(race, isCompleted, isCurrent, isLocked) {
    const card = document.createElement('div');
    card.className = 'race-card';
    
    if (isCompleted) card.classList.add('completed');
    if (isCurrent) card.classList.add('current');
    if (isLocked) card.classList.add('locked');
    
    let statusText = 'Bloccata';
    let statusClass = 'locked';
    if (isCompleted) {
      statusText = '✓ Completata';
      statusClass = 'completed';
    } else if (isCurrent) {
      statusText = '→ Prossima';
      statusClass = 'current';
    }
    
    const weatherIcons = {
      sunny: '☀️',
      cloudy: '☁️',
      snowing: '❄️',
      night: '🌙'
    };
    
    const disciplineNames = {
      slalom: 'Slalom',
      gigante: 'Gigante',
      discesa: 'Discesa'
    };
    
    card.innerHTML = `
      <div class="race-header">
        <span class="race-number">Tappa ${race.id}/10</span>
        <span class="race-status ${statusClass}">${statusText}</span>
      </div>
      <h3 class="race-title">${race.name}</h3>
      <div class="race-location">${race.location} • ${race.track}</div>
      <div class="race-meta">
        <span>${weatherIcons[race.weather] || '☀️'} ${race.weather}</span>
        <span class="discipline-badge ${race.discipline}">${disciplineNames[race.discipline]}</span>
        <span>📏 ${race.length}m</span>
        <span>🚩 ${race.gates} porte</span>
      </div>
    `;
    
    if (!isLocked) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => showRaceDetail(race.id));
    }
    
    return card;
  }
  
  // Mostra dettaglio gara
  function showRaceDetail(raceId) {
    const race = Championship.getRaceById(raceId);
    if (!race) return;
    
    selectedRaceId = raceId;
    
    championshipCalendar.style.display = 'none';
    raceDetail.style.display = 'block';
    
    const disciplineNames = {
      slalom: 'Slalom',
      gigante: 'Slalom Gigante',
      discesa: 'Discesa Libera'
    };
    
    const difficultyNames = {
      easy: 'Facile',
      normal: 'Normale',
      hard: 'Difficile'
    };
    
    const weatherNames = {
      sunny: '☀️ Soleggiato',
      cloudy: '☁️ Nuvoloso',
      snowing: '❄️ Nevicata',
      night: '🌙 Notturno'
    };
    
    const raceInfo = document.getElementById('raceInfo');
    raceInfo.innerHTML = `
      <div class="race-info-header">
        <h2 class="race-info-title">${race.name}</h2>
        <div class="race-info-location">${race.location}</div>
      </div>
      
      <div class="race-details-grid">
        <div class="detail-item">
          <div class="detail-label">Pista</div>
          <div class="detail-value">${race.track}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Disciplina</div>
          <div class="detail-value">${disciplineNames[race.discipline]}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Lunghezza</div>
          <div class="detail-value">${race.length}m</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Dislivello</div>
          <div class="detail-value">${race.elevation}m</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Porte</div>
          <div class="detail-value">${race.gates}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Difficoltà</div>
          <div class="detail-value">${difficultyNames[race.difficulty]}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Meteo</div>
          <div class="detail-value">${weatherNames[race.weather]}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Data</div>
          <div class="detail-value">${new Date(race.date).toLocaleDateString('it-IT', {day: 'numeric', month: 'short'})}</div>
        </div>
      </div>
      
      <p class="race-description">${race.description}</p>
    `;
    
    // Setup pulsante inizio gara
    startRaceFromChampionship.onclick = () => {
      startChampionshipRace(race);
    };
  }
  
  // Avvia gara del campionato
  function startChampionshipRace(race) {
    // Chiudi pannello campionato
    closeChampionshipPanel();
    
    // Imposta disciplina
    const disciplineBtns = document.querySelectorAll('.discipline-btn');
    disciplineBtns.forEach(btn => {
      btn.dataset.active = btn.dataset.discipline === race.discipline ? 'true' : 'false';
    });
    
    // Imposta difficoltà
    const difficultySelect = document.getElementById('difficulty');
    if (difficultySelect) {
      difficultySelect.value = race.difficulty;
    }
    
    // Salva info gara corrente per quando finisce
    window._currentChampionshipRace = race;
    
    // Avvia gara (simula click su bottone avvia)
    const startRaceBtn = document.getElementById('startRace');
    if (startRaceBtn) {
      // Trigger evento personalizzato che il game engine può ascoltare
      const event = new CustomEvent('championshipRaceStart', {
        detail: { race, isChampionship: true }
      });
      document.dispatchEvent(event);
      
      setTimeout(() => startRaceBtn.click(), 100);
    }
  }
  
  // Mostra risultato gara (chiamato dal game engine)
  function showRaceResult(raceId, playerTime, playerPenalty = 0) {
    const result = Championship.recordRaceResult(raceId, playerTime, playerPenalty);
    if (!result) return;
    
    const isPodium = result.position <= 3;
    const isWin = result.position === 1;
    
    // Renderizza risultato
    let positionHTML = `<div class="result-position ${isPodium ? 'podium' : ''}">#${result.position}</div>`;
    
    if (isWin) {
      positionHTML = `<div class="result-position podium">🥇 1° POSTO!</div>`;
    } else if (result.position === 2) {
      positionHTML = `<div class="result-position podium">🥈 2° POSTO</div>`;
    } else if (result.position === 3) {
      positionHTML = `<div class="result-position podium">🥉 3° POSTO</div>`;
    }
    
    raceResultContent.innerHTML = `
      <div class="result-header">
        ${positionHTML}
        <div class="result-time">${Championship.formatTime(result.time)}</div>
        <div class="result-points">Punti: <strong>+${result.points}</strong></div>
      </div>
      
      <div class="top-results">
        <h4>Top 10 Risultati</h4>
        <div class="result-list">
          ${result.aiResults.map((ai, idx) => {
            const pos = idx + 1;
            let posEmoji = '';
            if (pos === 1) posEmoji = '🥇';
            else if (pos === 2) posEmoji = '🥈';
            else if (pos === 3) posEmoji = '🥉';
            
            return `
              <div class="result-item">
                <span style="width: 30px; font-weight: 700;">${posEmoji || pos + '.'}</span>
                <span style="flex: 1;">${ai.name} ${ai.country}</span>
                <span style="font-weight: 600;">${ai.formattedTime}</span>
                <span style="color: var(--muted); font-size: 13px;">${ai.points}pt</span>
              </div>
            `;
          }).join('')}
          ${result.position > 10 ? `
            <div class="result-item player">
              <span style="width: 30px; font-weight: 700;">${result.position}.</span>
              <span style="flex: 1;">Tu ⭐</span>
              <span style="font-weight: 600;">${Championship.formatTime(result.time)}</span>
              <span style="color: var(--muted); font-size: 13px;">${result.points}pt</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    raceResultModal.hidden = false;
    
    // Aggiorna progresso
    Championship.save();
  }
  
  // Mostra modal classifiche
  function showStandingsModal(type = 'general') {
    const standings = Championship.getGeneralStandings();
    
    let title = 'Classifica Generale';
    let data = standings;
    
    if (type === 'slalom') {
      title = 'Classifica Slalom';
      data = Championship.getChampionshipData().slalomStandings;
    } else if (type === 'gigante') {
      title = 'Classifica Gigante';
      data = Championship.getChampionshipData().giganteStandings;
    } else if (type === 'discesa') {
      title = 'Classifica Discesa';
      data = Championship.getChampionshipData().discesaStandings;
    }
    
    standingsContent.innerHTML = `
      <table class="standings-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Atleta</th>
            ${type === 'general' ? '<th>Gare</th><th>Vittorie</th><th>Podi</th>' : ''}
            <th>Punti</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((skier, idx) => {
            const pos = idx + 1;
            let badge = `<span class="position-badge other">${pos}</span>`;
            if (pos === 1) badge = `<span class="position-badge gold">1</span>`;
            else if (pos === 2) badge = `<span class="position-badge silver">2</span>`;
            else if (pos === 3) badge = `<span class="position-badge bronze">3</span>`;
            
            const isPlayer = skier.isPlayer || skier.name.includes('⭐');
            
            return `
              <tr class="${isPlayer ? 'player-row' : ''}">
                <td>${badge}</td>
                <td>${skier.name} ${skier.country || ''}</td>
                ${type === 'general' ? `
                  <td>${skier.races || 0}</td>
                  <td>${skier.wins || 0}</td>
                  <td>${skier.podiums || 0}</td>
                ` : ''}
                <td><strong>${skier.points}</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    standingsModal.hidden = false;
  }
  
  // Mostra modal statistiche
  function showStatsModal() {
    const stats = Championship.getPlayerStats();
    
    statsContent.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Punti Totali</div>
          <div class="stat-value highlight">${stats.totalPoints}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Gare Completate</div>
          <div class="stat-value">${stats.completedRaces}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Vittorie</div>
          <div class="stat-value">${stats.wins}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Podi</div>
          <div class="stat-value">${stats.podiums}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Top 10</div>
          <div class="stat-value">${stats.topTen}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Media Posizione</div>
          <div class="stat-value">${stats.averagePosition}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Miglior Risultato</div>
          <div class="stat-value highlight">#${stats.bestResult}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Gare Rimanenti</div>
          <div class="stat-value">${stats.remainingRaces}</div>
        </div>
      </div>
      
      <div class="specialty-stats">
        <h4 style="margin-bottom: 12px; color: #041027;">Punti per Specialità</h4>
        <div class="specialty-card">
          <span class="specialty-name">🔵 Slalom</span>
          <span class="specialty-points">${stats.slalomPoints}</span>
        </div>
        <div class="specialty-card">
          <span class="specialty-name">🟢 Gigante</span>
          <span class="specialty-points">${stats.gigantePoints}</span>
        </div>
        <div class="specialty-card">
          <span class="specialty-name">🔴 Discesa</span>
          <span class="specialty-points">${stats.discesaPoints}</span>
        </div>
      </div>
    `;
    
    statsModal.hidden = false;
  }
  
  // Esponi funzioni globalmente
  window.ChampionshipUI = {
    init,
    showRaceResult,
    openChampionshipPanel,
    closeChampionshipPanel,
    isChampionshipMode: () => isChampionshipMode
  };
  
  // Auto-init quando DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
