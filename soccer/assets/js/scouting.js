/**
 * SCOUTING.JS
 * Modulo Osservazione Atleti Esterni
 * - Schede tecniche atleti esterni
 * - Valutazioni tecniche
 * - Mappa ruoli visuale
 * - Watchlist prossima stagione
 */

class ScoutingManager {
    constructor() {
        this.prospects = this.loadProspects();
        this.watchlist = this.loadWatchlist();
    }
    
    showScoutingDashboard() {
        const stats = this.getStats();
        const html = `
            <div class="scouting-dashboard">
                <div class="section-header">
                    <h2><i data-lucide="binoculars"></i> Scouting & Osservazione</h2>
                    <button class="btn btn-primary" onclick="scoutingManager.showAddProspectForm()">
                        <i data-lucide="user-plus"></i>
                        Nuovo Prospetto
                    </button>
                </div>
                <!-- Stats Overview -->
                <div class="scouting-stats">
                    <div class="stat-card">
                        <div class="stat-icon bg-blue">
                            <i data-lucide="eye"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.inObservation}</h3>
                            <p>In Osservazione</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-green">
                            <i data-lucide="star"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.watchlist}</h3>
                            <p>Watchlist</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-orange">
                            <i data-lucide="users"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.contacted}</h3>
                            <p>Contattati</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-purple">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.total}</h3>
                            <p>Totale Prospetti</p>
                        </div>
                    </div>
                </div>
                <!-- Tabs -->
                <div class="scouting-tabs">
                    <button class="tab-btn active" data-tab="all" onclick="scoutingManager.switchTab('all')">
                        <i data-lucide="list"></i>
                        Tutti i Prospetti
                    </button>
                    <button class="tab-btn" data-tab="watchlist" onclick="scoutingManager.switchTab('watchlist')">
                        <i data-lucide="star"></i>
                        Watchlist
                    </button>
                    <button class="tab-btn" data-tab="map" onclick="scoutingManager.switchTab('map')">
                        <i data-lucide="map"></i>
                        Mappa Ruoli
                    </button>
                </div>
                <!-- Content Area -->
                <div id="scoutingContent">
                    ${this.renderProspectsList()}
                </div>
            </div>
        `;
        const section = document.getElementById('scouting-section');
        if (section) {
            section.querySelector('#scouting-section-content').innerHTML = html;
            document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
            section.classList.add('active');
        }
        Utils.initLucideIcons();
    }
    
    switchTab(tab) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Render content
        const content = document.getElementById('scoutingContent');
        
        switch(tab) {
            case 'all':
                content.innerHTML = this.renderProspectsList();
                break;
            case 'watchlist':
                content.innerHTML = this.renderWatchlist();
                break;
            case 'map':
                content.innerHTML = this.renderRolesMap();
                break;
        }
        
