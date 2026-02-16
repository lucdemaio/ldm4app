/**
 * ATTENDANCE.JS
 * Registro Presenze e Gestione Infortuni
 * Traccia presenze agli allenamenti e stato di salute atleti
 * Developed by ldm4app
 */

const AttendanceModule = (() => {
  // Costanti
  const ATTENDANCE_STATUS = {
    PRESENT: 'present',
    ABSENT: 'absent',
    INJURED: 'injured',
    EXCUSED: 'excused'
  };

  /**
   * Inizializzazione
   */
  function init() {
    console.log('AttendanceModule initialized');
  }

  /**
   * Mostra modal appello per un evento
   */
  function showAttendanceModal(eventId) {
    const event = appState.state.calendar.find(e => e.id === eventId);
    if (!event) {
      UI.showToast('Evento non trovato', 'error');
      return;
    }

    if (event.type !== 'training') {
      UI.showToast('L\'appello è disponibile solo per gli allenamenti', 'warning');
      return;
    }

    // Ottieni squadra dell'evento (se specificata) o tutti gli atleti
    const athletes = event.teamId 
      ? appState.state.athletes.filter(a => a.teamId === event.teamId)
      : appState.state.athletes;

    if (athletes.length === 0) {
      UI.showToast('Nessun atleta disponibile', 'warning');
      return;
    }

    // Inizializza attendance se non esiste
    if (!event.attendance) {
      event.attendance = {};
    }

    const content = `
      <div class="attendance-modal">
        <div class="attendance-header">
          <h3><i data-lucide="clipboard-check"></i> Appello Allenamento</h3>
          <p class="attendance-date">${new Date(event.date).toLocaleDateString('it-IT')} - ${event.time || 'N/D'}</p>
          <p class="attendance-subtitle">${event.title}</p>
        </div>

        <!-- Quick Actions -->
        <div style="margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 8px; border: 2px solid #10b981;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 0.25rem 0; color: #065f46; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="scan-line" style="width: 20px; height: 20px;"></i>
                Scanner QR Code
              </h4>
              <p style="margin: 0; font-size: 0.875rem; color: #065f46;">
                Usa la webcam per segnare le presenze automaticamente
              </p>
            </div>
            <button class="btn btn-success" onclick="ScannerModule.showScanner('attendance')" style="white-space: nowrap;">
              <i data-lucide="camera"></i>
              Apri Scanner
            </button>
          </div>
        </div>

        <!-- Statistiche Rapide -->
        <div class="attendance-stats">
          <div class="attendance-stat-item present-stat">
            <span class="stat-label">Presenti</span>
            <span class="stat-value" id="present-count">0</span>
          </div>
          <div class="attendance-stat-item absent-stat">
            <span class="stat-label">Assenti</span>
            <span class="stat-value" id="absent-count">0</span>
          </div>
          <div class="attendance-stat-item injured-stat">
            <span class="stat-label">Infortunati</span>
            <span class="stat-value" id="injured-count">0</span>
          </div>
          <div class="attendance-stat-item excused-stat">
            <span class="stat-label">Giustificati</span>
            <span class="stat-value" id="excused-count">0</span>
          </div>
        </div>

        <!-- Lista Atleti -->
        <div class="attendance-list">
          ${athletes.map(athlete => renderAttendanceRow(athlete, event)).join('')}
        </div>

        <!-- Azioni -->
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="UI.closeModal()">Annulla</button>
          <button class="btn btn-primary" onclick="AttendanceModule.saveAttendance('${eventId}')">
            <i data-lucide="save"></i>
            Salva Appello
          </button>
        </div>
      </div>
    `;

    UI.showModal('Registro Presenze', content, 'large');
    
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      updateAttendanceStats();
    }, 50);
  }

  /**
   * Renderizza riga atleta per appello
   */
  function renderAttendanceRow(athlete, event) {
    const currentStatus = event.attendance[athlete.id] || null;
    const isInjured = athlete.injured || false;

    return `
      <div class="attendance-row" data-athlete-id="${athlete.id}">
        <div class="athlete-info">
          ${isInjured ? '<span class="injured-icon">🚑</span>' : ''}
          <strong>${athlete.firstName} ${athlete.lastName}</strong>
          <span class="athlete-meta">${athlete.role || 'N/D'}</span>
        </div>
        <div class="attendance-buttons">
          <button 
            class="attendance-btn btn-present ${currentStatus === ATTENDANCE_STATUS.PRESENT ? 'active' : ''}"
            onclick="AttendanceModule.setStatus('${athlete.id}', '${ATTENDANCE_STATUS.PRESENT}')"
            title="Presente"
          >
            <i data-lucide="check"></i>
            Presente
          </button>
          <button 
            class="attendance-btn btn-absent ${currentStatus === ATTENDANCE_STATUS.ABSENT ? 'active' : ''}"
            onclick="AttendanceModule.setStatus('${athlete.id}', '${ATTENDANCE_STATUS.ABSENT}')"
            title="Assente"
          >
            <i data-lucide="x"></i>
            Assente
          </button>
          <button 
            class="attendance-btn btn-injured ${currentStatus === ATTENDANCE_STATUS.INJURED ? 'active' : ''}"
            onclick="AttendanceModule.setStatus('${athlete.id}', '${ATTENDANCE_STATUS.INJURED}')"
            title="Infortunato"
          >
            <i data-lucide="activity"></i>
            Infortunato
          </button>
          <button 
            class="attendance-btn btn-excused ${currentStatus === ATTENDANCE_STATUS.EXCUSED ? 'active' : ''}"
            onclick="AttendanceModule.setStatus('${athlete.id}', '${ATTENDANCE_STATUS.EXCUSED}')"
            title="Permesso"
          >
            <i data-lucide="info"></i>
            Permesso
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Imposta stato presenza atleta
   */
  function setStatus(athleteId, status) {
    const row = document.querySelector(`.attendance-row[data-athlete-id="${athleteId}"]`);
    if (!row) return;

    // Rimuovi active da tutti i pulsanti della riga
    row.querySelectorAll('.attendance-btn').forEach(btn => btn.classList.remove('active'));

    // Aggiungi active al pulsante selezionato
    const btn = row.querySelector(`.btn-${status}`);
    if (btn) btn.classList.add('active');

    // Memorizza temporaneamente (verrà salvato con saveAttendance)
    row.dataset.status = status;

    updateAttendanceStats();
  }

  /**
   * Aggiorna statistiche presenze
   */
  function updateAttendanceStats() {
    const rows = document.querySelectorAll('.attendance-row');
    const stats = {
      present: 0,
      absent: 0,
      injured: 0,
      excused: 0
    };

    rows.forEach(row => {
      const status = row.dataset.status;
      if (status && stats[status] !== undefined) {
        stats[status]++;
      }
    });

    const presentEl = document.getElementById('present-count');
    const absentEl = document.getElementById('absent-count');
    const injuredEl = document.getElementById('injured-count');
    const excusedEl = document.getElementById('excused-count');
    
    if (presentEl) presentEl.textContent = stats.present;
    if (absentEl) absentEl.textContent = stats.absent;
    if (injuredEl) injuredEl.textContent = stats.injured;
    if (excusedEl) excusedEl.textContent = stats.excused;
  }

  /**
   * Salva appello
   */
  function saveAttendance(eventId) {
    const event = appState.state.calendar.find(e => e.id === eventId);
    if (!event) return;

    const rows = document.querySelectorAll('.attendance-row');
    const attendance = {};
    const newInjuries = [];

    rows.forEach(row => {
      const athleteId = row.dataset.athleteId;
      const status = row.dataset.status;
      
      if (status) {
        attendance[athleteId] = status;

        // Se segnato come infortunato, aggiorna stato atleta
        if (status === ATTENDANCE_STATUS.INJURED) {
          const athlete = appState.getAthlete(athleteId);
          if (athlete && !athlete.injured) {
            athlete.injured = true;
            athlete.injuryDate = event.date;
            athlete.injuryNote = `Infortunato durante allenamento del ${new Date(event.date).toLocaleDateString('it-IT')}`;
            appState.updateAthlete(athleteId, athlete);
            newInjuries.push(`${athlete.firstName} ${athlete.lastName}`);
          }
        }
      }
    });

    // Salva attendance nell'evento
    event.attendance = attendance;
    appState.updateCalendarEvent(eventId, event);

    UI.closeModal();
    UI.showToast('Appello salvato con successo', 'success');

    if (newInjuries.length > 0) {
      setTimeout(() => {
        UI.showToast(`Nuovi infortuni registrati: ${newInjuries.join(', ')}`, 'warning');
      }, 1500);
    }
  }

  /**
   * Segna atleta come guarito
   */
  function markAsRecovered(athleteId) {
    const athlete = appState.getAthlete(athleteId);
    if (!athlete) return;

    athlete.injured = false;
    athlete.recoveryDate = new Date().toISOString().split('T')[0];
    
    appState.updateAthlete(athleteId, athlete);
    UI.showToast(`${athlete.firstName} ${athlete.lastName} è stato segnato come guarito`, 'success');
  }

  /**
   * Calcola statistiche presenze atleta
   */
  function calculateAthleteAttendance(athleteId, months = 1) {
    const events = appState.state.calendar.filter(e => e.type === 'training' && e.attendance);
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months);

    let total = 0;
    let present = 0;
    let absent = 0;
    let injured = 0;
    let excused = 0;

    events.forEach(event => {
      if (new Date(event.date) >= fromDate && event.attendance[athleteId]) {
        total++;
        const status = event.attendance[athleteId];
        
        if (status === ATTENDANCE_STATUS.PRESENT) present++;
        else if (status === ATTENDANCE_STATUS.ABSENT) absent++;
        else if (status === ATTENDANCE_STATUS.INJURED) injured++;
        else if (status === ATTENDANCE_STATUS.EXCUSED) excused++;
      }
    });

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, injured, excused, percentage };
  }

  /**
   * Renderizza grafico presenze atleta
   */
  function renderAttendanceChart(athleteId, canvasId) {
    const stats = calculateAthleteAttendance(athleteId, 3); // Ultimi 3 mesi

    if (!window.Chart) {
      console.error('Chart.js non caricato');
      return;
    }

    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Presente', 'Assente', 'Infortunato', 'Permesso'],
        datasets: [{
          label: 'Presenze (ultimi 3 mesi)',
          data: [stats.present, stats.absent, stats.injured, stats.excused],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',  // Verde
            'rgba(239, 68, 68, 0.8)',   // Rosso
            'rgba(245, 158, 11, 0.8)',  // Arancione
            'rgba(59, 130, 246, 0.8)'   // Blu
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `Partecipazione: ${stats.percentage}%`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  /**
   * Renderizza badge infortunio
   */
  function renderInjuryBadge(athlete) {
    if (!athlete.injured) return '';
    
    const daysSince = athlete.injuryDate 
      ? Math.floor((new Date() - new Date(athlete.injuryDate)) / (1000 * 60 * 60 * 24))
      : 0;

    return `
      <span class="injury-badge" title="${athlete.injuryNote || 'Infortunato'}">
        🚑 Infortunato ${daysSince > 0 ? `(${daysSince}g)` : ''}
      </span>
    `;
  }

  return {
    init,
    showAttendance: showAttendanceModal, // Alias per navbar
    showAttendanceModal,
    setStatus,
    saveAttendance,
    markAsRecovered,
    calculateAthleteAttendance,
    renderAttendanceChart,
    renderInjuryBadge,
    ATTENDANCE_STATUS
  };
})();

// Esposizione globale
window.AttendanceModule = AttendanceModule;

