/**
 * MATCHDAY.JS
 * Generatore Distinta di Gara
 * Crea formazioni e distinte PDF per le partite
 * Developed by ldm4app
 */

const MatchDayModule = (() => {
  let selectedTeam = null;
  let formation = {
    starters: [],    // Array di {athleteId, shirtNumber, position}
    reserves: [],    // Array di athleteId
    captain: null,   // athleteId
    goalkeeper: null // athleteId
  };

  /**
   * Inizializzazione
   */
  function init() {
    console.log('MatchDayModule initialized');
  }

  /**
   * Mostra modal selezione formazione
   */
  function showFormationModal(teamId) {
    const team = appState.getTeam(teamId);
    if (!team) {
      UI.showToast('Squadra non trovata', 'error');
      return;
    }

    selectedTeam = team;
    resetFormation();

    const athletes = appState.state.athletes.filter(a => a.teamId === teamId);
    
    if (athletes.length === 0) {
      UI.showToast('Nessun atleta in questa squadra', 'warning');
      return;
    }

    const content = `
      <div class="matchday-modal">
        <div class="matchday-header">
          <h3><i data-lucide="shield"></i> ${team.name}</h3>
          <p class="matchday-subtitle">Seleziona 11 titolari e le riserve</p>
        </div>

        <!-- Azione Selezione Automatica -->
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 8px; border: 2px solid #3b82f6;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 0.25rem 0; color: #1e40af; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="sparkles" style="width: 20px; height: 20px;"></i>
                Selezione Automatica
              </h4>
              <p style="margin: 0; font-size: 0.875rem; color: #1e40af;">
                Algoritmo basato sulle valutazioni tecniche medie degli atleti
              </p>
            </div>
            <button class="btn btn-primary btn-glass primary" onclick="MatchDayModule.autoSelectBestLineup()" style="white-space: nowrap;">
              <i data-lucide="wand-2"></i>
              Seleziona Migliori 11
            </button>
          </div>
        </div>

        <!-- Formazione Titolari -->
        <div class="matchday-section">
          <div class="matchday-section-header">
            <h4><i data-lucide="users"></i> Titolari (11)</h4>
            <span id="starters-count" class="count-badge">0/11</span>
          </div>
          <div id="starters-list" class="formation-list">
            <!-- Popolato dinamicamente -->
          </div>
        </div>

        <!-- Formazione Riserve -->
        <div class="matchday-section">
          <div class="matchday-section-header">
            <h4><i data-lucide="user-plus"></i> Riserve</h4>
            <span id="reserves-count" class="count-badge">0</span>
          </div>
          <div id="reserves-list" class="formation-list reserves-list">
            <!-- Popolato dinamicamente -->
          </div>
        </div>

        <!-- Lista Atleti Disponibili -->
        <div class="matchday-section">
          <h4><i data-lucide="list"></i> Atleti Disponibili</h4>
          <div id="available-athletes" class="athletes-grid">
            ${athletes.map(athlete => renderAthleteCard(athlete)).join('')}
          </div>
        </div>

        <!-- Azioni -->
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="UI.closeModal()">Annulla</button>
          <button class="btn btn-secondary" onclick="TacticsModule.showTacticalBoard(null, '${teamId}')">
            <i data-lucide="layout"></i>
            Lavagna Tattica
          </button>
          <button class="btn btn-primary btn-glass primary" onclick="MatchDayModule.generateMatchSheet()">
            <i data-lucide="file-text"></i>
            Genera Distinta PDF
          </button>
        </div>
      </div>
    `;

    UI.showModal('Distinta di Gara', content, 'large');
    
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      updateFormationDisplay();
    }, 50);
  }

  /**
   * Renderizza card atleta selezionabile
   */
  function renderAthleteCard(athlete) {
    const isInjured = athlete.injured || false;
    const injuredClass = isInjured ? 'athlete-injured' : '';
    const injuredBadge = isInjured ? '<span class="injured-badge">🚑</span>' : '';

    // Calcola media valutazioni se disponibile
    let technicalAvg = 0;
    let ratingBadge = '';
    
    if (typeof EvaluationsModule !== 'undefined') {
      technicalAvg = EvaluationsModule.getAthleteTechnicalAverage(athlete.id);
      if (technicalAvg > 0) {
        const ratingColor = technicalAvg >= 8 ? '#10b981' : technicalAvg >= 6 ? '#f59e0b' : '#6b7280';
        ratingBadge = `<span class="rating-badge" style="background: ${ratingColor}; color: white; padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">⭐ ${technicalAvg.toFixed(1)}</span>`;
      }
    }

    return `
      <div class="athlete-card ${injuredClass}" data-athlete-id="${athlete.id}">
        ${injuredBadge}
        <div class="athlete-card-info">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
            <strong>${athlete.firstName} ${athlete.lastName}</strong>
            ${ratingBadge}
          </div>
          <span class="athlete-role">${athlete.role || 'N/D'}</span>
        </div>
        <div class="athlete-card-actions">
          <button 
            class="btn-small btn-primary" 
            onclick="MatchDayModule.addToStarters('${athlete.id}')"
            ${formation.starters.length >= 11 ? 'disabled' : ''}
          >
            Titolare
          </button>
          <button 
            class="btn-small btn-secondary" 
            onclick="MatchDayModule.addToReserves('${athlete.id}')"
          >
            Riserva
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Aggiunge atleta ai titolari
   */
  function addToStarters(athleteId) {
    if (formation.starters.length >= 11) {
      UI.showToast('Hai già selezionato 11 titolari', 'warning');
      return;
    }

    // Verifica se già presente
    if (formation.starters.some(s => s.athleteId === athleteId) || 
        formation.reserves.includes(athleteId)) {
      UI.showToast('Atleta già selezionato', 'warning');
      return;
    }

    const athlete = appState.getAthlete(athleteId);
    
    formation.starters.push({
      athleteId,
      shirtNumber: formation.starters.length + 1,
      position: athlete.role || 'N/D'
    });

    updateFormationDisplay();
    UI.showToast(`${athlete.firstName} ${athlete.lastName} aggiunto ai titolari`, 'success');
  }

  /**
   * Aggiunge atleta alle riserve
   */
  function addToReserves(athleteId) {
    // Verifica se già presente
    if (formation.starters.some(s => s.athleteId === athleteId) || 
        formation.reserves.includes(athleteId)) {
      UI.showToast('Atleta già selezionato', 'warning');
      return;
    }

    const athlete = appState.getAthlete(athleteId);
    formation.reserves.push(athleteId);

    updateFormationDisplay();
    UI.showToast(`${athlete.firstName} ${athlete.lastName} aggiunto alle riserve`, 'success');
  }

  /**
   * Rimuove atleta dalla formazione
   */
  function removeFromFormation(athleteId, type) {
    if (type === 'starter') {
      formation.starters = formation.starters.filter(s => s.athleteId !== athleteId);
      // Rinumera
      formation.starters.forEach((s, i) => s.shirtNumber = i + 1);
      
      // Rimuovi capitano/portiere se era questo atleta
      if (formation.captain === athleteId) formation.captain = null;
      if (formation.goalkeeper === athleteId) formation.goalkeeper = null;
    } else {
      formation.reserves = formation.reserves.filter(id => id !== athleteId);
    }

    updateFormationDisplay();
  }

  /**
   * Imposta capitano
   */
  function setCaptain(athleteId) {
    formation.captain = athleteId;
    updateFormationDisplay();
    UI.showToast('Capitano impostato', 'success');
  }

  /**
   * Imposta portiere
   */
  function setGoalkeeper(athleteId) {
    formation.goalkeeper = athleteId;
    updateFormationDisplay();
    UI.showToast('Portiere impostato', 'success');
  }

  /**
   * Aggiorna visualizzazione formazione
   */
  function updateFormationDisplay() {
    // Aggiorna contatori
    const startersCount = document.getElementById('starters-count');
    const reservesCount = document.getElementById('reserves-count');
    
    if (startersCount) startersCount.textContent = `${formation.starters.length}/11`;
    if (reservesCount) reservesCount.textContent = formation.reserves.length;

    // Aggiorna lista titolari
    const startersList = document.getElementById('starters-list');
    if (formation.starters.length === 0) {
      startersList.innerHTML = '<p class="empty-message">Nessun titolare selezionato</p>';
    } else {
      startersList.innerHTML = formation.starters.map(starter => {
        const athlete = appState.getAthlete(starter.athleteId);
        const isCaptain = formation.captain === starter.athleteId;
        const isGK = formation.goalkeeper === starter.athleteId;

        // Calcola rating se disponibile
        let technicalAvg = 0;
        let ratingBadge = '';
        if (typeof EvaluationsModule !== 'undefined') {
          technicalAvg = EvaluationsModule.getAthleteTechnicalAverage(starter.athleteId);
          if (technicalAvg > 0) {
            const ratingColor = technicalAvg >= 8 ? '#10b981' : technicalAvg >= 6 ? '#f59e0b' : '#6b7280';
            ratingBadge = `<span style="background: ${ratingColor}; color: white; padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">⭐ ${technicalAvg.toFixed(1)}</span>`;
          }
        }

        return `
          <div class="formation-player">
            <div class="player-number">${starter.shirtNumber}</div>
            <div class="player-info">
              <strong>${athlete.firstName} ${athlete.lastName} ${ratingBadge}</strong>
              <span>${starter.position}</span>
              <div class="player-badges">
                ${isCaptain ? '<span class="captain-badge">© Capitano</span>' : ''}
                ${isGK ? '<span class="gk-badge">🧤 Portiere</span>' : ''}
              </div>
            </div>
            <div class="player-actions">
              ${!isCaptain ? `<button class="btn-icon" onclick="MatchDayModule.setCaptain('${starter.athleteId}')" title="Capitano"><i data-lucide="shield"></i></button>` : ''}
              ${!isGK ? `<button class="btn-icon" onclick="MatchDayModule.setGoalkeeper('${starter.athleteId}')" title="Portiere"><i data-lucide="hand"></i></button>` : ''}
              <button class="btn-icon btn-danger" onclick="MatchDayModule.removeFromFormation('${starter.athleteId}', 'starter')" title="Rimuovi"><i data-lucide="x"></i></button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Aggiorna lista riserve
    const reservesList = document.getElementById('reserves-list');
    if (formation.reserves.length === 0) {
      reservesList.innerHTML = '<p class="empty-message">Nessuna riserva selezionata</p>';
    } else {
      reservesList.innerHTML = formation.reserves.map(athleteId => {
        const athlete = appState.getAthlete(athleteId);

        // Calcola rating se disponibile
        let technicalAvg = 0;
        let ratingBadge = '';
        if (typeof EvaluationsModule !== 'undefined') {
          technicalAvg = EvaluationsModule.getAthleteTechnicalAverage(athleteId);
          if (technicalAvg > 0) {
            const ratingColor = technicalAvg >= 8 ? '#10b981' : technicalAvg >= 6 ? '#f59e0b' : '#6b7280';
            ratingBadge = `<span style="background: ${ratingColor}; color: white; padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">⭐ ${technicalAvg.toFixed(1)}</span>`;
          }
        }

        return `
          <div class="formation-player reserve-player">
            <div class="player-info">
              <strong>${athlete.firstName} ${athlete.lastName} ${ratingBadge}</strong>
              <span>${athlete.role || 'N/D'}</span>
            </div>
            <button class="btn-icon btn-danger" onclick="MatchDayModule.removeFromFormation('${athleteId}', 'reserve')">
              <i data-lucide="x"></i>
            </button>
          </div>
        `;
      }).join('');
    }

    // Aggiorna disponibilità pulsanti
    document.querySelectorAll('.athlete-card').forEach(card => {
      const athleteId = card.dataset.athleteId;
      const isSelected = formation.starters.some(s => s.athleteId === athleteId) || 
                        formation.reserves.includes(athleteId);
      
      const btnStarter = card.querySelector('.btn-primary');
      if (btnStarter) {
        btnStarter.disabled = formation.starters.length >= 11 || isSelected;
      }
      
      const btnReserve = card.querySelector('.btn-secondary');
      if (btnReserve) {
        btnReserve.disabled = isSelected;
      }
    });

    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 10);
  }

  /**
   * Genera distinta PDF
   */
  function generateMatchSheet() {
    if (formation.starters.length !== 11) {
      UI.showToast('Devi selezionare esattamente 11 titolari', 'error');
      return;
    }

    if (!window.jspdf) {
      UI.showToast('jsPDF non caricato', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(26, 71, 42);
    doc.text('⚽ DISTINTA DI GARA', 105, 20, { align: 'center' });

    // Info squadra
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Squadra: ${selectedTeam.name}`, 20, 35);
    doc.text(`Categoria: ${selectedTeam.category || 'N/D'}`, 20, 42);
    doc.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, 20, 49);

    // Linea separatore
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 55, 190, 55);

    // Titolari
    doc.setFontSize(14);
    doc.setTextColor(26, 71, 42);
    doc.text('FORMAZIONE TITOLARE', 20, 65);

    let yPos = 75;
    formation.starters.forEach(starter => {
      const athlete = appState.getAthlete(starter.athleteId);
      const isCaptain = formation.captain === starter.athleteId;
      const isGK = formation.goalkeeper === starter.athleteId;
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      // Numero maglia
      doc.setFont(undefined, 'bold');
      doc.text(`${starter.shirtNumber}.`, 25, yPos);
      
      // Nome
      doc.setFont(undefined, 'normal');
      let name = `${athlete.firstName} ${athlete.lastName}`;
      if (isCaptain) name += ' (C)';
      if (isGK) name += ' [P]';
      doc.text(name, 35, yPos);
      
      // Ruolo
      doc.setTextColor(100, 100, 100);
      doc.text(starter.position, 120, yPos);
      
      yPos += 8;
    });

    // Riserve
    if (formation.reserves.length > 0) {
      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(26, 71, 42);
      doc.text('PANCHINA', 20, yPos);

      yPos += 10;
      formation.reserves.forEach(athleteId => {
        const athlete = appState.getAthlete(athleteId);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`• ${athlete.firstName} ${athlete.lastName}`, 25, yPos);
        doc.setTextColor(100, 100, 100);
        doc.text(athlete.role || 'N/D', 120, yPos);
        yPos += 7;
      });
    }

    // Legenda
    yPos += 10;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('(C) = Capitano  |  [P] = Portiere', 20, yPos);

    // Firme
    yPos = 250;
    doc.setDrawColor(0, 0, 0);
    doc.line(20, yPos, 80, yPos);
    doc.line(110, yPos, 170, yPos);
    
    doc.setFontSize(9);
    doc.text('Firma Dirigente', 35, yPos + 7);
    doc.text('Firma Arbitro', 127, yPos + 7);

    // Footer (shared)
    if (window.PDFUtils && typeof window.PDFUtils.addStandardFooter === 'function') {
      window.PDFUtils.addStandardFooter(doc);
    } else {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Creato da www.ldm4app.com', 105, 287, { align: 'center' });
    }

    // Salva
    const filename = `Distinta_${selectedTeam.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    UI.showToast('Distinta PDF generata con successo', 'success');
  }

  /**
   * Reset formazione
   */
  function resetFormation() {
    formation = {
      starters: [],
      reserves: [],
      captain: null,
      goalkeeper: null
    };
  }

  /**
   * Selezione automatica dei migliori 11 atleti basata sulle valutazioni tecniche
   */
  function autoSelectBestLineup() {
    if (!selectedTeam) {
      UI.showToast('Nessuna squadra selezionata', 'error');
      return;
    }

    // Chiedi formazione desiderata
    const formationChoice = prompt(
      'Inserisci la formazione desiderata:\n\nEsempi:\n• 4-4-2 (classica)\n• 4-3-3 (offensiva)\n• 3-5-2 (centrocampo forte)\n• 5-3-2 (difensiva)\n• 4-2-3-1 (moderna)',
      '4-4-2'
    );

    if (!formationChoice) return;

    // Valida formato formazione
    const formationRegex = /^\d-\d-\d$/;
    if (!formationRegex.test(formationChoice)) {
      UI.showToast('Formato formazione non valido. Usa il formato: X-X-X (es. 4-4-2)', 'error');
      return;
    }

    // Verifica che EvaluationsModule sia disponibile
    if (typeof EvaluationsModule === 'undefined') {
      UI.showToast('Modulo valutazioni non disponibile', 'error');
      return;
    }

    // Ottieni suggerimento automatico
    const suggestion = EvaluationsModule.suggestBestLineup(selectedTeam.id, formationChoice);
    
    if (!suggestion) {
      return; // Errore già mostrato da suggestBestLineup
    }

    // Conferma applicazione
    const avgScore = suggestion.averageScore;
    const confirmMsg = `Formazione ${formationChoice} suggerita!\n\n` +
                       `• 11 Titolari selezionati\n` +
                       `• ${suggestion.reserves.length} Riserve\n` +
                       `• Media tecnica: ${avgScore}/10\n\n` +
                       `Vuoi applicare questa selezione?`;

    if (!confirm(confirmMsg)) return;

    // Applica la selezione suggerita
    formation.starters = suggestion.starters;
    formation.reserves = suggestion.reserves;
    formation.goalkeeper = suggestion.goalkeeper;
    formation.captain = suggestion.captain;

    updateFormationDisplay();

    UI.showToast(`✅ Formazione ${formationChoice} applicata con successo! Media: ${avgScore}/10`, 'success');
  }

  /**
   * Restituisce la formazione corrente (per integrazione con altri moduli)
   */
  function getCurrentFormation() {
    return {
      formation: formation,
      team: selectedTeam
    };
  }

  return {
    init,
    showFormationModal,
    addToStarters,
    addToReserves,
    removeFromFormation,
    setCaptain,
    setGoalkeeper,
    generateMatchSheet,
    getCurrentFormation,
    autoSelectBestLineup
  };
})();

// Esposizione globale
window.MatchDayModule = MatchDayModule;


