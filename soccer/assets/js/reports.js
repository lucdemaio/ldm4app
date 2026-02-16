/**
 * REPORTS.JS
 * Modulo per la generazione di report PDF professionali
 * Utilizza jsPDF e autoTable per creare documenti stampabili
 */

const ReportsModule = {
    /**
     * Inizializza il modulo reports
     */
    init() {
        console.log('📄 Inizializzazione modulo Reports');
        this.bindEvents();
    },

    /**
     * Binding eventi UI
     */
    bindEvents() {
        // Gli eventi verranno gestiti dai moduli chiamanti
    },

    /**
     * Renderizza la vista Reports nella UI principale
     */
    render() {
        console.log('[ReportsModule] render chiamato');
        const container = document.getElementById('reports-list');
        if (!container) {
            console.error('[ReportsModule] container #reports-list non trovato');
            return;
        }
        const teams = (typeof appState !== 'undefined') ? appState.getTeams() : [];
        console.log('[ReportsModule] Numero squadre trovate:', teams.length);

        let html = '';

        if (teams.length === 0) {
            html = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="file-text"></i></div>
                    <h4>Nessun Report</h4>
                    <p>Non ci sono squadre o dati disponibili per generare report.</p>
                </div>
            `;
        } else {
            html = `
                <div class="report-actions" style="margin-bottom:1rem;">
                    <p class="text-secondary">Genera report PDF per la società o per singola squadra</p>
                </div>
                <div class="reports-grid">
                    ${teams.map(team => `
                        <div class="report-card premium-card">
                            <div class="report-card-header">
                                <h4>${team.name}</h4>
                                <div class="text-secondary">${team.category || ''}</div>
                            </div>
                            <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
                                <button class="btn btn-secondary btn-glass secondary" onclick="ReportsModule.generateTeamReport('${team.id}')">
                                    <i data-lucide="file-text"></i> Report PDF
                                </button>
                                <button class="btn btn-outline" onclick="showView('teams'); setTimeout(()=>TeamsModule.showTeamDetails('${team.id}'), 100)">
                                    <i data-lucide="eye"></i> Vedi Squadra
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        container.innerHTML = html;
        setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
    },

    /**
     * Genera report PDF completo per una squadra
     * @param {string} teamId - ID della squadra
     */
    async generateTeamReport(teamId) {
        try {
            const team = appState.getTeam(teamId);
            if (!team) {
                UI.showToast('Squadra non trovata', 'error');
                return;
            }

            const athletes = appState.getAthletes().filter(a => a.teamId === teamId);
            
            if (athletes.length === 0) {
                UI.showToast('Nessun atleta in questa squadra', 'warning');
                return;
            }

            // Crea documento PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // === HEADER ===
            this.addHeader(doc, team.name);

            // === INFORMAZIONI SQUADRA ===
            let yPos = 40;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Informazioni Squadra', 14, yPos);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            yPos += 7;
            doc.text(`Categoria: ${team.category || 'N/D'}`, 14, yPos);
            yPos += 5;
            doc.text(`Numero Atleti: ${athletes.length} (Attivi: ${athletes.filter(a => a.active).length})`, 14, yPos);
            yPos += 5;
            doc.text(`Data Report: ${new Date().toLocaleDateString('it-IT')}`, 14, yPos);
            
            if (team.description) {
                yPos += 5;
                doc.text(`Descrizione: ${team.description.substring(0, 80)}`, 14, yPos);
            }

            // === TABELLA ATLETI ===
            yPos += 10;
            
            const tableData = athletes.map(athlete => {
                const medicalExpiry = new Date(athlete.medicalExpiry);
                const today = new Date();
                const daysToExpiry = Math.ceil((medicalExpiry - today) / (1000 * 60 * 60 * 24));
                
                let medicalStatus = '✓ OK';
                if (daysToExpiry < 0) medicalStatus = '✗ Scaduta';
                else if (daysToExpiry <= 30) medicalStatus = '⚠ In scadenza';

                return [
                    `${athlete.firstName} ${athlete.lastName}`,
                    new Date(athlete.birthDate).toLocaleDateString('it-IT'),
                    athlete.role,
                    athlete.active ? '✓' : '✗',
                    new Date(athlete.medicalExpiry).toLocaleDateString('it-IT'),
                    medicalStatus
                ];
            });

            doc.autoTable({
                startY: yPos,
                head: [['Atleta', 'Data Nascita', 'Ruolo', 'Attivo', 'Scad. Visita', 'Stato']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [26, 71, 42], textColor: 255, fontSize: 9 },
                bodyStyles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 45 },
                    1: { cellWidth: 28 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 15, halign: 'center' },
                    4: { cellWidth: 28 },
                    5: { cellWidth: 30 }
                },
                margin: { top: 10 }
            });

            // === STATISTICHE ===
            yPos = doc.lastAutoTable.finalY + 10;

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Statistiche', 14, yPos);
            
            yPos += 7;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            // Calcola statistiche
            const stats = this.calculateTeamStats(athletes);
            
            doc.text(`Distribuzione Ruoli:`, 14, yPos);
            yPos += 5;
            doc.setFontSize(9);
            Object.entries(stats.roleDistribution).forEach(([role, count]) => {
                doc.text(`  • ${role}: ${count}`, 20, yPos);
                yPos += 4;
            });

            yPos += 3;
            doc.setFontSize(10);
            doc.text(`Età Media: ${stats.averageAge.toFixed(1)} anni`, 14, yPos);
            yPos += 5;
            doc.text(`Visite in Scadenza (30gg): ${stats.expiringMedicals}`, 14, yPos);
            yPos += 5;
            doc.text(`Visite Scadute: ${stats.expiredMedicals}`, 14, yPos);

            // === FOOTER ===
            this.addFooter(doc);

            // === SALVA PDF ===
            const fileName = `Report_${team.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            UI.showToast('Report PDF generato con successo!', 'success');

        } catch (error) {
            console.error('Errore generazione report:', error);
            UI.showToast('Errore nella generazione del report', 'error');
        }
    },

    /**
     * Genera report globale di tutte le squadre
     */
    async generateGlobalReport() {
        try {
            const teams = appState.getTeams();
            const athletes = appState.getAthletes();

            if (teams.length === 0 && athletes.length === 0) {
                UI.showToast('Nessun dato da esportare', 'warning');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // === HEADER ===
            this.addHeader(doc, 'Report Società');

            // === STATISTICHE GENERALI ===
            let yPos = 40;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Statistiche Generali', 14, yPos);
            
            yPos += 7;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Totale Squadre: ${teams.length}`, 14, yPos);
            yPos += 5;
            doc.text(`Totale Atleti: ${athletes.length}`, 14, yPos);
            yPos += 5;
            doc.text(`Atleti Attivi: ${athletes.filter(a => a.active).length}`, 14, yPos);
            yPos += 5;
            doc.text(`Data Report: ${new Date().toLocaleDateString('it-IT')}`, 14, yPos);

            // === TABELLA SQUADRE ===
            yPos += 10;
            
            const tableData = teams.map(team => {
                const teamAthletes = athletes.filter(a => a.teamId === team.id);
                const activeAthletes = teamAthletes.filter(a => a.active);
                
                return [
                    team.name,
                    team.category || 'N/D',
                    teamAthletes.length.toString(),
                    activeAthletes.length.toString(),
                    `${((activeAthletes.length / (teamAthletes.length || 1)) * 100).toFixed(0)}%`
                ];
            });

            doc.autoTable({
                startY: yPos,
                head: [['Squadra', 'Categoria', 'Tot. Atleti', 'Attivi', '% Attivi']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [26, 71, 42], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 30, halign: 'center' },
                    3: { cellWidth: 30, halign: 'center' },
                    4: { cellWidth: 30, halign: 'center' }
                }
            });

            // === SCADENZE VISITE MEDICHE ===
            yPos = doc.lastAutoTable.finalY + 10;
            
            const today = new Date();
            const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
            
            const expiringAthletes = athletes.filter(a => {
                const expiryDate = new Date(a.medicalExpiry);
                return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
            }).sort((a, b) => new Date(a.medicalExpiry) - new Date(b.medicalExpiry));

            if (expiringAthletes.length > 0) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('⚠ Visite Mediche in Scadenza (30 giorni)', 14, yPos);
                
                yPos += 7;
                
                const expiringData = expiringAthletes.map(athlete => {
                    const team = appState.getTeam(athlete.teamId);
                    const expiryDate = new Date(athlete.medicalExpiry);
                    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    
                    return [
                        `${athlete.firstName} ${athlete.lastName}`,
                        team ? team.name : 'N/D',
                        expiryDate.toLocaleDateString('it-IT'),
                        `${daysLeft} giorni`
                    ];
                });

                doc.autoTable({
                    startY: yPos,
                    head: [['Atleta', 'Squadra', 'Scadenza', 'Giorni Rimanenti']],
                    body: expiringData,
                    theme: 'plain',
                    headStyles: { fillColor: [245, 158, 11], textColor: 255 },
                    columnStyles: {
                        3: { textColor: [245, 158, 11], fontStyle: 'bold' }
                    }
                });
            }

            // === FOOTER ===
            this.addFooter(doc);

            // === SALVA PDF ===
            const fileName = `Report_Societa_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            UI.showToast('Report globale generato con successo!', 'success');

        } catch (error) {
            console.error('Errore generazione report globale:', error);
            UI.showToast('Errore nella generazione del report', 'error');
        }
    },

    /**
     * Calcola statistiche per una squadra
     * @param {Array} athletes - Lista atleti della squadra
     */
    calculateTeamStats(athletes) {
        const roleDistribution = {};
        let totalAge = 0;
        const today = new Date();
        let expiringMedicals = 0;
        let expiredMedicals = 0;

        athletes.forEach(athlete => {
            // Distribuzione ruoli
            roleDistribution[athlete.role] = (roleDistribution[athlete.role] || 0) + 1;

            // Età media
            const birthDate = new Date(athlete.birthDate);
            const age = today.getFullYear() - birthDate.getFullYear();
            totalAge += age;

            // Visite mediche
            const medicalExpiry = new Date(athlete.medicalExpiry);
            const daysToExpiry = Math.ceil((medicalExpiry - today) / (1000 * 60 * 60 * 24));
            
            if (daysToExpiry < 0) expiredMedicals++;
            else if (daysToExpiry <= 30) expiringMedicals++;
        });

        return {
            roleDistribution,
            averageAge: athletes.length > 0 ? totalAge / athletes.length : 0,
            expiringMedicals,
            expiredMedicals
        };
    },

    /**
     * Aggiunge header al PDF
     */
    addHeader(doc, title) {
        // Logo/Titolo
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 71, 42);
        doc.text('⚽ SoccerManager Pro', 14, 15);
        
        // Titolo report
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(title, 14, 25);
        
        // Linea separatore
        doc.setDrawColor(26, 71, 42);
        doc.setLineWidth(0.5);
        doc.line(14, 30, 196, 30);
    },

    /**
     * Aggiunge footer al PDF
     */
    addFooter(doc) {
        if (window.PDFUtils && typeof window.PDFUtils.addStandardFooter === 'function') {
            window.PDFUtils.addStandardFooter(doc);
            return;
        }

        // Fallback: simple centered footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Pagina ${i} di ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
            doc.text(
                `Generato il ${new Date().toLocaleString('it-IT')}`,
                14,
                doc.internal.pageSize.height - 10
            );
        }
    }
};
window.ReportsModule = ReportsModule;
