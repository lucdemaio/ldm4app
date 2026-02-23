/**
 * ENTERPRISE SHIFT MANAGER - CORE LOGIC v2.0
 * Ottimizzato per 1000+ dipendenti con rotazione M-P-N-R rigorosa
 */

'use strict';

// ============================================
// CONFIG e STATE (migrati in sm-core.js)
// ============================================

const CONFIG = window.ShiftManager.CONFIG;
const STATE = window.ShiftManager.STATE;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calcola date della settimana da input week (DOMENICA come primo giorno)
 * Se weekString è falsy, calcola la settimana corrente (da Domenica a Sabato)
 */
function getWeekDates(weekString) {
    // Fallback: se manca la settimana, restituisci la settimana corrente
    if (!weekString) {
        const today = new Date();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - today.getDay()); // Domenica
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const current = new Date(sunday);
            current.setDate(sunday.getDate() + i);
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
        }
        return dates;
    }

    const parts = weekString.split('-W');
    if (!parts || parts.length !== 2) {
        console.warn('getWeekDates: weekString has unexpected format:', weekString);
        return getWeekDates(null);
    }
    const [year, week] = parts.map(Number);

    // Calcola il primo giovedì dell'anno (ISO 8601)
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7; // Domenica = 7
    const firstThursday = new Date(year, 0, 4 - jan4Day + 4);

    // Calcola la data del lunedì della settimana ISO selezionata
    const mondayOfWeek = new Date(firstThursday);
    mondayOfWeek.setDate(firstThursday.getDate() - 3 + (week - 1) * 7);

    // Torna indietro di un giorno per arrivare alla DOMENICA (giorno prima di lunedì)
    const sundayOfWeek = new Date(mondayOfWeek);
    sundayOfWeek.setDate(mondayOfWeek.getDate() - 1);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const current = new Date(sundayOfWeek);
        current.setDate(sundayOfWeek.getDate() + i);
        // Formatta la data correttamente evitando problemi di timezone
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
    }
    return dates; // [Domenica, Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato]
}

/**
 * Formatta data per visualizzazione (settimana parte da Domenica)
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const fullDayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return {
        dayName: dayNames[date.getDay()],
        fullDayName: fullDayNames[date.getDay()],
        dayNum: day,
        month: month,
        full: `${day}/${month}`
    };
}

/**
 * Recupera l'orario di un turno dall'ID (T1, T2, T3, ecc.)
 * @param {string} slotId - ID del turno (es: "T1", "T2")
 * @returns {string|null} Orario del turno o null se non trovato
 */
function getTimeFromSlotId(slotId) {
    // Cerca nelle fasce personalizzate (T1, T2, T3...)
    // Le fasce personalizzate sono in STATE.timeSlots come array di orari
    // T1 = index 0, T2 = index 1, ecc.
    const customIndex = parseInt(slotId.substring(1)) - 1; // T1=0, T2=1, T3=2...
    if (customIndex >= 0 && customIndex < STATE.timeSlots.length) {
        return STATE.timeSlots[customIndex];
    }
    
    return null;
}

/**
 * Calcola l'ora di fine turno in base all'ora di inizio e al tipo di contratto
 * @param {string} startTime - Ora di inizio formato "HH:MM"
 * @param {number} contractType - Tipo di contratto (40, 37.5, 33.20, 31.15)
 * @param {object} employee - Oggetto dipendente (opzionale, per contratti personalizzati)
 * @returns {string} Fascia oraria completa "HH:MM - HH:MM"
 */
function calculateShiftEnd(startTime, contractType, employee) {
    // Se startTime contiene già " - ", ritornalo così com'è
    if (startTime.includes(' - ')) {
        return startTime;
    }
    
    // Determina la durata in base al contratto
    let durationMinutes;
    
    // Se il dipendente ha orari personalizzati, usali
    if (employee && employee.customTurnHours !== undefined && employee.customTurnMinutes !== undefined) {
        durationMinutes = (employee.customTurnHours * 60) + employee.customTurnMinutes;
    } else if (contractType === 40 || contractType === 33.20) {
        durationMinutes = 6 * 60 + 40; // 6h 40min
    } else if (contractType === 37.5 || contractType === 31.15) {
        durationMinutes = 6 * 60 + 15; // 6h 15min
    } else {
        durationMinutes = 6 * 60 + 40; // Default 6h 40min
    }
    
    // Calcola ora di fine
    const [startH, startM] = startTime.split(':').map(Number);
    const totalStartMinutes = startH * 60 + startM;
    const totalEndMinutes = totalStartMinutes + durationMinutes;
    
    const endH = Math.floor(totalEndMinutes / 60) % 24;
    const endM = totalEndMinutes % 60;
    
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    
    return `${startTime} - ${endTime}`;
}

/**
 * Verifica se una data è festivo
 */
function isHoliday(dateString) {
    return CONFIG.HOLIDAYS.includes(dateString);
}

/**
 * Calcola ore da stringa turno (formato HH:MM - HH:MM o stati operativi)
 */
