/**
 * TACTICS.JS
 * Modulo Lavagna Tattica - Schema Formazione Campo
 * Gestisce posizionamento giocatori, moduli tattici, export PDF/PNG
 * Developed by ldm4app
 */

const TacticsModule = (() => {
  // Moduli tattici predefiniti (posizioni in percentuale del campo)
  const FORMATIONS = {
    '4-4-2': {
      name: '4-4-2',
      positions: [
        { role: 'GK', x: 50, y: 90 },  // Portiere
        { role: 'LB', x: 20, y: 75 },  // Terzino sx
        { role: 'CB', x: 37, y: 80 },  // Difensore centrale sx
        { role: 'CB', x: 63, y: 80 },  // Difensore centrale dx
        { role: 'RB', x: 80, y: 75 },  // Terzino dx
        { role: 'LM', x: 20, y: 50 },  // Centrocampista sx
        { role: 'CM', x: 40, y: 55 },  // Centrocampista centrale sx
        { role: 'CM', x: 60, y: 55 },  // Centrocampista centrale dx
        { role: 'RM', x: 80, y: 50 },  // Centrocampista dx
        { role: 'ST', x: 37, y: 20 },  // Attaccante sx
        { role: 'ST', x: 63, y: 20 }   // Attaccante dx
      ]
    },
    '4-3-3': {
      name: '4-3-3',
      positions: [
        { role: 'GK', x: 50, y: 90 },
        { role: 'LB', x: 20, y: 75 },
        { role: 'CB', x: 37, y: 80 },
        { role: 'CB', x: 63, y: 80 },
        { role: 'RB', x: 80, y: 75 },
        { role: 'CM', x: 30, y: 55 },
        { role: 'CM', x: 50, y: 60 },
        { role: 'CM', x: 70, y: 55 },
        { role: 'LW', x: 20, y: 25 },
        { role: 'ST', x: 50, y: 15 },
        { role: 'RW', x: 80, y: 25 }
      ]
    },
    '3-5-2': {
      name: '3-5-2',
      positions: [
        { role: 'GK', x: 50, y: 90 },
        { role: 'CB', x: 25, y: 80 },
        { role: 'CB', x: 50, y: 82 },
        { role: 'CB', x: 75, y: 80 },
        { role: 'LM', x: 15, y: 55 },
        { role: 'CM', x: 35, y: 60 },
        { role: 'CM', x: 50, y: 55 },
        { role: 'CM', x: 65, y: 60 },
        { role: 'RM', x: 85, y: 55 },
        { role: 'ST', x: 37, y: 20 },
        { role: 'ST', x: 63, y: 20 }
      ]
    },
    '4-2-3-1': {
      name: '4-2-3-1',
      positions: [
        { role: 'GK', x: 50, y: 90 },
        { role: 'LB', x: 20, y: 75 },
        { role: 'CB', x: 37, y: 80 },
        { role: 'CB', x: 63, y: 80 },
        { role: 'RB', x: 80, y: 75 },
        { role: 'CDM', x: 37, y: 60 },
        { role: 'CDM', x: 63, y: 60 },
        { role: 'LW', x: 20, y: 35 },
        { role: 'CAM', x: 50, y: 40 },
        { role: 'RW', x: 80, y: 35 },
        { role: 'ST', x: 50, y: 15 }
      ]
    },
    '3-4-3': {
      name: '3-4-3',
      positions: [
        { role: 'GK', x: 50, y: 90 },
        { role: 'CB', x: 25, y: 80 },
        { role: 'CB', x: 50, y: 82 },
        { role: 'CB', x: 75, y: 80 },
        { role: 'LM', x: 20, y: 55 },
        { role: 'CM', x: 40, y: 60 },
        { role: 'CM', x: 60, y: 60 },
        { role: 'RM', x: 80, y: 55 },
        { role: 'LW', x: 25, y: 25 },
        { role: 'ST', x: 50, y: 15 },
        { role: 'RW', x: 75, y: 25 }
      ]
    }
  };

  let currentFormation = null;
  let currentTeam = null;
  let currentEvent = null;
  let playerPositions = {}; // { athleteId: {x, y} }

  /**
   * Inizializzazione modulo
   */
  function init() {
    console.log('TacticsModule initialized');
  }

  /**
   * Mostra lavagna tattica
   */
  function showTacticalBoard(eventIdOrTeamId, maybeTeamId) {
    // Support both signatures: (eventId, teamId) or (teamId)
    let eventId = null;
    let teamId = null;
    if (typeof maybeTeamId === 'undefined') {
      teamId = eventIdOrTeamId;
      eventId = null;
    } else {
      eventId = eventIdOrTeamId;
      teamId = maybeTeamId;
    }

    // Resolve team
    currentTeam = appState.getTeam(teamId);
    if (!currentTeam) {
      UI.showToast('Squadra non trovata', 'error');
      return;
    }

    // Resolve event: if eventId provided, try to fetch; otherwise, try to get current formation from MatchDay editor
    if (eventId) {
      currentEvent = appState.getCalendarEvents().find(e => e.id === eventId);
      if (!currentEvent) {
        // fallback to an empty event context
        currentEvent = { id: null, formation: { starters: [], reserves: [] } };
      }
    } else {
      // Try to obtain formation from MatchDay editor if available
      if (typeof MatchDayModule !== 'undefined' && typeof MatchDayModule.getCurrentFormation === 'function') {
        const mf = MatchDayModule.getCurrentFormation();
        if (mf && mf.team && mf.team.id === teamId) {
          currentEvent = { id: `matchday-temp-${teamId}`, formation: mf.formation };
        } else {
          currentEvent = { id: null, formation: { starters: [], reserves: [] } };
        }
      } else {
        currentEvent = { id: null, formation: { starters: [], reserves: [] } };
      }
    }

    // Carica formazione/tattica salvata se esiste
    if (currentEvent.tactics) {
      playerPositions = currentEvent.tactics.playerPositions || {};
      currentFormation = currentEvent.tactics.formation || '4-4-2';
    } else {
      playerPositions = {};
      currentFormation = currentEvent.formation && currentEvent.formation.formation ? currentEvent.formation.formation : (currentEvent.formation && currentEvent.formation.starters && currentEvent.formation.starters.length ? '4-4-2' : '4-4-2');
    }

    const content = renderTacticalBoard();
    UI.showModal('⚽ Lavagna Tattica', content, 'fullscreen');

    // Setup dopo render
    setTimeout(() => {
      setupDragAndDrop();
      syncWithMatchday();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 100);
  }

  /**
   * Renderizza la lavagna tattica completa
   */
  function renderTacticalBoard() {
    const formationOptions = Object.keys(FORMATIONS).map(key => 
      `<option value="${key}" ${currentFormation === key ? 'selected' : ''}>${FORMATIONS[key].name}</option>`
    ).join('');

    return `
      <div class="tactical-board-container">
        <!-- Toolbar -->
        <div class="tactics-toolbar">
          <div class="toolbar-section">
            <label class="toolbar-label">
              <i data-lucide="shield"></i>
              Squadra: <strong>${currentTeam.name}</strong>
            </label>
            ${currentTeam.primaryColor ? `
              <div class="team-color-preview" style="background-color: ${currentTeam.primaryColor}"></div>
            ` : ''}
          </div>

          <div class="toolbar-section">
            <label class="toolbar-label">
              <i data-lucide="grid-3x3"></i>
              Modulo:
            </label>
            <select id="formation-selector" class="formation-select" onchange="TacticsModule.applyFormation(this.value)">
              ${formationOptions}
            </select>
          </div>

          <div class="toolbar-section">
            <button class="btn btn-secondary" onclick="TacticsModule.resetPositions()">
              <i data-lucide="rotate-ccw"></i> Reset
            </button>
            <button class="btn btn-secondary" onclick="TacticsModule.exportToPNG()">
              <i data-lucide="image"></i> PNG
            </button>
            <button class="btn btn-primary" onclick="TacticsModule.saveTactics()">
              <i data-lucide="save"></i> Salva
            </button>
          </div>
        </div>

        <!-- Campo da calcio e panchina -->
        <div class="tactics-main-area">
          <!-- Campo -->
          <div class="pitch-container" id="pitch-container">
            ${renderPitch()}
            <div id="players-on-pitch" class="players-layer"></div>
          </div>

          <!-- Panchina -->
          <div class="bench-area">
            <h4><i data-lucide="users"></i> Panchina</h4>
            <div id="bench-players" class="bench-players"></div>
          </div>
        </div>
      </div>

      <style>
        .tactical-board-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 1rem;
        }

        .tactics-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          flex-wrap: wrap;
          gap: 1rem;
          position: relative;
          z-index: 100;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toolbar-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: var(--font-size-sm);
        }

        .team-color-preview {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid var(--color-border);
        }

        .formation-select {
          padding: 0.5rem 1rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background-color: var(--color-bg-primary);
          color: var(--color-text-primary);
          font-weight: 600;
        }

        .tactics-main-area {
          display: flex;
          gap: 1rem;
          flex: 1;
          min-height: 0;
        }

        .pitch-container {
          position: relative;
          flex: 1;
          min-width: 0;
          background: linear-gradient(180deg, #2d7a3e 0%, #1e5a2e 100%);
          border-radius: var(--radius-md);
          overflow: hidden;
          z-index: 1;
        }

        .bench-area {
          width: 200px;
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          padding: 1rem;
          overflow-y: auto;
        }

        .bench-area h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 1rem 0;
          font-size: var(--font-size-base);
        }

        .bench-players {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .tactics-main-area {
            flex-direction: column;
          }
          .bench-area {
            width: 100%;
            max-height: 200px;
          }
        }
      </style>
    `;
  }

  /**
   * Renderizza il campo da calcio con linee regolamentari
   */
  function renderPitch() {
    return `
      <svg class="pitch-svg" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid meet">
        <!-- Linee del campo -->
        <rect x="0" y="0" width="600" height="900" fill="none" stroke="white" stroke-width="3"/>
        
        <!-- Metà campo -->
        <line x1="0" y1="450" x2="600" y2="450" stroke="white" stroke-width="2"/>
        <circle cx="300" cy="450" r="60" fill="none" stroke="white" stroke-width="2"/>
        <circle cx="300" cy="450" r="3" fill="white"/>
        
        <!-- Area grande superiore (attacco) -->
        <rect x="120" y="0" width="360" height="135" fill="none" stroke="white" stroke-width="2"/>
        
        <!-- Area piccola superiore -->
        <rect x="210" y="0" width="180" height="50" fill="none" stroke="white" stroke-width="2"/>
        
        <!-- Area grande inferiore (difesa) -->
        <rect x="120" y="765" width="360" height="135" fill="none" stroke="white" stroke-width="2"/>
        
        <!-- Area piccola inferiore -->
        <rect x="210" y="850" width="180" height="50" fill="none" stroke="white" stroke-width="2"/>
        
        <!-- Dischetto rigore superiore -->
        <circle cx="300" cy="90" r="3" fill="white"/>
        
        <!-- Dischetto rigore inferiore -->
        <circle cx="300" cy="810" r="3" fill="white"/>
        
        <!-- Arco area rigore superiore -->
        <path d="M 300 90 m -60 45 a 60 60 0 0 1 120 0" fill="none" stroke="white" stroke-width="2"/>
        
        <!-- Arco area rigore inferiore -->
        <path d="M 300 810 m -60 -45 a 60 60 0 0 0 120 0" fill="none" stroke="white" stroke-width="2"/>
      </svg>
    `;
  }

  /**
   * Sincronizza con distinta di gara
   */
  function syncWithMatchday() {
    if (!currentEvent.formation) {
      UI.showToast('Nessuna distinta disponibile. Crea prima la formazione.', 'warning');
      return;
    }

    const starters = currentEvent.formation.starters || [];
    const reserves = currentEvent.formation.reserves || [];
    const captain = currentEvent.formation.captain;
    const goalkeeper = currentEvent.formation.goalkeeper;

    // Posiziona titolari sul campo
    const playersContainer = document.getElementById('players-on-pitch');
    const benchContainer = document.getElementById('bench-players');

    if (!playersContainer || !benchContainer) return;

    playersContainer.innerHTML = '';
    benchContainer.innerHTML = '';

    // Titolari sul campo
    starters.forEach((starter, index) => {
      const athlete = appState.getAthlete(starter.athleteId);
      if (!athlete) return;

      const formation = FORMATIONS[currentFormation];
      const position = formation.positions[index] || { x: 50, y: 50 };

      // Usa posizione salvata se esiste
      const savedPos = playerPositions[starter.athleteId];
      const x = savedPos ? savedPos.x : position.x;
      const y = savedPos ? savedPos.y : position.y;

      const playerEl = createPlayerElement(athlete, starter, captain, goalkeeper, x, y);
      playersContainer.appendChild(playerEl);
    });

    // Riserve in panchina
    reserves.forEach(athleteId => {
      const athlete = appState.getAthlete(athleteId);
      if (!athlete) return;

      const benchPlayer = createBenchPlayerElement(athlete);
      benchContainer.appendChild(benchPlayer);
    });
  }

  /**
   * Crea elemento giocatore sul campo
   */
  function createPlayerElement(athlete, starter, captain, goalkeeper, x, y) {
    const isCaptain = captain === starter.athleteId;
    const isGK = goalkeeper === starter.athleteId;
    const teamColor = currentTeam.primaryColor || '#1e40af';

    const div = document.createElement('div');
    div.className = 'pitch-player';
    div.dataset.athleteId = starter.athleteId;
    div.style.left = `${x}%`;
    div.style.top = `${y}%`;
    div.draggable = true;

    div.innerHTML = `
      <div class="player-marker" style="background-color: ${teamColor}">
        <div class="player-number">${starter.shirtNumber}</div>
        ${isCaptain ? '<div class="captain-star">⭐</div>' : ''}
        ${isGK ? '<div class="gk-badge">P</div>' : ''}
      </div>
      <div class="player-name">${athlete.lastName}</div>
    `;

    return div;
  }

  /**
   * Crea elemento giocatore in panchina
   */
  function createBenchPlayerElement(athlete) {
    const div = document.createElement('div');
    div.className = 'bench-player-item';
    
    div.innerHTML = `
      <div class="bench-player-number">${athlete.shirtNumber || '-'}</div>
      <div class="bench-player-info">
        <strong>${athlete.lastName}</strong>
        <span>${athlete.firstName}</span>
      </div>
    `;

    return div;
  }

  /**
   * Setup Drag & Drop
   */
  function setupDragAndDrop() {
    const players = document.querySelectorAll('.pitch-player');
    const pitchContainer = document.getElementById('pitch-container');

    if (!pitchContainer) return;

    let draggedPlayer = null;

    players.forEach(player => {
      player.addEventListener('dragstart', (e) => {
        draggedPlayer = player;
        player.style.opacity = '0.5';
      });

      player.addEventListener('dragend', (e) => {
        player.style.opacity = '1';
      });

      // Touch support
      player.addEventListener('touchstart', handleTouchStart, { passive: false });
      player.addEventListener('touchmove', handleTouchMove, { passive: false });
      player.addEventListener('touchend', handleTouchEnd, { passive: false });
    });

    pitchContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    pitchContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedPlayer) return;

      const rect = pitchContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Limita posizione al campo
      const clampedX = Math.max(5, Math.min(95, x));
      const clampedY = Math.max(5, Math.min(95, y));

      draggedPlayer.style.left = `${clampedX}%`;
      draggedPlayer.style.top = `${clampedY}%`;

      // Salva posizione
      const athleteId = draggedPlayer.dataset.athleteId;
      playerPositions[athleteId] = { x: clampedX, y: clampedY };
    });

    // Touch handlers
    let touchStartX, touchStartY;

    function handleTouchStart(e) {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      this.style.opacity = '0.5';
    }

    function handleTouchMove(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = pitchContainer.getBoundingClientRect();
      
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(5, Math.min(95, x));
      const clampedY = Math.max(5, Math.min(95, y));

      this.style.left = `${clampedX}%`;
      this.style.top = `${clampedY}%`;
    }

    function handleTouchEnd(e) {
      this.style.opacity = '1';
      const athleteId = this.dataset.athleteId;
      const x = parseFloat(this.style.left);
      const y = parseFloat(this.style.top);
      playerPositions[athleteId] = { x, y };
    }
  }

  /**
   * Applica modulo tattico
   */
  function applyFormation(formationType) {
    currentFormation = formationType;
    const formation = FORMATIONS[formationType];

    if (!formation || !currentEvent.formation) return;

    const starters = currentEvent.formation.starters || [];
    const players = document.querySelectorAll('.pitch-player');

    players.forEach((player, index) => {
      const position = formation.positions[index];
      if (position) {
        player.style.left = `${position.x}%`;
        player.style.top = `${position.y}%`;

        const athleteId = player.dataset.athleteId;
        playerPositions[athleteId] = { x: position.x, y: position.y };
      }
    });

    UI.showToast(`Modulo ${formationType} applicato`, 'success');
  }

  /**
   * Reset posizioni al modulo corrente
   */
  function resetPositions() {
    playerPositions = {};
    applyFormation(currentFormation);
  }

  /**
   * Salva tattica nell'evento
   */
  function saveTactics() {
    if (!currentEvent) return;

    currentEvent.tactics = {
      formation: currentFormation,
      playerPositions: { ...playerPositions },
      savedAt: new Date().toISOString()
    };

    // Aggiorna evento nello stato
    const events = appState.getCalendarEvents();
    const eventIndex = events.findIndex(e => e.id === currentEvent.id);
    if (eventIndex !== -1) {
      events[eventIndex] = currentEvent;
      appState.state.calendar = events;
      appState.saveState();
    }

    UI.showToast('Schema tattico salvato!', 'success');
    UI.closeModal();
  }

  /**
   * Export schema tattico come PNG
   */
  async function exportToPNG() {
    const container = document.getElementById('pitch-container');
    if (!container) return;

    try {
      // Usa html2canvas se disponibile
      if (typeof html2canvas !== 'undefined') {
        // Mark UI elements to be ignored by html2canvas (buttons, icons, debug info)
        const restoreIgnore = (typeof Utils !== 'undefined' && typeof Utils.addHtml2canvasIgnore === 'function')
          ? Utils.addHtml2canvasIgnore(container)
          : () => {};

        const canvas = await html2canvas(container, {
          backgroundColor: '#2d7a3e',
          scale: 2
        });

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `schema-tattico-${currentTeam.name}-${new Date().toISOString().split('T')[0]}.png`;
          link.click();
          URL.revokeObjectURL(url);
        });

        UI.showToast('Schema esportato come PNG', 'success');
        // restore attributes
        try { restoreIgnore(); } catch (e) { /* ignore */ }
      } else {
        UI.showToast('Libreria html2canvas non disponibile', 'warning');
      }
    } catch (error) {
      console.error('Errore export PNG:', error);
      UI.showToast('Errore durante export PNG', 'error');
    }
  }

  /**
   * Export schema tattico per PDF (usato da reports.js)
   */
  function exportTacticsToPDF(doc, event, team, yPosition) {
    if (!event.tactics || !event.formation) return yPosition;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pitchWidth = 80;
    const pitchHeight = 120;
    const pitchX = (pageWidth - pitchWidth) / 2;
    const pitchY = yPosition;

    // Sfondo campo
    doc.setFillColor(45, 122, 62);
    doc.rect(pitchX, pitchY, pitchWidth, pitchHeight, 'F');

    // Linee campo
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.rect(pitchX, pitchY, pitchWidth, pitchHeight);
    doc.line(pitchX, pitchY + pitchHeight/2, pitchX + pitchWidth, pitchY + pitchHeight/2);

    // Giocatori
    const starters = event.formation.starters || [];
    const positions = event.tactics.playerPositions || {};
    const formation = FORMATIONS[event.tactics.formation] || FORMATIONS['4-4-2'];

    starters.forEach((starter, index) => {
      const athlete = appState.getAthlete(starter.athleteId);
      if (!athlete) return;

      const savedPos = positions[starter.athleteId];
      const formationPos = formation.positions[index] || { x: 50, y: 50 };
      const pos = savedPos || formationPos;

      const playerX = pitchX + (pos.x / 100) * pitchWidth;
      const playerY = pitchY + (pos.y / 100) * pitchHeight;

      // Cerchio giocatore
      doc.setFillColor(30, 64, 175);
      doc.circle(playerX, playerY, 3, 'F');

      // Numero maglia
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(starter.shirtNumber.toString(), playerX, playerY + 1, { align: 'center' });

      // Cognome sotto
      doc.setFontSize(6);
      doc.text(athlete.lastName.toUpperCase(), playerX, playerY + 5, { align: 'center' });

      // Stella capitano
      if (event.formation.captain === starter.athleteId) {
        doc.text('⭐', playerX + 3, playerY - 2);
      }
    });

    return pitchY + pitchHeight + 10;
  }

  // Esposizione pubblica
  return {
    init,
    showTacticalBoard,
    applyFormation,
    resetPositions,
    saveTactics,
    exportToPNG,
    exportTacticsToPDF
  };
})();

// Esposizione globale
window.TacticsModule = TacticsModule;
