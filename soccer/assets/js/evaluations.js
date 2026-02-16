/**
 * EVALUATIONS.JS
 * Modulo per la valutazione e tracciamento progressi atleti
 * Include test fisici, tecnici e visualizzazione grafica con Chart.js
 */

const EvaluationsModule = {
    charts: {},

    /**
     * Inizializza il modulo valutazioni
     */
    init() {
        console.log('📊 Inizializzazione modulo Evaluations');
    },

    /**
     * Mostra form per aggiungere una valutazione
     * @param {string} athleteId - ID dell'atleta
     */
    showEvaluationForm(athleteId) {
        const athlete = appState.getAthlete(athleteId);
        if (!athlete) return;

        const modalBody = `
            <form id="evaluation-form" class="form">
                <div class="form-group">
                    <label>Data Valutazione *</label>
                    <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}" max="${new Date().toISOString().split('T')[0]}">
                </div>

                <h4 style="margin: 1.5rem 0 1rem; color: var(--color-primary);">Test Fisici</h4>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Velocità 30m (secondi)</label>
                        <input type="number" name="speed30m" step="0.01" min="0" max="10" placeholder="4.50">
                    </div>
                    <div class="form-group">
                        <label>Resistenza 1000m (minuti)</label>
                        <input type="number" name="endurance1000m" step="0.01" min="0" max="20" placeholder="4.30">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Salto in Alto (cm)</label>
                        <input type="number" name="verticalJump" step="1" min="0" max="150" placeholder="45">
                    </div>
                    <div class="form-group">
                        <label>Forza (kg)</label>
                        <input type="number" name="strength" step="1" min="0" max="200" placeholder="50">
                    </div>
                </div>

                <h4 style="margin: 1.5rem 0 1rem; color: var(--color-primary);">Test Tecnici (1-10)</h4>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Tecnica Palla</label>
                        <input type="number" name="ballControl" step="0.5" min="0" max="10" placeholder="7.5">
                    </div>
                    <div class="form-group">
                        <label>Precisione Passaggi</label>
                        <input type="number" name="passing" step="0.5" min="0" max="10" placeholder="8.0">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Tiro in Porta</label>
                        <input type="number" name="shooting" step="0.5" min="0" max="10" placeholder="7.0">
                    </div>
                    <div class="form-group">
                        <label>Tattica</label>
                        <input type="number" name="tactics" step="0.5" min="0" max="10" placeholder="6.5">
                    </div>
                </div>

                <div class="form-group">
                    <label>Note Valutazione</label>
                    <textarea name="notes" rows="3" placeholder="Osservazioni sul test..."></textarea>
                </div>

                <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">
                        Annulla
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i data-lucide="save"></i> Salva Valutazione
                    </button>
                </div>
            </form>
        `;

        UI.showModal(`Valutazione - ${athlete.firstName} ${athlete.lastName}`, modalBody);

        document.getElementById('evaluation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvaluation(athleteId);
        });

        lucide.createIcons();
    },

    /**
     * Salva una valutazione
     * @param {string} athleteId - ID dell'atleta
     */
    saveEvaluation(athleteId) {
        const form = document.getElementById('evaluation-form');
        const formData = new FormData(form);

        const evaluation = {
            id: Date.now().toString(),
            athleteId: athleteId,
            date: formData.get('date'),
            createdAt: new Date().toISOString(),
            physical: {
                speed30m: parseFloat(formData.get('speed30m')) || null,
                endurance1000m: parseFloat(formData.get('endurance1000m')) || null,
                verticalJump: parseInt(formData.get('verticalJump')) || null,
                strength: parseInt(formData.get('strength')) || null
            },
            technical: {
                ballControl: parseFloat(formData.get('ballControl')) || null,
                passing: parseFloat(formData.get('passing')) || null,
                shooting: parseFloat(formData.get('shooting')) || null,
                tactics: parseFloat(formData.get('tactics')) || null
            },
            notes: formData.get('notes')
        };

        // Aggiungi valutazione tramite state manager
        appState.addEvaluation(evaluation);

        UI.closeModal();
        UI.showToast('Valutazione salvata con successo!', 'success');
    },

    /**
     * Mostra storico valutazioni e grafici progresso atleta
     * @param {string} athleteId - ID dell'atleta
     */
    showAthleteProgress(athleteId) {
        const athlete = appState.getAthlete(athleteId);
        if (!athlete) return;

        const evaluations = appState.getEvaluations(athleteId);

        const modalBody = `
            <div class="athlete-progress">
                ${evaluations.length === 0 ? `
                    <div style="text-align: center; padding: 2rem; color: var(--color-gray-500);">
                        <i data-lucide="trending-up" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <p>Nessuna valutazione registrata</p>
                        <button class="btn btn-primary" onclick="EvaluationsModule.showEvaluationForm('${athleteId}');">
                            <i data-lucide="plus"></i> Aggiungi Prima Valutazione
                        </button>
                    </div>
                ` : `
                    <div style="margin-bottom: 1.5rem;">
                        <button class="btn btn-primary" onclick="EvaluationsModule.showEvaluationForm('${athleteId}')">
                            <i data-lucide="plus"></i> Nuova Valutazione
                        </button>
                    </div>

                    <!-- Grafici -->
                    <div style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
                        <div class="card">
                            <h4>Progressione Test Fisici</h4>
                            <canvas id="physical-chart" style="max-height: 300px;"></canvas>
                        </div>
                        
                        <div class="card">
                            <h4>Progressione Test Tecnici</h4>
                            <canvas id="technical-chart" style="max-height: 300px;"></canvas>
                        </div>
                    </div>

                    <!-- Lista Valutazioni -->
                    <h4 style="margin-bottom: 1rem;">Storico Valutazioni</h4>
                    <div style="display: grid; gap: 1rem;">
                        ${evaluations.sort((a, b) => new Date(b.date) - new Date(a.date)).map(ev => `
                            <div class="card" style="padding: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                    <strong>${new Date(ev.date).toLocaleDateString('it-IT')}</strong>
                                    <button class="btn-icon" onclick="EvaluationsModule.deleteEvaluation('${ev.id}')" title="Elimina">
                                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                                    </button>
                                </div>
                                <div style="font-size: 0.875rem; color: var(--color-gray-600);">
                                    ${ev.physical.speed30m ? `Velocità: ${ev.physical.speed30m}s • ` : ''}
                                    ${ev.physical.verticalJump ? `Salto: ${ev.physical.verticalJump}cm • ` : ''}
                                    ${ev.technical.ballControl ? `Tecnica: ${ev.technical.ballControl}/10` : ''}
                                </div>
                                ${ev.notes ? `<p style="margin-top: 0.5rem; font-size: 0.875rem;">${ev.notes}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;

        UI.showModal(`Progressione - ${athlete.firstName} ${athlete.lastName}`, modalBody, 'large');

        if (evaluations.length > 0) {
            // Render grafici
            setTimeout(() => {
                this.renderPhysicalChart(evaluations);
                this.renderTechnicalChart(evaluations);
            }, 100);
        }

        lucide.createIcons();
    },

    /**
     * Renderizza grafico test fisici
     * @param {Array} evaluations - Lista valutazioni
     */
    renderPhysicalChart(evaluations) {
        const ctx = document.getElementById('physical-chart');
        if (!ctx) return;

        // Distruggi grafico precedente se esiste
        if (this.charts.physical) {
            this.charts.physical.destroy();
        }

        const sortedEvals = evaluations.sort((a, b) => new Date(a.date) - new Date(b.date));
        const labels = sortedEvals.map(ev => new Date(ev.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }));

        const datasets = [];

        // Velocità (invertita - meno è meglio)
        const speedData = sortedEvals.map(ev => ev.physical.speed30m);
        if (speedData.some(v => v !== null)) {
            datasets.push({
                label: 'Velocità 30m (s)',
                data: speedData,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4
            });
        }

        // Salto
        const jumpData = sortedEvals.map(ev => ev.physical.verticalJump);
        if (jumpData.some(v => v !== null)) {
            datasets.push({
                label: 'Salto in Alto (cm)',
                data: jumpData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            });
        }

        // Forza
        const strengthData = sortedEvals.map(ev => ev.physical.strength);
        if (strengthData.some(v => v !== null)) {
            datasets.push({
                label: 'Forza (kg)',
                data: strengthData,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            });
        }

        this.charts.physical = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },

    /**
     * Renderizza grafico test tecnici
     * @param {Array} evaluations - Lista valutazioni
     */
    renderTechnicalChart(evaluations) {
        const ctx = document.getElementById('technical-chart');
        if (!ctx) return;

        if (this.charts.technical) {
            this.charts.technical.destroy();
        }

        const sortedEvals = evaluations.sort((a, b) => new Date(a.date) - new Date(b.date));
        const labels = sortedEvals.map(ev => new Date(ev.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }));

        const datasets = [
            {
                label: 'Tecnica Palla',
                data: sortedEvals.map(ev => ev.technical.ballControl),
                borderColor: 'rgb(147, 51, 234)',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                tension: 0.4
            },
            {
                label: 'Passaggi',
                data: sortedEvals.map(ev => ev.technical.passing),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            },
            {
                label: 'Tiro',
                data: sortedEvals.map(ev => ev.technical.shooting),
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4
            },
            {
                label: 'Tattica',
                data: sortedEvals.map(ev => ev.technical.tactics),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }
        ];

        this.charts.technical = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Tecnica', 'Passaggi', 'Tiro', 'Tattica'],
                datasets: sortedEvals.slice(-3).map((ev, index) => ({
                    label: new Date(ev.date).toLocaleDateString('it-IT'),
                    data: [
                        ev.technical.ballControl,
                        ev.technical.passing,
                        ev.technical.shooting,
                        ev.technical.tactics
                    ],
                    borderColor: ['rgb(239, 68, 68)', 'rgb(59, 130, 246)', 'rgb(16, 185, 129)'][index],
                    backgroundColor: ['rgba(239, 68, 68, 0.1)', 'rgba(59, 130, 246, 0.1)', 'rgba(16, 185, 129, 0.1)'][index],
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        min: 0,
                        max: 10,
                        ticks: { stepSize: 2 }
                    }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },

    /**
     * Elimina una valutazione
     * @param {string} evaluationId - ID della valutazione
     */
    deleteEvaluation(evaluationId) {
        if (confirm('Sei sicuro di voler eliminare questa valutazione?')) {
            appState.deleteEvaluation(evaluationId);
            UI.showToast('Valutazione eliminata', 'success');
            
            // Ricarica la vista
            const evaluation = appState.state.evaluations?.find(e => e.id === evaluationId);
            if (evaluation) {
                setTimeout(() => this.showAthleteProgress(evaluation.athleteId), 300);
            }
        }
    },

    /**
     * Calcola media valutazioni tecniche di un atleta
     * @param {string} athleteId - ID dell'atleta
     * @returns {number} Media valutazioni (0-10) o 0 se nessuna valutazione
     */
    getAthleteTechnicalAverage(athleteId) {
        const evaluations = appState.getEvaluations(athleteId);
        if (!evaluations || evaluations.length === 0) return 0;

        // Prendi le ultime 3 valutazioni (più recenti)
        const recentEvals = evaluations
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        let totalScore = 0;
        let count = 0;

        recentEvals.forEach(ev => {
            const tech = ev.technical;
            if (tech.ballControl) { totalScore += tech.ballControl; count++; }
            if (tech.passing) { totalScore += tech.passing; count++; }
            if (tech.shooting) { totalScore += tech.shooting; count++; }
            if (tech.tactics) { totalScore += tech.tactics; count++; }
        });

        return count > 0 ? (totalScore / count) : 0;
    },

    /**
     * Suggerisce i migliori 11 atleti per una squadra basandosi sulle valutazioni
     * @param {string} teamId - ID della squadra
     * @param {string} formation - Formazione tattica (es. "4-3-3", "4-4-2")
     * @returns {Object} {starters: Array, reserves: Array, goalkeeper: string}
     */
    suggestBestLineup(teamId, formation = "4-4-2") {
        const athletes = appState.state.athletes.filter(a => a.teamId === teamId);
        
        if (athletes.length < 11) {
            UI.showToast('Non ci sono abbastanza atleti in questa squadra', 'warning');
            return null;
        }

        // Mappa ruoli italiani -> standard
        const roleMap = {
            'Portiere': 'GK',
            'Difensore': 'DEF',
            'Centrocampista': 'MID',
            'Attaccante': 'ATT',
            'GK': 'GK',
            'DEF': 'DEF',
            'MID': 'MID',
            'ATT': 'ATT'
        };

        // Calcola score per ogni atleta
        const athletesWithScores = athletes.map(athlete => {
            const techAvg = this.getAthleteTechnicalAverage(athlete.id);
            const role = roleMap[athlete.role] || 'MID';
            
            return {
                ...athlete,
                role: role,
                technicalScore: techAvg,
                // Bonus per atleti con valutazioni recenti
                hasEvaluations: techAvg > 0
            };
        });

        // Analizza formazione (es. "4-4-2" -> {DEF: 4, MID: 4, ATT: 2})
        const formationParts = formation.split('-').map(n => parseInt(n));
        const roleDistribution = {
            GK: 1,
            DEF: formationParts[0] || 4,
            MID: formationParts[1] || 4,
            ATT: formationParts[2] || 2
        };

        // Separa per ruolo e ordina per punteggio
        const byRole = {
            GK: athletesWithScores.filter(a => a.role === 'GK').sort((a, b) => b.technicalScore - a.technicalScore),
            DEF: athletesWithScores.filter(a => a.role === 'DEF').sort((a, b) => b.technicalScore - a.technicalScore),
            MID: athletesWithScores.filter(a => a.role === 'MID').sort((a, b) => b.technicalScore - a.technicalScore),
            ATT: athletesWithScores.filter(a => a.role === 'ATT').sort((a, b) => b.technicalScore - a.technicalScore)
        };

        const starters = [];
        const reserves = [];

        // Seleziona portiere
        const goalkeeper = byRole.GK[0];
        if (!goalkeeper) {
            UI.showToast('Nessun portiere disponibile', 'error');
            return null;
        }
        
        starters.push({
            athleteId: goalkeeper.id,
            shirtNumber: 1,
            position: 'GK',
            technicalScore: goalkeeper.technicalScore
        });

        let shirtNum = 2;

        // Seleziona difensori
        for (let i = 0; i < roleDistribution.DEF && i < byRole.DEF.length; i++) {
            starters.push({
                athleteId: byRole.DEF[i].id,
                shirtNumber: shirtNum++,
                position: 'DEF',
                technicalScore: byRole.DEF[i].technicalScore
            });
        }

        // Seleziona centrocampisti
        for (let i = 0; i < roleDistribution.MID && i < byRole.MID.length; i++) {
            starters.push({
                athleteId: byRole.MID[i].id,
                shirtNumber: shirtNum++,
                position: 'MID',
                technicalScore: byRole.MID[i].technicalScore
            });
        }

        // Seleziona attaccanti
        for (let i = 0; i < roleDistribution.ATT && i < byRole.ATT.length; i++) {
            starters.push({
                athleteId: byRole.ATT[i].id,
                shirtNumber: shirtNum++,
                position: 'ATT',
                technicalScore: byRole.ATT[i].technicalScore
            });
        }

        // Riserve: i migliori esclusi
        const starterIds = starters.map(s => s.athleteId);
        const remaining = athletesWithScores
            .filter(a => !starterIds.includes(a.id))
            .sort((a, b) => b.technicalScore - a.technicalScore)
            .slice(0, 7); // Max 7 riserve

        reserves.push(...remaining.map(a => a.id));

        return {
            starters,
            reserves,
            goalkeeper: goalkeeper.id,
            captain: starters.length > 1 ? starters[1].athleteId : starters[0].athleteId, // Secondo giocatore o portiere
            formation,
            averageScore: (starters.reduce((sum, s) => sum + s.technicalScore, 0) / starters.length).toFixed(2)
        };
    }
};

// Esposizione globale
window.EvaluationsModule = EvaluationsModule;
