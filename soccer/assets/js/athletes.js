/**
 * ATHLETES.JS
 * Modulo per la gestione degli atleti
 * Rendering, filtri, form di aggiunta/modifica
 */

const AthletesModule = {
    /**
     * Inizializza il modulo atleti
     */
    init() {
        console.log('⚽ Inizializzazione modulo Atleti');
        
        // Bind eventi dopo che il DOM è pronto
        setTimeout(() => this.bindEvents(), 100);
        this.render();
        
        // Subscribe agli eventi dello stato
        appState.subscribe('athletes:added', () => this.render());
        appState.subscribe('athletes:updated', () => this.render());
        appState.subscribe('athletes:deleted', () => this.render());
        appState.subscribe('filters:changed', () => this.render());
    },

    /**
     * Binding eventi UI
     */
    bindEvents() {
        // Bottone aggiungi atleta
        document.getElementById('add-athlete-btn')?.addEventListener('click', () => {
            this.showAthleteForm();
        });

        // Bottone esporta PDF atleti (esporta tutti gli atleti in un unico PDF)
        document.getElementById('export-athletes-pdf-btn')?.addEventListener('click', () => {
            this.exportAllToPDF();
        });

        // Bottone ordina alfabeticamente le schede atleti
        document.getElementById('sort-athletes-alpha-btn')?.addEventListener('click', () => {
            this.toggleAlphabeticalSort();
        });

        // Filtri
        document.getElementById('athlete-search')?.addEventListener('input', (e) => {
            appState.setFilter('athleteSearch', e.target.value);
        });

        document.getElementById('filter-team')?.addEventListener('change', (e) => {
            appState.setFilter('selectedTeam', e.target.value);
        });

        document.getElementById('filter-role')?.addEventListener('change', (e) => {
            appState.setFilter('selectedRole', e.target.value);
        });

        // Carica preferenza ordinamento alfabetico (persistente)
        try { this.loadSortPreference(); } catch(e) { console.warn('loadSortPreference failed', e); }
    },

    /**
     * Renderizza la lista atleti con filtri applicati
     */
    render() {
        const container = document.getElementById('athletes-list');
        if (!container) return;

        let athletes = this.getFilteredAthletes();

        // Applica ordinamento alfabetico se attivato (cognome, poi nome)
        if (this.sortAlpha) {
            athletes = athletes.slice().sort((a,b) => {
                const an = `${a.lastName || ''} ${a.firstName || ''}`.toLowerCase();
                const bn = `${b.lastName || ''} ${b.firstName || ''}`.toLowerCase();
                return an.localeCompare(bn);
            });
            try { console.debug('AthletesModule.render: sorted (alpha) sample', athletes.slice(0,5).map(a => `${a.lastName || ''}, ${a.firstName || ''}`)); } catch(e) {}
        }

        if (athletes.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <i data-lucide="users" style="font-size: 4rem; color: var(--color-gray-400); margin-bottom: 1rem;"></i>
                    <h3>Nessun atleta trovato</h3>
                    <p style="color: var(--color-gray-600);">Inizia aggiungendo il primo atleta alla tua società</p>
                    <button class="btn btn-primary" onclick="AthletesModule.showAthleteForm()">
                        <i data-lucide="plus"></i>
                        Aggiungi Atleta
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = athletes.map(athlete => this.createAthleteCard(athlete)).join('');
        
        // Re-initialize Lucide icons
        lucide.createIcons();

        // Mostra alert scadenze documenti (breve sommario)
        this.checkDocumentExpiries();

        // Carica immagini salvate in IndexedDB (se presenti)
        setTimeout(() => this.loadBlobImages(), 50);

        // Popola il filtro squadre
        this.populateTeamFilter();

        // Assicura che il bottone Ordine alfabetico sia correttamente bindato anche dopo render o ripristino DOM
        try { this.ensureSortButtonBound(); } catch(e) { console.warn('ensureSortButtonBound failed', e); }
    },

    /**
     * Renderizza atleti e assicura che i listener siano attivi
     */
    renderAthletes() {
        this.bindEvents();
        this.render();
    },

    /**
     * Ottiene gli atleti filtrati
     */
    getFilteredAthletes() {
        let athletes = appState.getAthletes();
        const filters = appState.getFilters();

        // Filtro ricerca per nome
        if (filters.athleteSearch) {
            const search = filters.athleteSearch.toLowerCase();
            athletes = athletes.filter(a => 
                a.firstName.toLowerCase().includes(search) ||
                a.lastName.toLowerCase().includes(search)
            );
        }

        // Filtro squadra
        if (filters.selectedTeam) {
            athletes = athletes.filter(a => a.teamId === filters.selectedTeam);
        }

        // Filtro ruolo
        if (filters.selectedRole) {
            athletes = athletes.filter(a => a.role === filters.selectedRole);
        }

        return athletes;
    },

    /**
     * Crea la card HTML per un atleta
     */
    createAthleteCard(athlete) {
        const fullName = `${athlete.firstName} ${athlete.lastName}`;
        const team = appState.getTeam(athlete.teamId);
        const teamName = team ? team.name : 'Nessuna Squadra';
        
        // Calcola giorni alla scadenza visita medica
        const medicalExpiry = new Date(athlete.medicalExpiry);
        const today = new Date();
        const daysToExpiry = Math.ceil((medicalExpiry - today) / (1000 * 60 * 60 * 24));
        
        const isExpiringSoon = daysToExpiry <= 30 && daysToExpiry > 0;
        const isExpired = daysToExpiry <= 0;

        // Documento d'identità
        const hasDoc = !!athlete.idDocument;
        const docExpiryDate = athlete.idDocumentExpiry ? new Date(athlete.idDocumentExpiry) : null;
        const daysToDocExpiry = docExpiryDate ? Math.ceil((docExpiryDate - today) / (1000 * 60 * 60 * 24)) : null;
        const docExpiringSoon = daysToDocExpiry !== null && daysToDocExpiry <= 30 && daysToDocExpiry > 0;
        const docExpired = daysToDocExpiry !== null && daysToDocExpiry <= 0;

        return `
            <div class="athlete-card" onclick="AthletesModule.showAthleteDetails('${athlete.id}')">
                <div class="athlete-photo">
                    ${athlete.photo ? 
                        `<img src="${athlete.photo}" alt="${fullName}">` : (athlete.photoBlobKey ?
                        `<img id="athlete-photo-${athlete.id}" data-blob-key="${athlete.photoBlobKey}" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="${fullName}">` :
                        `<i data-lucide="user" style="font-size: 4rem; color: var(--color-gray-400);"></i>`
                    ) }
                    <span class="athlete-status ${athlete.active ? 'active' : 'inactive'}">
                        ${athlete.active ? '✓ Attivo' : '✗ Inattivo'}
                    </span>
                </div>
                <div class="athlete-info">
                    <h3 class="athlete-name">${fullName}</h3>
                    <div class="athlete-meta">
                        <span><i data-lucide="calendar"></i> ${athlete.birthDate}</span>
                        <span><i data-lucide="shield"></i> ${teamName}</span>
                        <span><i data-lucide="target"></i> ${athlete.role}</span>
                    </div>
                    ${isExpired ? 
                        `<p style="color: var(--color-danger); font-size: 0.875rem; margin-top: 0.5rem;">
                            <i data-lucide="alert-circle"></i> Visita Scaduta
                        </p>` :
                        isExpiringSoon ?
                        `<p style="color: var(--color-warning); font-size: 0.875rem; margin-top: 0.5rem;">
                            <i data-lucide="alert-triangle"></i> Scade tra ${daysToExpiry} giorni
                        </p>` : ''
                    }

                    ${hasDoc ? (
                        docExpired ?
                        `<p style="color: var(--color-danger); font-size: 0.875rem; margin-top: 0.25rem;">
                            <i data-lucide="alert-circle"></i> Documento Scaduto
                        </p>` : (
                        docExpiringSoon ?
                        `<p style="color: var(--color-warning); font-size: 0.875rem; margin-top: 0.25rem;">
                            <i data-lucide="alert-triangle"></i> Doc scade tra ${daysToDocExpiry} giorni
                        </p>` : ''
                    )) : ''}
                </div>
            </div>
        `;
    },

    /**
     * Mostra il form per aggiungere/modificare atleta
     */
    showAthleteForm(athleteId = null) {
        const athlete = athleteId ? appState.getAthlete(athleteId) : null;
        const isEdit = !!athlete;
        const teams = appState.getTeams();

        const modalBody = `
            <form id="athlete-form" class="form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" name="firstName" required value="${athlete?.firstName || ''}" 
                               placeholder="Es: Mario">
                    </div>
                    <div class="form-group">
                        <label>Cognome *</label>
                        <input type="text" name="lastName" required value="${athlete?.lastName || ''}"
                               placeholder="Es: Rossi">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Data di Nascita *</label>
                        <input type="date" name="birthDate" required value="${athlete?.birthDate || ''}">
                    </div>
                    <div class="form-group">
                        <label>Ruolo *</label>
                        <select name="role" required>
                            <option value="">Seleziona...</option>
                            <option value="Portiere" ${athlete?.role === 'Portiere' ? 'selected' : ''}>Portiere</option>
                            <option value="Difensore" ${athlete?.role === 'Difensore' ? 'selected' : ''}>Difensore</option>
                            <option value="Centrocampista" ${athlete?.role === 'Centrocampista' ? 'selected' : ''}>Centrocampista</option>
                            <option value="Attaccante" ${athlete?.role === 'Attaccante' ? 'selected' : ''}>Attaccante</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Squadra</label>
                    <select name="teamId">
                        <option value="">Nessuna Squadra</option>
                        ${teams.map(t => `
                            <option value="${t.id}" ${athlete?.teamId === t.id ? 'selected' : ''}>
                                ${t.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Scadenza Visita Medica *</label>
                    <input type="date" name="medicalExpiry" required value="${athlete?.medicalExpiry || ''}">
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" name="active" ${athlete?.active !== false ? 'checked' : ''}>
                        Tesserato Attivo
                    </label>
                </div>

                <div class="form-group">
                    <label>Note</label>
                    <textarea name="notes" rows="3" placeholder="Note aggiuntive...">${athlete?.notes || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Foto Atleta (JPEG)</label>
                        <input type="file" name="photo" accept="image/jpeg" />
                        <div id="photo-preview" class="image-preview">${athlete?.photo ? `<img src="${athlete.photo}" alt="Foto">` : ''}</div>
                    </div>
                    <div class="form-group">
                        <label>Documento d'identità (JPEG)</label>
                        <input type="file" name="idDocument" accept="image/jpeg" />
                        <div id="iddoc-preview" class="image-preview">${athlete?.idDocument ? `<img src="${athlete.idDocument}" alt="Documento">` : ''}</div>
                        <label style="margin-top:0.5rem;display:block;">Scadenza Documento</label>
                        <input type="date" name="idDocumentExpiry" value="${athlete?.idDocumentExpiry || ''}" />
                    </div>
                </div>

                <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    ${isEdit ? `
                        <button type="button" class="btn btn-danger" onclick="AthletesModule.deleteAthlete('${athleteId}')">
                            <i data-lucide="trash-2"></i> Elimina
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">
                        Annulla
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i data-lucide="save"></i> ${isEdit ? 'Salva' : 'Aggiungi'}
                    </button>
                </div>
            </form>
        `;

        // Apri modal in dimensione più ampia per evitare overflow dei campi
        UI.showModal(isEdit ? 'Modifica Atleta' : 'Nuovo Atleta', modalBody, 'large');
        
        // Bind form submit (async to support file reads)
        const formEl = document.getElementById('athlete-form');
        formEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveAthlete(athleteId);
        });

        // Preview handlers for file inputs
        const photoInput = formEl.querySelector('input[name="photo"]');
        const idDocInput = formEl.querySelector('input[name="idDocument"]');

        if (photoInput) photoInput.addEventListener('change', (e) => AthletesModule.previewFile(e.target, 'photo-preview'));
        if (idDocInput) idDocInput.addEventListener('change', (e) => AthletesModule.previewFile(e.target, 'iddoc-preview'));

        lucide.createIcons();
    },

    /**
     * Controlla scadenze documenti e mostra un breve avviso
     */
    checkDocumentExpiries() {
        const athletes = appState.getAthletes();
        const today = new Date();
        let expiring = 0;
        let expired = 0;

        athletes.forEach(a => {
            if (!a.idDocumentExpiry) return;
            const d = new Date(a.idDocumentExpiry);
            const days = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
            if (days <= 0) expired++;
            else if (days <= 30) expiring++;
        });

        if (expired > 0 || expiring > 0) {
            const parts = [];
            if (expired > 0) parts.push(`${expired} documento${expired>1?'i':'o'} scaduto${expired>1?'i':''}`);
            if (expiring > 0) parts.push(`${expiring} in scadenza entro 30 giorni`);
            UI.showToast(parts.join(' • '), expired > 0 ? 'danger' : 'warning');
        }
    },

    async loadBlobImages() {
        try {
            const container = document.getElementById('athletes-list');
            if (!container) return;
            const imgs = container.querySelectorAll('img[data-blob-key]');
            for (const img of Array.from(imgs)) {
                const key = img.dataset.blobKey;
                if (!key) continue;
                const dataURL = await Storage.getBlob(key);
                if (dataURL) img.src = dataURL;
            }
        } catch (err) {
            console.error('Errore caricamento immagini da IndexedDB', err);
        }
    },

    /**
     * Esporta tutti gli atleti in un unico PDF (una pagina per atleta)
     */
    async exportAllToPDF() {
        try {
            const athletes = appState.getAthletes();
            if (!athletes || athletes.length === 0) {
                UI.showToast('Nessun atleta da esportare', 'warning');
                return;
            }

            UI.showToast('Generazione PDF in corso...', 'info');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const pageWidth = doc.internal.pageSize.width;
            const margin = 40;
            const maxImageWidth = 120;
            const maxImageHeight = 120;

            for (let i = 0; i < athletes.length; i++) {
                const a = athletes[i];
                if (i > 0) doc.addPage();

                let y = 50;
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.text(`${a.firstName || ''} ${a.lastName || ''}`, margin, y);

                // Photo (se presente)
                try {
                    let photoData = a.photo || null;
                    if (!photoData && a.photoBlobKey && typeof Storage !== 'undefined' && typeof Storage.getBlob === 'function') {
                        photoData = await Storage.getBlob(a.photoBlobKey);
                    }
                    if (photoData) {
                        // Calcola dimensioni scala
                        let imgW = maxImageWidth;
                        let imgH = maxImageHeight;
                        // Aggiungi immagine in alto a destra
                        doc.addImage(photoData, 'JPEG', pageWidth - margin - imgW, 40, imgW, imgH);
                    }
                } catch (imgErr) {
                    console.warn('Impossibile aggiungere foto atleta al PDF', imgErr);
                }

                y += 28;
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');

                const team = appState.getTeam(a.teamId);
                const lines = [];
                lines.push(`Data di nascita: ${a.birthDate || 'N/D'}`);
                lines.push(`Squadra: ${team ? team.name : 'Nessuna'}`);
                lines.push(`Ruolo: ${a.role || 'N/D'}`);
                lines.push(`Stato: ${a.active ? 'Attivo' : 'Inattivo'}`);
                lines.push(`Visita medica: ${a.medicalExpiry || 'N/D'}`);
                if (a.idDocumentExpiry) lines.push(`Documento scadenza: ${a.idDocumentExpiry}`);
                if (a.notes) lines.push(`Note: ${a.notes}`);

                // Pagamenti / quota (se presenti)
                if (a.finance && Array.isArray(a.finance.payments) && a.finance.payments.length > 0) {
                    const paid = a.finance.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
                    lines.push(`Quota annuale: € ${Number(a.finance.annualFee || 0).toFixed(2)} - Totale pagato: € ${paid.toFixed(2)}`);
                }

                const wrapped = doc.splitTextToSize(lines.join('\n'), pageWidth - margin * 2 - maxImageWidth - 20);
                doc.text(wrapped, margin, y);

                // Allega documento d'identita' come immagine (se presente) su pagina sotto, piccolo
                try {
                    let idDoc = a.idDocument || null;
                    if (!idDoc && a.idDocumentBlobKey && typeof Storage !== 'undefined' && typeof Storage.getBlob === 'function') {
                        idDoc = await Storage.getBlob(a.idDocumentBlobKey);
                    }
                    if (idDoc) {
                        const idY = doc.internal.pageSize.height - margin - maxImageHeight - 30;
                        doc.setFontSize(10);
                        doc.text('Documento (immagine):', margin, idY - 12);
                        doc.addImage(idDoc, 'JPEG', margin, idY, maxImageWidth, maxImageHeight);
                    }
                } catch (docImgErr) {
                    console.warn('Impossibile aggiungere documento immagine atleta al PDF', docImgErr);
                }

                // Footer standard (branding, page number)
                try { PDFUtils && PDFUtils.addStandardFooter(doc, { showBranding: true }); } catch(e) { /* ignore */ }
            }

            // Salva il file
            const date = new Date().toISOString().split('T')[0];
            doc.save(`Atleti_${date}.pdf`);
            UI.showToast('PDF esportato con successo', 'success');
        } catch (err) {
            console.error('Errore esportazione PDF atleti', err);
            UI.showToast('Errore durante l\'esportazione PDF', 'danger');
        }
    },

    /**
     * Stato e toggle ordinamento alfabetico
     */
    sortAlpha: false,

    toggleAlphabeticalSort() {
        this.sortAlpha = !this.sortAlpha;
        this.saveSortPreference();
        const btn = document.getElementById('sort-athletes-alpha-btn');
        if (btn) btn.classList.toggle('active', !!this.sortAlpha);
        console.debug('AthletesModule.toggleAlphabeticalSort ->', this.sortAlpha);
        UI.showToast(this.sortAlpha ? 'Ordinamento alfabetico attivato' : 'Ordinamento alfabetico disattivato', 'success');
        this.render();
    },

    /**
     * Bind idempotente per il bottone ordine alfabetico (utile se il DOM viene reinserito)
     */
    ensureSortButtonBound() {
        try {
            const btn = document.getElementById('sort-athletes-alpha-btn');
            if (!btn) return;
            if (!btn._alphaBound) {
                btn.addEventListener('click', () => {
                    console.debug('sort-athletes-alpha-btn clicked');
                    this.toggleAlphabeticalSort();
                });
                btn._alphaBound = true;
            }
            // Set aria-pressed per accessibilità
            btn.setAttribute('aria-pressed', !!this.sortAlpha);
            btn.classList.toggle('active', !!this.sortAlpha);
        } catch (e) { console.warn('ensureSortButtonBound error', e); }
    },

    /**
     * Salva la preferenza di ordinamento in LocalStorage
     */
    saveSortPreference() {
        try {
            localStorage.setItem('athletes_sort_alpha', this.sortAlpha ? 'true' : 'false');
        } catch (e) { console.warn('saveSortPreference failed', e); }
    },

    /**
     * Carica la preferenza di ordinamento da LocalStorage
     */
    loadSortPreference() {
        try {
            const v = localStorage.getItem('athletes_sort_alpha');
            this.sortAlpha = (v === 'true');
            const btn = document.getElementById('sort-athletes-alpha-btn');
            if (btn) {
                btn.classList.toggle('active', !!this.sortAlpha);
                btn.setAttribute('aria-pressed', !!this.sortAlpha);
            }
            if (this.sortAlpha) this.render();
        } catch (e) { console.warn('loadSortPreference failed', e); }
    },

    /**
     * Mostra suggerimento categoria basato sulla data di nascita
     */
    updateCategorySuggestion(birthDate) {
        const suggestionEl = document.getElementById('category-suggestion');
        if (!suggestionEl || !birthDate) return;

        const category = appState.calculateCategory(birthDate);
        const birthYear = new Date(birthDate).getFullYear();
        if (suggestionEl) {
          suggestionEl.textContent = `📋 Categoria suggerita: ${category} (anno ${birthYear})`;
        }
    },

    // Legge file come dataURL e ridimensiona/comprime se immagine
    readFileAsDataURL(file, maxDim = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('File non fornito'));

            // Limite dimensione file originale (es. 8MB)
            if (file.size && file.size > 8 * 1024 * 1024) {
                return reject(new Error('File troppo grande (max 8MB)'));
            }

            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    try {
                        // Se non è immagine, ritorna il dataURL originale
                        if (!file.type || !file.type.startsWith('image/')) {
                            return resolve(reader.result);
                        }

                        const width = img.width;
                        const height = img.height;
                        let newWidth = width;
                        let newHeight = height;

                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                newWidth = maxDim;
                                newHeight = Math.round((height / width) * maxDim);
                            } else {
                                newHeight = maxDim;
                                newWidth = Math.round((width / height) * maxDim);
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = newWidth;
                        canvas.height = newHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, newWidth, newHeight);

                        // Convert to JPEG
                        const out = canvas.toDataURL('image/jpeg', quality);

                        // Safety: if result still too large, lower quality iteratively
                        let final = out;
                        let q = quality;
                        while (final.length > 500 * 1024 && q > 0.3) {
                            q -= 0.1;
                            final = canvas.toDataURL('image/jpeg', q);
                        }

                        resolve(final);
                    } catch (err) {
                        // fallback al dataURL originale
                        resolve(reader.result);
                    }
                };
                img.onerror = () => reject(new Error('Impossibile processare immagine'));
                img.src = reader.result;
            };
            reader.onerror = () => reject(new Error('Impossibile leggere il file'));
            reader.readAsDataURL(file);
        });
    },

    // Mostra anteprima immagine
    previewFile(input, previewId) {
        const file = input.files && input.files[0];
        const preview = document.getElementById(previewId);
        if (!preview) return;
        if (!file) { preview.innerHTML = ''; return; }
        if (!file.type || !file.type.includes('jpeg')) {
            UI.showToast('Carica solo immagini in formato JPEG', 'warning');
            input.value = '';
            return;
        }
        this.readFileAsDataURL(file, 400, 0.85).then(src => {
            preview.innerHTML = `<img src="${src}" alt="preview">`;
        }).catch(err => {
            console.error('Anteprima file fallita', err);
            UI.showToast('Impossibile caricare anteprima', 'danger');
        });
    },

    /**
     * Valida i dati del form atleta
     * @param {FormData} formData - Dati del form
     * @returns {Object} - {valid: boolean, errors: Array}
     */
    validateAthleteForm(formData) {
        const errors = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Validazione nome e cognome
        const firstName = formData.get('firstName')?.trim();
        const lastName = formData.get('lastName')?.trim();
        
        if (!firstName || firstName.length < 2) {
            errors.push('Il nome deve contenere almeno 2 caratteri');
        }
        if (!lastName || lastName.length < 2) {
            errors.push('Il cognome deve contenere almeno 2 caratteri');
        }

        // Validazione data di nascita
        const birthDate = formData.get('birthDate');
        if (birthDate) {
            const birthDateObj = new Date(birthDate);
            const minDate = new Date(1950, 0, 1);
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() - 3); // Minimo 3 anni

            if (birthDateObj < minDate) {
                errors.push('Data di nascita non valida (troppo vecchia)');
            }
            if (birthDateObj > maxDate) {
                errors.push('L\'atleta deve avere almeno 3 anni');
            }
        } else {
            errors.push('La data di nascita è obbligatoria');
        }

        // Validazione scadenza visita medica
        const medicalExpiry = formData.get('medicalExpiry');
        if (medicalExpiry) {
            const expiryDate = new Date(medicalExpiry);
            const minExpiry = new Date();
            minExpiry.setMonth(minExpiry.getMonth() - 1); // Max 1 mese nel passato
            const maxExpiry = new Date();
            maxExpiry.setFullYear(maxExpiry.getFullYear() + 2); // Max 2 anni nel futuro

            if (expiryDate < minExpiry) {
                errors.push('La visita medica è già scaduta da troppo tempo. Aggiorna la data.');
            }
            if (expiryDate > maxExpiry) {
                errors.push('La scadenza visita medica non può essere superiore a 2 anni');
            }
        } else {
            errors.push('La scadenza visita medica è obbligatoria');
        }

        // Validazione documenti (opzionale)
        const idDocFile = formData.get('idDocument');
        const idDocExpiry = formData.get('idDocumentExpiry');
        if (idDocFile && idDocFile.size) {
            if (!idDocFile.type || !idDocFile.type.includes('jpeg')) {
                errors.push("Il documento deve essere in formato JPEG");
            }
            if (!idDocExpiry) {
                errors.push("Se carichi il documento, inserisci anche la data di scadenza");
            }
        } else if (idDocExpiry) {
            // se c'è solo la data di scadenza ma nessun documento caricato, accettiamo la data ma non la richiediamo
            const expiry = new Date(idDocExpiry);
            if (isNaN(expiry)) errors.push('Data scadenza documento non valida');
        }

        // Validazione ruolo
        const role = formData.get('role');
        const validRoles = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
        if (!role || !validRoles.includes(role)) {
            errors.push('Seleziona un ruolo valido');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Salva atleta (nuovo o modifica)
     */
    async saveAthlete(athleteId = null) {
        const form = document.getElementById('athlete-form');
        const formData = new FormData(form);

        // Log dati raccolti
        const athleteData = {
            firstName: formData.get('firstName')?.trim(),
            lastName: formData.get('lastName')?.trim(),
            birthDate: formData.get('birthDate'),
            role: formData.get('role'),
            teamId: formData.get('teamId'),
            medicalExpiry: formData.get('medicalExpiry'),
            idDocumentExpiry: formData.get('idDocumentExpiry') || null,
            active: formData.get('active') === 'on',
            notes: formData.get('notes')?.trim() || ''
        };
        console.log('[ATHLETES] Dati raccolti dal form:', athleteData);

        // Validazione
        const validation = this.validateAthleteForm(formData);
        if (!validation.valid) {
            UI.showToast(validation.errors[0], 'danger');
            console.warn('Errori validazione:', validation.errors);
            return;
        }

        try {
            // Gestione file (foto e documento)
            const photoInput = form.elements['photo'];
            const idDocInput = form.elements['idDocument'];

            if (photoInput && photoInput.files && photoInput.files[0]) {
                // ridimensiona/comprime l'immagine per evitare payload eccessivi in LocalStorage
                const photoData = await this.readFileAsDataURL(photoInput.files[0], 800, 0.8);

                // Se è grande, spostala su IndexedDB e salva solo il riferimento
                if (photoData.length > 150 * 1024) { // >150KB
                    try {
                        const blobKey = await Storage.saveBlob(photoData);
                        athleteData.photo = null;
                        athleteData.photoBlobKey = blobKey;
                    } catch (e) {
                        console.error('Errore salvataggio foto in IndexedDB', e);
                        UI.showToast('Errore salvataggio foto', 'danger');
                        return;
                    }
                } else {
                    athleteData.photo = photoData;
                    athleteData.photoBlobKey = null;
                }
            } else if (athleteId) {
                const current = appState.getAthlete(athleteId);
                athleteData.photo = current?.photo || null;
                athleteData.photoBlobKey = current?.photoBlobKey || null;
            }

            if (idDocInput && idDocInput.files && idDocInput.files[0]) {
                const docData = await this.readFileAsDataURL(idDocInput.files[0], 1200, 0.7);
                if (docData.length > 300 * 1024) { // >300KB
                    try {
                        const docKey = await Storage.saveBlob(docData);
                        athleteData.idDocument = null;
                        athleteData.idDocumentBlobKey = docKey;
                    } catch (e) {
                        console.error('Errore salvataggio documento in IndexedDB', e);
                        UI.showToast('Errore salvataggio documento', 'danger');
                        return;
                    }
                } else {
                    athleteData.idDocument = docData;
                    athleteData.idDocumentBlobKey = null;
                }
            } else if (athleteId) {
                const current = appState.getAthlete(athleteId);
                athleteData.idDocument = current?.idDocument || null;
                athleteData.idDocumentBlobKey = current?.idDocumentBlobKey || null;
            }
        } catch (err) {
            console.error('Errore lettura file', err);
            UI.showToast('Errore durante la lettura dei file', 'danger');
            return;
        }

        let result;
        try {
            if (athleteId) {
                result = appState.updateAthlete(athleteId, athleteData);
                console.log('[ATHLETES] Atleta aggiornato:', result);
            } else {
                result = appState.addAthlete(athleteData);
                console.log('[ATHLETES] Atleta creato:', result);
            }
        } catch (err) {
            console.error('Errore salvataggio atleta:', err);
            UI.showToast('Errore salvataggio: ' + (err.message || String(err)), 'danger');
            return;
        }

        // Aggiorna categorie squadre se l'atleta è assegnato a una squadra
        if (athleteData.teamId) {
            setTimeout(() => appState.updateTeamCategories(), 100);
        }

        UI.closeModal();
        UI.showToast(athleteId ? '✓ Atleta aggiornato con successo' : '✓ Atleta aggiunto con successo', 'success');
    },


    /**
     * Elimina atleta
     */
    deleteAthlete(athleteId) {
        if (confirm('Sei sicuro di voler eliminare questo atleta?')) {
            appState.deleteAthlete(athleteId);
            UI.closeModal();
            UI.showToast('Atleta eliminato', 'success');
        }
    },

    /**
     * Mostra dettagli atleta
     */
    showAthleteDetails(athleteId) {
        const athlete = appState.getAthlete(athleteId);
        if (!athlete) return;

        const team = appState.getTeam(athlete.teamId);
        const fullName = `${athlete.firstName} ${athlete.lastName}`;

        const modalBody = `
            <div class="athlete-details">
                <div class="athlete-photo" style="height: 250px; margin-bottom: 1.5rem;">
                    ${athlete.photo ? 
                        `<img id="athlete-detail-photo" src="${athlete.photo}" alt="${fullName}">` : (athlete.photoBlobKey ?
                        `<img id="athlete-detail-photo" data-blob-key="${athlete.photoBlobKey}" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="${fullName}">` :
                        `<i data-lucide="user" style="font-size: 6rem; color: var(--color-gray-400);"></i>`
                    )}
                </div>
                
                <div class="detail-row">
                    <strong>Nome Completo:</strong>
                    <span>${fullName}</span>
                </div>
                <div class="detail-row">
                    <strong>Data di Nascita:</strong>
                    <span>${new Date(athlete.birthDate).toLocaleDateString('it-IT')}</span>
                </div>
                <div class="detail-row">
                    <strong>Ruolo:</strong>
                    <span>${athlete.role}</span>
                </div>
                <div class="detail-row">
                    <strong>Squadra:</strong>
                    <span>${team ? team.name : 'Nessuna Squadra'}</span>
                </div>
                <div class="detail-row">
                    <strong>Scadenza Visita:</strong>
                    <span>${new Date(athlete.medicalExpiry).toLocaleDateString('it-IT')}</span>
                </div>
                <div class="detail-row">
                    <strong>Stato:</strong>
                    <span class="athlete-status ${athlete.active ? 'active' : 'inactive'}">
                        ${athlete.active ? 'Attivo' : 'Inattivo'}
                    </span>
                </div>
                ${athlete.idDocument ? `
                    <div class="detail-row">
                        <strong>Documento Identità:</strong>
                        <span><a href="${athlete.idDocument}" target="_blank">Apri Documento</a></span>
                    </div>
                ` : (athlete.idDocumentBlobKey ? `
                    <div class="detail-row">
                        <strong>Documento Identità:</strong>
                        <span><button class="btn btn-link" onclick="AthletesModule.openIdDocument('${athlete.idDocumentBlobKey}')">Apri Documento</button></span>
                    </div>
                ` : '')}
                ${athlete.idDocumentExpiry ? `
                    <div class="detail-row">
                        <strong>Scadenza Documento:</strong>
                        <span>${new Date(athlete.idDocumentExpiry).toLocaleDateString('it-IT')}</span>
                    </div>
                ` : ''}
                ${athlete.notes ? `
                    <div class="detail-row">
                        <strong>Note:</strong>
                        <p>${athlete.notes}</p>
                    </div>
                ` : ''}
                
                <div class="form-actions" style="margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <div style="width:100%;display:flex;flex-wrap:wrap;justify-content:center;gap:1rem;">
                        <button class="btn btn-primary" onclick="AthletesModule.showAthleteForm('${athleteId}')">
                            <i data-lucide="edit"></i> Modifica
                        </button>
                        <button class="btn btn-secondary" onclick="FinancesModule.showPaymentModal('${athleteId}')">
                            <i data-lucide="euro"></i> Gestione Pagamenti
                        </button>
                        <button class="btn btn-secondary" onclick="EvaluationsModule.showAthleteProgress('${athleteId}')">
                            <i data-lucide="trending-up"></i> Valutazioni
                        </button>
                        <button class="btn btn-secondary" onclick="EvaluationsModule.showEvaluationForm('${athleteId}')">
                            <i data-lucide="plus"></i> Nuova Valutazione
                        </button>
                    </div>
                </div>
            </div>

            <style>
                .athlete-details .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid var(--color-gray-200);
                }
            </style>
        `;

        UI.showModal(fullName, modalBody);
        lucide.createIcons();

        // Se l'immagine o il documento sono su IndexedDB, caricali asincronamente
        setTimeout(async () => {
            try {
                const imgEl = document.getElementById('athlete-detail-photo');
                if (imgEl && imgEl.dataset && imgEl.dataset.blobKey) {
                    const dataURL = await Storage.getBlob(imgEl.dataset.blobKey);
                    if (dataURL) imgEl.src = dataURL;
                }
            } catch (err) {
                console.error('Errore caricamento dettaglio immagine', err);
            }
        }, 50);
    },

    /**
     * Popola il filtro squadre
     */
    populateTeamFilter() {
        const select = document.getElementById('filter-team');
        if (!select) return;

        const teams = appState.getTeams();
        const currentValue = select.value;

        select.innerHTML = '<option value="">Tutte le Squadre</option>' +
            teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        
        select.value = currentValue;
    },

    async openIdDocument(blobKey) {
        try {
            const dataURL = await Storage.getBlob(blobKey);
            if (!dataURL) { UI.showToast('Documento non trovato', 'warning'); return; }
            const w = window.open();
            if (w) {
                w.document.write(`<html><head><title>Documento</title></head><body style="margin:0"><img src="${dataURL}" style="max-width:100%;height:auto;display:block;margin:0 auto;" /></body></html>`);
                w.document.close();
            } else {
                UI.showToast('Impossibile aprire nuova finestra (popup bloccato)', 'warning');
            }
        } catch (err) {
            console.error('Errore apertura documento', err);
            UI.showToast('Errore apertura documento', 'danger');
        }
    }
};
