/**
 * DASHBOARD.JS
 * Modulo per la dashboard con statistiche e overview
 */

const DashboardModule = {
    charts: {},

    /**
     * Inizializza il modulo dashboard
     */
    init() {
        console.log('📊 Inizializzazione modulo Dashboard');
        
        this.render();
        
        // Subscribe agli eventi per aggiornare le statistiche
        appState.subscribe('athletes:added', () => this.updateStats());
        appState.subscribe('athletes:updated', () => this.updateStats());
        appState.subscribe('athletes:deleted', () => this.updateStats());
        appState.subscribe('teams:added', () => this.renderCharts());
        appState.subscribe('teams:updated', () => this.renderCharts());
        appState.subscribe('calendar:added', () => this.updateUpcomingMatches());
        appState.subscribe('calendar:updated', () => this.updateUpcomingMatches());
        appState.subscribe('calendar:deleted', () => this.updateUpcomingMatches());
    },

    render() {
        this.updateStats();
        this.updateMedicalExpiries();
        this.updateUpcomingMatches();
        this.renderCharts();

        // Subscribe a modifiche fiscali per aggiornare la dashboard automaticamente
        try { if (typeof appState !== 'undefined' && typeof appState.subscribe === 'function') appState.subscribe('fiscal:updated', () => this.updateStats()); } catch (e) { /* ignore */ }
    },

    /**
     * Aggiorna le statistiche principali
     */
    updateStats() {
        const athletes = appState.getAthletes();
        const activeAthletes = athletes.filter(a => a.active);
        
        // Calcola atleti con visite in scadenza (prossimi 30 giorni)
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        const expiringMedicals = athletes.filter(a => {
            const expiryDate = new Date(a.medicalExpiry);
            return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
        });

        // Aggiorna i numeri nelle card
        this.updateStatCard('total-athletes', athletes.length);
        this.updateStatCard('active-athletes', activeAthletes.length);
        this.updateStatCard('expiring-medicals', expiringMedicals.length);
        
        // Aggiorna statistiche finanziarie (modulo Finances esistente)
        if (typeof FinancesModule !== 'undefined') {
            FinancesModule.updateFinancialStats();
        }

        // Aggiorna statistiche provenienti dal modulo fiscale (ricevute/ledger/collaboratori)
        if (typeof FiscalModule !== 'undefined') {
            try {
                const currentYear = new Date().getFullYear();
                const r = FiscalModule.getReceiptsSummary(currentYear);
                const l = FiscalModule.getLedgerSummary(currentYear);
                // Totale ricevute + quote atleti
                const totalCollectedEl = document.getElementById('total-collected');
                let totalAthleteFees = 0;
                if (typeof FinancesModule !== 'undefined') {
                    const stats = FinancesModule.calculateFinancialStats();
                    totalAthleteFees = stats.totalCollected || 0;
                }
                if (totalCollectedEl) totalCollectedEl.textContent = `€ ${(r.totalAmount + totalAthleteFees).toFixed(2)}`;
                // Entrate fiscali
                const incomeEl = document.getElementById('fiscal-ledger-income');
                if (incomeEl) incomeEl.textContent = `€ ${l.income.toFixed(2)}`;
                // Uscite fiscali
                const expenseEl = document.getElementById('fiscal-ledger-expense');
                if (expenseEl) expenseEl.textContent = `€ ${l.expense.toFixed(2)}`;
                // Saldo prima nota (se presente nella dashboard)
                const balanceEl = document.getElementById('fiscal-ledger-balance');
                if (balanceEl) balanceEl.textContent = `€ ${l.balance.toFixed(2)}`;
                // Totale crediti (dal modulo Finances)
                const creditEl = document.getElementById('total-credit');
                if (creditEl && typeof FinancesModule !== 'undefined') {
                    const stats = FinancesModule.calculateFinancialStats();
                    creditEl.textContent = `€ ${stats.totalCredit.toFixed(0)}`;
                }
            } catch (e) {
                console.warn('Dashboard: impossibile leggere i dati fiscali', e);
            }
        }
    },

    /**
     * Aggiorna prossime partite
     */
    updateUpcomingMatches() {
        const today = new Date();
        const upcomingMatches = appState.getCalendarEvents()
            .filter(e => e.type === 'match' && new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5); // Solo le prossime 5

        this.updateStatCard('upcoming-matches', upcomingMatches.length);

        const container = document.getElementById('upcoming-matches-list');
        if (!container) return;

        if (upcomingMatches.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--color-gray-500);">
                    <i data-lucide="calendar-x"></i>
                    <p style="margin-top: 0.5rem;">Nessuna partita in programma</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = upcomingMatches.map(match => {
            const matchDate = new Date(match.date);
            const team = appState.getTeam(match.teamId);
            const daysUntil = Math.ceil((matchDate - today) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="list-item" onclick="CalendarModule.showEventDetails('${match.id}')">
                    <div class="list-item-info">
                        <div class="list-item-title">
                            ⚽ ${match.title}
                        </div>
                        <div class="list-item-subtitle">
                            ${matchDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                            ${match.time ? ` - ${match.time}` : ''}
                            ${team ? ` - ${team.name}` : ''}
                        </div>
                    </div>
                    <span style="color: var(--color-primary); font-size: 0.875rem;">
                        ${daysUntil === 0 ? 'Oggi' : daysUntil === 1 ? 'Domani' : `${daysUntil}gg`}
                    </span>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    },

    /**
     * Aggiorna lista scadenze visite mediche
     */
    updateMedicalExpiries() {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        const athletes = appState.getAthletes();
        const expiringAthletes = athletes
            .filter(a => {
                const expiryDate = new Date(a.medicalExpiry);
                return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
            })
            .sort((a, b) => new Date(a.medicalExpiry) - new Date(b.medicalExpiry));

        const container = document.getElementById('medical-expiry-list');
        if (!container) return;

        if (expiringAthletes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--color-gray-500);">
                    <i data-lucide="check-circle"></i>
                    <p style="margin-top: 0.5rem;">Nessuna visita in scadenza</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = expiringAthletes.map(athlete => {
            const expiryDate = new Date(athlete.medicalExpiry);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            const isUrgent = daysUntilExpiry <= 7;
            
            return `
                <div class="list-item ${isUrgent ? 'danger' : 'warning'}" onclick="AthletesModule.showAthleteDetails('${athlete.id}')">
                    <div class="list-item-info">
                        <div class="list-item-title">
                            ${athlete.firstName} ${athlete.lastName}
                        </div>
                        <div class="list-item-subtitle">
                            Scadenza: ${expiryDate.toLocaleDateString('it-IT')}
                        </div>
                    </div>
                    <span style="color: ${isUrgent ? 'var(--color-danger)' : 'var(--color-warning)'}; font-weight: 600; font-size: 0.875rem;">
                        ${daysUntilExpiry === 0 ? 'Oggi!' : daysUntilExpiry === 1 ? '1 giorno' : `${daysUntilExpiry} giorni`}
                    </span>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    },

    /**
     * Aggiorna una singola card statistica
     */
    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animazione di cambio valore
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.textContent = value;
                element.style.transform = 'scale(1)';
            }, 150);
        }
    },

    /**
     * Renderizza tutti i grafici della dashboard
     */
    renderCharts() {
        setTimeout(() => {
            this.renderRoleDistributionChart();
            this.renderTeamDistributionChart();
        }, 100);
    },

    /**
     * Grafico distribuzione ruoli
     */
    renderRoleDistributionChart() {
        const ctx = document.getElementById('role-distribution-chart');
        if (!ctx) return;

        const athletes = appState.getAthletes();
        const roleCount = {};

        athletes.forEach(a => {
            roleCount[a.role] = (roleCount[a.role] || 0) + 1;
        });

        // Distruggi grafico precedente
        if (this.charts.roleDistribution) {
            this.charts.roleDistribution.destroy();
        }

        this.charts.roleDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(roleCount),
                datasets: [{
                    data: Object.values(roleCount),
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',    // Portiere
                        'rgba(59, 130, 246, 0.8)',   // Difensore
                        'rgba(16, 185, 129, 0.8)',   // Centrocampista
                        'rgba(245, 158, 11, 0.8)'    // Attaccante
                    ],
                    borderColor: 'var(--color-bg-primary)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Grafico distribuzione atleti per squadra
     */
    renderTeamDistributionChart() {
        const ctx = document.getElementById('team-distribution-chart');
        if (!ctx) return;

        const teams = appState.getTeams();
        const athletes = appState.getAthletes();

        const teamData = teams.map(team => {
            const teamAthletes = athletes.filter(a => a.teamId === team.id);
            return {
                name: team.name,
                total: teamAthletes.length,
                active: teamAthletes.filter(a => a.active).length
            };
        }).filter(t => t.total > 0);

        // Distruggi grafico precedente
        if (this.charts.teamDistribution) {
            this.charts.teamDistribution.destroy();
        }

        this.charts.teamDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: teamData.map(t => t.name),
                datasets: [
                    {
                        label: 'Totali',
                        data: teamData.map(t => t.total),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Attivi',
                        data: teamData.map(t => t.active),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
};