function calculateHours(shiftValue) {
    // Se è uno stato operativo con emoji, ritorna 0
    if (shiftValue && shiftValue.includes('☕') || shiftValue.includes('🏖️') || 
        shiftValue.includes('📋') || shiftValue.includes('🩺') || 
        shiftValue.includes('📦') || shiftValue.includes('🏢')) {
        return 0;
    }
    
    // Se contiene " - ", è un range orario
    if (shiftValue && shiftValue.includes(' - ')) {
        const [start, end] = shiftValue.split(' - ');
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        
        let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (totalMinutes < 0) totalMinutes += 24 * 60; // Gestisce turni notturni
        
        return totalMinutes / 60; // Ritorna ore decimali
    }
    
    // Default: nessun orario riconosciuto
    return 0;
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ============================================
// ROTAZIONE SEQUENZIALE M-P-N-R
// ============================================

/**
 * CORE: Genera rotazione (funzione delegata a sm-engine.js)
 */
function generateRotationSequence(startIndex, days) {
    return window.ShiftManager.generateRotationSequence(startIndex, days);
}

/**
 * Calcola punto di partenza ottimale (delegato a sm-engine.js)
 */
function getNextStartIndex(lastShift) {
    return window.ShiftManager.getNextStartIndex(lastShift);
}

/**
 * Controlla vincoli dipendente (delegato a sm-engine.js)
 */
function getAllowedShiftsForEmployee(employee) {
    return window.ShiftManager.getAllowedShiftsForEmployee(employee);
}

/**
 * Genera schedule per dipendente (delegato a sm-engine.js)
 */
function generateEmployeeSchedule(employee, startIndex) {
    return window.ShiftManager.generateEmployeeSchedule(employee, startIndex);
}

/**
 * GENERA TUTTI I TURNI (delegato a sm-engine.js)
 */
function generateAllShifts() {
    return window.ShiftManager.generateAllShifts();
}

// ============================================
// GESTIONE DIPENDENTI
// ============================================

/**
 * Aggiungi dipendente (delegato a sm-employees.js)
 */
function addEmployee(data) {
    return window.ShiftManager.addEmployee(data);
}

/**
 * Rimuovi dipendente (delegato a sm-employees.js)
 */
function removeEmployee(id) {
    return window.ShiftManager.removeEmployee(id);
}

/**
 * Aggiorna dipendente (delegato a sm-employees.js)
 */
function updateEmployee(id, data) {
    return window.ShiftManager.updateEmployee(id, data);
}

/**
 * Modifica dipendente esistente
 */
function editEmployee(id) {
    const employee = STATE.employees.find(e => e.id === id);
    if (!employee) return;
    
    // Popola il form con i dati esistenti
    document.getElementById('empCode').value = employee.code;
    document.getElementById('empName').value = employee.name;
    document.getElementById('empDepartment').value = employee.department;
    document.getElementById('empSubgroup').value = employee.subgroup;
    
    // Popola rotazione reparti
    const deptRotationInput = document.getElementById('empDepartmentRotation');
    if (deptRotationInput && employee.allowedDepartments && employee.allowedDepartments.length > 0) {
        deptRotationInput.value = employee.allowedDepartments.join(', ');
    } else if (deptRotationInput) {
        deptRotationInput.value = '';
    }
    
    // Verifica se è un contratto personalizzato
    const standardContracts = [40, 37.5, 33.20, 31.15];
    const contractType = employee.contractType || employee.contractHours || 40;
    
    if (standardContracts.includes(contractType)) {
        document.getElementById('empContractType').value = contractType;
    } else {
        // È un contratto personalizzato
        document.getElementById('empContractType').value = 'custom';
        document.getElementById('customContractFields').style.display = 'block';
        document.getElementById('empCustomHours').value = contractType;
        document.getElementById('empTurnHours').value = employee.customTurnHours || 6;
        document.getElementById('empTurnMinutes').value = employee.customTurnMinutes || 40;
        document.getElementById('empRestDays').value = employee.restDaysPerWeek || 1;
    }
    
    // Ripristina selezioni multiple delle fasce
    const select = document.getElementById('empStartShift');
    if (select) {
        // Deseleziona tutto prima
        Array.from(select.options).forEach(opt => opt.selected = false);
        
        // Seleziona le fasce salvate
        if (employee.customStart !== undefined) {
            const shifts = Array.isArray(employee.customStart) ? employee.customStart : [employee.customStart];
            shifts.forEach(shiftIndex => {
                const option = select.querySelector(`option[value="${shiftIndex}"]`);
                if (option) option.selected = true;
            });
        }
    }
    
    // Memorizza l'ID per l'update
    document.getElementById('editingEmployeeId').value = id;
    document.getElementById('btnSaveEmployee').textContent = '💾 Aggiorna';
    document.getElementById('btnCancelEdit').style.display = 'inline-block';
    
    // Apri modal
    openAddEmployeeModal();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Annulla modifica dipendente
 */
function cancelEditEmployee() {
    const editingIdEl = document.getElementById('editingEmployeeId');
    if (editingIdEl) editingIdEl.value = '';

    const btnSave = document.getElementById('btnSaveEmployee');
    if (btnSave) btnSave.textContent = '✅ Aggiungi';

    const btnCancel = document.getElementById('btnCancelEdit');
    if (btnCancel) btnCancel.style.display = 'none';

    const form = document.getElementById('addEmployeeForm');
    if (form && typeof form.reset === 'function') form.reset();

    const customHours = document.getElementById('customHoursContainer');
    if (customHours) customHours.style.display = 'none';

    // Close modal if present
    if (typeof closeAddEmployeeModal === 'function') closeAddEmployeeModal();
}

/**
 * Cerca dipendenti
 */
function searchEmployees(query) {
    STATE.filters.search = query.toLowerCase();
    renderTable();
}

/**
 * Ordina dipendenti
 */
function sortEmployees(by) {
    const sorters = {
        name: (a, b) => a.name.localeCompare(b.name),
        code: (a, b) => a.code.localeCompare(b.code),
        department: (a, b) => a.department.localeCompare(b.department),
        hours: (a, b) => (b.stats?.totalHours || 0) - (a.stats?.totalHours || 0),
        time: (a, b) => {
            // Ordina per orario del primo turno
            const getFirstTime = (employee) => {
                if (!employee.schedule || employee.schedule.length === 0) return '99:99';
                
                for (let shift of employee.schedule) {
                    if (shift && shift.includes(' - ')) {
                        return shift.split(' - ')[0].trim();
                    }
                }
                return '99:99';
            };
            
            const timeA = getFirstTime(a);
            const timeB = getFirstTime(b);
            
            const [hA, mA] = timeA.split(':').map(Number);
            const [hB, mB] = timeB.split(':').map(Number);
            
            return (hA * 60 + mA) - (hB * 60 + mB);
        }
    };
    
    if (sorters[by]) {
        STATE.employees.sort(sorters[by]);
        renderTable();
    }
}

// ============================================
// RENDERING TABELLA (OTTIMIZZATO 1000+)
// ============================================

/**
 * Genera HTML intestazioni tabella
 */
function renderTableHeader() {
    if (!STATE.weekDates.length) return;
    
    let html = '<tr><th>Dipendente / Reparto</th>';
    
    STATE.weekDates.forEach(dateStr => {
        const date = formatDate(dateStr);
        const holidayClass = isHoliday(dateStr) ? 'holiday' : '';
        html += `<th class="${holidayClass}">
            ${date.dayName}<br>
            <span style="font-weight:400;font-size:9px">${date.full}</span>
        </th>`;
    });
    
    html += '<th>Ore Tot</th><th>M/P/N/R</th><th></th></tr>';
    
    STATE.dom.thead.innerHTML = html;
}

/**
 * Genera opzioni select per turni (fasce orarie + stati operativi)
 */
function getShiftOptions(currentValue = '', employee = null) {
    let options = '<option value="">-- Seleziona --</option>';
    
    // Gruppo: Fasce Orarie personalizzate (da configurazione)
    if (STATE.timeSlots && STATE.timeSlots.length > 0) {
        options += '<optgroup label="🕒 Fasce Orarie Configurate">';
        STATE.timeSlots.forEach((slot, index) => {
            // Se è già in formato range, usa così, altrimenti usa calculateShiftEnd
            let slotValue = slot;
            if (!slot.includes(' - ')) {
                // compute end time based on employee contract or default
                const contractType = (employee && (employee.contractType || employee.contractHours)) || 40;
                slotValue = calculateShiftEnd(slot, contractType, employee);
            }
            const label = `T${index + 1}: ${slotValue}`;
            const selected = currentValue === slotValue || currentValue === slot ? 'selected' : '';
            options += `<option value="${slotValue}" ${selected}>${label}</option>`;
        });
        options += '</optgroup>';
    }
    
    // Gruppo: Stati Operativi con emoji
    options += '<optgroup label="🏷️ Stati Operativi">';
    const operativeStates = [
        { emoji: '☕', name: 'Riposo' },
        { emoji: '🏖️', name: 'Ferie' },
        { emoji: '📋', name: 'Permesso' },
        { emoji: '🩺', name: 'Malattia' },
        { emoji: '📦', name: 'Magazzino' },
        { emoji: '🏢', name: 'Ufficio' }
    ];
    
    operativeStates.forEach(state => {
        const selected = currentValue === state.name ? 'selected' : '';
        options += `<option value="${state.name}" ${selected}>${state.emoji} ${state.name}</option>`;
    });
    
    // Aggiungi stati custom
    if (STATE.customStates && STATE.customStates.length > 0) {
        STATE.customStates.forEach(stateName => {
            const selected = currentValue === stateName ? 'selected' : '';
            options += `<option value="${stateName}" ${selected}>🏷️ ${stateName}</option>`;
        });
    }
    options += '</optgroup>';
    
    // Opzione personalizzata (se il valore attuale non è in nessuna lista)
    const isInCustomSlots = STATE.timeSlots.some(t => t === currentValue || t.includes(currentValue));
    const isInStates = operativeStates.some(s => s.name === currentValue) || STATE.customStates.includes(currentValue);
    
    if (currentValue && !isInCustomSlots && !isInStates) {
        options += '<optgroup label="✏️ Personalizzato">';
        options += `<option value="${currentValue}" selected>🕒 ${currentValue}</option>`;
        options += '</optgroup>';
    }
    
    return options;
}

/**
 * Genera HTML riga dipendente (OTTIMIZZATO)
 */
function renderEmployeeRow(employee) {
    // Mostra il reparto attivo e, se c'è rotazione, tutti i reparti
    let departmentDisplay = employee.department;
    if (employee.subgroup) {
        departmentDisplay += ` (${employee.subgroup})`;
    }
    
    // Se ha rotazione reparti, mostra anche gli altri reparti
    if (employee.allowedDepartments && employee.allowedDepartments.length > 1) {
        const currentIndex = employee.currentDepartmentIndex || 0;
        const nextIndex = (currentIndex + 1) % employee.allowedDepartments.length;
        const nextDept = employee.allowedDepartments[nextIndex];
        departmentDisplay += ` → Prossimo: ${nextDept}`;
    }
    
    // Crea badge per fasce personalizzate
    let shiftsBadge = '';
    if (employee.customStart && employee.customStart.length > 0) {
        const shiftsText = employee.customStart.map(i => `T${i + 1}`).join(', ');
        shiftsBadge = `<span style="display:inline-block;background:#3b82f6;color:white;font-size:9px;padding:2px 6px;border-radius:3px;margin-left:4px;" title="Fasce orarie: ${shiftsText}">⏰ ${shiftsText}</span>`;
    }
    
    // Crea badge per rotazione reparti
    let deptRotationBadge = '';
    if (employee.allowedDepartments && employee.allowedDepartments.length > 1) {
        const deptText = employee.allowedDepartments.join(' → ');
        deptRotationBadge = `<span style="display:inline-block;background:#10b981;color:white;font-size:9px;padding:2px 6px;border-radius:3px;margin-left:4px;" title="Rotazione reparti: ${deptText}">🔄 ${employee.allowedDepartments.length} reparti</span>`;
    }

    // Badge per decisione applicata dal modal (riposo/skip)
    let decisionBadge = '';
    if (employee._appliedDecision) {
        if (employee._appliedDecision === 'rest') {
            decisionBadge = `<span style="display:inline-block;background:#10b981;color:white;font-size:11px;padding:4px 8px;border-radius:4px;margin-left:8px;">🛌 Riposo</span>`;
        } else if (employee._appliedDecision === 'skip') {
            decisionBadge = `<span style="display:inline-block;background:#f59e0b;color:white;font-size:11px;padding:4px 8px;border-radius:4px;margin-left:8px;">🔁 Salta</span>`;
        } else if (employee._appliedDecision === 'ignore') {
            decisionBadge = `<span style="display:inline-block;background:#94a3b8;color:white;font-size:11px;padding:4px 8px;border-radius:4px;margin-left:8px;">✖️ Ignora</span>`;
        }
    }
    
    // Info dipendente
    let html = `<tr data-employee-id="${employee.id}">
        <td class="employee-info">
            <div class="employee-id">ID: ${employee.code}</div>
            <div class="employee-name">
                ${employee.name}
                ${shiftsBadge}
                ${deptRotationBadge}
                ${decisionBadge}
                <button onclick="editEmployee('${employee.id}')" class="btn-edit-inline" title="Modifica dipendente">✍️</button>
            </div>
            <div class="employee-role">${departmentDisplay}</div>
        </td>`;
    
    // Celle turni
    if (employee.schedule && employee.schedule.length === 7) {
        employee.schedule.forEach((shift, dayIndex) => {
            const dateStr = STATE.weekDates[dayIndex];
            const holidayClass = isHoliday(dateStr) ? 'holiday' : '';
            
            // Determina classe CSS e valore da mostrare
            let shiftClass = 'shift-riposo';
            let displayValue = shift || '-';
            
            // Verifica se è uno stato operativo (contiene emoji o parole chiave)
            const isOperativeState = shift && (
                shift.includes('☕') || shift.includes('Riposo') ||
                shift.includes('🏖️') || shift.includes('Ferie') ||
                shift.includes('📋') || shift.includes('Permesso') ||
                shift.includes('🩺') || shift.includes('Malattia') ||
                shift.includes('📦') || shift.includes('Magazzino') ||
                shift.includes('🏢') || shift.includes('Ufficio')
            );
            
            if (!isOperativeState && shift && shift.includes(' - ')) {
                // È un time range (es: "06:00 - 12:15")
                const match = shift.match(/^(\d{2}):(\d{2})/);
                if (match) {
                    const hour = parseInt(match[1]);
                    if (hour >= 6 && hour < 13) {
                        shiftClass = 'shift-mattina';
                    } else if (hour >= 13 && hour < 20) {
                        shiftClass = 'shift-pomeriggio';
                    } else {
                        shiftClass = 'shift-notte';
                    }
                }
            }
            
            // Mostra l'orario o stato operativo come testo semplice con onclick per aprire modal di modifica
            html += `<td class="shift-cell ${shiftClass} ${holidayClass}" onclick="openShiftEditor('${employee.id}', ${dayIndex}, '${(shift || '').replace(/'/g, "\\'")}')">
                <div class="shift-display">${displayValue}</div>
            </td>`;
        });
    } else {
        // Settimana non generata
        for (let i = 0; i < 7; i++) {
            html += '<td class="shift-cell"><span class="text-muted">-</span></td>';
        }
    }
    
    // Totale ore
    const totalHours = employee.stats?.totalHours || 0;
    html += `<td class="hours-total">${totalHours.toFixed(2)}h</td>`;
    
    // Numero turni
    const shifts = employee.stats?.shifts || 0;
    html += `<td style="font-size:11px;color:var(--text-secondary)">
        ${shifts} turni
    </td>`;
    
    // Azioni
    html += `<td>
        <button class="btn-icon btn-danger" onclick="confirmRemoveEmployee('${employee.id}')" title="Elimina">×</button>
    </td></tr>`;
    
    return html;
}

/**
 * Rendering principale tabella (PERFORMANCE OTTIMIZZATA)
 */
function renderTable() {
    if (!STATE.dom.tbody) {
        console.error('ERRORE: tbody non trovato!');
        return;
    }
    
    console.log('renderTable() chiamata, dipendenti:', STATE.employees.length);
    
    // Filtra dipendenti
    let filteredEmployees = STATE.employees;
    if (STATE.filters.search) {
        filteredEmployees = STATE.employees.filter(e => 
            e.name.toLowerCase().includes(STATE.filters.search) ||
            e.code.toLowerCase().includes(STATE.filters.search) ||
            e.department.toLowerCase().includes(STATE.filters.search)
        );
    }
    
    console.log('Dipendenti filtrati:', filteredEmployees.length);
    
    // Rendering ottimizzato con DocumentFragment
    if (filteredEmployees.length > CONFIG.MAX_ROWS_BEFORE_VIRTUAL) {
        // Virtual scrolling per 100+ righe
        renderTableVirtual(filteredEmployees);
    } else {
        // Rendering normale con fragment
        renderTableNormal(filteredEmployees);
    }
    
    updateStats();
}

/**
 * Rendering normale (< 100 righe)
 */
function renderTableNormal(employees) {
    console.log('renderTableNormal chiamata con', employees.length, 'dipendenti');
    
    if (employees.length === 0) {
        STATE.dom.tbody.innerHTML = `<tr>
            <td colspan="11" style="text-align: center; padding: 48px; color: #64748b;">
                <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                <p style="font-size: 14px; font-weight: 500; margin: 0 0 8px 0;">
                    Nessun dipendente inserito
                </p>
                <p style="font-size: 12px; color: #475569; margin: 0;">
                    Clicca su "➕ Dipendente" per iniziare
                </p>
            </td>
        </tr>`;
        return;
    }
    
    // Genera HTML di tutte le righe
    const html = employees.map(employee => renderEmployeeRow(employee)).join('');
    
    // Sostituisci tutto il contenuto
    STATE.dom.tbody.innerHTML = html;
    
    console.log('Tabella renderizzata con', employees.length, 'righe');
    
    // Aggiorna statistiche
    updateStats();
}

/**
 * Rendering virtuale (100+ righe) - SCALABILITÀ 1000+
 */
function renderTableVirtual(employees) {
    // Implementazione semplificata: rendering batch
    // Per implementazione completa virtual scrolling, usare IntersectionObserver
    
    STATE.dom.tbody.innerHTML = '';
    const batchSize = 50;
    let currentBatch = 0;
    
    function renderBatch() {
        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, employees.length);
        const batchEmployees = employees.slice(start, end);
        
        const html = batchEmployees.map(e => renderEmployeeRow(e)).join('');
        STATE.dom.tbody.insertAdjacentHTML('beforeend', html);
        
        currentBatch++;
        
        if (end < employees.length) {
            requestAnimationFrame(renderBatch);
        }
    }
    
    renderBatch();
}

/**
 * Aggiorna singolo turno
 */
function updateShift(employeeId, dayIndex, newShift) {
    const employee = STATE.employees.find(e => e.id === employeeId);
    if (employee && employee.schedule) {
        employee.schedule[dayIndex] = newShift;
        
        // Mark schedule as locked when user edits manually
        employee.lockedSchedule = true;
        console.log(`[DEBUG] LOCK SET: ${employee.name} (id=${employee.id}) lockedSchedule=true via updateShift`);

        // Ricalcola statistiche
        const stats = {
            M: employee.schedule.filter(s => s === 'M').length,
            P: employee.schedule.filter(s => s === 'P').length,
            N: employee.schedule.filter(s => s === 'N').length,
            R: employee.schedule.filter(s => s === 'R').length,
            totalHours: employee.schedule.reduce((sum, s) => sum + calculateHours(s), 0)
        };
        employee.stats = stats;
        
        // Aggiorna ultima shift se è l'ultimo giorno
        if (dayIndex === 6) {
            employee.lastShift = newShift;
        }
        
        // Persist changes
        if (typeof saveData === 'function') saveData();

        // Aggiorna UI riga specifica (ottimizzato)
        const row = STATE.dom.tbody.querySelector(`tr[data-employee-id="${employeeId}"]`);
        if (row) {
            const hoursCell = row.querySelector('.hours-total');
            if (hoursCell) hoursCell.textContent = `${stats.totalHours}h`;
            
            const statsCell = row.querySelectorAll('td')[9]; // Colonna M/P/N/R
            if (statsCell) {
                statsCell.innerHTML = `
                    <span class="badge badge-primary">M:${stats.M}</span>
                    <span class="badge badge-success">P:${stats.P}</span>
                    <span class="badge badge-warning">N:${stats.N}</span>
                    <span class="badge" style="background:rgba(148,163,184,.2);color:#94a3b8">R:${stats.R}</span>
                `;
            }
        }
        
        saveData();
        updateStats();
        
        // Salva anche nei turni settimanali
        if (STATE.currentWeek) {
            if (!STATE.weeklySchedules[STATE.currentWeek]) {
                STATE.weeklySchedules[STATE.currentWeek] = {};
            }
            STATE.weeklySchedules[STATE.currentWeek][employeeId] = {
                schedule: employee.schedule,
                stats: employee.stats
            };
            // Safe save (handles quota exceeded)
            if (typeof window.ShiftManager !== 'undefined' && typeof window.ShiftManager.saveWeeklySchedulesSafely === 'function') {
                window.ShiftManager.saveWeeklySchedulesSafely(6);
            } else {
                try { localStorage.setItem('weeklySchedules', JSON.stringify(STATE.weeklySchedules)); }
                catch (e) { console.error('Failed saving weeklySchedules (no safe helper available)', e); }
            }
        }
    }
}

// ============================================
// STATISTICHE GLOBALI
// ============================================

function updateStats() {
    const totalEmployees = STATE.employees.length;
    const filteredCount = STATE.dom.tbody?.querySelectorAll('tr').length || 0;
    
    // Aggiorna badge header
    if (STATE.dom.employeeCount) {
        STATE.dom.employeeCount.textContent = `${totalEmployees} Dipendenti`;
    }
    
    // Statistiche aggregate
    const totalStats = STATE.employees.reduce((acc, emp) => {
        if (emp.stats) {
            acc.M += emp.stats.M;
            acc.P += emp.stats.P;
            acc.N += emp.stats.N;
            acc.R += emp.stats.R;
            acc.totalHours += emp.stats.totalHours;
        }
        return acc;
    }, { M: 0, P: 0, N: 0, R: 0, totalHours: 0 });
    
    // Mostra in console per debug
    console.log('📊 Statistiche:', totalStats);
}

// ============================================
// EXPORT EXCEL
// ============================================

/**
 * Export tabella in Excel (delegato a sm-export.js)
 */
function exportToExcel() { return window.ShiftManager.exportToExcel(); }

/**
 * Export PDF (delegato a sm-export.js)
 */
function exportToPDF() { return window.ShiftManager.exportToPDF(); }

/**
 * Formatta un turno per l'export PDF (delegato a sm-export.js)
 */
function formatShiftForPDF(shift) { return window.ShiftManager.formatShiftForPDF(shift); }

/**
 * Export PDF con titolo personalizzato (delegato a sm-export.js)
 */
function exportPDFWithTitle(customTitle) {
    try {
        return window.ShiftManager.exportPDFWithTitle(customTitle);
    } catch (e) {
        console.error('[ERROR] exportPDFWithTitle failed', e);
        alert('❌ Errore durante l\'esportazione PDF: ' + (e.message || e));
    }
}

/**
 * Apri modal per export PDF con titolo
 */
function openPDFExportModal() {
    const defaultTitle = `Turni Settimana ${STATE.currentWeek || ''}`;
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
                    📄 Esporta PDF per Bacheca
                </h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                        🎯 Titolo del PDF
                    </label>
                    <input 
                        type="text" 
                        id="pdfTitleInput" 
                        class="form-control" 
                        value="${defaultTitle}"
                        placeholder="Es: Turni Gennaio 2026"
                        style="font-size: 14px;"
                    >
                    <small style="display: block; margin-top: 6px; font-size: 11px; color: #64748b;">
                        Questo titolo apparirà in alto nel PDF esportato
                    </small>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Annulla</button>
                <button class="btn btn-primary" onclick="confirmPDFExport()">
                    💾 Genera PDF
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('pdfTitleInput').focus();
}

/**
 * Conferma export PDF con titolo dal modal
 */
function confirmPDFExport() {
    const title = document.getElementById('pdfTitleInput').value.trim();
    document.querySelector('.modal.active').remove();
    
    if (title) {
        exportPDFWithTitle(title);
    } else {
        exportPDFWithTitle();
    }
}

// ============================================
// PERSISTENZA DATI
// ============================================

function saveData() { return window.ShiftManager.saveData(); }

function loadData() { return window.ShiftManager.loadData(); }

function clearAllData() { return window.ShiftManager.clearAllData(); }

// ============================================
// UI HELPERS
// ============================================

function showLoading(show) { return window.ShiftManager.showLoading(show); }

function showNotification(message, type = 'info') { return window.ShiftManager.showNotification(message, type); }

function confirmRemoveEmployee(id) {
    const employee = STATE.employees.find(e => e.id === id);
    if (employee && confirm(`Eliminare ${employee.name}?`)) {
        removeEmployee(id);
        showNotification('✅ Dipendente eliminato', 'success');
    }
}

// Aggiorna la riga DOM per un singolo dipendente (usato dopo applicazioni rapide)
function updateEmployeeRowInDOM(employeeId) {
    try {
        const tr = STATE.dom.tbody.querySelector(`tr[data-employee-id="${employeeId}"]`);
        if (!tr) return;
        const emp = STATE.employees.find(e => e.id === employeeId);
        if (!emp) return;
        const newHtml = renderEmployeeRow(emp);
        tr.outerHTML = newHtml;
    } catch (e) {
        console.error('updateEmployeeRowInDOM error:', e);
    }
}
window.updateEmployeeRowInDOM = updateEmployeeRowInDOM;

// Esporta i dati correnti della tabella come backup (Salvataggi)
function exportTableToSalvataggi() {
    try {
        const week = STATE.currentWeek || (new Date().toISOString().split('T')[0]);
        const name = `Tabella ${week}`;
        const should = confirm(`Vuoi salvare i dati della tabella corrente come backup con nome "${name}"?`);
        if (!should) return;
        const ok = ShiftManager.saveNamedBackup(name);
        if (ok) {
            ShiftManager.showNotification('✅ Tabella esportata nei Salvataggi', 'success');
            try { showSection('salvataggi'); } catch (e) { /* ignore */ }
            try { if (typeof ShiftManager._onBackupsChanged === 'function') ShiftManager._onBackupsChanged(); } catch (e) { /* ignore */ }
        } else {
            alert('Errore durante il salvataggio della tabella nei Salvataggi.');
        }
    } catch (e) {
        console.error('exportTableToSalvataggi error', e);
        alert('Errore durante l\'esportazione della tabella.');
    }
}

// ============================================
// EVENT HANDLERS
// ============================================

function handleWeekChange(weekString) {
    STATE.currentWeek = weekString;
    STATE.weekDates = getWeekDates(weekString);
    
    // Carica i turni della settimana selezionata
    if (STATE.weeklySchedules[weekString]) {
        const weekSchedules = STATE.weeklySchedules[weekString];
        STATE.employees.forEach(emp => {
            if (weekSchedules[emp.id]) {
                emp.schedule = weekSchedules[emp.id].schedule || [];
                emp.stats = weekSchedules[emp.id].stats || { totalHours: 0, shifts: 0 };
            } else {
                // Nessun turno per questa settimana, resetta
                emp.schedule = [];
                emp.stats = { totalHours: 0, shifts: 0 };
            }
        });
    } else {
        // Settimana mai generata, resetta tutti i turni
        STATE.employees.forEach(emp => {
            emp.schedule = [];
            emp.stats = { totalHours: 0, shifts: 0 };
        });
    }
    
    renderTableHeader();
    renderTable();
    updateShiftsLegend();
    generateRiepilogoPresenza();
    
    // Prompt per salvare Export dopo week change è disabilitato (preferenza utente).

    // Aggiorna badge
    if (STATE.dom.weekBadge) {
        const start = formatDate(STATE.weekDates[0]);
        const end = formatDate(STATE.weekDates[6]);
        STATE.dom.weekBadge.textContent = `${start.full} - ${end.full}`;
    }
    
    saveData();
}

function handleSearchInput(value) {
    searchEmployees(value);
}

function handleAddEmployee(formData) {
    if (!formData.name || !formData.code) {
        alert('⚠️ Nome e Codice sono obbligatori!');
        return;
    }
    
    addEmployee(formData);
    showNotification('✅ Dipendente aggiunto', 'success');
}

// ============================================
// IMPORTAZIONE E CONVERSIONE DATI
// ============================================

/**
 * Converte dati dal vecchio formato (Backup_Turni_Ecommerce) al nuovo formato
 */
function convertOldFormatToNew(oldData) {
    if (!oldData.personale || !Array.isArray(oldData.personale)) {
        return [];
    }
    
    return oldData.personale.map((person, index) => {
        // Mantieni gli orari originali invece di convertirli in M/P/N/R
        const schedule = person.turni || [];
        
        // Calcola statistiche
        const stats = calculateStatsFromSchedule(schedule);
        
        // Determina contractType (converti contractHours se presente)
        const contractType = parseFloat(person.contractType || person.ore || 40);
        const restDaysPerWeek = (contractType === 33.20 || contractType === 31.15) ? 2 : 1;
        
        return {
            id: person.idRiga || `emp-${person.codice}-${Date.now()}-${index}`,
            code: person.codice || '',
            name: person.nome || '',
            department: person.mansione || 'Operativo',
            subgroup: person.sottogruppo || '',
            contractType: contractType,
            restDaysPerWeek: restDaysPerWeek,
            customStart: person.customStart || undefined,
            allowedDepartments: person.allowedDepartments || undefined,
            currentDepartmentIndex: person.currentDepartmentIndex || 0,
            schedule: schedule,
            stats: stats,
            absences: person.absences || [],
            lastShift: schedule.length > 0 ? schedule[schedule.length - 1] : null
        };
    });
}

/**
 * Calcola statistiche da schedule con orari
 */
function calculateStatsFromSchedule(schedule) {
    const stats = { totalHours: 0, shifts: schedule.length };
    
    schedule.forEach(shift => {
        // Estrai ore dal formato "HH:MM - HH:MM"
        const hours = calculateHoursFromShift(shift);
        stats.totalHours += hours;
    });
    
    return stats;
}

/**
 * Calcola ore da stringa orario tipo "08:30 - 15:10"
 */
function calculateHoursFromShift(shift) {
    if (!shift || shift === 'Riposo' || shift === 'Ferie' || shift === 'Magazzino' || shift === 'Ufficio') {
        return 0;
    }
    
    // Estrai orari di inizio e fine
    const match = shift.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
    if (!match) return 0;
    
    const startHour = parseInt(match[1]);
    const startMin = parseInt(match[2]);
    const endHour = parseInt(match[3]);
    const endMin = parseInt(match[4]);
    
    // Calcola differenza in ore
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    // Gestisci turni notturni che attraversano la mezzanotte
    if (hours < 0) {
        hours += 24;
    }
    
    return hours + (minutes / 60);
}

// ============================================
// INIZIALIZZAZIONE
// ============================================

function init() {
    // Cache DOM elements
    STATE.dom = {
        tbody: document.getElementById('corpoTabella'),
        thead: document.getElementById('tableHead'),
        weekInput: document.getElementById('settimana'),
        searchInput: document.getElementById('searchInput'),
        employeeCount: document.getElementById('employeeCount'),
        weekBadge: document.getElementById('weekBadge')
    };
    
    // Carica dati salvati
    loadData();
    // Apply auto-prune if enabled to prevent storage overflow
    try {
        const apr = (window.ShiftManager && typeof window.ShiftManager.getAutoPruneSettings === 'function') ? window.ShiftManager.getAutoPruneSettings() : null;
        if (apr && apr.enabled) {
            try { if (typeof window.ShiftManager.pruneBackupsIfNeeded === 'function') window.ShiftManager.pruneBackupsIfNeeded(apr.keepBackups); } catch(e){}
            try { if (typeof window.ShiftManager.pruneExportsIfNeeded === 'function') window.ShiftManager.pruneExportsIfNeeded(apr.keepExports); } catch(e){}
        }
    } catch(e) { /* ignore */ }
    
    // Imposta settimana corrente se non caricata
    if (!STATE.currentWeek) {
        const now = new Date();
        const year = now.getFullYear();
        const week = Math.ceil((((now - new Date(year, 0, 1)) / 86400000) + 1) / 7);
        STATE.currentWeek = `${year}-W${String(week).padStart(2, '0')}`;
    }
    
    if (STATE.dom.weekInput) {
        STATE.dom.weekInput.value = STATE.currentWeek;
        STATE.dom.weekInput.addEventListener('change', (e) => handleWeekChange(e.target.value));
    }
    
    // Setup search
    if (STATE.dom.searchInput) {
        STATE.dom.searchInput.addEventListener('input', 
            debounce((e) => handleSearchInput(e.target.value), 300)
        );
    }

    // In-page guida: gestione stampa/scarico e toggle (se presente)
    try {
        const btnPrint = document.getElementById('btnPrintGuidaLocalFull');
        const btnDownload = document.getElementById('btnDownloadGuidaLocalFull');
        const btnToggle = document.getElementById('btnToggleGuidaLocal');
        const guide = document.getElementById('guidaContentLocal');
        if (btnToggle) btnToggle.addEventListener('click', () => {
            if (!guide) return;
            if (guide.style.display === 'none' || guide.style.display === '') { guide.style.display = 'block'; btnToggle.textContent='Nascondi Guida'; guide.scrollIntoView({behavior:'smooth'}); }
            else { guide.style.display = 'none'; btnToggle.textContent='Mostra Guida'; }
        });
        if (btnPrint) btnPrint.addEventListener('click', () => { window.print(); });
        if (btnDownload) btnDownload.addEventListener('click', () => {
            try {
                if (!guide) return;
                const w = window.open('', '_blank');
                const cssHref = Array.from(document.getElementsByTagName('link')).find(l=>l.rel==='stylesheet')?.href || 'shifts-style.css';
                w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Guida - Shift Manager</title><link rel="stylesheet" href="'+cssHref+'"><style>@media print{ body{ -webkit-print-color-adjust:exact; } }</style></head><body>' + guide.innerHTML + '</body></html>');
                w.document.close(); w.focus();
                setTimeout(()=>{ try { w.print(); } catch(e){} }, 300);
            } catch(e) { console.error('download local guide failed', e); }
        });
    } catch(e) { /* ignore */ }
    
    // Genera date settimana
    STATE.weekDates = getWeekDates(STATE.currentWeek);
    
    // Render iniziale
    renderTableHeader();
    renderTable();
    
    // Popola select ferie
    populateAbsenceEmployeeSelect();
    populateAbsenceTypeSelect();
    updateAbsencesList();
    
    // Aggiorna lista stati personalizzati
    updateCustomStatesList();
    
    // Aggiorna rotazioni e fasce orarie
    updateDepartmentRotationsList();
    updateTimeSlotsList(); // Questo chiama anche updateShiftsLegend()
    populateDepartmentSelect();
    populateStartShiftSelect(); // Popola select scelta fascia oraria
    
    // Aggiorna statistiche
    updateStats();
    
    // Nascondi loading
    setTimeout(() => showLoading(false), 500);

    // Check persistent storage banner
    try { showStorageBannerIfNeeded(); } catch(e) { /* ignore if helper not ready */ }
    
    console.log('%c✅ SHIFT MANAGER v2.0 - READY', 'color: #10b981; font-size: 16px; font-weight: bold');
    console.log('%c⚡ Rotazione basata su fasce configurate', 'color: #6366f1; font-size: 12px');
    console.log(`%c📊 ${STATE.employees.length} dipendenti caricati`, 'color: #f59e0b; font-size: 12px');
}

// ============================================
// ROTAZIONI PER REPARTO/SOTTOGRUPPO
// ============================================

// STORAGE banner helpers
function showStorageBannerIfNeeded() {
    try {
        const banner = document.getElementById('storageStatusBanner');
        if (!banner) return;
        const dismissed = localStorage.getItem('shift_manager_cleaned_dismissed');
        const cleaned = localStorage.getItem('shift_manager_cleaned');
        if (cleaned && !dismissed) {
            banner.style.display = 'block';
            const action = document.getElementById('storageStatusAction');
            const dismiss = document.getElementById('storageStatusDismiss');
            if (action && !action._bound) {
                action._bound = true;
                action.onclick = async () => {
                    try {
                        const res = await ShiftManager.autoCleanLocalStorage({ keepBackups: 3, keepExports: 3 });
                        console.log('autoCleanLocalStorage from banner result', res);
                        if (res && res.success) {
                            localStorage.removeItem('shift_manager_cleaned');
                            banner.style.display = 'none';
                            ShiftManager.showNotification('✅ Pulizia spazio completata', 'success');
                        } else {
                            ShiftManager.showNotification('⚠️ Pulizia spazio: alcune operazioni non sono riuscite. Controlla console.', 'warning');
                        }
                    } catch (e) { console.warn('autoCleanLocalStorage failed', e); }
                };
            }
            if (dismiss && !dismiss._bound) {
                dismiss._bound = true;
                dismiss.onclick = () => { try { localStorage.setItem('shift_manager_cleaned_dismissed', '1'); banner.style.display='none'; } catch(e){} };
            }
        } else {
            banner.style.display = 'none';
        }
    } catch(e) { console.warn('showStorageBannerIfNeeded failed', e); }
}

function clearStorageBannerDismiss() {
    try { localStorage.removeItem('shift_manager_cleaned_dismissed'); } catch(e){}
}


/**
 * Aggiungi rotazione specifica per reparto (delegato a sm-employees.js)
 */
function addDepartmentRotation(department, allowedSlots) {
    return window.ShiftManager.addDepartmentRotation(department, allowedSlots);
}

/**
 * Rimuovi rotazione reparto (delegato a sm-employees.js)
 */
function removeDepartmentRotation(department) {
    return window.ShiftManager.removeDepartmentRotation(department);
}

/**
 * Aggiorna lista rotazioni reparto (delegato a sm-employees.js)
 */
function updateDepartmentRotationsList() {
    return window.ShiftManager.updateDepartmentRotationsList();
}

/**
 * Popola select reparti per rotazioni (delegato a sm-employees.js)
 */
function populateDepartmentSelect() {
    return window.ShiftManager.populateDepartmentSelect();
}

/**
 * Gestisce l'aggiunta di una rotazione per reparto/sottogruppo (delegato a sm-employees.js)
 */
function handleAddDepartmentRotation() {
    return window.ShiftManager.handleAddDepartmentRotation();
}

// ============================================
// FASCE ORARIE CONFIGURABILI
// ============================================

/**
 * Aggiungi fascia oraria
 */
function addTimeSlot(startTime, endTime) {
    if (!startTime) return;
    
    // Se l'utente ha specificato l'ora di fine, salva la fascia completa
    // Altrimenti salva solo l'ora di inizio (verrà calcolata automaticamente)
    let timeSlot;
    if (endTime) {
        timeSlot = `${startTime} - ${endTime}`;
    } else {
        timeSlot = startTime;
    }
    
    // Controlla se esiste già (confronta sia formato completo che solo inizio)
    const exists = STATE.timeSlots.some(slot => {
        if (slot.includes(' - ')) {
            return slot === timeSlot;
        } else {
            return slot === startTime || timeSlot.startsWith(slot + ' - ');
        }
    });
    
    if (exists) {
        alert('⚠️ Questa fascia oraria esiste già');
        return;
    }
    
    STATE.timeSlots.push(timeSlot);
    STATE.timeSlots.sort();
    localStorage.setItem('timeSlots', JSON.stringify(STATE.timeSlots));
    updateTimeSlotsList();
    populateStartShiftSelect(); // Aggiorna anche il select nel form dipendente
}

/**
 * Rimuovi fascia oraria
 */
function removeTimeSlot(time) {
    STATE.timeSlots = STATE.timeSlots.filter(t => t !== time);
    localStorage.setItem('timeSlots', JSON.stringify(STATE.timeSlots));
    updateTimeSlotsList();
    populateStartShiftSelect(); // Aggiorna anche il select nel form dipendente
}

/**
 * Aggiorna lista fasce orarie
 */
function updateTimeSlotsList() {
    const list = document.getElementById('timeSlotsList');
    if (!list) return;
    
    let html = '';
    
    STATE.timeSlots.forEach((time, index) => {
        // Se è solo ora di inizio, mostrala con indicazione
        let displayTime = time;
        if (!time.includes(' - ')) {
            displayTime = `${time} (auto)`;
        }
        html += `<div class="timeslot-item">
            <span><strong>T${index + 1}:</strong> ${displayTime}</span>
            <button onclick="removeTimeSlot('${time.replace(/'/g, "\\'")}')" class="btn-remove-timeslot">×</button>
        </div>`;
    });
    
    list.innerHTML = html || '<p style="color: #94a3b8; font-size: 11px; text-align: center; padding: 12px;">Nessuna fascia personalizzata</p>';
    
    // Aggiorna anche la legenda nella tabella turni
    updateShiftsLegend();
}

/**
 * Aggiorna la legenda delle fasce orarie nella sezione turni
 */
function updateShiftsLegend() {
    const legend = document.getElementById('shiftsLegend');
    if (!legend) return;
    
    if (STATE.timeSlots.length === 0) {
        legend.innerHTML = `<p style="font-size: 12px; color: #94a3b8; text-align: center; padding: 12px;">
            Configura le fasce orarie nella sezione "⚙️ Fasce Orarie"
        </p>`;
        return;
    }
    
    // Conta dipendenti per fascia basandosi sugli schedule EFFETTIVI della settimana
    const slotStats = STATE.timeSlots.map((time, index) => {
        const employeesInSlot = [];
        const departmentCount = {};
        
        STATE.employees.forEach(emp => {
            // Conta quanti giorni della settimana il dipendente lavora in questa fascia
            let daysInThisSlot = 0;
            
            if (emp.schedule && emp.schedule.length === 7) {
                emp.schedule.forEach(shift => {
                    // Controlla se il turno corrisponde a questa fascia oraria
                    if (shift && shift.includes(' - ')) {
                        // Confronta con la fascia oraria
                        if (shift === time || shift.startsWith(time.split(' - ')[0])) {
                            daysInThisSlot++;
                        }
                    }
                });
            }
            
            // Se il dipendente lavora almeno un giorno in questa fascia, contalo
            if (daysInThisSlot > 0) {
                employeesInSlot.push(emp);
                const dept = emp.department || 'Non Assegnato';
                departmentCount[dept] = (departmentCount[dept] || 0) + 1;
            }
        });
        
        // Trova reparto principale (quello con più dipendenti)
        let mainDepartment = '-';
        let maxCount = 0;
        for (const dept in departmentCount) {
            if (departmentCount[dept] > maxCount) {
                maxCount = departmentCount[dept];
                mainDepartment = dept;
            }
        }
        
        return {
            count: employeesInSlot.length,
            mainDepartment: mainDepartment,
            employees: employeesInSlot
        };
    });
    
    let html = '';
    STATE.timeSlots.forEach((time, index) => {
        let displayTime = time;
        if (!time.includes(' - ')) {
            displayTime = `${time} (auto)`;
        }
        
        const stats = slotStats[index];
        const employeeNames = stats.employees.map(e => e.name).join(', ');
        const tooltip = stats.count > 0 ? `Dipendenti: ${employeeNames}` : 'Nessun dipendente';
        
        html += `<div style="display: flex; align-items: center; gap: 8px; padding: 6px 0;" title="${tooltip}">
            <div class="shift-badge" style="background: #4f46e5; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">T${index + 1}</div>
            <span style="font-size: 12px; color: #000; flex: 1;">🕒 ${displayTime}</span>
            <span style="font-size: 10px; color: ${stats.count > 0 ? '#059669' : '#94a3b8'}; background: ${stats.count > 0 ? '#d1fae5' : '#f1f5f9'}; padding: 2px 6px; border-radius: 3px; font-weight: 600;">👥 ${stats.count} dip.</span>
        </div>`;
    });
    
    legend.innerHTML = html;
}

/**
 * Popola il select di scelta fascia oraria nel form dipendente
 */
function populateStartShiftSelect() {
    const select = document.getElementById('empStartShift');
    if (!select) return;
    
    // Reset select
    select.innerHTML = '';
    
    // Aggiungi le fasce orarie configurate
    if (STATE.timeSlots && STATE.timeSlots.length > 0) {
        STATE.timeSlots.forEach((time, index) => {
            let displayTime = time;
            if (!time.includes(' - ')) {
                displayTime = `${time} (auto)`;
            }
            select.innerHTML += `<option value="${index}">T${index + 1}: ${displayTime}</option>`;
        });
    } else {
        // Nessuna fascia configurata
        select.innerHTML = '<option value="" disabled>⚠️ Configura prima le fasce orarie</option>';
    }
}

// ============================================
// IMPORT/EXPORT ANAGRAFICA
// ============================================

/**
 * Esporta solo anagrafica dipendenti (senza turni)
 */
function exportEmployeeRegistry() {
    const registry = STATE.employees.map(emp => ({
        id: emp.id,
        code: emp.code,
        name: emp.name,
        department: emp.department,
        subgroup: emp.subgroup,
        contractType: emp.contractType || emp.contractHours,
        restDaysPerWeek: emp.restDaysPerWeek,
        customStart: emp.customStart,
        allowedDepartments: emp.allowedDepartments,
        currentDepartmentIndex: emp.currentDepartmentIndex,
        customTurnHours: emp.customTurnHours,
        customTurnMinutes: emp.customTurnMinutes,
        absences: emp.absences,
        lastShift: emp.lastShift
    }));
    
    const data = {
        exportDate: new Date().toISOString(),
        version: '2.0',
        employeeCount: registry.length,
        employees: registry
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `anagrafica_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Importa anagrafica dipendenti
 */
function importEmployeeRegistry(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            let employeesToImport = [];
            
            // Gestisci diversi formati
            if (data.employees && Array.isArray(data.employees)) {
                employeesToImport = data.employees;
            } else if (Array.isArray(data)) {
                employeesToImport = data;
            } else {
                throw new Error('Formato file non valido. Atteso: {employees: [...]} o [...]');
            }
            
            if (employeesToImport.length === 0) {
                throw new Error('Il file non contiene dipendenti');
            }
            
            const count = data.employeeCount || employeesToImport.length;
            
            if (confirm(`⚠️ Importare ${count} dipendenti?\nI dipendenti con stesso codice NON saranno duplicati.`)) {
                let imported = 0;
                let skipped = 0;
                
                employeesToImport.forEach(emp => {
                    // Verifica se esiste già (per codice o nome)
                    const existing = STATE.employees.find(e => 
                        e.code === (emp.code || emp.codice) || 
                        e.name === (emp.name || emp.nome)
                    );
                    
                    if (!existing) {
                        // Crea nuovo dipendente con struttura completa
                        const newEmployee = {
                            id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            code: emp.code || emp.codice || '',
                            name: emp.name || emp.nome || '',
                            department: emp.department || emp.reparto || '',
                            subgroup: emp.subgroup || emp.sottogruppo || '',
                            contractHours: emp.contractHours || emp.oreContrattuali || 40,
                            customMinutes: emp.customMinutes || 0,
                            schedule: Array(7).fill(''),
                            absences: [],
                            stats: { totalHours: 0, shifts: 0 }
                        };
                        
                        STATE.employees.push(newEmployee);
                        imported++;
                    } else {
                        skipped++;
                    }
                });
                
                renderTable();
                saveData();
                updateStats();
                populateAbsenceEmployeeSelect();
                
                alert(`✅ Importazione completata!\n\n📥 Importati: ${imported}\n⚠️ Saltati (già presenti): ${skipped}`);
            }
        } catch (error) {
            alert('❌ Errore nell\'importazione:\n\n' + error.message + '\n\nVerifica che il file JSON sia corretto.');
            console.error('Errore import:', error);
        }
    };
    reader.readAsText(file);
}

// ============================================
// EXPORT PDF AVANZATO
// ============================================

/**
 * Export PDF diviso per reparto
 */
function exportPDFByDepartment() {
    if (!window.jspdf || typeof window.jspdf.jsPDF === 'undefined') {
        alert('❌ Libreria PDF non caricata');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    
    // Raggruppa per reparto
    const byDepartment = {};
    STATE.employees.forEach(emp => {
        const dept = emp.department || 'Non Assegnato';
        if (!byDepartment[dept]) byDepartment[dept] = [];
        byDepartment[dept].push(emp);
    });
    
    const departments = Object.keys(byDepartment).sort();
    
    if (departments.length === 0) {
        alert('❌ Nessun dipendente trovato');
        return;
    }
    
    // Ottieni range settimana dal selettore
    const weekInput = document.getElementById('settimana');
    const selectedWeek = weekInput.value || STATE.currentWeek;
    
    const firstDate = STATE.weekDates[0];
    const lastDate = STATE.weekDates[STATE.weekDates.length - 1];
    
    // Formatta date correttamente
    const firstD = new Date(firstDate);
    const lastD = new Date(lastDate);
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const weekRange = `dal ${firstD.getDate()} ${monthNames[firstD.getMonth()]} al ${lastD.getDate()} ${monthNames[lastD.getMonth()]} ${lastD.getFullYear()}`;
    
    // Lista stati operativi
    const operativeStates = ['Riposo', 'Ferie', 'Permesso', 'Malattia', 'Magazzino', 'Ufficio'];
    const allStates = [...operativeStates, ...(STATE.customStates || [])];
    
    // Crea PDF per ogni reparto con delay
    let delay = 0;
    departments.forEach((dept, index) => {
        setTimeout(() => {
            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
            
            doc.setFontSize(16);
            doc.text(`Turni Reparto: ${dept}`, 14, 15);
            doc.setFontSize(10);
            doc.text(`Settimana ${weekRange}`, 14, 22);
            
            const tableData = byDepartment[dept].map(emp => {
                const row = [
                    emp.code, 
                    emp.name,
                    emp.subgroup || '-'
                ];
                emp.schedule.forEach(shift => {
                    // Se è vuoto o trattino
                    if (!shift || shift === '-' || shift.trim() === '') {
                        row.push('Riposo');
                    } 
                    // Controlla se è uno stato operativo
                    else {
                        // Rimuove TUTTE le emoji Unicode e spazi
                        const cleanShift = shift
                            .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // Emoji completi
                            .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Altri simboli
                            .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
                            .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation selectors
                            .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental
                            .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
                            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & Pictographs
                            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & Map
                            .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
                            .trim();
                        
                        // Controlla se è uno stato operativo
                        if (allStates.some(s => s.toLowerCase() === cleanShift.toLowerCase())) {
                            row.push('Riposo');
                        } 
                        // Altrimenti mostra il turno (ma senza emoji)
                        else {
                            row.push(cleanShift || shift);
                        }
                    }
                });
                row.push(`${emp.stats?.totalHours?.toFixed(1) || 0}h`);
                return row;
            });
            
            doc.autoTable({
                head: [['Codice', 'Nome', 'Sottogr.', ...STATE.weekDates.map((d, i) => formatDate(d).dayName), 'Ore']],
                body: tableData,
                startY: 30,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: {
                    fillColor: [230, 230, 230]
                },
                columnStyles: {
                    0: { cellWidth: 18 }, // Codice
                    1: { cellWidth: 33, halign: 'left' }, // Nome
                    2: { cellWidth: 20, halign: 'left', fontSize: 7 } // Sottogruppo
                }
            });
            
            doc.save(`turni_${dept.replace(/\s+/g, '_')}_${STATE.currentWeek}.pdf`);
            
            // Mostra messaggio solo per l'ultimo PDF
            if (index === departments.length - 1) {
                alert(`✅ Esportati ${departments.length} PDF (uno per reparto)`);
            }
        }, delay);
        delay += 300; // 300ms di ritardo tra un PDF e l'altro
    });
}

/**
 * Export PDF multi-settimana
 */
function exportPDFMultiWeek(weeks = 8) {
    if (!window.jspdf || typeof window.jspdf.jsPDF === 'undefined') {
        alert('❌ Libreria PDF non caricata');
        return;
    }
    
    alert(`📄 Funzione export ${weeks} settimane in sviluppo. Usa export PDF normale.`);
    // Implementazione completa richiederebbe generazione turni per 8 settimane
}

// ============================================
// RIEPILOGO PRESENZA
// ============================================

/**
 * Imposta il tipo di ordinamento per il riepilogo
 */
function setRiepilogoSort(sortType) {
    STATE.riepilogoSort = sortType;
    generateRiepilogoPresenza();
}

/**
 * Genera riepilogo presenza per giorno
 */
function generateRiepilogoPresenza() {
    const container = document.getElementById('riepilogoPresenza');
    if (!container) return;
    
    if (!STATE.weekDates || STATE.weekDates.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 40px;">Seleziona una settimana per visualizzare il riepilogo</p>';
        return;
    }
    
    let html = '';
    
    // Per ogni giorno della settimana
    STATE.weekDates.forEach((dateStr, dayIndex) => {
        const dateFormatted = formatDate(dateStr);
        
        // Raccogli dati per questo giorno
        const dayData = {
            byDepartment: {},
            byTimeSlot: {},
            byState: {}, // formato: { 'Ferie': { 'T1: 06:00 - 14:00': 2, 'Nessun turno': 1 } }
            total: 0
        };
        
        STATE.employees.forEach(emp => {
            if (!emp.schedule || !emp.schedule[dayIndex]) return;
            
            const shift = emp.schedule[dayIndex];
            const dept = emp.department || 'Non Assegnato';
            
            // Funzione helper per trovare il turno che il dipendente fa negli altri giorni della settimana
            const findWorkingTimeSlot = () => {
                if (!emp.schedule) return 'Nessun turno';
                
                // Cerca negli altri giorni della settimana
                for (let i = 0; i < emp.schedule.length; i++) {
                    if (i === dayIndex) continue; // Salta il giorno corrente
                    
                    const otherDayShift = emp.schedule[i];
                    if (!otherDayShift || otherDayShift === '-' || otherDayShift.trim() === '') continue;
                    
                    // Verifica se è uno stato operativo
                    const isOperativeState = otherDayShift.includes('☕') || otherDayShift.includes('Riposo') ||
                        otherDayShift.includes('🏖️') || otherDayShift.includes('Ferie') ||
                        otherDayShift.includes('📋') || otherDayShift.includes('Permesso') ||
                        otherDayShift.includes('🩺') || otherDayShift.includes('Malattia') ||
                        STATE.customStates.some(s => otherDayShift.includes(s));
                    
                    if (!isOperativeState && otherDayShift.includes(' - ')) {
                        // È una fascia oraria valida
                        let slotName = 'Altro';
                        STATE.timeSlots.forEach((slot, idx) => {
                            if (otherDayShift === slot || otherDayShift.startsWith(slot.split(' - ')[0])) {
                                slotName = `T${idx + 1}: ${slot}`;
                            }
                        });
                        return slotName;
                    }
                }
                return 'Nessun turno';
            };
            
            if (!shift || shift === '-' || shift.trim() === '') {
                // Riposo - trova il turno che fa negli altri giorni della settimana
                const timeSlotName = findWorkingTimeSlot();
                if (!dayData.byState['Riposo']) {
                    dayData.byState['Riposo'] = {};
                }
                dayData.byState['Riposo'][timeSlotName] = (dayData.byState['Riposo'][timeSlotName] || 0) + 1;
            } else {
                dayData.total++;
                
                // Per reparto
                dayData.byDepartment[dept] = (dayData.byDepartment[dept] || 0) + 1;
                
                // Verifica se è uno stato operativo
                const isOperativeState = shift.includes('☕') || shift.includes('Riposo') ||
                    shift.includes('🏖️') || shift.includes('Ferie') ||
                    shift.includes('📋') || shift.includes('Permesso') ||
                    shift.includes('🩺') || shift.includes('Malattia') ||
                    STATE.customStates.some(s => shift.includes(s));
                
                if (isOperativeState) {
                    // Estrai il nome dello stato (rimuovi emoji)
                    const stateName = shift
                        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
                        .replace(/[\u{2600}-\u{26FF}]/gu, '')
                        .replace(/[\u{2700}-\u{27BF}]/gu, '')
                        .trim() || 'Altro';
                    
                    // Trova il turno che fa negli altri giorni della settimana
                    const timeSlotName = findWorkingTimeSlot();
                    
                    if (!dayData.byState[stateName]) {
                        dayData.byState[stateName] = {};
                    }
                    dayData.byState[stateName][timeSlotName] = (dayData.byState[stateName][timeSlotName] || 0) + 1;
                } else if (shift.includes(' - ')) {
                    // È una fascia oraria
                    // Trova quale fascia corrisponde
                    let slotFound = false;
                    STATE.timeSlots.forEach((slot, idx) => {
                        if (shift === slot || shift.startsWith(slot.split(' - ')[0])) {
                            const slotName = `T${idx + 1}: ${slot}`;
                            dayData.byTimeSlot[slotName] = (dayData.byTimeSlot[slotName] || 0) + 1;
                            slotFound = true;
                        }
                    });
                    if (!slotFound) {
                        dayData.byTimeSlot['Altro'] = (dayData.byTimeSlot['Altro'] || 0) + 1;
                    }
                }
            }
        });
        
        // Genera HTML per questo giorno
        html += `<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-primary);">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <span style="background: #4f46e5; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 600;">${dateFormatted.fullDayName}</span>
                <span style="color: var(--text-secondary); font-size: 14px;">${dateFormatted.full}</span>
                <span style="margin-left: auto; background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 600;">
                    👥 ${dayData.total} presenti
                </span>
            </h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
                <!-- Per Reparto -->
                <div style="background: var(--bg-secondary); padding: 12px; border-radius: 6px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 13px; color: var(--text-secondary); font-weight: 600;">📋 Per Reparto</h4>
                    <div style="display: flex; flex-direction: column; gap: 6px;">`;
        
        if (Object.keys(dayData.byDepartment).length > 0) {
            for (const dept in dayData.byDepartment) {
                const count = dayData.byDepartment[dept];
                const percentage = dayData.total > 0 ? ((count / dayData.total) * 100).toFixed(0) : 0;
                html += `<div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                    <span style="color: var(--text-primary);">${dept}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${percentage}%; height: 100%; background: #4f46e5;"></div>
                        </div>
                        <span style="color: var(--text-secondary); font-weight: 600; min-width: 40px; text-align: right;">${count} (${percentage}%)</span>
                    </div>
                </div>`;
            }
        } else {
            html += '<p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 8px 0;">Nessun dato</p>';
        }
        
        html += `</div>
                </div>
                
                <!-- Per Fascia Oraria -->
                <div style="background: var(--bg-secondary); padding: 12px; border-radius: 6px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 13px; color: var(--text-secondary); font-weight: 600;">🕒 Per Fascia Oraria</h4>
                    <div style="display: flex; flex-direction: column; gap: 6px;">`;
        
        if (Object.keys(dayData.byTimeSlot).length > 0) {
            // Ordina le fasce in base alla preferenza
            let sortedSlots = Object.entries(dayData.byTimeSlot);
            if (STATE.riepilogoSort === 'timeSlot-asc') {
                sortedSlots.sort((a, b) => a[0].localeCompare(b[0]));
            } else if (STATE.riepilogoSort === 'timeSlot-desc') {
                sortedSlots.sort((a, b) => b[0].localeCompare(a[0]));
            } else if (STATE.riepilogoSort === 'count-asc') {
                sortedSlots.sort((a, b) => a[1] - b[1]);
            } else if (STATE.riepilogoSort === 'count-desc') {
                sortedSlots.sort((a, b) => b[1] - a[1]);
            }
            
            for (const [slot, count] of sortedSlots) {
                const percentage = dayData.total > 0 ? ((count / dayData.total) * 100).toFixed(0) : 0;
                html += `<div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                    <span style="color: var(--text-primary);">${slot}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${percentage}%; height: 100%; background: #10b981;"></div>
                        </div>
                        <span style="color: var(--text-secondary); font-weight: 600; min-width: 40px; text-align: right;">${count} (${percentage}%)</span>
                    </div>
                </div>`;
            }
        } else {
            html += '<p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 8px 0;">Nessun turno</p>';
        }
        
        html += `</div>
                </div>
                
                <!-- Stati Operativi -->
                <div style="background: var(--bg-secondary); padding: 12px; border-radius: 6px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 13px; color: var(--text-secondary); font-weight: 600;">🏷️ Stati Operativi</h4>
                    <div style="display: flex; flex-direction: column; gap: 6px;">`;
        
        if (Object.keys(dayData.byState).length > 0) {
            // Ordina gli stati operativi
            let sortedStates = Object.entries(dayData.byState);
            
            for (const [state, timeSlots] of sortedStates) {
                const totalCount = Object.values(timeSlots).reduce((a, b) => a + b, 0);
                
                html += `<div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; margin-bottom: 4px;">
                        <span style="color: var(--text-primary);">${state}</span>
                        <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 3px;">${totalCount}</span>
                    </div>`;
                
                // Ordina le fasce orarie dentro ogni stato
                let sortedSlots = Object.entries(timeSlots);
                if (STATE.riepilogoSort === 'timeSlot-asc') {
                    sortedSlots.sort((a, b) => a[0].localeCompare(b[0]));
                } else if (STATE.riepilogoSort === 'timeSlot-desc') {
                    sortedSlots.sort((a, b) => b[0].localeCompare(a[0]));
                } else if (STATE.riepilogoSort === 'count-asc') {
                    sortedSlots.sort((a, b) => a[1] - b[1]);
                } else if (STATE.riepilogoSort === 'count-desc') {
                    sortedSlots.sort((a, b) => b[1] - a[1]);
                }
                
                // Mostra ogni fascia oraria ordinata
                for (const [slot, count] of sortedSlots) {
                    html += `<div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding-left: 12px; color: var(--text-secondary);">
                        <span>└ ${slot}</span>
                        <span style="font-weight: 600;">${count}</span>
                    </div>`;
                }
                
                html += `</div>`;
            }
        } else {
            html += '<p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 8px 0;">Nessuno</p>';
        }
        
        html += `</div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

// ============================================
// GESTIONE STATI OPERATIVI PERSONALIZZABILI
// ============================================

/**
 * Aggiungi nuovo stato personalizzato
 */
function addCustomState(stateName) {
    if (!stateName || stateName.trim() === '') return;
    
    const name = stateName.trim();
    
    if (STATE.customStates.includes(name)) {
        alert('⚠️ Questo stato esiste già');
        return;
    }
    
    STATE.customStates.push(name);
    localStorage.setItem('customStates', JSON.stringify(STATE.customStates));
    updateCustomStatesList();
    populateAbsenceTypeSelect();
    renderTable();
}

/**
 * Rimuovi stato personalizzato
 */
function removeCustomState(stateName) {
    STATE.customStates = STATE.customStates.filter(s => s !== stateName);
    localStorage.setItem('customStates', JSON.stringify(STATE.customStates));
    updateCustomStatesList();
    populateAbsenceTypeSelect();
    renderTable();
}

/**
 * Aggiorna lista stati personalizzati
 */
function updateCustomStatesList() {
    const container = document.getElementById('customStatesContainer');
    if (!container) return;
    
    let html = '';
    
    // Stati di default
    const defaultStates = ['Riposo', 'Ferie', 'Permesso', 'Malattia'];
    defaultStates.forEach(state => {
        html += `<div class="state-badge state-default">
            <span>${getStateEmoji(state)} ${state}</span>
        </div>`;
    });
    
    // Stati personalizzati
    STATE.customStates.forEach(state => {
        html += `<div class="state-badge state-custom">
            <span>🏷️ ${state}</span>
            <button onclick="ShiftManager.removeCustomState('${state}')" class="btn-remove-state">×</button>
        </div>`;
    });
    
    container.innerHTML = html;
}

/**
 * Ottieni emoji per stato
 */
function getStateEmoji(state) {
    const emojis = {
        'Riposo': '☕',
        'Ferie': '🏖️',
        'Permesso': '📝',
        'Malattia': '🤒',
        'Formazione': '📚',
        'Trasferta': '✈️'
    };
    return emojis[state] || '🏷️';
}

/**
 * Ottieni tutti gli stati disponibili
 */
function getAllAvailableStates() {
    const defaultStates = [
        { emoji: '☕', name: 'Riposo' },
        { emoji: '🏖️', name: 'Ferie' },
        { emoji: '📋', name: 'Permesso' },
        { emoji: '🩺', name: 'Malattia' },
        { emoji: '📦', name: 'Magazzino' },
        { emoji: '🏢', name: 'Ufficio' }
    ];
    
    // Aggiungi stati custom con emoji generico
    const customStatesWithEmoji = STATE.customStates.map(name => ({
        emoji: '🏷️',
        name: name
    }));
    
    return [...defaultStates, ...customStatesWithEmoji];
}

// ============================================
// STATISTICHE E CONTATORI
// ============================================

/**
 * Aggiorna statistiche generali
 */
function updateStats() {
    // Aggiorna contatore dipendenti
    const employeeCount = document.getElementById('employeeCount');
    if (employeeCount) {
        employeeCount.textContent = STATE.employees.length;
    }
    
    // Calcola ore totali settimanali
    let totalWeekHours = 0;
    STATE.employees.forEach(emp => {
        totalWeekHours += emp.stats?.totalHours || 0;
    });
    
    const weekHours = document.getElementById('weekHours');
    if (weekHours) {
        weekHours.textContent = totalWeekHours.toFixed(1);
    }
}

// ============================================
// GESTIONE FERIE E PERMESSI
// ============================================

/**
 * Aggiungi assenza (ferie/permesso)
 */
function addAbsence(employeeId, startDate, endDate, type) {
    const employee = STATE.employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    const absence = {
        id: Date.now().toString(),
        startDate: startDate,
        endDate: endDate || startDate,
        type: type || 'Ferie'
    };
    
    employee.absences = employee.absences || [];
    employee.absences.push(absence);
    
    // Applica assenza ai turni della settimana corrente
    applyAbsenceToSchedule(employee, absence);
    
    saveData();
    renderTable();
    updateAbsencesList();
}

/**
 * Rimuovi assenza
 */
function removeAbsence(employeeId, absenceId) {
    const employee = STATE.employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    employee.absences = employee.absences.filter(a => a.id !== absenceId);
    
    saveData();
    updateAbsencesList();
}

/**
 * Applica assenza ai turni della settimana
 */
function applyAbsenceToSchedule(employee, absence) {
    if (!STATE.weekDates || STATE.weekDates.length === 0) return;
    
    const startDate = new Date(absence.startDate + 'T00:00:00');
    const endDate = new Date((absence.endDate || absence.startDate) + 'T00:00:00');
    
    STATE.weekDates.forEach((dateStr, index) => {
        const currentDate = new Date(dateStr + 'T00:00:00');
        
        if (currentDate >= startDate && currentDate <= endDate) {
            if (!employee.schedule) {
                employee.schedule = new Array(7).fill('');
            }
            
            // Applica stato operativo con emoji
            if (absence.type === 'Ferie') {
                employee.schedule[index] = '🏖️ Ferie';
            } else if (absence.type === 'Permesso') {
                employee.schedule[index] = '📋 Permesso';
            } else if (absence.type === 'Malattia') {
                employee.schedule[index] = '🩺 Malattia';
            } else {
                employee.schedule[index] = absence.type;
            }
        }
    });
}

/**
 * Aggiorna lista ferie visualizzata
 */
function updateAbsencesList() {
    const list = document.getElementById('absencesList');
    if (!list) return;
    
    let html = '';
    
    STATE.employees.forEach(employee => {
        if (employee.absences && employee.absences.length > 0) {
            employee.absences.forEach(absence => {
                const start = new Date(absence.startDate).toLocaleDateString('it-IT');
                const end = absence.endDate !== absence.startDate 
                    ? new Date(absence.endDate).toLocaleDateString('it-IT')
                    : start;
                const dateRange = start === end ? start : `${start} - ${end}`;
                
                html += `<div class="absence-item">
                    <span><strong>${employee.name}</strong> - ${absence.type}</span>
                    <span>${dateRange}</span>
                    <button onclick="ShiftManager.removeAbsence('${employee.id}', '${absence.id}')" class="btn-remove-absence">×</button>
                </div>`;
            });
        }
    });
    
    list.innerHTML = html || '<p style="color: #94a3b8; font-size: 11px; text-align: center; padding: 20px;">Nessuna assenza programmata</p>';
}

/**
 * Popola select dipendenti per ferie
 */
function populateAbsenceEmployeeSelect() {
    const select = document.getElementById('absenceEmployee');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleziona Dipendente</option>';
    
    STATE.employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.name} (${employee.code})`;
        select.appendChild(option);
    });
}

/**
 * Popola select tipo assenza con stati operativi (standard + custom)
 */
function populateAbsenceTypeSelect() {
    const select = document.getElementById('absenceType');
    if (!select) return;
    
    // Stati standard
    select.innerHTML = `
        <option value="Ferie">🏖️ Ferie</option>
        <option value="Permesso">📋 Permesso</option>
        <option value="Malattia">🩺 Malattia</option>
    `;
    
    // Aggiungi stati operativi standard
    const standardStates = [
        { name: 'Magazzino', emoji: '📦' },
        { name: 'Ufficio', emoji: '🏢' }
    ];
    
    standardStates.forEach(state => {
        const option = document.createElement('option');
        option.value = state.name;
        option.textContent = `${state.emoji} ${state.name}`;
        select.appendChild(option);
    });
    
    // Aggiungi stati personalizzati
    if (STATE.customStates && STATE.customStates.length > 0) {
        STATE.customStates.forEach(stateName => {
            const option = document.createElement('option');
            option.value = stateName;
            option.textContent = `⭐ ${stateName}`;
            select.appendChild(option);
        });
    }
}

// ============================================
// EXPORT GLOBALE (per uso da HTML)
// ============================================

(function(){
    const _SM = window.ShiftManager || {};
    Object.assign(window.ShiftManager, {
        init,
        generateAllShifts: _SM.generateAllShifts || generateAllShifts,
        addEmployee: _SM.addEmployee || addEmployee,
        removeEmployee: _SM.removeEmployee || removeEmployee,
        updateEmployee: _SM.updateEmployee || updateEmployee,
        editEmployee,
        cancelEditEmployee,
        searchEmployees,
        sortEmployees,
        exportToExcel: _SM.exportToExcel || exportToExcel,
        exportToPDF: _SM.exportToPDF || exportToPDF,
        exportPDFWithTitle: _SM.exportPDFWithTitle || exportPDFWithTitle,
        openPDFExportModal: _SM.openPDFExportModal || window.openPDFExportModal || function() { alert('⚠️ Funzione export PDF non disponibile'); },
        clearAllData: _SM.clearAllData || clearAllData,
        handleAddEmployee,
        convertOldFormatToNew,
        calculateStatsFromSchedule,
        addAbsence,
        removeAbsence,
        updateAbsencesList,
        populateAbsenceEmployeeSelect,
        populateAbsenceTypeSelect,
        addCustomState,
        removeCustomState,
        updateCustomStatesList,
        getAllAvailableStates,
        updateStats,
        addDepartmentRotation: _SM.addDepartmentRotation || addDepartmentRotation,
        removeDepartmentRotation: _SM.removeDepartmentRotation || removeDepartmentRotation,
        handleAddDepartmentRotation: _SM.handleAddDepartmentRotation || handleAddDepartmentRotation,
        updateDepartmentRotationsList: _SM.updateDepartmentRotationsList || updateDepartmentRotationsList,
        populateDepartmentSelect: _SM.populateDepartmentSelect || populateDepartmentSelect,
        getAllowedShiftsForEmployee: _SM.getAllowedShiftsForEmployee || getAllowedShiftsForEmployee,
        addTimeSlot,
        removeTimeSlot,
        updateTimeSlotsList,
        updateShiftsLegend,
        populateStartShiftSelect,
        exportEmployeeRegistry,
        importEmployeeRegistry,
        exportPDFByDepartment,
        exportPDFMultiWeek,
        generateRiepilogoPresenza,
        setRiepilogoSort,
        getWeekDates,
        getTimeFromSlotId,
        calculateShiftEnd,
        calculateHours,
        renderTableHeader,
        renderTable,
        saveData: _SM.saveData || saveData,
        getShiftOptions,
        CONFIG: _SM.CONFIG || CONFIG,
        STATE: _SM.STATE || STATE
    });
})();

// Auto-init quando DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Register service worker for PWA (offline support + simple cache)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('Service Worker registrato:', reg);
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            console.log('Nuova versione disponibile — ricarica per aggiornare.');
                        } else {
                            console.log('Contenuti in cache per uso offline.');
                        }
                    }
                });
            });
        }).catch(err => console.warn('Registrazione Service Worker fallita:', err));
    });
}
