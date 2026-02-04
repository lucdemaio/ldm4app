/**
 * SCANNER.JS
 * Modulo Scanner QR Code per Identificazione Atleti
 * - Generazione QR Code univoco per atleta
 * - Scanner webcam HTML5
 * - Apertura automatica scheda atleta
 * - Marcatura presenza automatica
 */

const ScannerModule = {
    html5QrCode: null,
    isScanning: false,
    scanMode: 'view', // 'view' o 'attendance'

    /**
     * Inizializza il modulo scanner
     */
    init() {
        console.log('📷 Scanner Module initialized');
    },

    /**
     * Genera QR Code per un atleta
     * @param {string} athleteId - ID dell'atleta
     * @returns {string} Data URL del QR Code
     */
    generateQRCode(athleteId) {
        const athlete = appState.getAthlete(athleteId);
        if (!athlete) {
            UI.showToast('Atleta non trovato', 'error');
            return null;
        }

        // Crea payload QR
        const qrPayload = {
            type: 'ATHLETE_ID',
            id: athleteId,
            name: `${athlete.firstName} ${athlete.lastName}`,
            timestamp: Date.now()
        };

        const qrData = JSON.stringify(qrPayload);

        // Crea elemento temporaneo per generare QR
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        try {
            // Genera QR Code
            const qrcode = new QRCode(tempDiv, {
                text: qrData,
                width: 300,
                height: 300,
                colorDark: '#0f172a',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });

            // Estrai immagine
            setTimeout(() => {
                const canvas = tempDiv.querySelector('canvas');
                if (canvas) {
                    const dataURL = canvas.toDataURL('image/png');
                    document.body.removeChild(tempDiv);
                    return dataURL;
                }
            }, 100);

            return tempDiv;
        } catch (error) {
            console.error('Errore generazione QR:', error);
            document.body.removeChild(tempDiv);
            return null;
        }
    },

    /**
     * Mostra modal con QR Code dell'atleta
     * @param {string} athleteId - ID dell'atleta
     */
    showAthleteQRCode(athleteId) {
        const athlete = appState.getAthlete(athleteId);
        if (!athlete) {
            UI.showToast('Atleta non trovato', 'error');
            return;
        }

        const qrPayload = JSON.stringify({
            type: 'ATHLETE_ID',
            id: athleteId,
            name: `${athlete.firstName} ${athlete.lastName}`,
            timestamp: Date.now()
        });

        const modalBody = `
            <div class="qr-code-container">
                <div class="qr-header">
                    <div class="athlete-qr-info">
                        <h3>${athlete.firstName} ${athlete.lastName}</h3>
                        <p class="athlete-role">${athlete.role || 'N/D'} - ${athlete.shirtNumber || 'N/D'}</p>
                        <p class="qr-id">ID: ${athleteId}</p>
                    </div>
                </div>
                
                <div id="qrcode-display" class="qr-display"></div>
                
                <div class="qr-instructions">
                    <p><i data-lucide="info"></i> Usa questo QR Code per identificazione rapida</p>
                    <ul>
                        <li>Scansiona con lo scanner dell'app</li>
                        <li>Apri automaticamente la scheda atleta</li>
                        <li>Segna presenza agli allenamenti</li>
                    </ul>
                </div>

                <div class="qr-actions">
                    <button class="btn btn-secondary" onclick="ScannerModule.downloadQRCode('${athleteId}')">
                        <i data-lucide="download"></i>
                        Scarica QR Code
                    </button>
                    <button class="btn btn-secondary" onclick="ScannerModule.printQRCode('${athleteId}')">
                        <i data-lucide="printer"></i>
                        Stampa
                    </button>
                </div>
            </div>
        `;

        UI.showModal(`QR Code - ${athlete.firstName} ${athlete.lastName}`, modalBody, 'medium');

        // Genera QR Code
        setTimeout(() => {
            const qrContainer = document.getElementById('qrcode-display');
            if (qrContainer) {
                new QRCode(qrContainer, {
                    text: qrPayload,
                    width: 280,
                    height: 280,
                    colorDark: '#0f172a',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
            lucide.createIcons();
        }, 100);
    },

    /**
     * Scarica QR Code come immagine PNG
     * @param {string} athleteId - ID dell'atleta
     */
    downloadQRCode(athleteId) {
        const athlete = appState.getAthlete(athleteId);
        if (!athlete) return;

        const canvas = document.querySelector('#qrcode-display canvas');
        if (!canvas) {
            UI.showToast('QR Code non disponibile', 'error');
            return;
        }

        // Converti canvas in blob e scarica
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `QR_${athlete.firstName}_${athlete.lastName}_${athleteId}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            UI.showToast('QR Code scaricato', 'success');
        });
    },

    /**
     * Stampa QR Code
     * @param {string} athleteId - ID dell'atleta
     */
    printQRCode(athleteId) {
        const athlete = appState.getAthlete(athleteId);
        if (!athlete) return;

        const canvas = document.querySelector('#qrcode-display canvas');
        if (!canvas) {
            UI.showToast('QR Code non disponibile', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        const imgData = canvas.toDataURL('image/png');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${athlete.firstName} ${athlete.lastName}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 2rem;
                    }
                    h1 { margin-bottom: 0.5rem; }
                    p { color: #666; margin-bottom: 1rem; }
                    img { border: 2px solid #000; padding: 1rem; }
                </style>
            </head>
            <body>
                <h1>${athlete.firstName} ${athlete.lastName}</h1>
                <p>${athlete.role || 'N/D'} - Maglia #${athlete.shirtNumber || 'N/D'}</p>
                <img src="${imgData}" alt="QR Code" />
                <p style="margin-top: 1rem;">ID: ${athleteId}</p>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    },

    /**
     * Mostra interfaccia scanner webcam
     * @param {string} mode - 'view' (apri scheda) o 'attendance' (segna presenza)
     */
    showScanner(mode = 'view') {
        this.scanMode = mode;

        const modalBody = `
            <div class="scanner-container">
                <div class="scanner-header">
                    <h3>
                        <i data-lucide="camera"></i>
                        Scanner QR Code
                    </h3>
                    <p class="scanner-mode">
                        Modalità: ${mode === 'view' ? '👤 Visualizza Scheda Atleta' : '✅ Segna Presenza'}
                    </p>
                </div>

                <div class="scanner-controls">
                    <button class="btn btn-success" id="start-scan-btn" onclick="ScannerModule.startScanning()">
                        <i data-lucide="video"></i>
                        Avvia Scansione
                    </button>
                    <button class="btn btn-danger" id="stop-scan-btn" onclick="ScannerModule.stopScanning()" style="display: none;">
                        <i data-lucide="video-off"></i>
                        Ferma Scansione
                    </button>
                </div>

                <!-- Camera View -->
                <div id="qr-reader" class="qr-reader"></div>

                <!-- Risultati -->
                <div id="scan-results" class="scan-results">
                    <p class="scan-placeholder">
                        <i data-lucide="scan-line"></i>
                        Inquadra un QR Code per iniziare
                    </p>
                </div>

                <!-- Log Scansioni -->
                <div id="scan-log" class="scan-log"></div>
            </div>
        `;

        UI.showModal('Scanner QR Code', modalBody, 'large');

        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    },

    /**
     * Avvia scansione webcam
     */
    async startScanning() {
        if (this.isScanning) {
            UI.showToast('Scansione già in corso', 'warning');
            return;
        }

        const readerElement = document.getElementById('qr-reader');
        if (!readerElement) {
            UI.showToast('Elemento scanner non trovato', 'error');
            return;
        }

        // Inizializza scanner
        this.html5QrCode = new Html5Qrcode("qr-reader");

        try {
            await this.html5QrCode.start(
                { facingMode: "environment" }, // Usa camera posteriore su mobile
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    this.onScanSuccess(decodedText, decodedResult);
                },
                (errorMessage) => {
                    // Ignora errori continui di scansione
                }
            );

            this.isScanning = true;
            
            // Aggiorna UI
            document.getElementById('start-scan-btn').style.display = 'none';
            document.getElementById('stop-scan-btn').style.display = 'inline-flex';
            document.getElementById('scan-results').innerHTML = `
                <p class="scan-active">
                    <i data-lucide="scan-line"></i>
                    Scansione attiva... Inquadra un QR Code
                </p>
            `;

            lucide.createIcons();
            UI.showToast('Scanner avviato', 'success');

        } catch (error) {
            console.error('Errore avvio scanner:', error);
            UI.showToast('Impossibile accedere alla webcam: ' + error, 'error');
        }
    },

    /**
     * Ferma scansione webcam
     */
    async stopScanning() {
        if (!this.isScanning || !this.html5QrCode) {
            return;
        }

        try {
            await this.html5QrCode.stop();
            this.html5QrCode = null;
            this.isScanning = false;

            // Aggiorna UI
            document.getElementById('start-scan-btn').style.display = 'inline-flex';
            document.getElementById('stop-scan-btn').style.display = 'none';
            document.getElementById('scan-results').innerHTML = `
                <p class="scan-placeholder">
                    <i data-lucide="scan-line"></i>
                    Scanner fermato
                </p>
            `;

            lucide.createIcons();
            UI.showToast('Scanner fermato', 'info');

        } catch (error) {
            console.error('Errore stop scanner:', error);
        }
    },

    /**
     * Gestisce scansione QR riuscita
     * @param {string} decodedText - Testo decodificato dal QR
     * @param {object} decodedResult - Risultato completo
     */
    onScanSuccess(decodedText, decodedResult) {
        try {
            // Parse payload QR
            const payload = JSON.parse(decodedText);

            if (payload.type !== 'ATHLETE_ID') {
                UI.showToast('QR Code non valido', 'error');
                return;
            }

            const athleteId = payload.id;
            const athlete = appState.getAthlete(athleteId);

            if (!athlete) {
                UI.showToast('Atleta non trovato', 'error');
                this.logScan(payload.name, 'error', 'Atleta non trovato nel database');
                return;
            }

            // Ferma scanner
            this.stopScanning();

            // Esegui azione in base alla modalità
            if (this.scanMode === 'view') {
                // Apri scheda atleta
                UI.closeModal();
                setTimeout(() => {
                    AthletesModule.showAthleteDetails(athleteId);
                }, 300);
                
                this.logScan(athlete.firstName + ' ' + athlete.lastName, 'success', 'Scheda atleta aperta');
                UI.showToast(`✅ Scheda ${athlete.firstName} ${athlete.lastName} aperta`, 'success');

            } else if (this.scanMode === 'attendance') {
                // Segna presenza
                const today = new Date().toISOString().split('T')[0];
                
                // Verifica se già presente oggi
                const existingAttendance = appState.state.attendance?.find(
                    a => a.athleteId === athleteId && a.date === today
                );

                if (existingAttendance) {
                    UI.showToast(`${athlete.firstName} ${athlete.lastName} già presente oggi`, 'warning');
                    this.logScan(athlete.firstName + ' ' + athlete.lastName, 'warning', 'Già segnato presente oggi');
                } else {
                    // Aggiungi presenza
                    const attendance = {
                        id: Date.now().toString(),
                        athleteId: athleteId,
                        date: today,
                        present: true,
                        timestamp: new Date().toISOString()
                    };

                    if (!appState.state.attendance) {
                        appState.state.attendance = [];
                    }
                    appState.state.attendance.push(attendance);
                    appState.saveState();

                    UI.showToast(`✅ ${athlete.firstName} ${athlete.lastName} segnato presente!`, 'success');
                    this.logScan(athlete.firstName + ' ' + athlete.lastName, 'success', 'Presenza registrata');

                    // Riavvia scanner dopo 2 secondi
                    setTimeout(() => {
                        this.startScanning();
                    }, 2000);
                }
            }

        } catch (error) {
            console.error('Errore parsing QR:', error);
            UI.showToast('QR Code non valido o corrotto', 'error');
            this.logScan('Sconosciuto', 'error', 'QR Code non valido');
        }
    },

    /**
     * Registra scansione nel log
     * @param {string} athleteName - Nome atleta
     * @param {string} status - 'success', 'error', 'warning'
     * @param {string} message - Messaggio
     */
    logScan(athleteName, status, message) {
        const logContainer = document.getElementById('scan-log');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString('it-IT');
        const statusIcon = {
            success: '✅',
            error: '❌',
            warning: '⚠️'
        }[status] || 'ℹ️';

        const statusClass = {
            success: 'log-success',
            error: 'log-error',
            warning: 'log-warning'
        }[status] || '';

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${statusClass}`;
        logEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-icon">${statusIcon}</span>
            <span class="log-name">${athleteName}</span>
            <span class="log-message">${message}</span>
        `;

        logContainer.insertBefore(logEntry, logContainer.firstChild);

        // Limita a 10 voci
        while (logContainer.children.length > 10) {
            logContainer.removeChild(logContainer.lastChild);
        }
    },

    /**
     * Genera QR Code per tutti gli atleti di una squadra
     * @param {string} teamId - ID squadra
     */
    generateTeamQRCodes(teamId) {
        const team = appState.getTeam(teamId);
        if (!team) {
            UI.showToast('Squadra non trovata', 'error');
            return;
        }

        const athletes = appState.state.athletes.filter(a => a.teamId === teamId);
        
        if (athletes.length === 0) {
            UI.showToast('Nessun atleta in questa squadra', 'warning');
            return;
        }

        UI.showToast(`Generazione ${athletes.length} QR Code in corso...`, 'info');

        // TODO: Implementare generazione batch PDF con tutti i QR
        // Per ora mostra lista
        const modalBody = `
            <div class="team-qr-list">
                <h3>${team.name} - QR Code Atleti</h3>
                <p>Seleziona un atleta per visualizzare il suo QR Code</p>
                <div class="athletes-qr-grid">
                    ${athletes.map(athlete => `
                        <div class="athlete-qr-card" onclick="ScannerModule.showAthleteQRCode('${athlete.id}')">
                            <strong>${athlete.firstName} ${athlete.lastName}</strong>
                            <span>${athlete.role || 'N/D'} - #${athlete.shirtNumber || 'N/D'}</span>
                            <button class="btn btn-sm btn-primary">
                                <i data-lucide="qr-code"></i> Visualizza QR
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        UI.showModal(`QR Code Squadra - ${team.name}`, modalBody, 'large');
        setTimeout(() => lucide.createIcons(), 100);
    }
};

// Inizializza al caricamento
window.ScannerModule = ScannerModule;
