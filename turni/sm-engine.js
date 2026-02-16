(function(){
    'use strict';
    const SM = window.ShiftManager;

    function generateRotationSequence(startIndex, days) {
        const CONFIG = SM.CONFIG;
        const sequence = [];
        // Use reversed rotation (Tn...T1) based on configured timeSlots unless an explicit ROTATION_SEQUENCE is set.
        const cycle = (CONFIG.ROTATION_SEQUENCE && CONFIG.ROTATION_SEQUENCE.length)
            ? CONFIG.ROTATION_SEQUENCE.slice().reverse()
            : (SM.STATE.timeSlots || []).map((_, idx, arr) => `T${arr.length - idx}`);

        for (let i = 0; i < days; i++) {
            const index = (startIndex + i) % cycle.length;
            sequence.push(cycle[index]);
        }

        return sequence;
    }

    function getNextStartIndex(lastShift) {
        const STATE = SM.STATE;
        const CONFIG = SM.CONFIG;
        if (!lastShift) return 0;

        // Build reversed sequence (Tn...T1) so the "next" shift goes backwards through configured slots
        const rotationSequence = STATE.timeSlots.map((_, idx, arr) => `T${arr.length - idx}`);
        const currentIndex = rotationSequence.indexOf(lastShift);
        if (currentIndex === -1) return 0;
        return (currentIndex + 1) % rotationSequence.length;
    }

    function getAllowedShiftsForEmployee(employee) {
        const STATE = SM.STATE;
        if (employee.department && STATE.departmentRotations[employee.department]) {
            const deptConfig = STATE.departmentRotations[employee.department];
            const allowedShifts = Array.isArray(deptConfig) ? deptConfig : deptConfig.allowedShifts;
            if (allowedShifts && allowedShifts.length > 0) return allowedShifts;
        }

        if (employee.subgroup && STATE.departmentRotations[employee.subgroup]) {
            const subgroupConfig = STATE.departmentRotations[employee.subgroup];
            const allowedShifts = Array.isArray(subgroupConfig) ? subgroupConfig : subgroupConfig.allowedShifts;
            if (allowedShifts && allowedShifts.length > 0) return allowedShifts;
        }

        return [];
    }

    // Helper: parse a shift time string "HH:MM - HH:MM" -> {startMinutes, endMinutes} or null
    function parseShiftTimes(shiftStr) {
        if (!shiftStr || typeof shiftStr !== 'string') return null;
        // Direct HH:MM - HH:MM
        const match = shiftStr.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
        if (match) {
            const [_, start, end] = match;
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            return { startMinutes: sh * 60 + sm, endMinutes: eh * 60 + em };
        }
        // Try to resolve slot id like 'T4' to configured timeSlots
        const tMatch = String(shiftStr).match(/T(\d+)/);
        if (tMatch) {
            const idx = parseInt(tMatch[1], 10) - 1;
            const slots = SM.STATE && SM.STATE.timeSlots ? SM.STATE.timeSlots : [];
            if (slots[idx]) {
                const slotMatch = slots[idx].match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
                if (slotMatch) {
                    const [_, start, end] = slotMatch;
                    const [sh, sm] = start.split(':').map(Number);
                    const [eh, em] = end.split(':').map(Number);
                    return { startMinutes: sh * 60 + sm, endMinutes: eh * 60 + em };
                }
            }
        }
        return null;
    }

    // Helper: get slot index (0-based) from a shift value (tries T# then matches start time to STATE.timeSlots)
    function getSlotIndexFromShift(shiftValue) {
        if (!shiftValue) return null;
        const tMatch = String(shiftValue).match(/T(\d+)/);
        if (tMatch) return parseInt(tMatch[1], 10) - 1;
        const startMatch = String(shiftValue).match(/(\d{2}:\d{2})/);
        if (startMatch) {
            const start = startMatch[1];
            const slots = SM.STATE.timeSlots || [];
            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                if (!slot) continue;
                if (slot.includes(start) || slot === shiftValue || String(shiftValue).includes(slot)) return i;
                const sMatch = String(slot).match(/(\d{2}:\d{2})/);
                if (sMatch && sMatch[1] === start) return i;
            }
        }
        return null;
    }
    // Expose helper
    if (typeof window !== 'undefined' && window.ShiftManager) window.ShiftManager.getSlotIndexFromShift = getSlotIndexFromShift;

    // Helper: check if a shift string is an operative state (Riposo/Ferie/etc.)
    function isOperativeState(shift) {
        if (!shift || typeof shift !== 'string') return false;
        return shift.includes('☕') || shift.includes('Riposo') || shift.includes('🏖️') || shift.includes('Ferie') || shift.includes('📋') || shift.includes('Permesso') || shift.includes('🩺') || shift.includes('Malattia') || shift.includes('📦') || shift.includes('Magazzino') || shift.includes('🏢') || shift.includes('Ufficio');
    }

    // Helper: check minimum rest between two shifts across consecutive days
    // Use the forward interval within the next 24 hours (shortest forward gap):
    // diff = next.start - prev.end (if negative, wrap by +24h). This matches the
    // expected "time between end of today's shift and next day's start" rule
    // used by business logic (e.g. T1 -> T5 = 10h15 -> violation).
    function minutesBetweenEndAndNextStart(prevShiftStr, nextShiftStr) {
        const prev = parseShiftTimes(prevShiftStr);
        const next = parseShiftTimes(nextShiftStr);
        if (!prev || !next) return Infinity; // if one is non-time (Riposo/Ferie), treat as infinite rest
        let diff = next.startMinutes - prev.endMinutes;
        if (diff < 0) diff += 24 * 60;
        return diff;
    }

    // --- Storage helpers: safe save for weeklySchedules (prune old weeks on quota error)
    function parseWeekKeyToSortable(weekKey) {
        // weekKey expected: YYYY-WNN (e.g., 2026-W06)
        if (!weekKey || typeof weekKey !== 'string') return 0;
        const m = weekKey.match(/(\d{4})-W(\d{2})/);
        if (!m) return 0;
        const year = parseInt(m[1], 10);
        const wk = parseInt(m[2], 10);
        return year * 100 + wk;
    }

    function pruneOldWeeklySchedules(maxKeep = 6) {
        try {
            const keys = Object.keys(STATE.weeklySchedules || {});
            if (keys.length <= maxKeep) return;
            const sorted = keys.sort((a, b) => parseWeekKeyToSortable(b) - parseWeekKeyToSortable(a)); // newest first
            const toKeep = new Set(sorted.slice(0, maxKeep));
            for (const k of keys) {
                if (!toKeep.has(k)) {
                    delete STATE.weeklySchedules[k];
                }
            }
            console.warn(`[STORAGE] weeklySchedules pruned to last ${maxKeep} weeks (${Object.keys(STATE.weeklySchedules).length} kept)`);
        } catch (e) {
            console.error('[STORAGE] pruneOldWeeklySchedules error', e);
        }
    }

    function saveWeeklySchedulesSafely(maxKeep = 6) {
        try {
            localStorage.setItem('weeklySchedules', JSON.stringify(STATE.weeklySchedules));
            return true;
        } catch (e) {
            console.error('[STORAGE] Failed to save weeklySchedules:', e);
            // Try pruning old weeks and retry
            try {
                pruneOldWeeklySchedules(maxKeep);
                localStorage.setItem('weeklySchedules', JSON.stringify(STATE.weeklySchedules));
                SM.showNotification(`⚠️ Spazio locale limitato: archivio turni compresso mantenendo ultime ${maxKeep} settimane.`, 'warning');
                return true;
            } catch (e2) {
                console.error('[STORAGE] Retry failed after prune:', e2);
                // As final fallback, attempt to save a minimal version: only current week
                try {
                    const current = {};
                    if (STATE.currentWeek && STATE.weeklySchedules && STATE.weeklySchedules[STATE.currentWeek]) {
                        current[STATE.currentWeek] = STATE.weeklySchedules[STATE.currentWeek];
                    }
                    localStorage.setItem('weeklySchedules', JSON.stringify(current));
                    SM.showNotification('⚠️ Spazio locale quasi esaurito: salvata solo la settimana corrente.', 'warning');
                    return true;
                } catch (e3) {
                    console.error('[STORAGE] Final fallback failed:', e3);
                    SM.showNotification('❌ Impossibile salvare i turni localmente: spazio di archiviazione esaurito.', 'error');
                    return false;
                }
            }
        } finally {
            // Expose function on namespace so other modules can call it
            if (typeof window !== 'undefined' && window.ShiftManager) window.ShiftManager.saveWeeklySchedulesSafely = saveWeeklySchedulesSafely;
        }
    }

    // Helper: validate schedule respects min rest (in minutes)
    function scheduleRespectsMinRest(schedule, minRestMinutes, prevShift) {
        const STATE = SM.STATE || {};
        // Normalize prevShift: allow index (number) or slot-id string (e.g. 'T2')
        if (typeof prevShift === 'number' && Number.isFinite(prevShift)) {
            prevShift = `T${prevShift + 1}`;
        } else if (typeof prevShift === 'string') {
            // ok - keep as-is
        } else if (prevShift && typeof prevShift === 'object' && prevShift.slot !== undefined) {
            // support shim objects in some modules
            prevShift = `T${(parseInt(prevShift.slot,10) || 0) + 1}`;
        }

        // check between consecutive days
        for (let i = 0; i < schedule.length - 1; i++) {
            const cur = schedule[i];
            const next = schedule[i + 1];
            if (!cur || !next) continue;
            // if either is an operative state (contains emoji or words), skip check
            const skipIfOperative = (s) => !s || (typeof s === 'string' && (s.includes('☕') || s.includes('Riposo') || s.includes('🏖️') || s.includes('Ferie') || s.includes('📋') || s.includes('Permesso') || s.includes('🩺') || s.includes('Malattia') || s.includes('📦') || s.includes('Magazzino') || s.includes('🏢') || s.includes('Ufficio')));
            if (skipIfOperative(cur) || skipIfOperative(next)) continue;

            const minutes = minutesBetweenEndAndNextStart(cur, next);
            if (!isFinite(minutes)) {
                console.warn('[WARN] scheduleRespectsMinRest: unable to parse consecutive day times', { cur, next });
                // conservative: treat unresolved as violation
                return false;
            }
            if (minutes < minRestMinutes) {
                console.warn('[WARN] scheduleRespectsMinRest: insufficient rest between consecutive days', { cur, next, minutes, minRestMinutes });
                return false;
            }
        }

        // Also check wrap-around between previous week's last shift and this week's first shift
        if (prevShift && schedule && schedule.length > 0) {
            const first = schedule[0];
            const skipIfOperative = (s) => !s || (typeof s === 'string' && (s.includes('☕') || s.includes('Riposo') || s.includes('🏖️') || s.includes('Ferie') || s.includes('📋') || s.includes('Permesso') || s.includes('🩺') || s.includes('Malattia') || s.includes('📦') || s.includes('Magazzino') || s.includes('🏢') || s.includes('Ufficio')));

            if (!skipIfOperative(prevShift) && !skipIfOperative(first)) {
                // Only enforce the cross-week 11h check when `first` is the *successor* of `prevShift`
                // according to the active rotation sequence. This avoids treating non-consecutive
                // combinations as violations (e.g. when rotation is reversed, only T1 -> T5 is the
                // wrap-around successor).
                const STATE = SM.STATE || {};
                const CONFIG = SM.CONFIG || {};
                const rotationSequence = (CONFIG.ROTATION_SEQUENCE && CONFIG.ROTATION_SEQUENCE.length)
                    ? CONFIG.ROTATION_SEQUENCE.slice().reverse()
                    : (STATE.timeSlots || []).map((_, idx, arr) => `T${arr.length - idx}`);

                // Try to map prevShift/first (time ranges or T#) to slot indices so we can
                // determine true consecutivity in the rotation sequence. If mapping fails
                // we **do not** assume consecutivity — skip the wrap-around gating to avoid
                // false positives.
                let prevSlotIdx = null, firstSlotIdx = null;
                try { prevSlotIdx = (typeof getSlotIndexFromShift === 'function') ? getSlotIndexFromShift(prevShift) : null; } catch(e){ prevSlotIdx = null; }
                try { firstSlotIdx = (typeof getSlotIndexFromShift === 'function') ? getSlotIndexFromShift(first) : null; } catch(e){ firstSlotIdx = null; }

                if (prevSlotIdx === null || firstSlotIdx === null) {
                    // cannot reliably determine rotation-successor relationship -> do NOT gate by successor
                    // (fall through to perform the minutes comparison below)
                } else {
                    const prevT = `T${prevSlotIdx + 1}`;
                    const firstT = `T${firstSlotIdx + 1}`;
                    const idxPrev = rotationSequence.indexOf(prevT);
                    const isSuccessor = (idxPrev !== -1) ? (rotationSequence[(idxPrev + 1) % rotationSequence.length] === firstT) : false;
                    if (!isSuccessor) {
                        // Not a rotation wrap-around step -> skip cross-week minutes check
                        return true;
                    }
                }

                const minutes = minutesBetweenEndAndNextStart(prevShift, first);
                // If minutesBetweenEndAndNextStart returned Infinity, try to diagnose unresolved formats
                if (!isFinite(minutes)) {
                    console.warn('[WARN] scheduleRespectsMinRest: unable to parse prevShift/first times', { prevShift, first });
                    // conservative approach: treat unresolved as violation to avoid unsafe assignment
                    return false;
                }
                if (minutes < minRestMinutes) {
                    console.warn('[WARN] scheduleRespectsMinRest: insufficient rest across week boundary', { prevShift, first, minutes, minRestMinutes });
                    return false;
                }
            }
        }

        return true;
    }

    function generateEmployeeSchedule(employee, startIndex, forcedSlotIndex, forcedRestDays) {
        const STATE = SM.STATE;
        const CONFIG = SM.CONFIG;
        const shifts = [];

        // Se viene passato "forcedSlotIndex" (es. distribuzione vincolante), questo sovrascrive tutti gli altri vincoli
        let assignedSlotId;
        if (typeof forcedSlotIndex === 'number' && !isNaN(forcedSlotIndex)) {
            // forcedSlotIndex è un indice 0-based del turno (es. 0 -> T1)
            assignedSlotId = `T${forcedSlotIndex + 1}`;
        } else {
            const allowedSlots = getAllowedShiftsForEmployee(employee);

            if (allowedSlots.length > 0) {
                assignedSlotId = allowedSlots[startIndex % allowedSlots.length];
            } else if (employee.customStart !== undefined && employee.customStart.length > 0) {
                const customShifts = Array.isArray(employee.customStart) ? employee.customStart : [employee.customStart];
                const customSlotIds = customShifts.map(idx => `T${idx + 1}`);
                assignedSlotId = customSlotIds[startIndex % customSlotIds.length];
            } else {
                // available slots ordered in reverse (Tn..T1)
                const availableSlots = STATE.timeSlots.map((_, idx, arr) => `T${arr.length - idx}`);
                assignedSlotId = availableSlots[startIndex % availableSlots.length] || 'T1';
            }
        }

        // riposi (possono essere forzati per test deterministici)
        const restDays = Array.isArray(forcedRestDays) ? forcedRestDays.slice() : [];
        if (restDays.length === 0) {
            const availableDays = [0,1,2,3,4,5,6];
            const restDaysCount = employee.restDaysPerWeek || CONFIG.REST_DAYS_PER_WEEK;
            for (let i = 0; i < restDaysCount; i++) {
                if (availableDays.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableDays.length);
                    restDays.push(availableDays[randomIndex]);
                    availableDays.splice(randomIndex,1);
                }
            }
        }

        let assignedShift = SM.getTimeFromSlotId ? SM.getTimeFromSlotId(assignedSlotId) : null;
        if (!assignedShift) assignedShift = assignedSlotId;
        if (assignedShift && !assignedShift.includes(' - ')) {
            assignedShift = SM.calculateShiftEnd ? SM.calculateShiftEnd(assignedShift, employee.contractType || 40, employee) : assignedShift;
        }

        for (let day = 0; day < CONFIG.DAYS_PER_WEEK; day++) {
            if (restDays.includes(day)) shifts.push('☕ Riposo');
            else shifts.push(assignedShift);
        }

        if (employee.absences && employee.absences.length > 0 && SM.STATE.weekDates) {
            employee.absences.forEach(absence => {
                const startDate = new Date(absence.startDate + 'T00:00:00');
                const endDate = new Date((absence.endDate || absence.startDate) + 'T00:00:00');
                SM.STATE.weekDates.forEach((dateStr, dayIndex) => {
                    const currentDate = new Date(dateStr + 'T00:00:00');
                    if (currentDate >= startDate && currentDate <= endDate) {
                        if (absence.type === 'Ferie') shifts[dayIndex] = '🏖️ Ferie';
                        else if (absence.type === 'Permesso') shifts[dayIndex] = '📋 Permesso';
                        else if (absence.type === 'Malattia') shifts[dayIndex] = '🩺 Malattia';
                        else shifts[dayIndex] = absence.type;
                    }
                });
            });
        }

        const totalHours = shifts.reduce((sum,s) => sum + (SM.calculateHours ? SM.calculateHours(s) : 0), 0);
        const shiftsCount = shifts.filter(s => s && !s.includes('☕') && !s.includes('🏖️')).length;

        const stats = { totalHours, shifts: shiftsCount };
        return { shifts, stats, lastShift: shifts[shifts.length - 1] };
    }

    function generateAllShifts() {
        const STATE = SM.STATE;
        const CONFIG = SM.CONFIG;
        if (!STATE.currentWeek) { alert('⚠️ Seleziona una settimana prima!'); return; }

        SM.showLoading(true);

        setTimeout(() => {
            // Rotazione reparti: update currentDepartmentIndex
            // Also clear any previously applied per-employee decisions from modal interactions
            STATE.employees.forEach(employee => {
                if (employee.allowedDepartments && employee.allowedDepartments.length > 1) {
                    employee.currentDepartmentIndex = (employee.currentDepartmentIndex || 0) + 1;
                    if (employee.currentDepartmentIndex >= employee.allowedDepartments.length) employee.currentDepartmentIndex = 0;
                    employee.department = employee.allowedDepartments[employee.currentDepartmentIndex];
                    console.log(`🔄 ${employee.name}: reparto aggiornato a ${employee.department}`);
                }
                // clear previous UI decisions so they don't persist after regenerate
                if (employee._appliedDecision) delete employee._appliedDecision;
                if (employee._appliedDecisionTime) delete employee._appliedDecisionTime;
            });

            const numSlots = STATE.timeSlots.length || 3;
            let assignmentMap = [];
            let remainingCounts = null;

            // Use Distribuzione module when available to prepare assignment map and remaining counts
            if (window.Distribuzione && typeof window.Distribuzione.prepareAssignment === 'function') {
                const res = window.Distribuzione.prepareAssignment(numSlots, STATE);
                assignmentMap = res.assignmentMap || [];
                remainingCounts = res.remainingCounts || null;
            } else {
                // Fallback to previous inline behaviour
                const distribution = STATE.distributionPerShift || [];
                if (distribution.length > 0) {
                    remainingCounts = new Array(numSlots).fill(0);
                    for (let i = 0; i < distribution.length && i < numSlots; i++) {
                        remainingCounts[i] = distribution[i];
                    }
                    distribution.forEach((count, shiftIndex) => { for (let i=0;i<count;i++) assignmentMap.push(shiftIndex); });
                    const rotatedMap = [];
                    for (let i=0;i<assignmentMap.length;i++) {
                        const newIndex = (i + STATE.rotationOffset) % assignmentMap.length;
                        rotatedMap.push(assignmentMap[newIndex]);
                    }
                    assignmentMap = rotatedMap;
                } else {
                    for (let i=0;i<STATE.employees.length;i++) assignmentMap.push((i + STATE.rotationOffset) % numSlots);
                }
            }

            const minRestMinutes = 11 * 60;
            const overflowWarnings = [];

            STATE.employees.forEach((employee, index) => {
                let startIndex;

                // Deterministic restDays for testing candidates: distribute based on employee index
                const restDaysCount = employee.restDaysPerWeek || CONFIG.REST_DAYS_PER_WEEK;
                const forcedRestDays = [];
                for (let r = 0; r < restDaysCount; r++) {
                    forcedRestDays.push((r + index) % CONFIG.DAYS_PER_WEEK);
                }

                // Determine previous slot index (avoid same slot consecutive weeks if possible)
                const prevSlot = getSlotIndexFromShift(employee.lastShift);
                // Determine previous shift string (last shift of prior week) to enforce 11h across week boundary
                function getEmployeePrevShift(emp) {
                    if (!emp) return null;
                    if (emp.lastShift) return emp.lastShift;
                    // try to find most recent week in weeklySchedules before currentWeek
                    const keys = Object.keys(STATE.weeklySchedules || {});
                    if (!keys || keys.length === 0) return null;
                    const currentSortable = parseWeekKeyToSortable(STATE.currentWeek);
                    const prevKeys = keys.filter(k => parseWeekKeyToSortable(k) < currentSortable).sort((a,b) => parseWeekKeyToSortable(b) - parseWeekKeyToSortable(a));
                    if (prevKeys.length === 0) return null;
                    const prevKey = prevKeys[0];
                    const entry = STATE.weeklySchedules[prevKey] && STATE.weeklySchedules[prevKey][emp.id];
                    if (entry && entry.schedule && entry.schedule.length > 0) {
                        return entry.schedule[entry.schedule.length - 1];
                    }
                    return null;
                }
                const prevShift = getEmployeePrevShift(employee);

                // If schedule is explicitly locked, preserve it exactly and skip assignment
                if (employee.lockedSchedule && Array.isArray(employee.schedule) && employee.schedule.length === CONFIG.DAYS_PER_WEEK) {
                    console.log(`[DEBUG] PRESERVE LOCKED: ${employee.name} (id=${employee.id}) schedule preserved as-IS: ${employee.schedule.join(' | ')}`);
                    // recalc stats
                    const totalHours = employee.schedule.reduce((sum,s) => sum + (SM.calculateHours ? SM.calculateHours(s) : 0), 0);
                    const shiftsCount = employee.schedule.filter(s => s && !isOperativeState(s)).length;
                    employee.stats = { totalHours, shifts: shiftsCount };
                    employee.lastShift = employee.schedule[employee.schedule.length - 1];
                    return;
                }

                // Debug: show initial schedule snapshot for diagnostics
                try {
                    const snap = Array.isArray(employee.schedule) ? employee.schedule.slice(0, CONFIG.DAYS_PER_WEEK) : [];
                    console.debug(`[DEBUG] START: ${employee.name} (id=${employee.id}) locked=${!!employee.lockedSchedule} prevSlot=${prevSlot} customStart=${JSON.stringify(employee.customStart)} rotationOffset=${STATE.rotationOffset} initialSchedule=${JSON.stringify(snap)}`);
                    // Extra detailed debug when investigating a specific employee
                    if (employee.name === 'Adou Agnini Bra') {
                        console.info(`[TRACE] Adou INFO: remainingCounts=${JSON.stringify(remainingCounts)}, distribution=${JSON.stringify(STATE.distributionPerShift)}, timeSlots=${JSON.stringify(STATE.timeSlots)}, prevSlot=${prevSlot}`);
                    }
                } catch (e) {
                    console.debug('[DEBUG] START: unable to stringify schedule for', employee && employee.id, e);
                }

                // Central constraints module: attempt to assign using unified rules (if present)
                if (window.Constraints && typeof window.Constraints.assignEmployee === 'function') {
                    try {
                        const cRes = window.Constraints.assignEmployee(employee, index, assignmentMap, remainingCounts, numSlots, STATE, CONFIG, prevShift, forcedRestDays);
                        if (cRes && typeof cRes.assigned === 'number') {
                            employee.schedule = cRes.schedule;
                            employee.stats = cRes.stats;
                            employee.lastShift = cRes.lastShift;
                            if (Array.isArray(cRes.warnings) && cRes.warnings.length > 0) {
                                cRes.warnings.forEach(w => overflowWarnings.push({ employee: employee.name, id: employee.id, reason: w }));
                            }
                            return;
                        }
                    } catch (err) {
                        console.error('Constraints.assignEmployee failed', err);
                    }
                }

                // If employee has any pre-existing non-operative shift, enforce a single weekly shift based on the most frequent one
                if (Array.isArray(employee.schedule) && employee.schedule.some(s => !isOperativeState(s))) {
                    // Determine most frequent non-operative shift
                    const freq = {};
                    employee.schedule.forEach(s => {
                        if (!s) return;
                        if (isOperativeState(s)) return;
                        freq[s] = (freq[s] || 0) + 1;
                    });
                    const entries = Object.entries(freq).sort((a,b) => b[1] - a[1]);
                    let preferredSlot = null;
                    let mostFreqShift = null;
                    if (entries.length > 0) {
                        mostFreqShift = entries[0][0];
                        preferredSlot = getSlotIndexFromShift(mostFreqShift);
                    }

                    // If preferredSlot is not found, fallback to rotation/distribution logic below (treat as no preassignment)
                    if (preferredSlot !== null && preferredSlot !== undefined) {
                        let assigned = preferredSlot;

                        // Check 11h constraint; if violated, try to find alternative but prefer keeping user's assigned shift
                        const test = generateEmployeeSchedule(employee, assigned, assigned, forcedRestDays);
                        if (!scheduleRespectsMinRest(test.shifts, minRestMinutes, prevShift)) {
                            // Attempt to find alternative slot respecting 11h (do NOT pick prevSlot)
                            const strictAvoidPrev = !!SM.CONFIG.AVOID_PREV_SLOT_ALWAYS;
                            let foundAlt = null;
                            for (let offset = 1; offset < numSlots; offset++) {
                                const candidate = (assigned + offset) % numSlots;
                                if (strictAvoidPrev && candidate === prevSlot) { continue; }
                                const t2 = generateEmployeeSchedule(employee, candidate, candidate, forcedRestDays);
                                if (scheduleRespectsMinRest(t2.shifts, minRestMinutes, prevShift)) { foundAlt = candidate; break; }
                            }
                            if (foundAlt !== null) {
                                assigned = foundAlt;
                                if (remainingCounts && remainingCounts[assigned] > 0) remainingCounts[assigned]--;
                                overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'Preferred pre-assigned shift violated 11h; alternative used' });
                            } else {
                                // No alt respecting 11h found that also isn't prevSlot. Choose any slot that is not prevSlot (even if violates 11h) to comply with 'no-repeat' rule
                                let fallback = null;
                                for (let offset = 1; offset < numSlots; offset++) {
                                    const candidate = (assigned + offset) % numSlots;
                                    if (candidate === prevSlot) continue;
                                    fallback = candidate; break;
                                }
                                if (fallback !== null) {
                                    assigned = fallback;
                                    overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'Preferred pre-assigned shift violates 11h; fallback (no-repeat) used' });
                                } else {
                                    // Degenerate case: only one slot exists (or all candidates are prevSlot). As last resort allow prevSlot but log clearly.
                                    assigned = assigned; // keep as-is
                                    overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'Preferred pre-assigned shift violates 11h; only-prevSlot-available, kept as-is' });
                                }
                            }
                        } else {
                            // preferred respected; ensure remainingCounts already considered in deduction earlier
                        }

                        // If distribution is active (remainingCounts present) we must respect it even for preferredSlot
                        if (remainingCounts) {
                            // Try to assign preferredSlot if quota available and respects rest
                            const prefers = (typeof preferredSlot === 'number') ? preferredSlot : null;
                            let finalAssigned = null;

                            const slotRespects = (slot) => {
                                try {
                                    const test = generateEmployeeSchedule(employee, slot, slot, forcedRestDays);
                                    return scheduleRespectsMinRest(test.shifts, 11 * 60, employee.lastShift);
                                } catch (e) { return false; }
                            };

                            if (prefers !== null && remainingCounts[prefers] > 0 && slotRespects(prefers)) {
                                remainingCounts[prefers]--;
                                finalAssigned = prefers;
                                console.debug(`[DEBUG][Distribuzione-Prefer] assigned preferred T${prefers+1} for ${employee.name}; remainingCounts=${JSON.stringify(remainingCounts)}`);
                            } else if (window.Distribuzione && typeof window.Distribuzione.allocateSlotForEmployee === 'function') {
                                const alloc = window.Distribuzione.allocateSlotForEmployee(employee, index, assignmentMap, remainingCounts, numSlots);
                                finalAssigned = alloc.slot;
                                console.debug(`[DEBUG][Distribuzione-Allocate] emp=${employee.name} alloc=${JSON.stringify(alloc)} remainingCounts=${JSON.stringify(remainingCounts)}`);
                                if (alloc.reserved === false) {
                                    overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'Distribuzione non rispettata per preferenza' });
                                }
                                if (alloc.forcedDueToRest) {
                                    overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'Distribuzione forzata (potrebbe violare riposo)' });
                                }
                            } else {
                                // No Distribuzione module available; fallback to current assigned
                                finalAssigned = assigned;
                            }

                            // Apply finalAssigned
                            const schedule = generateEmployeeSchedule(employee, finalAssigned, finalAssigned, forcedRestDays);
                            employee.schedule = schedule.shifts;
                            const totalHours = employee.schedule.reduce((sum,s) => sum + (SM.calculateHours ? SM.calculateHours(s) : 0), 0);
                            const shiftsCount = employee.schedule.filter(s => s && !isOperativeState(s)).length;
                            employee.stats = { totalHours, shifts: shiftsCount };
                            employee.lastShift = employee.schedule[employee.schedule.length -1];

                            // Debug logs
                            try {
                                const expected = mostFreqShift || '(unknown)';
                                const expectedSlotLabel = (preferredSlot !== null && preferredSlot !== undefined) ? `T${preferredSlot + 1}` : '(unknown)';
                                const assignedSlotLabel = (finalAssigned !== null && finalAssigned !== undefined) ? `T${finalAssigned + 1}` : '(unknown)';
                                if (finalAssigned !== preferredSlot) {
                                    console.warn(`[DEBUG] MISMATCH (dist enforced): ${employee.name} (id=${employee.id}) expected ${expected} ${expectedSlotLabel} from card -> assigned ${assignedSlotLabel}. Assigned schedule: ${employee.schedule.join(' | ')}`);
                                } else {
                                    console.log(`[DEBUG] OK: ${employee.name} (id=${employee.id}) expected ${expected} ${expectedSlotLabel} -> assigned ${assignedSlotLabel}.`);
                                }
                            } catch (e) { console.log('[DEBUG] Logging error for employee', employee && employee.id, e); }

                            return;
                        }

                        // Assign uniformly the chosen slot for the week (no distribution active)
                        const schedule = generateEmployeeSchedule(employee, assigned, assigned, forcedRestDays);
                        employee.schedule = schedule.shifts;
                        const totalHours = employee.schedule.reduce((sum,s) => sum + (SM.calculateHours ? SM.calculateHours(s) : 0), 0);
                        const shiftsCount = employee.schedule.filter(s => s && !isOperativeState(s)).length;
                        employee.stats = { totalHours, shifts: shiftsCount };
                        employee.lastShift = employee.schedule[employee.schedule.length -1];

                        // Debug logs: show expected shift from employee card and actual assigned shift/schedule
                        try {
                            const expected = mostFreqShift || '(unknown)';
                            const expectedSlotLabel = (preferredSlot !== null && preferredSlot !== undefined) ? `T${preferredSlot + 1}` : '(unknown)';
                            const assignedSlotLabel = (assigned !== null && assigned !== undefined) ? `T${assigned + 1}` : '(unknown)';
                            if (assigned !== preferredSlot) {
                                console.warn(`[DEBUG] MISMATCH: ${employee.name} (id=${employee.id}) expected ${expected} ${expectedSlotLabel} from card -> assigned ${assignedSlotLabel}. Assigned schedule: ${employee.schedule.join(' | ')}`);
                            } else {
                                console.log(`[DEBUG] OK: ${employee.name} (id=${employee.id}) expected ${expected} ${expectedSlotLabel} -> assigned ${assignedSlotLabel}.`);
                            }
                        } catch (e) {
                            console.log('[DEBUG] Logging error for employee', employee && employee.id, e);
                        }

                        return;
                    }
                    // else fall through to normal allocation if no recognizable preferred slot
                }

                if (remainingCounts) {
                    // Distribuzione vincolante: la priorità secondaria è la rotazione
                    const preferred = (index + STATE.rotationOffset) % numSlots;
                    let assigned = -1;

                    // Determine allowed candidate indices based on employee.customStart if present
                    let candidatePool = [];
                    if (Array.isArray(employee.customStart) && employee.customStart.length > 0) {
                        candidatePool = employee.customStart.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
                        console.debug(`[DEBUG] CUSTOM-START active for ${employee.name}: allowed=${JSON.stringify(candidatePool.map(i=>`T${i+1}`))}`);
                    } else {
                        candidatePool = Array.from({length: numSlots}, (_,i)=>i);
                    }

                    // Rotate candidatePool to start from 'preferred' position (nearest index in pool)
                    let startIdx = 0;
                    const findIdx = candidatePool.indexOf(preferred);
                    if (findIdx >= 0) startIdx = findIdx;

                    // First pass: prefer candidates that are NOT the same as prevSlot
                    for (let k = 0; k < candidatePool.length; k++) {
                        const candidate = candidatePool[(startIdx + k) % candidatePool.length];
                        if (candidate === prevSlot && !!SM.CONFIG.AVOID_PREV_SLOT_ALWAYS) { console.debug(`[DEBUG] SKIP prevSlot for ${employee.name} candidate=T${candidate+1}`); continue; }
                        const capacity = remainingCounts[candidate];
                        // Test schedule with candidate
                        const test = generateEmployeeSchedule(employee, candidate, candidate, forcedRestDays);
                        const respects = scheduleRespectsMinRest(test.shifts, minRestMinutes, prevShift);
                        console.debug(`[DEBUG] CANDIDATE: ${employee.name} candidate=T${candidate+1} capacity=${capacity} respects11h=${respects} sample=${(test.shifts||[]).slice(0,3).join('|')}`);
                        if (capacity > 0 && respects) {
                            assigned = candidate;
                            remainingCounts[candidate]--;
                            break;
                        }
                    }

                    // Second pass: allow other candidates (still avoid prevSlot if strict)
                    if (assigned === -1) {
                        for (let k = 0; k < candidatePool.length; k++) {
                            const candidate = candidatePool[(startIdx + k) % candidatePool.length];
                            if (candidate === prevSlot && !!SM.CONFIG.AVOID_PREV_SLOT_ALWAYS) { continue; }
                            const capacity = remainingCounts[candidate];
                            console.debug(`[DEBUG] FALLBACK-CANDIDATE: ${employee.name} candidate=T${candidate+1} capacity=${capacity}`);
                            if (capacity > 0) {
                                assigned = candidate;
                                remainingCounts[candidate]--;
                                const reason = (candidate === prevSlot) ? 'Assigned prevSlot (would repeat week)' : 'No slot respecting 11h; assigned available slot';
                                overflowWarnings.push({ employee: employee.name, id: employee.id, reason: reason });
                                if (candidate === prevSlot) console.warn(`[RULE] Repeated slot assigned to ${employee.name} (T${candidate+1}) - could not avoid repeat this week`);
                                break;
                            }
                        }
                    }

                    // Se ancora non assegnato (tutti slot pieni o prevSlot escluso), pick a candidate that is not prevSlot even if it violates 11h
                    if (assigned === -1) {
                        let pick = null;
                        for (let k = 0; k < candidatePool.length; k++) {
                            const candidate = candidatePool[k];
                            if (candidate === prevSlot && !!SM.CONFIG.AVOID_PREV_SLOT_ALWAYS) continue;
                            pick = candidate; break;
                        }
                        if (pick !== null) {
                            assigned = pick;
                            overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'All slots full; assigned fallback (no-repeat)' });
                        } else {
                            // degenerate: only prevSlot exists; allow it but mark
                            assigned = preferred;
                            overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'Only-prevSlot-available; assigned prevSlot (forced)' });
                            console.warn(`[RULE] Repeated slot assigned to ${employee.name} (T${assigned+1}) - only-prevSlot-available`);
                        }
                    }

                    startIndex = assigned;
                    const forcedSlotIndex = assigned;
                    const schedule = generateEmployeeSchedule(employee, startIndex, forcedSlotIndex, forcedRestDays);
                    employee.schedule = schedule.shifts;
                    employee.stats = schedule.stats;
                    employee.lastShift = schedule.lastShift;
                    // Post-assignment verification: ensure uniformity (single weekly shift) — log if mismatch
                    try {
                        const nonOperativeDays = employee.schedule.map((s,i) => ({d:i,s})).filter(x => x.s && !isOperativeState(x.s));
                        const distinctShifts = [...new Set(nonOperativeDays.map(x => getSlotIndexFromShift(x.s))).values()].filter(v => v !== null && v !== undefined);
                        if (distinctShifts.length > 1) {
                            console.warn(`[DEBUG] NON-UNIFORM: ${employee.name} (id=${employee.id}) assigned slot=${startIndex}, but schedule has multiple slots: ${JSON.stringify(distinctShifts)} schedule=${employee.schedule.join(' | ')}`);
                        } else {
                            console.log(`[DEBUG] ASSIGNED: ${employee.name} (id=${employee.id}) slot=T${startIndex+1}, schedule sample=${employee.schedule.slice(0,4).join(' | ')}`);
                        }
                    } catch (e) {
                        console.debug('[DEBUG] Post-assignment verification failed for', employee && employee.id, e);
                    }                } else {
                    // Determine candidatePool from employee.customStart (preferred), fallback to department allowed slots, else all slots
                    let candidatePool = null;
                    if (Array.isArray(employee.customStart) && employee.customStart.length > 0) {
                        candidatePool = employee.customStart.map(n => parseInt(n,10)).filter(n => !isNaN(n));
                        console.debug(`[DEBUG] CUSTOM-START active for ${employee.name}: allowed=${JSON.stringify(candidatePool.map(i=>`T${i+1}`))}`);
                    } else {
                        const allowedSlots = getAllowedShiftsForEmployee(employee);
                        if (allowedSlots && allowedSlots.length > 0) {
                            candidatePool = allowedSlots.map(s => parseInt(String(s).replace(/[^0-9]/g, ''), 10) - 1).filter(n => !isNaN(n));
                        }
                    }

                    if (Array.isArray(candidatePool) && candidatePool.length > 0) {
                        // start from rotated preferred position within candidatePool
                        const startIdx = (index + STATE.rotationOffset) % candidatePool.length;
                        // First try candidates != prevSlot
                        for (let offset = 0; offset < candidatePool.length; offset++) {
                            const candidate = candidatePool[(startIdx + offset) % candidatePool.length];
                            if (candidate === prevSlot) { console.debug(`[DEBUG] SKIP prevSlot for ${employee.name} candidate=T${candidate+1}`); continue; }
                            const test = generateEmployeeSchedule(employee, candidate, candidate, forcedRestDays);
                                if (scheduleRespectsMinRest(test.shifts, minRestMinutes, prevShift)) {
                                startIndex = candidate;
                                break;
                            }
                        }
                        if (startIndex === undefined) {
                            // allow prevSlot only as last resort
                            for (let offset = 0; offset < candidatePool.length; offset++) {
                                const candidate = candidatePool[(startIdx + offset) % candidatePool.length];
                                const test = generateEmployeeSchedule(employee, candidate, candidate, forcedRestDays);
                                if (scheduleRespectsMinRest(test.shifts, minRestMinutes, prevShift)) {
                                    startIndex = candidate;
                                    if (candidate === prevSlot) console.warn(`[RULE] Repeated slot assigned to ${employee.name} (T${candidate+1}) - could not avoid repeat this week`);
                                    break;
                                }
                            }
                            if (startIndex === undefined) {
                                const rotatedIndex = (index + STATE.rotationOffset) % candidatePool.length;
                                startIndex = candidatePool[rotatedIndex];
                                overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'No allowed slot respecting 11h; fallback used' });
                            }
                        }
                    } else {
                        // assignmentMap fallback: consult Distribuzione if present to enforce quotas
                        let assigned = undefined;
                        let _allocResult = null;
                        if (window.Distribuzione && typeof window.Distribuzione.allocateSlotForEmployee === 'function') {
                            const alloc = window.Distribuzione.allocateSlotForEmployee(employee, index, assignmentMap, remainingCounts, numSlots);
                            _allocResult = alloc || null;
                            assigned = alloc.slot;
                            console.debug(`[DEBUG][Engine] idx=${index} emp=${employee.name} alloc=${JSON.stringify(_allocResult)} remainingCounts=${JSON.stringify(remainingCounts)}`);
                        } else {
                            // Fallback to previous behaviour when Distribuzione not present
                            const preferred = assignmentMap[index % assignmentMap.length];

                            // Build candidate pool from customStart if present, otherwise all slots
                            let candidatePool = Array.from({length: numSlots}, (_,i)=>i);
                            if (Array.isArray(employee.customStart) && employee.customStart.length > 0) {
                                candidatePool = employee.customStart.map(n => parseInt(n,10)).filter(n => !isNaN(n));
                                console.debug(`[DEBUG] CUSTOM-START active for ${employee.name}: allowed=${JSON.stringify(candidatePool.map(i=>`T${i+1}`))}`);
                            }

                            // Find index in pool nearest to preferred
                            let startIdx = 0;
                            const idxInPool = candidatePool.indexOf(preferred);
                            if (idxInPool >= 0) startIdx = idxInPool;

                            // First pass: try to find candidate != prevSlot
                            for (let k = 0; k < candidatePool.length; k++) {
                                const candidate = candidatePool[(startIdx + k) % candidatePool.length];
                                if (candidate === prevSlot) { console.debug(`[DEBUG] SKIP prevSlot for ${employee.name} candidate=T${candidate+1}`); continue; }
                                const test = generateEmployeeSchedule(employee, candidate, candidate, forcedRestDays);
                                if (scheduleRespectsMinRest(test.shifts, minRestMinutes, prevSlot)) {
                                    assigned = candidate;
                                    break;
                                }
                            }
                            if (assigned === undefined) {
                                // allow prevSlot only if unavoidable
                                for (let k = 0; k < candidatePool.length; k++) {
                                    const candidate = candidatePool[(startIdx + k) % candidatePool.length];
                                    const test = generateEmployeeSchedule(employee, candidate, candidate, forcedRestDays);
                                    if (scheduleRespectsMinRest(test.shifts, minRestMinutes, prevSlot)) {
                                        assigned = candidate;
                                        if (candidate === prevSlot) console.warn(`[RULE] Repeated slot assigned to ${employee.name} (T${candidate+1}) - could not avoid repeat this week`);
                                        break;
                                    }
                                }
                                if (assigned === undefined) {
                                    // fallback
                                    assigned = preferred;
                                    overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'No automatic slot respecting 11h; fallback used' });
                                }
                            }
                        }
                        startIndex = assigned;
                        // If we attempted to respect distribuzione but quota wasn't available, mark as overflow
                        try {
                            if (_allocResult) {
                                if (_allocResult.reserved === false && remainingCounts) {
                                    overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'Distribuzione non rispettata - quota esaurita' });
                                }
                                if (_allocResult.forcedDueToRest === true) {
                                    overflowWarnings.push({ employee: employee.name, id: employee.id, reason: 'Distribuzione forzata (potrebbe violare riposo)' });
                                }
                            }
                        } catch (e) { /* ignore */ }
                    }

                    const forcedSlotIndex = undefined;
                    const schedule = generateEmployeeSchedule(employee, startIndex, forcedSlotIndex, forcedRestDays);
                    employee.schedule = schedule.shifts;
                    employee.stats = schedule.stats;
                    employee.lastShift = schedule.lastShift;
                }
            });

            if (overflowWarnings.length > 0) {
                const count = overflowWarnings.length;
                const names = overflowWarnings.slice(0,5).map(w => w.employee).join(', ');
                const more = count > 5 ? ` e altri ${count-5}` : '';
                // Show modal prompt to let user choose action for affected employees
                const affected = overflowWarnings.map(w => ({ id: w.id, name: w.employee, reason: w.reason }));
                // Notify user and open modal/banner/confirm for manual decision
                SM.showNotification(`⚠️ ${count} assegnazioni non rispettano il riposo minimo di 11h (${names}${more})`, 'warning');
                console.log(`[DEBUG] Preparing to prompt user for rest decision with ${affected.length} affected employees`);
                try {
                    // small delay to ensure DOM is ready and modal/banner are visible
                    setTimeout(() => {
                        // Prefer the detailed per-employee modal if available
                        try {
                            if (typeof window.showRestDecisionDetailModal === 'function') {
                                window._restDecisionAffectedList = affected;
                                window.showRestDecisionDetailModal(affected);
                                return;
                            }
                        } catch (e) {
                            console.error('[DEBUG] showRestDecisionDetailModal failed', e);
                        }

                        // Fallback to older modal if present
                        try {
                            if (typeof window.showRestDecisionModal === 'function') {
                                window._restDecisionAffected = affected.map(a => a.id);
                                if (typeof window.showRestDecisionModal === 'function') window.showRestDecisionModal(affected);
                                return;
                            }
                        } catch (e) {
                            console.error('[DEBUG] showRestDecisionModal failed', e);
                        }

                        // Then try banner (persistent) - if banner succeeds we return early
                        if (typeof window.showRestDecisionBanner === 'function') {
                            try { window.showRestDecisionBanner(affected); return; } catch (e) { console.error('showRestDecisionBanner error', e); }
                        }

                        // If both UI methods are unavailable or failed, ask via confirm() as last resort (deprecated)
                        try {
                            const ids = affected.map(a => a.id);
                            window._restDecisionAffected = ids;
                            const c = confirm(`${affected.length} assegnazioni non rispettano il riposo minimo di 11h. Premere OK per assegnare riposo Domenica ai coinvolti, Annulla per saltare al turno successivo.`);
                            if (c) {
                                if (typeof window.applySundayRestOnAffected === 'function') window.applySundayRestOnAffected();
                            } else {
                                if (typeof window.skipToNextShiftForAffected === 'function') window.skipToNextShiftForAffected();
                            }
                        } catch (e) {
                            console.error('Fallback confirm failed', e);
                        }
                    }, 50);
                } catch (e) {
                    console.error('[DEBUG] Prompt scheduling failed', e);
                    // As a final fallback attempt banner and confirm synchronously
                    if (typeof window.showRestDecisionBanner === 'function') {
                        try { window.showRestDecisionBanner(affected); } catch (err) { console.error('showRestDecisionBanner fallback error', err); }
                    }
                    try {
                        const ids = affected.map(a => a.id);
                        window._restDecisionAffected = ids;
                        const c = confirm(`${affected.length} assegnazioni non rispettono il riposo minimo di 11h. Premere OK per assegnare riposo Domenica ai coinvolti, Annulla per saltare al turno successivo.`);
                        if (c) {
                            if (typeof window.applySundayRestOnAffected === 'function') window.applySundayRestOnAffected();
                        } else {
                            if (typeof window.skipToNextShiftForAffected === 'function') window.skipToNextShiftForAffected();
                        }
                    } catch (err) {
                        console.error('Fallback confirm failed', err);
                    }
                }
            }

            STATE.rotationOffset = (STATE.rotationOffset + 1) % numSlots;
            localStorage.setItem('rotationOffset', STATE.rotationOffset.toString());

            if (!STATE.weeklySchedules[STATE.currentWeek]) STATE.weeklySchedules[STATE.currentWeek] = {};
            STATE.employees.forEach(emp => {
                STATE.weeklySchedules[STATE.currentWeek][emp.id] = { schedule: emp.schedule, stats: emp.stats };
            });
            // Safe save (handles quota exceeded by pruning/mini-save)
            saveWeeklySchedulesSafely(6);

            if (typeof SM.renderTable === 'function') SM.renderTable();
            SM.saveData();
            if (typeof SM.updateShiftsLegend === 'function') SM.updateShiftsLegend();
            if (typeof SM.generateRiepilogoPresenza === 'function') SM.generateRiepilogoPresenza();
            SM.showLoading(false);

            // Verify final assignment counts per slot when distribution is active
            if (STATE.distributionPerShift && STATE.distributionPerShift.length > 0) {
                const numSlots = STATE.timeSlots.length || 3;
                const assignedCounts = new Array(numSlots).fill(0);
                STATE.employees.forEach(e => {
                    const most = Array.isArray(e.schedule) ? e.schedule.find(s => s && !isOperativeState(s)) : null;
                    if (most) {
                        const idx = (typeof getSlotIndexFromShift === 'function') ? getSlotIndexFromShift(most) : null;
                        if (idx !== null && idx !== undefined && idx >= 0 && idx < numSlots) assignedCounts[idx]++;
                    }
                });
                console.info('[INFO] Distribuzione richiesta:', STATE.distributionPerShift, 'Assegnati effettivi:', assignedCounts);
                // keep last assigned counts for external consumers (Distribuzione UI)
                try { if (window.ShiftManager) window.ShiftManager._lastAssignedCounts = assignedCounts.slice(); } catch(e) { console.debug('Could not set _lastAssignedCounts', e); }
                // Log mismatch if any
                const mismatch = STATE.distributionPerShift.some((v,i) => (assignedCounts[i] || 0) !== v);
                if (mismatch) {
                    console.warn('[WARN] final assignment does NOT match requested distribution');
                    try {
                        if (typeof window.Distribuzione !== 'undefined' && typeof window.Distribuzione.showSuggestionsModal === 'function') {
                            // mark generation complete time so we can wait for save to finish
                            window.ShiftManager._lastGenerationCompleteTime = Date.now();

                            // If restDecision modal is open, wait until it's closed and until saveData recorded a lastSaveTime >= generation time
                            const restModal = document.getElementById('restDecisionDetailModal');
                            const showWhenReady = () => {
                                try {
                                    const lastSave = window.ShiftManager && window.ShiftManager._lastSaveTime ? window.ShiftManager._lastSaveTime : 0;
                                    const genTime = window.ShiftManager._lastGenerationCompleteTime || 0;
                                    const restClosed = !restModal || (restModal.classList && !restModal.classList.contains('active') && (restModal.style.display === '' || restModal.style.display === 'none'));
                                    const savedAfterGen = lastSave >= genTime;
                                    if (restClosed && savedAfterGen) {
                                        // give a little breathing room
                                        setTimeout(()=>{ window.Distribuzione.showSuggestionsModal(); }, 120);
                                    } else {
                                        // retry after short delay
                                        setTimeout(showWhenReady, 250);
                                    }
                                } catch(e) { console.error('showWhenReady failed', e); }
                            };
                            showWhenReady();
                        }
                    } catch(e) { console.error('showSuggestionsModal failed', e); }
                }
                else console.log('[SUCCESS] final assignment matches requested distribution');
            }

            const deptRotationCount = STATE.employees.filter(e => e.allowedDepartments && e.allowedDepartments.length > 1).length;
            const deptRotationMsg = deptRotationCount > 0 ? ` | 🔄 ${deptRotationCount} dipendenti con rotazione reparti` : '';
            const msg = (STATE.distributionPerShift && STATE.distributionPerShift.length > 0)
                ? `✅ Turni generati! Distribuzione: ${STATE.distributionPerShift.join('-')} dipendenti per turno (Rotazione #${STATE.rotationOffset})${deptRotationMsg}`
                : `✅ Turni generati con distribuzione automatica equa (Rotazione #${STATE.rotationOffset})${deptRotationMsg}`;
            SM.showNotification(msg, 'success');

        }, 100);
    }

    // Esporta le funzioni nel namespace
    if (typeof window !== 'undefined' && window.ShiftManager) {
        window.ShiftManager.getSlotIndexFromShift = getSlotIndexFromShift;
        window.ShiftManager.generateEmployeeSchedule = generateEmployeeSchedule;
        window.ShiftManager.scheduleRespectsMinRest = scheduleRespectsMinRest;
        window.ShiftManager.minutesBetweenEndAndNextStart = minutesBetweenEndAndNextStart;
    }
    SM.generateRotationSequence = generateRotationSequence;
    SM.getNextStartIndex = getNextStartIndex;
    SM.getAllowedShiftsForEmployee = getAllowedShiftsForEmployee;
    SM.generateEmployeeSchedule = generateEmployeeSchedule;
    SM.generateAllShifts = generateAllShifts;

    // Diagnostic helper: lists employees whose generated schedule violates minRest (default 11h)
    SM.findMinRestViolations = function(minRestMinutes = 11 * 60) {
        const STATE = SM.STATE || {};
        const CONFIG = SM.CONFIG || {};
        const numSlots = (STATE.timeSlots && STATE.timeSlots.length) ? STATE.timeSlots.length : 3;
        // build assignmentMap same as generateAllShifts
        let assignmentMap = [];
        if (window.Distribuzione && typeof window.Distribuzione.prepareAssignment === 'function') {
            try { assignmentMap = window.Distribuzione.prepareAssignment(numSlots, STATE).assignmentMap || []; } catch(e) { assignmentMap = []; }
        }
        if (!assignmentMap || assignmentMap.length === 0) {
            for (let i = 0; i < (STATE.employees || []).length; i++) assignmentMap.push((i + (STATE.rotationOffset || 0)) % numSlots);
        }

        const violations = [];
        const getEmployeePrevShift = (emp) => {
            if (!emp) return null;
            if (emp.lastShift) return emp.lastShift;
            const keys = Object.keys(STATE.weeklySchedules || {});
            if (!keys || keys.length === 0) return null;
            const currentSortable = parseWeekKeyToSortable(STATE.currentWeek);
            const prevKeys = keys.filter(k => parseWeekKeyToSortable(k) < currentSortable).sort((a,b) => parseWeekKeyToSortable(b) - parseWeekKeyToSortable(a));
            if (prevKeys.length === 0) return null;
            const prevKey = prevKeys[0];
            const entry = STATE.weeklySchedules[prevKey] && STATE.weeklySchedules[prevKey][emp.id];
            if (entry && entry.schedule && entry.schedule.length > 0) return entry.schedule[entry.schedule.length - 1];
            return null;
        };

        (STATE.employees || []).forEach((emp, idx) => {
            const startIndex = assignmentMap[idx % assignmentMap.length];
            // deterministic restDays like generateAllShifts
            const restDaysCount = emp.restDaysPerWeek || CONFIG.REST_DAYS_PER_WEEK;
            const forcedRestDays = [];
            for (let r = 0; r < restDaysCount; r++) forcedRestDays.push((r + idx) % CONFIG.DAYS_PER_WEEK);

            const sched = generateEmployeeSchedule(emp, startIndex, undefined, forcedRestDays);
            const prevShift = getEmployeePrevShift(emp);
            const ok = scheduleRespectsMinRest(sched.shifts, minRestMinutes, prevShift);
            if (!ok) {
                // find exact violating pairs
                const bad = [];
                for (let i = 0; i < sched.shifts.length - 1; i++) {
                    const cur = sched.shifts[i];
                    const next = sched.shifts[i + 1];
                    if (!cur || !next) continue;
                    const skipIfOperative = (s) => !s || (typeof s === 'string' && (s.includes('☕') || s.includes('Riposo') || s.includes('🏖️') || s.includes('Ferie') || s.includes('📋') || s.includes('Permesso') || s.includes('🩺') || s.includes('Malattia') || s.includes('📦') || s.includes('Magazzino') || s.includes('🏢') || s.includes('Ufficio')));
                    if (skipIfOperative(cur) || skipIfOperative(next)) continue;
                    const minutes = minutesBetweenEndAndNextStart(cur, next);
                    if (!isFinite(minutes) || minutes < minRestMinutes) {
                        bad.push({ type: 'consecutive', dayIndex: i, from: cur, to: next, minutes });
                    }
                }
                // check wrap-around
                if (prevShift && sched.shifts && sched.shifts.length > 0) {
                    const first = sched.shifts[0];
                    const skipIfOperative = (s) => !s || (typeof s === 'string' && (s.includes('☕') || s.includes('Riposo') || s.includes('🏖️') || s.includes('Ferie') || s.includes('📋') || s.includes('Permesso') || s.includes('🩺') || s.includes('Malattia') || s.includes('📦') || s.includes('Magazzino') || s.includes('🏢') || s.includes('Ufficio')));
                    if (!skipIfOperative(prevShift) && !skipIfOperative(first)) {
                        const minutes = minutesBetweenEndAndNextStart(prevShift, first);
                        if (!isFinite(minutes) || minutes < minRestMinutes) bad.push({ type: 'wrap', from: prevShift, to: first, minutes });
                    }
                }

                violations.push({ id: emp.id, name: emp.name, assigned: sched.lastShift, issues: bad, schedule: sched.shifts, prevShift });
            }
        });

        return violations;
    };

    // Per compatibilità globale diretta
    window.generateAllShifts = function(){ return SM.generateAllShifts.apply(SM, arguments); };
    window.getAllowedShiftsForEmployee = function(){ return SM.getAllowedShiftsForEmployee.apply(SM, arguments); };
})();