/**
 * TEAMS.JS
 * Modulo per la gestione delle squadre
 * Creazione squadre, convocazioni, distinte di gara
 */

const TeamsModule = {
    /**
     * Inizializza il modulo squadre
     */
    init() {
        console.log('🛡️ Inizializzazione modulo Squadre');
        
        this.bindEvents();
        this.render();
        
        appState.subscribe('teams:added', () => this.render());
        appState.subscribe('teams:updated', () => this.render());
        appState.subscribe('teams:deleted', () => this.render());
        appState.subscribe('athletes:updated', () => this.render());
    },

    bindEvents() {
        document.getElementById('add-team-btn')?.addEventListener('click', () => {
            this.showTeamForm();
        });
    },

    render() {
        const container = document.getElementById('teams-list');
        if (!container) return;

        const teams = appState.getTeams();

        if (teams.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <i data-lucide="shield" style="font-size: 4rem; color: var(--color-gray-400); margin-bottom: 1rem;"></i>
                    <h3>Nessuna squadra creata</h3>
                    <p style="color: var(--color-gray-600);">Crea la tua prima squadra per iniziare a gestire le convocazioni</p>
                    <button class="btn btn-primary" onclick="TeamsModule.showTeamForm()">
                        <i data-lucide="plus"></i>
                        Crea Squadra
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = teams.map(team => this.createTeamCard(team)).join('');
        lucide.createIcons();
    },

    createTeamCard(team) {
        const athletes = appState.getAthletes().filter(a => a.teamId === team.id);
        const activeAthletes = athletes.filter(a => a.active);
        
        const colorChips = (team.colors && team.colors.length) ? team.colors.map(c => `<span style="display:inline-block;width:18px;height:18px;background:${c};border-radius:3px;margin-right:6px;border:1px solid rgba(0,0,0,0.06);"></span>`).join('') : `<span style="display:inline-block;width:18px;height:18px;background:${team.primaryColor || '#1e40af'};border-radius:3px;margin-right:6px;border:1px solid rgba(0,0,0,0.06);"></span>`;

        // Generate jersey svg for the team header
        let jerseySVG = '';
        try {
            if (typeof Utils !== 'undefined' && typeof Utils.generateJerseySVG === 'function') {
                jerseySVG = Utils.generateJerseySVG(team.primaryColor || (team.colors && team.colors[0]) || '#1e40af', team.secondaryColor || (team.colors && team.colors[1]) || '', team.accentColor || (team.colors && team.colors[2]) || '#ffffff', team.uniformStyle || 'solid', 36, 46);
            }
        } catch (e) { jerseySVG = ''; }

                return `
                        <div class="team-card">
                                <div class="team-header">
                                        <h3 class="team-name">
                                                <span class="team-jersey">${jerseySVG}</span>
                                                ${team.name}
                                        </h3>
                                        <div class="team-actions" style="display:flex;gap:0.5rem;align-items:center;">
                                                <!-- Distinta di Gara: calendario con pallone -->
                                                    <!-- Distinta di Gara: taccuino con check, accenti azzurro/giallo -->
                                                    <button class="btn-icon icon-page" onclick="MatchDayModule.showFormationModal('${team.id}')" title="Distinta di Gara">
                                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#f59e42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                            <rect x="4" y="3" width="16" height="18" rx="3" fill="#38bdf8" opacity="0.18"/>
                                                            <rect x="4" y="3" width="16" height="18" rx="3"/>
                                                            <path d="M8 7h8" stroke="#fbbf24"/>
                                                            <path d="M8 11h4" stroke="#fbbf24"/>
                                                            <polyline points="8 15 10 17 16 11" stroke="#22c55e"/>
                                                        </svg>
                                                    </button>
                                                    <!-- Report PDF: grafico a torta, accenti arancione/azzurro -->
                                                    <button class="btn-icon icon-page" onclick="ReportsModule.generateTeamReport('${team.id}')" title="Report PDF">
                                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#f59e42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                            <circle cx="12" cy="12" r="9" fill="#fde047" opacity="0.18"/>
                                                            <circle cx="12" cy="12" r="9"/>
                                                            <path d="M12 12L12 3" stroke="#38bdf8"/>
                                                            <path d="M12 12L20.4 16.8" stroke="#fbbf24"/>
                                                        </svg>
                                                    </button>
                                                    <!-- Modifica: pennello artistico, accenti verde/azzurro -->
                                                    <button class="btn-icon icon-page" onclick="TeamsModule.showTeamForm('${team.id}')" title="Modifica">
                                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M19.4 7.34a2.4 2.4 0 0 1 0 3.4l-8.6 8.6a2 2 0 0 1-2.83 0l-1.51-1.51a2 2 0 0 1 0-2.83l8.6-8.6a2.4 2.4 0 0 1 3.4 0Z" fill="#38bdf8" opacity="0.18"/>
                                                            <path d="M19.4 7.34a2.4 2.4 0 0 1 0 3.4l-8.6 8.6a2 2 0 0 1-2.83 0l-1.51-1.51a2 2 0 0 1 0-2.83l8.6-8.6a2.4 2.4 0 0 1 3.4 0Z"/>
                                                            <path d="M15 6l3 3" stroke="#f59e42"/>
                                                            <path d="M7.5 17.5l-2 2" stroke="#fbbf24"/>
                                                        </svg>
                                                    </button>
                                                    <!-- Convocazione: megafono, accenti giallo/arancione -->
                                                    <button class="btn-icon icon-page" onclick="TeamsModule.createCallup('${team.id}')" title="Convocazione">
                                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M3 11v2a1 1 0 0 0 1 1h2l7 4v-14l-7 4H4a1 1 0 0 0-1 1z" fill="#fde047" opacity="0.18"/>
                                                            <path d="M3 11v2a1 1 0 0 0 1 1h2l7 4v-14l-7 4H4a1 1 0 0 0-1 1z"/>
                                                            <path d="M15 8v8" stroke="#f59e42"/>
                                                            <circle cx="19" cy="12" r="2" stroke="#22c55e"/>
                                                        </svg>
                                                    </button>
                                        </div>
                                </div>
                
                <div style="display: flex; gap: 2rem; margin-bottom: 1rem; align-items:center;">
                    <div>
                        <strong>Categoria:</strong> ${team.category || 'N/D'}
                    </div>
                    <div>
                        <strong>Atleti:</strong> ${activeAthletes.length}/${athletes.length}
                    </div>
                    <div style="margin-left:auto;display:flex;align-items:center;gap:0.25rem;">
                        ${colorChips}
                    </div>
                </div>

                ${team.description ? `<p style="color: var(--color-gray-600); font-size: 0.875rem;">${team.description}</p>` : ''}
                
                ${athletes.length > 0 ? `
                    <details style="margin-top: 1rem;">
                        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">
                            Vedi Atleti (${athletes.length})
                        </summary>
                        <div style="display: grid; gap: 0.5rem; margin-top: 0.5rem;">
                            ${athletes.map(a => `
                                <div class="list-item" style="cursor: pointer;" onclick="AthletesModule.showAthleteDetails('${a.id}')">
                                    <div>
                                        <strong>${a.firstName} ${a.lastName}</strong>
                                        <span style="margin-left: 0.5rem; color: var(--color-gray-600);">${a.role}</span>
                                    </div>
                                    <span class="athlete-status ${a.active ? 'active' : 'inactive'}">
                                        ${a.active ? '✓' : '✗'}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                ` : ''}
            </div>
        `;
    },

    showTeamForm(teamId = null) {
        const team = teamId ? appState.getTeam(teamId) : null;
        const isEdit = !!team;

        const modalBody = `
            <form id="team-form" class="form">
                <div class="form-group">
                    <label>Nome Squadra *</label>
                    <input type="text" name="name" required value="${team?.name || ''}" 
                           placeholder="Es: Allievi 2010">
                </div>

                <div class="form-group">
                    <label>Categoria *</label>
                    <select name="category" required>
                        <option value="">Seleziona...</option>
                        <option value="Piccoli Amici" ${team?.category === 'Piccoli Amici' ? 'selected' : ''}>Piccoli Amici (5-6 anni)</option>
                        <option value="Primi Calci" ${team?.category === 'Primi Calci' ? 'selected' : ''}>Primi Calci (7-8 anni)</option>
                        <option value="Pulcini" ${team?.category === 'Pulcini' ? 'selected' : ''}>Pulcini (9-10 anni)</option>
                        <option value="Esordienti" ${team?.category === 'Esordienti' ? 'selected' : ''}>Esordienti (11-12 anni)</option>
                        <option value="Giovanissimi" ${team?.category === 'Giovanissimi' ? 'selected' : ''}>Giovanissimi (13-14 anni)</option>
                        <option value="Allievi" ${team?.category === 'Allievi' ? 'selected' : ''}>Allievi (15-16 anni)</option>
                        <option value="Juniores" ${team?.category === 'Juniores' ? 'selected' : ''}>Juniores (17-18 anni)</option>
                        <option value="Seniores" ${team?.category === 'Seniores' ? 'selected' : ''}>Seniores (19+ anni)</option>
                    </select>
                    <small style="color: var(--color-gray-600); margin-top: 0.5rem; display: block;">
                        💡 La categoria si aggiorna automaticamente ogni anno in base all'età degli atleti
                    </small>
                </div>

                <div class="form-group">
                    <label>Descrizione</label>
                    <textarea name="description" rows="3" placeholder="Informazioni sulla squadra...">${team?.description || ''}</textarea>
                </div>

                <div class="form-group">
                    <label>Colori Sociali</label>
                    <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
                        <div style="display:flex;flex-direction:column;"><label style="font-size:0.8rem;">Maglia (Primario)</label><input type="color" name="primaryColor" id="primary-color" value="${team?.primaryColor || (team?.colors && team.colors[0]) || '#1e40af'}" /></div>
                        <div style="display:flex;flex-direction:column;"><label style="font-size:0.8rem;">Dettagli / Secondario</label><input type="color" name="secondaryColor" id="secondary-color" value="${team?.secondaryColor || (team?.colors && team.colors[1]) || '#ffffff'}" /></div>
                        <div style="display:flex;flex-direction:column;"><label style="font-size:0.8rem;">Numeri / Accento</label><input type="color" name="accentColor" id="accent-color" value="${team?.accentColor || (team?.colors && team.colors[2]) || '#ffffff'}" /></div>
                        <div style="display:flex;flex-direction:column;min-width:160px;">
                            <label style="font-size:0.8rem;">Stile Divisa</label>
                            <select name="uniformStyle" id="uniform-style" style="padding:6px;border-radius:6px;">
                                <option value="solid" ${(!team?.uniformStyle || team.uniformStyle === 'solid') ? 'selected' : ''}>Tinta Unita</option>
                                <option value="stripes-vertical" ${team?.uniformStyle === 'stripes-vertical' ? 'selected' : ''}>Strisce Verticali</option>
                                <option value="stripes-horizontal" ${team?.uniformStyle === 'stripes-horizontal' ? 'selected' : ''}>Strisce Orizzontali</option>
                                <option value="diagonal" ${team?.uniformStyle === 'diagonal' ? 'selected' : ''}>Diagonale</option>
                            </select>
                        </div>
                    </div>
                    <div style="margin-top:0.75rem;display:flex;gap:0.5rem;align-items:center;">
                        <div id="jersey-preview" style="width:72px;height:84px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:6px;background:linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01));box-shadow:0 6px 18px rgba(0,0,0,0.06);">
                            ${ (typeof Utils !== 'undefined' && typeof Utils.generateJerseySVG === 'function') ? Utils.generateJerseySVG(team?.primaryColor || (team?.colors && team.colors[0]) || '#1e40af', team?.secondaryColor || (team?.colors && team.colors[1]) || '#ffffff', team?.accentColor || (team?.colors && team.colors[2]) || '#ffffff', team?.uniformStyle || 'solid', 56, 72) : '<div style="width:48px;height:58px;background:#ddd;border-radius:6px;"></div>' }
                        </div>
                        <small style="color: var(--color-gray-600);">Anteprima Divisa</small>
                    </div>
                </div>

                <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    ${isEdit ? `
                        <button type="button" class="btn btn-danger" onclick="TeamsModule.deleteTeam('${teamId}')">
                            <i data-lucide="trash-2"></i> Elimina
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">
                        Annulla
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i data-lucide="save"></i> ${isEdit ? 'Salva' : 'Crea'}
                    </button>
                </div>
            </form>
        `;

        UI.showModal(isEdit ? 'Modifica Squadra' : 'Nuova Squadra', modalBody);
        
        const formEl = document.getElementById('team-form');
        formEl.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTeam(teamId);
        });

        // New: Color selectors and live preview handlers
        const primaryInput = document.getElementById('primary-color');
        const secondaryInput = document.getElementById('secondary-color');
        const accentInput = document.getElementById('accent-color');
        const styleSelect = document.getElementById('uniform-style');
        const previewContainer = document.getElementById('jersey-preview');

        function updateJerseyPreview() {
            try {
                const p = primaryInput.value;
                const s = secondaryInput.value;
                const a = accentInput.value;
                const st = styleSelect.value;
                if (typeof Utils !== 'undefined' && typeof Utils.generateJerseySVG === 'function') {
                    previewContainer.innerHTML = Utils.generateJerseySVG(p, s, a, st, 56, 72);
                }
            } catch (e) { /* ignore */ }
        }

        [primaryInput, secondaryInput, accentInput, styleSelect].forEach(el => {
            if (!el) return;
            el.addEventListener('input', updateJerseyPreview);
        });

        // initialize preview
        setTimeout(() => updateJerseyPreview(), 50);

        // Keep legacy colors array in sync (for backward compatibility)
        function syncColorsArray() {
            const colorsArr = [primaryInput.value, secondaryInput.value, accentInput.value].filter(Boolean);
            const hiddenColors = formEl.querySelector('input[name="colors"]');
            if (hiddenColors) hiddenColors.value = JSON.stringify(colorsArr);
        }

        [primaryInput, secondaryInput, accentInput].forEach(el => el && el.addEventListener('input', syncColorsArray));

        lucide.createIcons();
    },

    saveTeam(teamId = null) {
        const form = document.getElementById('team-form');
        const formData = new FormData(form);
        const colorsRaw = formData.get('colors');
        let colorsArray = [];
        try { colorsArray = JSON.parse(colorsRaw || '[]'); } catch (e) { colorsArray = []; }

        // Ensure colorsArray is limited to MAX_COLORS and unique
        const uniqueColors = Array.from(new Set(colorsArray || [])).slice(0, 3);

        const primaryColor = formData.get('primaryColor') || '#1e40af';
        const secondaryColor = formData.get('secondaryColor') || '';
        const accentColor = formData.get('accentColor') || '';
        const uniformStyle = formData.get('uniformStyle') || 'solid';

        const teamData = {
            name: formData.get('name'),
            category: formData.get('category'),
            description: formData.get('description'),
            colors: [primaryColor, secondaryColor, accentColor].filter(Boolean),
            primaryColor,
            secondaryColor,
            accentColor,
            uniformStyle,
            primaryColorFallback: primaryColor
        };
        console.log('[TEAMS] Dati raccolti dal form:', teamData);
        UI.showToast('Salvataggio squadra in corso...', 'info');
        if (!teamData.name || !teamData.category) {
            UI.showToast('Nome e categoria sono obbligatori', 'danger');
            return;
        }
        let result;
        if (teamId) {
            result = appState.updateTeam(teamId, teamData);
            console.log('[TEAMS] Squadra aggiornata:', result);
        } else {
            result = appState.addTeam(teamData);
            console.log('[TEAMS] Squadra creata:', result);
        }
        setTimeout(() => {
            this.render();
        }, 200);
        UI.closeModal();
        UI.showToast(teamId ? 'Squadra aggiornata' : 'Squadra creata', 'success');
    },

    deleteTeam(teamId) {
        if (confirm('Sei sicuro di voler eliminare questa squadra? Gli atleti non verranno eliminati.')) {
            // Rimuovi la squadra dagli atleti
            const athletes = appState.getAthletes().filter(a => a.teamId === teamId);
            athletes.forEach(a => {
                appState.updateAthlete(a.id, { teamId: '' });
            });

            appState.deleteTeam(teamId);
            UI.closeModal();
            UI.showToast('Squadra eliminata', 'success');
        }
    },

    /**
     * Crea una convocazione/distinta
     */
    createCallup(teamId) {
        const team = appState.getTeam(teamId);
        if (!team) return;

        const athletes = appState.getAthletes().filter(a => a.teamId === teamId && a.active);

        if (athletes.length === 0) {
            alert('Non ci sono atleti attivi in questa squadra');
            return;
        }

        const modalBody = `
            <form id="callup-form" class="form">
                <div class="form-group">
                    <label>Evento *</label>
                    <input type="text" name="eventName" required placeholder="Es: Partita vs ASD Rivale">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Data *</label>
                        <input type="date" name="date" required>
                    </div>
                    <div class="form-group">
                        <label>Ora *</label>
                        <input type="time" name="time" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>Luogo</label>
                    <input type="text" name="location" placeholder="Es: Campo Comunale">
                </div>

                <div class="form-group">
                    <label>Seleziona Atleti Convocati</label>
                    <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--color-gray-300); border-radius: var(--radius-md); padding: 1rem;">
                        ${athletes.map(a => `
                            <label style="display: block; padding: 0.5rem; cursor: pointer;" class="callup-athlete-item">
                                <input type="checkbox" name="athletes" value="${a.id}" checked>
                                <strong>${a.firstName} ${a.lastName}</strong>
                                <span style="margin-left: 0.5rem; color: var(--color-gray-600);">(${a.role})</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">
                        Annulla
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i data-lucide="file-text"></i> Genera PDF
                    </button>
                </div>
            </form>

            <style>
                .callup-athlete-item:hover {
                    background-color: var(--color-gray-50);
                    border-radius: var(--radius-sm);
                }
            </style>
        `;

        UI.showModal(`Convocazione - ${team.name}`, modalBody);
        
        document.getElementById('callup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateCallupPDF(teamId);
        });
        
        lucide.createIcons();
    },

    /**
     * Genera PDF della convocazione (placeholder per futura implementazione)
     */
    generateCallupPDF(teamId) {
        const form = document.getElementById('callup-form');
        const formData = new FormData(form);
        const selectedAthletes = formData.getAll('athletes');

        if (selectedAthletes.length === 0) {
            alert('Seleziona almeno un atleta');
            return;
        }

        // TODO: Implementare generazione PDF con jsPDF
        alert(`📄 Funzionalità in arrivo!\n\nVerrà generato un PDF con:\n- ${selectedAthletes.length} atleti convocati\n- Evento: ${formData.get('eventName')}\n- Data: ${formData.get('date')} ${formData.get('time')}`);
        
        UI.closeModal();
        UI.showToast('Convocazione creata', 'success');
    },

    showTeamDetails(teamId) {
        // Mostra il form di modifica della squadra
        this.showTeamForm(teamId);
    },
};
