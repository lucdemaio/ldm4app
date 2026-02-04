/**
 * DIAGNOSTICS.JS
 * Semplice modulo di diagnostica e health-check per l'app
 */

const DiagnosticsModule = (() => {
    async function runFullCheck() {
        const results = [];
        try {
            results.push({ label: 'Timestamp', ok: true, value: new Date().toISOString() });

            // Storage availability
            try {
                const avail = Storage.isAvailable();
                results.push({ label: 'LocalStorage available', ok: !!avail });
            } catch (e) {
                results.push({ label: 'LocalStorage available', ok: false, error: e.message });
            }

            // Check saved state presence
            try {
                const state = Storage.loadState();
                if (state) {
                    results.push({ label: 'Saved state found', ok: true, details: { athletes: (state.athletes||[]).length, teams: (state.teams||[]).length } });
                } else {
                    results.push({ label: 'Saved state found', ok: false });
                }
            } catch (e) {
                results.push({ label: 'Saved state found', ok: false, error: e.message });
            }

            // AppState health
            try {
                if (typeof appState !== 'undefined') {
                    const ui = appState.getUIState();
                    const athletes = appState.getAthletes();
                    const teams = appState.getTeams();
                    results.push({ label: 'appState initialized', ok: true, details: { currentSection: ui.currentSection, athletes: athletes.length, teams: teams.length } });
                } else {
                    results.push({ label: 'appState initialized', ok: false });
                }
            } catch (e) {
                results.push({ label: 'appState initialized', ok: false, error: e.message });
            }

            // Modules presence
            const modulesToCheck = ['DashboardModule','FiscalModule','LegalDocManager','meetingMinutes','ReportsModule'];
            modulesToCheck.forEach(name => {
                const present = (typeof window[name] !== 'undefined') || (typeof eval(name) !== 'undefined');
                results.push({ label: `Module ${name}`, ok: !!present });
            });

            // UI leftovers (overlays, modal-open)
            try {
                const overlays = document.querySelectorAll('.modal-overlay').length;
                const modalOpen = document.body.classList.contains('modal-open');
                const dropdowns = document.querySelectorAll('.nav-dropdown.active').length;
                results.push({ label: 'UI overlays', ok: true, details: { overlays, modalOpen, activeDropdowns: dropdowns } });
            } catch (e) { results.push({ label: 'UI overlays', ok: false, error: e.message }); }

            // Error reports stored
            try {
                const reports = JSON.parse(localStorage.getItem('errorReports') || '[]');
                results.push({ label: 'Stored error reports', ok: true, details: { count: reports.length, last: reports[reports.length-1] || null } });
            } catch (e) { results.push({ label: 'Stored error reports', ok: false, error: e.message }); }

            // Try simple render calls to detect runtime errors
            try {
                if (typeof DashboardModule !== 'undefined' && typeof DashboardModule.updateStats === 'function') {
                    DashboardModule.updateStats();
                    results.push({ label: 'DashboardModule.updateStats()', ok: true });
                } else results.push({ label: 'DashboardModule.updateStats()', ok: false });
            } catch (e) { results.push({ label: 'DashboardModule.updateStats()', ok: false, error: e.message }); }

            // Test aggiuntivo: verifica che UI.showView('dashboard') funzioni anche se la dashboard è stata rimossa dal DOM
            try {
                if (typeof UI !== 'undefined' && typeof UI.showView === 'function') {
                    try {
                        // Simula scenario: rimuovi la sezione dashboard e chiama showView()
                        const original = document.getElementById('dashboard-section');
                        const had = !!original;
                        if (original && original.parentElement) original.parentElement.removeChild(original);
                        UI.showView('dashboard');
                        const restored = !!document.getElementById('dashboard-section');
                        results.push({ label: 'UI.showView("dashboard") ripristina la dashboard', ok: restored, details: { hadBefore: had } });
                        // ripristina lo stato per non alterare altri controlli (se necessario)
                        if (!restored && had && UI._appTemplate) { document.getElementById('app-container').innerHTML = UI._appTemplate; if (typeof DashboardModule !== 'undefined') DashboardModule.render(); }
                    } catch (e) {
                        results.push({ label: 'UI.showView("dashboard") ripristina la dashboard', ok: false, error: e && e.message ? e.message : String(e) });
                    }
                } else {
                    results.push({ label: 'UI.showView("dashboard") ripristina la dashboard', ok: false });
                }
            } catch (e) { results.push({ label: 'UI.showView("dashboard") ripristina la dashboard', ok: false, error: e.message }); }

            try {
                if (typeof FiscalModule !== 'undefined' && typeof FiscalModule.getReceiptsSummary === 'function') {
                    const s = FiscalModule.getReceiptsSummary();
                    results.push({ label: 'FiscalModule.getReceiptsSummary()', ok: true, details: s });
                } else results.push({ label: 'FiscalModule.getReceiptsSummary()', ok: false });
            } catch (e) { results.push({ label: 'FiscalModule.getReceiptsSummary()', ok: false, error: e.message }); }

            // Blob DB test (non distruttivo)
            try {
                if (typeof Storage.openBlobDB === 'function') {
                    const db = await Storage.openBlobDB();
                    if (db) { results.push({ label: 'IndexedDB blob DB', ok: true }); db.close(); }
                } else {
                    results.push({ label: 'IndexedDB blob DB', ok: false });
                }
            } catch (e) { results.push({ label: 'IndexedDB blob DB', ok: false, error: e.message }); }

        } catch (e) {
            results.push({ label: 'Health check failed', ok: false, error: e.message });
        }

        // Display results in a modal
        const html = `
            <div style="max-height:60vh;overflow:auto;padding:1rem;">
                <h3>Risultati Health Check</h3>
                <ul style="font-family: monospace; font-size: 0.9rem;">
                    ${results.map(r => `<li style="margin-bottom:0.5rem;">${r.ok ? '✅' : '❌'} <strong>${r.label}</strong> ${r.details ? '- ' + JSON.stringify(r.details) : ''} ${r.error ? '- ' + r.error : ''}</li>`).join('')}
                </ul>
                <div style="margin-top:1rem; text-align:right;">
                    <button class="btn btn-primary" onclick="UI.closeModal()">Chiudi</button>
                </div>
            </div>
        `;

        const modalHtml = `
            ${html}
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:0.75rem;">
                <button class="btn btn-secondary" onclick="(function(){ try { const data = localStorage.getItem('errorReports') || '[]'; const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'soccermanager-error-reports-' + new Date().toISOString().split('T')[0] + '.json'; a.click(); URL.revokeObjectURL(url); } catch(e){ console.error('Export error reports failed', e); UI.showToast('Export fallito', 'danger'); } })()">📥 Download Error Reports</button>
                <button class="btn btn-primary" onclick="UI.closeModal()">Chiudi</button>
            </div>
        `;

        UI.showModal('Health Check - Risultati', modalHtml, 'large');
        return results;
    }

    async function quickCheck() {
        // Quick, non-intrusive checks logged to console and saved to localStorage
        try {
            const summary = { timestamp: new Date().toISOString(), storageAvailable: Storage.isAvailable(), athletes: (appState && typeof appState.getAthletes === 'function') ? appState.getAthletes().length : 'N/D', teams: (appState && typeof appState.getTeams === 'function') ? appState.getTeams().length : 'N/D' };
            try { console.log('Diagnostics Quick Check:', summary); } catch(e) { /* ignore */ }
            localStorage.setItem('lastDiagnosticsSummary', JSON.stringify(summary));
            return summary;
        } catch (e) {
            console.error('Diagnostics quickCheck failed', e);
            return { error: e.message };
        }
    }

    async function stressTest(options = {}) {
        const cycles = options.cycles || 100;
        const delayMs = options.delayMs || 10;
        const results = { cycles, errors: [], addedListeners: {}, domGrowth: 0, suggestions: [] };

        // Hook addEventListener to count registrations during the test
        const originalAdd = EventTarget.prototype.addEventListener;
        const listenerCounts = {};
        EventTarget.prototype.addEventListener = function(type, listener, opts) {
            listenerCounts[type] = (listenerCounts[type] || 0) + 1;
            return originalAdd.apply(this, arguments);
        };

        // Temporaneamente cattura errori non gestiti
        const capturedErrors = [];
        const onError = (e) => { capturedErrors.push({ type: 'error', payload: e.error || e.message || e }); };
        const onRejection = (e) => { capturedErrors.push({ type: 'rejection', payload: e.reason || e }); };
        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);

        // Snapshot iniziale DOM
        const initialDomCount = document.getElementsByTagName('*').length;

        // Run cycles
        for (let i = 0; i < cycles; i++) {
            try {
                // call common renders / open/close flows
                try { if (typeof DashboardModule !== 'undefined' && typeof DashboardModule.render === 'function') DashboardModule.render(); } catch(e) { results.errors.push({ cycle: i, fn: 'DashboardModule.render', err: e.message }); }
                try { if (typeof AthletesModule !== 'undefined' && typeof AthletesModule.render === 'function') AthletesModule.render(); } catch(e) { results.errors.push({ cycle: i, fn: 'AthletesModule.render', err: e.message }); }

                // Legal docs flow: open selector and close
                try {
                    if (typeof legalDocs !== 'undefined' && typeof legalDocs.selectAthleteForDoc === 'function') {
                        legalDocs.selectAthleteForDoc('registration');
                        // small delay to simulate user
                        await new Promise(r => setTimeout(r, 1));
                        legalDocs.showLegalDocsDashboard();
                    }
                } catch(e) { results.errors.push({ cycle: i, fn: 'legalDocs flow', err: e.message }); }

                // Meeting minutes flow
                try {
                    if (typeof meetingMinutes !== 'undefined' && typeof meetingMinutes.showCreateMinuteForm === 'function') {
                        meetingMinutes.showCreateMinuteForm();
                        await new Promise(r => setTimeout(r, 1));
                        meetingMinutes.showMeetingMinutesDashboard();
                    }
                } catch(e) { results.errors.push({ cycle: i, fn: 'meetingMinutes flow', err: e.message }); }

                // Force UI rerenders and update stats
                try { if (typeof DashboardModule !== 'undefined' && typeof DashboardModule.updateStats === 'function') DashboardModule.updateStats(); } catch(e) { results.errors.push({ cycle: i, fn: 'DashboardModule.updateStats', err: e.message }); }

                // Small delay
                await new Promise(r => setTimeout(r, delayMs));

            } catch (outer) {
                results.errors.push({ cycle: i, fn: 'outer', err: outer.message });
            }
        }

        // Post-test snapshot
        const finalDomCount = document.getElementsByTagName('*').length;
        results.domGrowth = finalDomCount - initialDomCount;
        results.addedListeners = listenerCounts;
        results.capturedErrors = capturedErrors;

        // Restore original addEventListener
        try { EventTarget.prototype.addEventListener = originalAdd; } catch (e) { /* ignore */ }
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);

        // Basic heuristic to suggest probable cause
        try {
            const frequent = Object.entries(listenerCounts).sort((a,b) => b[1]-a[1]).slice(0,5);
            if (results.domGrowth > 50) results.suggestions.push('DOM growth detected: possible elements appended and not removed (check render() functions).');
            if (frequent.length && frequent[0][1] > cycles) results.suggestions.push('High number of event listener registrations detected for event types: ' + frequent.map(f => `${f[0]}(${f[1]})`).join(', '));
            if (results.capturedErrors.length) results.suggestions.push('Captured runtime errors/rejections during test — inspect errorReports for details.');
        } catch (e) { /* ignore */ }

        // Show results
        const summaryHtml = `
            <div style="max-height:60vh;overflow:auto;padding:1rem;">
                <h3>Stress Test - Risultati</h3>
                <p>Cycles: <strong>${cycles}</strong></p>
                <p>DOM growth: <strong>${results.domGrowth}</strong></p>
                <p>Captured errors: <strong>${results.capturedErrors.length}</strong></p>
                <p>Distinct listener types added: <strong>${Object.keys(results.addedListeners).length}</strong></p>
                <ul style="font-family: monospace; font-size: 0.9rem; margin-top:0.5rem;">
                    ${Object.entries(results.addedListeners).map(e => `<li>${e[0]}: ${e[1]}</li>`).join('')}
                </ul>
                ${results.suggestions.length ? `<h4>Suggerimenti</h4><ul>${results.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
                <div style="margin-top:1rem; text-align:right;">
                    <button class="btn btn-secondary" onclick="UI.closeModal()">Chiudi</button>
                </div>
            </div>
        `;

        UI.showModal('Stress Test - Risultati', summaryHtml, 'large');
        return results;
    }

    function init() {
        console.log('DiagnosticsModule initialized');
        // Esegui un quick check non invasivo all'avvio
        try { setTimeout(() => { quickCheck(); }, 500); } catch (e) { /* ignore */ }
    }

    async function detectListenerLeaks({ threshold = 20, cycles = 100, delayMs = 10 } = {}) {
        // Temporarily override addEventListener to capture stacks when counts exceed threshold
        const orig = EventTarget.prototype.addEventListener;
        const counts = {};
        const stacks = {};

        EventTarget.prototype.addEventListener = function(type, listener, opts) {
            counts[type] = (counts[type] || 0) + 1;
            if (counts[type] > threshold) {
                try {
                    const st = (new Error()).stack.split('\n').slice(2, 8).join('\n');
                    stacks[type] = stacks[type] || [];
                    stacks[type].push({ stack: st, at: new Date().toISOString() });
                } catch (e) { /* ignore */ }
            }
            return orig.apply(this, arguments);
        };

        // Run stress test to exercise code paths
        let res = null;
        try {
            res = await stressTest({ cycles, delayMs });
        } catch (e) {
            // ensure we still capture stacks
            console.error('detectListenerLeaks: stressTest failed', e);
        }

        // Restore original
        try { EventTarget.prototype.addEventListener = orig; } catch (e) { /* ignore */ }

        const report = { timestamp: new Date().toISOString(), threshold, cycles, delayMs, counts, stacks, stressResult: res };
        try {
            localStorage.setItem('listenerReports', JSON.stringify((JSON.parse(localStorage.getItem('listenerReports') || '[]')).concat([report]).slice(-50)));
        } catch (e) { /* ignore */ }

        // Show summary modal with download button
        const html = `
            <div style="max-height:60vh;overflow:auto;padding:1rem;">
                <h3>Listener Leak Detection</h3>
                <p>Cycles: <strong>${cycles}</strong>, Threshold: <strong>${threshold}</strong></p>
                <p>Distinct event types recorded: <strong>${Object.keys(counts).length}</strong></p>
                <ul style="font-family: monospace; font-size: 0.9rem;">
                    ${Object.entries(counts).map(e => `<li>${e[0]}: ${e[1]}</li>`).join('')}
                </ul>
                <div style="margin-top:1rem; text-align:right;">
                    <button class="btn btn-secondary" onclick="(function(){ try{ const data = JSON.stringify(${JSON.stringify(report)}); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'listener-report-${new Date().toISOString().split('T')[0]}.json'; a.click(); URL.revokeObjectURL(url); } catch(e){ console.error('Export failed', e); UI.showToast('Export fallito', 'danger'); } })()">📥 Download Report</button>
                    <button class="btn btn-primary" onclick="UI.closeModal()">Chiudi</button>
                </div>
            </div>
        `;
        UI.showModal('Listener Leak Detection', html, 'large');
        return report;
    }

    return { init, runFullCheck, quickCheck, stressTest, detectListenerLeaks };
})();

window.DiagnosticsModule = DiagnosticsModule;