        Utils.initLucideIcons();
    }
    
    renderProspectsList() {
        const prospects = this.prospects;
        
        if (prospects.length === 0) {
            return `
                <div class="empty-state">
                    <i data-lucide="binoculars"></i>
                    <h3>Nessun Prospetto</h3>
                    <p>Inizia a osservare atleti esterni per la prossima stagione</p>
                </div>
            `;
        }
        
        const statusFilters = ['all', 'in_osservazione', 'contattato', 'trattativa', 'acquisito', 'scartato'];
        
        return `
            <div class="prospects-container">
                <!-- Filters -->
                <div class="prospects-filters">
                    <div class="search-box">
                        <i data-lucide="search"></i>
                        <input type="text" id="prospectSearch" placeholder="Cerca per nome, squadra o ruolo..." 
                               onkeyup="scoutingManager.filterProspects()">
                    </div>
                    <select id="statusFilter" class="form-input" onchange="scoutingManager.filterProspects()">
                        <option value="all">Tutti gli stati</option>
                        <option value="in_osservazione">In Osservazione</option>
                        <option value="contattato">Contattato</option>
                        <option value="trattativa">In Trattativa</option>
                        <option value="acquisito">Acquisito</option>
                        <option value="scartato">Scartato</option>
                    </select>
                    <select id="roleFilter" class="form-input" onchange="scoutingManager.filterProspects()">
                        <option value="all">Tutti i ruoli</option>
                        <option value="Portiere">Portiere</option>
                        <option value="Difensore">Difensore</option>
                        <option value="Centrocampista">Centrocampista</option>
                        <option value="Attaccante">Attaccante</option>
                    </select>
                </div>
                
                <!-- Prospects Grid -->
                <div class="prospects-grid" id="prospectsGrid">
                    ${prospects.map(p => this.renderProspectCard(p)).join('')}
                </div>
            </div>
        `;
    }
    
    renderProspectCard(prospect) {
        const statusColors = {
            in_osservazione: 'blue',
            contattato: 'orange',
            trattativa: 'purple',
            acquisito: 'green',
            scartato: 'gray'
        };
        
        const statusLabels = {
            in_osservazione: 'In Osservazione',
            contattato: 'Contattato',
            trattativa: 'In Trattativa',
            acquisito: 'Acquisito',
            scartato: 'Scartato'
        };
        
        const isWatchlist = this.watchlist.includes(prospect.id);
        const avgRating = this.calculateAvgRating(prospect.ratings);
        
        return `
            <div class="prospect-card" data-id="${prospect.id}" data-role="${prospect.role}" data-status="${prospect.status}">
                <div class="prospect-header">
                    <div class="prospect-avatar">${prospect.name.charAt(0)}</div>
                    <div class="prospect-info">
                        <h3>${prospect.name}</h3>
                        <p class="prospect-age">${prospect.age} anni • ${prospect.role}</p>
                        <p class="prospect-team">${prospect.currentTeam || 'Squadra non specificata'}</p>
                    </div>
                    <button class="watchlist-btn ${isWatchlist ? 'active' : ''}" 
                            onclick="scoutingManager.toggleWatchlist('${prospect.id}')">
                        <i data-lucide="star"></i>
                    </button>
                </div>
                
                <div class="prospect-rating">
                    <div class="rating-bar">
                        <div class="rating-fill" style="width: ${avgRating * 10}%"></div>
                    </div>
                    <span class="rating-value">${avgRating}/10</span>
                </div>
                
                <div class="prospect-status status-${statusColors[prospect.status]}">
                    ${statusLabels[prospect.status]}
                </div>
                
                <div class="prospect-actions">
                    <button class="btn btn-secondary btn-sm" onclick="scoutingManager.viewProspect('${prospect.id}')">
                        <i data-lucide="eye"></i>
                        Visualizza
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="scoutingManager.editProspect('${prospect.id}')">
                        <i data-lucide="edit"></i>
                        Modifica
                    </button>
                </div>
            </div>
        `;
    }
    
    renderWatchlist() {
        const watchlistProspects = this.prospects.filter(p => this.watchlist.includes(p.id));
        
        if (watchlistProspects.length === 0) {
            return `
                <div class="empty-state">
                    <i data-lucide="star"></i>
                    <h3>Watchlist Vuota</h3>
                    <p>Aggiungi i prospetti più interessanti alla watchlist per la prossima stagione</p>
                </div>
            `;
        }
        
        return `
            <div class="watchlist-container">
                <div class="watchlist-header">
                    <h3><i data-lucide="star"></i> Lista Desideri - Stagione ${new Date().getFullYear() + 1}/${new Date().getFullYear() + 2}</h3>
                    <button class="btn btn-primary" onclick="scoutingManager.exportWatchlist()">
                        <i data-lucide="download"></i>
                        Esporta PDF
                    </button>
                </div>
                
                <div class="watchlist-grid">
                    ${watchlistProspects.map(p => this.renderWatchlistCard(p)).join('')}
                </div>
            </div>
        `;
    }
    
    renderWatchlistCard(prospect) {
        const avgRating = this.calculateAvgRating(prospect.ratings);
        
        return `
            <div class="watchlist-card">
                <div class="priority-badge priority-${prospect.priority || 'medium'}">
                    ${prospect.priority === 'high' ? 'Priorità Alta' : prospect.priority === 'low' ? 'Priorità Bassa' : 'Priorità Media'}
                </div>
                
                <div class="watchlist-info">
                    <h4>${prospect.name}</h4>
                    <p>${prospect.age} anni • ${prospect.role}</p>
                    <p class="current-team">${prospect.currentTeam}</p>
                </div>
                
                <div class="watchlist-rating">
                    <div class="rating-stars">
                        ${'★'.repeat(Math.round(avgRating / 2))}${'☆'.repeat(5 - Math.round(avgRating / 2))}
                    </div>
                    <span>${avgRating}/10</span>
                </div>
                
                <div class="watchlist-actions">
                    <button class="btn btn-sm btn-secondary" onclick="scoutingManager.viewProspect('${prospect.id}')">
                        Dettagli
                    </button>
                    <button class="btn btn-sm" onclick="scoutingManager.setPriority('${prospect.id}')">
                        <i data-lucide="flag"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderRolesMap() {
        const byRole = {
            'Portiere': this.prospects.filter(p => p.role === 'Portiere'),
            'Difensore': this.prospects.filter(p => p.role === 'Difensore'),
            'Centrocampista': this.prospects.filter(p => p.role === 'Centrocampista'),
            'Attaccante': this.prospects.filter(p => p.role === 'Attaccante')
        };
        
        return `
            <div class="roles-map-container">
                <h3><i data-lucide="map"></i> Mappa Prospetti per Ruolo</h3>
                
                <div class="field-map">
                    <div class="field-zone attackers">
                        <h4>Attaccanti (${byRole['Attaccante'].length})</h4>
                        <div class="prospects-in-zone">
                            ${byRole['Attaccante'].slice(0, 5).map(p => `
                                <div class="zone-prospect" onclick="scoutingManager.viewProspect('${p.id}')">
                                    <div class="zone-prospect-avatar">${p.name.charAt(0)}</div>
                                    <span>${p.name.split(' ')[0]}</span>
                                    ${this.watchlist.includes(p.id) ? '<i data-lucide="star" class="watchlist-icon"></i>' : ''}
                                </div>
                            `).join('')}
                            ${byRole['Attaccante'].length > 5 ? `<div class="more-prospects">+${byRole['Attaccante'].length - 5}</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="field-zone midfielders">
                        <h4>Centrocampisti (${byRole['Centrocampista'].length})</h4>
                        <div class="prospects-in-zone">
                            ${byRole['Centrocampista'].slice(0, 5).map(p => `
                                <div class="zone-prospect" onclick="scoutingManager.viewProspect('${p.id}')">
                                    <div class="zone-prospect-avatar">${p.name.charAt(0)}</div>
                                    <span>${p.name.split(' ')[0]}</span>
                                    ${this.watchlist.includes(p.id) ? '<i data-lucide="star" class="watchlist-icon"></i>' : ''}
                                </div>
                            `).join('')}
                            ${byRole['Centrocampista'].length > 5 ? `<div class="more-prospects">+${byRole['Centrocampista'].length - 5}</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="field-zone defenders">
                        <h4>Difensori (${byRole['Difensore'].length})</h4>
                        <div class="prospects-in-zone">
                            ${byRole['Difensore'].slice(0, 5).map(p => `
                                <div class="zone-prospect" onclick="scoutingManager.viewProspect('${p.id}')">
                                    <div class="zone-prospect-avatar">${p.name.charAt(0)}</div>
                                    <span>${p.name.split(' ')[0]}</span>
                                    ${this.watchlist.includes(p.id) ? '<i data-lucide="star" class="watchlist-icon"></i>' : ''}
                                </div>
                            `).join('')}
                            ${byRole['Difensore'].length > 5 ? `<div class="more-prospects">+${byRole['Difensore'].length - 5}</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="field-zone goalkeepers">
                        <h4>Portieri (${byRole['Portiere'].length})</h4>
                        <div class="prospects-in-zone">
                            ${byRole['Portiere'].slice(0, 3).map(p => `
                                <div class="zone-prospect" onclick="scoutingManager.viewProspect('${p.id}')">
                                    <div class="zone-prospect-avatar">${p.name.charAt(0)}</div>
                                    <span>${p.name.split(' ')[0]}</span>
                                    ${this.watchlist.includes(p.id) ? '<i data-lucide="star" class="watchlist-icon"></i>' : ''}
                                </div>
                            `).join('')}
                            ${byRole['Portiere'].length > 3 ? `<div class="more-prospects">+${byRole['Portiere'].length - 3}</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    showAddProspectForm() {
        const html = `
            <div class="prospect-form-modal">
                <div class="form-container">
                    <div class="form-header">
                        <button class="btn-icon" onclick="scoutingManager.showScoutingDashboard()">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <h2><i data-lucide="user-plus"></i> Nuovo Prospetto</h2>
                    </div>
                    <form id="prospectForm" onsubmit="scoutingManager.saveProspect(event)">
                        <!-- Anagrafica -->
                        <div class="form-section">
                            <h3>Dati Anagrafici</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Nome Completo *</label>
                                    <input type="text" name="name" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label>Età *</label>
                                    <input type="number" name="age" class="form-input" min="5" max="40" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Ruolo *</label>
                                    <select name="role" class="form-input" required>
                                        <option value="">Seleziona ruolo</option>
                                        <option value="Portiere">Portiere</option>
                                        <option value="Difensore">Difensore</option>
                                        <option value="Centrocampista">Centrocampista</option>
                                        <option value="Attaccante">Attaccante</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Squadra Attuale</label>
                                    <input type="text" name="currentTeam" class="form-input">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Telefono</label>
                                    <input type="tel" name="phone" class="form-input">
                                </div>
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" name="email" class="form-input">
                                </div>
                            </div>
                        </div>
                        <!-- Valutazioni Tecniche -->
                        <div class="form-section">
                            <h3>Valutazioni Tecniche (1-10)</h3>
                            <div class="ratings-grid">
                                <div class="rating-input">
                                    <label>Tecnica</label>
                                    <input type="number" name="rating_tecnica" class="form-input" min="1" max="10" value="5">
                                </div>
                                <div class="rating-input">
                                    <label>Fisico</label>
                                    <input type="number" name="rating_fisico" class="form-input" min="1" max="10" value="5">
                                </div>
                                <div class="rating-input">
                                    <label>Velocità</label>
                                    <input type="number" name="rating_velocita" class="form-input" min="1" max="10" value="5">
                                </div>
                                <div class="rating-input">
                                    <label>Tattica</label>
                                    <input type="number" name="rating_tattica" class="form-input" min="1" max="10" value="5">
                                </div>
                                <div class="rating-input">
                                    <label>Mentalità</label>
                                    <input type="number" name="rating_mentalita" class="form-input" min="1" max="10" value="5">
                                </div>
                                <div class="rating-input">
                                    <label>Potenziale</label>
                                    <input type="number" name="rating_potenziale" class="form-input" min="1" max="10" value="5">
                                </div>
                            </div>
                        </div>
                        <!-- Stato e Note -->
                        <div class="form-section">
                            <h3>Stato e Note Scout</h3>
                            <div class="form-group">
                                <label>Stato</label>
                                <select name="status" class="form-input">
                                    <option value="in_osservazione">In Osservazione</option>
                                    <option value="contattato">Contattato</option>
                                    <option value="trattativa">In Trattativa</option>
                                    <option value="acquisito">Acquisito</option>
                                    <option value="scartato">Scartato</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Note Scout</label>
                                <textarea name="notes" class="form-input" rows="4" 
                                          placeholder="Osservazioni, punti di forza, aree di miglioramento..."></textarea>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="addToWatchlist">
                                    <span>Aggiungi alla Watchlist</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="scoutingManager.showScoutingDashboard()">
                                Annulla
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i data-lucide="save"></i>
                                Salva Prospetto
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        const section = document.getElementById('scouting-section');
        if (section) {
            section.querySelector('#scouting-section-content').innerHTML = html;
            document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
            section.classList.add('active');
        }
        Utils.initLucideIcons();
    }
    
    saveProspect(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const prospect = {
            id: Date.now().toString(),
            name: formData.get('name'),
            age: parseInt(formData.get('age')),
            role: formData.get('role'),
            currentTeam: formData.get('currentTeam') || '',
            phone: formData.get('phone') || '',
            email: formData.get('email') || '',
            ratings: {
                tecnica: parseInt(formData.get('rating_tecnica')),
                fisico: parseInt(formData.get('rating_fisico')),
                velocita: parseInt(formData.get('rating_velocita')),
                tattica: parseInt(formData.get('rating_tattica')),
                mentalita: parseInt(formData.get('rating_mentalita')),
                potenziale: parseInt(formData.get('rating_potenziale'))
            },
            status: formData.get('status'),
            notes: formData.get('notes') || '',
            dateAdded: new Date().toISOString(),
            priority: 'medium'
        };
        
        this.prospects.push(prospect);
        this.saveProspects();
        
        if (formData.get('addToWatchlist')) {
            this.watchlist.push(prospect.id);
            this.saveWatchlistData();
        }
        
        Utils.showToast('Prospetto salvato!', 'success');
        Utils.hapticFeedback('success');
        
        this.showScoutingDashboard();
    }
    
    viewProspect(id) {
        const prospect = this.prospects.find(p => p.id === id);
        if (!prospect) return;
        
        const isWatchlist = this.watchlist.includes(id);
        const avgRating = this.calculateAvgRating(prospect.ratings);
        
        const html = `
            <div class="prospect-view-modal">
                <div class="view-container">
                    <div class="view-header">
                        <button class="btn-icon" onclick="scoutingManager.showScoutingDashboard()">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <h2>Scheda Tecnica</h2>
                    </div>
                    <div class="view-content">
                        <!-- Header Info -->
                        <div class="prospect-detail-header">
                            <div class="prospect-detail-avatar">${prospect.name.charAt(0)}</div>
                            <div class="prospect-detail-info">
                                <h1>${prospect.name}</h1>
                                <p>${prospect.age} anni • ${prospect.role}</p>
                                <p class="current-team-detail">${prospect.currentTeam || 'Squadra non specificata'}</p>
                            </div>
                            <div class="overall-rating">
                                <div class="rating-circle">
                                    <span>${avgRating}</span>
                                </div>
                                <p>Valutazione Media</p>
                            </div>
                        </div>
                        <!-- Ratings Chart -->
                        <div class="ratings-section">
                            <h3>Valutazioni Tecniche</h3>
                            <div class="ratings-chart">
                                ${Object.entries(prospect.ratings).map(([key, value]) => `
                                    <div class="rating-bar-item">
                                        <label>${this.capitalizeFirst(key)}</label>
                                        <div class="rating-bar-container">
                                            <div class="rating-bar-fill" style="width: ${value * 10}%"></div>
                                            <span class="rating-value">${value}/10</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <!-- Contact Info -->
                        ${prospect.phone || prospect.email ? `
                            <div class="contact-section">
                                <h3>Contatti</h3>
                                ${prospect.phone ? `<p><i data-lucide="phone"></i> ${prospect.phone}</p>` : ''}
                                ${prospect.email ? `<p><i data-lucide="mail"></i> ${prospect.email}</p>` : ''}
                            </div>
                        ` : ''}
                        <!-- Notes -->
                        ${prospect.notes ? `
                            <div class="notes-section">
                                <h3>Note Scout</h3>
                                <p>${prospect.notes}</p>
                            </div>
                        ` : ''}
                        <!-- Status Update -->
                        <div class="status-update-section">
                            <h3>Aggiorna Stato</h3>
                            <select class="form-input" onchange="scoutingManager.updateStatus('${id}', this.value)">
                                <option value="in_osservazione" ${prospect.status === 'in_osservazione' ? 'selected' : ''}>In Osservazione</option>
                                <option value="contattato" ${prospect.status === 'contattato' ? 'selected' : ''}>Contattato</option>
                                <option value="trattativa" ${prospect.status === 'trattativa' ? 'selected' : ''}>In Trattativa</option>
                                <option value="acquisito" ${prospect.status === 'acquisito' ? 'selected' : ''}>Acquisito</option>
                                <option value="scartato" ${prospect.status === 'scartato' ? 'selected' : ''}>Scartato</option>
                            </select>
                        </div>
                        <!-- Action Bar Ordinata -->
                        <div class="prospect-action-bar" style="display:flex;gap:0.5rem;justify-content:center;margin-top:2rem;flex-wrap:wrap;">
                            <button class="btn ${isWatchlist ? 'btn-primary' : 'btn-secondary'}" onclick="scoutingManager.toggleWatchlist('${id}')">
                                <i data-lucide="star"></i> ${isWatchlist ? 'In Watchlist' : 'Aggiungi a Watchlist'}
                            </button>
                            <button class="btn btn-primary" onclick="scoutingManager.editProspect('${id}')">
                                <i data-lucide="edit"></i> Modifica
                            </button>
                            <button class="btn btn-secondary" onclick="scoutingManager.showScoutingDashboard()">
                                <i data-lucide="arrow-left"></i> Indietro
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const section = document.getElementById('scouting-section');
        if (section) {
            section.querySelector('#scouting-section-content').innerHTML = html;
            document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
            section.classList.add('active');
        }
        Utils.initLucideIcons();
    }
    
    editProspect(id) {
        const prospect = this.prospects.find(p => p.id === id);
        if (!prospect) return;

        const html = `
            <div class="prospect-form-container">
                <h2><i data-lucide="edit"></i> Modifica Prospetto</h2>
                <form id="editProspectForm">
                    <div class="form-group">
                        <label>Nome</label>
                        <input type="text" class="form-input" id="editProspectName" value="${prospect.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Età</label>
                        <input type="number" class="form-input" id="editProspectAge" value="${prospect.age}" min="10" max="50" required>
                    </div>
                    <div class="form-group">
                        <label>Ruolo</label>
                        <select class="form-input" id="editProspectRole" required>
                            <option value="Portiere" ${prospect.role === 'Portiere' ? 'selected' : ''}>Portiere</option>
                            <option value="Difensore" ${prospect.role === 'Difensore' ? 'selected' : ''}>Difensore</option>
                            <option value="Centrocampista" ${prospect.role === 'Centrocampista' ? 'selected' : ''}>Centrocampista</option>
                            <option value="Attaccante" ${prospect.role === 'Attaccante' ? 'selected' : ''}>Attaccante</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Squadra attuale</label>
                        <input type="text" class="form-input" id="editProspectTeam" value="${prospect.currentTeam || ''}">
                    </div>
                    <div class="form-group">
                        <label>Telefono</label>
                        <input type="text" class="form-input" id="editProspectPhone" value="${prospect.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-input" id="editProspectEmail" value="${prospect.email || ''}">
                    </div>
                    <div class="form-group">
                        <label>Note</label>
                        <textarea class="form-input" id="editProspectNotes">${prospect.notes || ''}</textarea>
                    </div>
                    <div class="form-actions" style="display:flex;gap:0.5rem;justify-content:center;">
                        <button type="button" class="btn btn-primary" onclick="scoutingManager.saveProspectEdit('${id}')">Salva</button>
                        <button type="button" class="btn btn-secondary" onclick="scoutingManager.viewProspect('${id}')">Annulla</button>
                    </div>
                </form>
            </div>
        `;
        const section = document.getElementById('scouting-section');
        if (section) {
            section.querySelector('#scouting-section-content').innerHTML = html;
            document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
            section.classList.add('active');
        }
        Utils.initLucideIcons();
    }

    saveProspectEdit(id) {
        const prospect = this.prospects.find(p => p.id === id);
        if (!prospect) return;
        prospect.name = document.getElementById('editProspectName').value.trim();
        prospect.age = parseInt(document.getElementById('editProspectAge').value, 10);
        prospect.role = document.getElementById('editProspectRole').value;
        prospect.currentTeam = document.getElementById('editProspectTeam').value.trim();
        prospect.phone = document.getElementById('editProspectPhone').value.trim();
        prospect.email = document.getElementById('editProspectEmail').value.trim();
        prospect.notes = document.getElementById('editProspectNotes').value.trim();
        this.saveProspects();
        Utils.showToast('Prospetto aggiornato', 'success');
        this.viewProspect(id);
    }
    
    toggleWatchlist(id) {
        const index = this.watchlist.indexOf(id);
        if (index > -1) {
            this.watchlist.splice(index, 1);
            Utils.showToast('Rimosso dalla watchlist', 'info');
        } else {
            this.watchlist.push(id);
            Utils.showToast('Aggiunto alla watchlist', 'success');
        }
        this.saveWatchlistData();
        this.showScoutingDashboard();
    }
    
    updateStatus(id, status) {
        const prospect = this.prospects.find(p => p.id === id);
        if (prospect) {
            prospect.status = status;
            this.saveProspects();
            Utils.showToast('Stato aggiornato', 'success');
        }
    }
    
    setPriority(id) {
        const prospect = this.prospects.find(p => p.id === id);
        if (!prospect) return;
        
        const priorities = ['low', 'medium', 'high'];
        const currentIndex = priorities.indexOf(prospect.priority || 'medium');
        const nextIndex = (currentIndex + 1) % priorities.length;
        prospect.priority = priorities[nextIndex];
        
        this.saveProspects();
        this.showScoutingDashboard();
        this.switchTab('watchlist');
    }
    
    filterProspects() {
        const search = document.getElementById('prospectSearch')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const roleFilter = document.getElementById('roleFilter')?.value || 'all';
        
        const cards = document.querySelectorAll('.prospect-card');
        
        cards.forEach(card => {
            const id = card.dataset.id;
            const prospect = this.prospects.find(p => p.id === id);
            
            const matchesSearch = prospect.name.toLowerCase().includes(search) ||
                                prospect.currentTeam?.toLowerCase().includes(search) ||
                                prospect.role.toLowerCase().includes(search);
            const matchesStatus = statusFilter === 'all' || prospect.status === statusFilter;
            const matchesRole = roleFilter === 'all' || prospect.role === roleFilter;
            
            card.style.display = matchesSearch && matchesStatus && matchesRole ? 'block' : 'none';
        });
    }
    
    exportWatchlist() {
        Utils.showToast('Export PDF in sviluppo', 'info');
    }
    
    calculateAvgRating(ratings) {
        const values = Object.values(ratings);
        const sum = values.reduce((a, b) => a + b, 0);
        return (sum / values.length).toFixed(1);
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    getStats() {
        return {
            total: this.prospects.length,
            inObservation: this.prospects.filter(p => p.status === 'in_osservazione').length,
            contacted: this.prospects.filter(p => p.status === 'contattato').length,
            watchlist: this.watchlist.length
        };
    }
    
    loadProspects() {
        return JSON.parse(localStorage.getItem('scoutingProspects') || '[]');
    }
    
    saveProspects() {
        localStorage.setItem('scoutingProspects', JSON.stringify(this.prospects));
    }
    
    loadWatchlist() {
        return JSON.parse(localStorage.getItem('scoutingWatchlist') || '[]');
    }
    
    saveWatchlistData() {
        localStorage.setItem('scoutingWatchlist', JSON.stringify(this.watchlist));
    }
}

// Global instance
const scoutingManager = new ScoutingManager();
window.scoutingManager = scoutingManager;
