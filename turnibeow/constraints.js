(function(){
    // Centralized constraints module (vincoli)
    const SM = window.ShiftManager;
    const MIN_REST_MINUTES = 11 * 60;

    function toIndexArrayFromAllowed(employee, numSlots) {
        // customStart prioritario: contiene indici 0-based o stringhe numeriche
        if (Array.isArray(employee.customStart) && employee.customStart.length > 0) {
            const arr = employee.customStart.map(n => parseInt(n,10)).filter(n => !isNaN(n));
            if (arr.length > 0) return arr;
        }
        // reparti / sottogruppi
        if (typeof window.getAllowedShiftsForEmployee === 'function') {
            const allowedSlots = window.getAllowedShiftsForEmployee(employee) || [];
            if (allowedSlots && allowedSlots.length > 0) {
                return allowedSlots.map(s => {
                    const m = String(s).match(/T(\d+)/i);
                    return m ? (parseInt(m[1],10) - 1) : null;
                }).filter(n => n !== null && !isNaN(n) && n >= 0 && n < numSlots);
            }
        }
        // fallback: tutti gli slot
        return Array.from({length: numSlots}, (_,i)=>i);
    }

    function respectsMinRestFor(employee, candidate, forcedRestDays, prevShift) {
        try {
            const schedule = SM.generateEmployeeSchedule ? SM.generateEmployeeSchedule(employee, candidate, candidate, forcedRestDays) : SM.generateEmployeeSchedule(employee, candidate, candidate, forcedRestDays);
            if (!schedule || !SM.scheduleRespectsMinRest) return true; // se non disponibile, assumiamo ok
            return SM.scheduleRespectsMinRest(schedule.shifts, MIN_REST_MINUTES, prevShift);
        } catch (e) { return false; }
    }

    function buildScheduleFor(employee, slotIndex, forcedRestDays) {
        const res = SM.generateEmployeeSchedule ? SM.generateEmployeeSchedule(employee, slotIndex, slotIndex, forcedRestDays) : null;
        return res || { shifts: new Array(SM.CONFIG.DAYS_PER_WEEK).fill(`T${slotIndex+1}`), stats:{totalHours:0,shifts:SM.CONFIG.DAYS_PER_WEEK}, lastShift: `T${slotIndex+1}` };
    }

    function tryAllocateDistribution(employee, index, assignmentMap, remainingCounts, numSlots) {
        // Use Distribuzione.allocateSlotForEmployee if available
        if (window.Distribuzione && typeof window.Distribuzione.allocateSlotForEmployee === 'function') {
            try {
                const alloc = window.Distribuzione.allocateSlotForEmployee(employee, index, assignmentMap, remainingCounts, numSlots);
                return alloc || null;
            } catch (e) { console.error('Distribuzione.allocateSlotForEmployee failed', e); }
        }
        // fallback: look at remainingCounts directly
        if (remainingCounts) {
            for (let i=0;i<numSlots;i++) if (remainingCounts[i] > 0) return { slot: i, reserved: true };
        }
        return null;
    }

    function assignEmployee(employee, index, assignmentMap, remainingCounts, numSlots, STATE, CONFIG, prevShift, forcedRestDays) {
        const warnings = [];
        const minRest = MIN_REST_MINUTES;

        // 1) If employee has lockedSchedule -> should be preserved by caller
        // 2) If employee has pre-existing non-operative shift entries, prefer the most frequent non-operative shift
        if (Array.isArray(employee.schedule) && employee.schedule.some(s => !isOperativeTest(s))) {
            const freq = {};
            employee.schedule.forEach(s => { if (s && !isOperativeTest(s)) freq[s] = (freq[s]||0)+1; });
            const entries = Object.entries(freq).sort((a,b)=>b[1]-a[1]);
            if (entries.length > 0) {
                const mostFreqShift = entries[0][0];
                const preferredSlot = SM.getSlotIndexFromShift ? SM.getSlotIndexFromShift(mostFreqShift) : getSlotIndexFromShiftShim(mostFreqShift, STATE);
                if (preferredSlot !== null && preferredSlot !== undefined && !isNaN(preferredSlot)) {
                    // Test 11h
                    const test = buildScheduleFor(employee, preferredSlot, forcedRestDays);
                    if (SM.scheduleRespectsMinRest && SM.scheduleRespectsMinRest(test.shifts, minRest, prevShift)) {
                        // Try to honor distribution if active
                        if (remainingCounts) {
                            if (remainingCounts[preferredSlot] > 0) { remainingCounts[preferredSlot]--; return finalize(preferredSlot, forcedRestDays); }
                            // else try Distribuzione
                            const alloc = tryAllocateDistribution(employee, index, assignmentMap, remainingCounts, numSlots);
                            if (alloc && alloc.slot !== undefined) {
                                if (alloc.reserved === false) warnings.push('Distribuzione non rispettata per preferenza');
                                if (alloc.forcedDueToRest) warnings.push('Distribuzione forzata (potrebbe violare riposo)');
                                return finalize(alloc.slot, forcedRestDays, warnings);
                            }
                            // if distribution not available or quota exhausted, fallthrough to try alternative slots
                        } else {
                            return finalize(preferredSlot, forcedRestDays);
                        }
                    }
                    // If preferred violates 11h: try alternatives that respect 11h
                    for (let offset=1; offset<numSlots; offset++) {
                        const candidate = (preferredSlot + offset) % numSlots;
                        if (candidate === getPrevSlotShim(employee)) continue;
                        const test2 = buildScheduleFor(employee, candidate, forcedRestDays);
                        if (SM.scheduleRespectsMinRest && SM.scheduleRespectsMinRest(test2.shifts, minRest, prevShift)) {
                            if (remainingCounts && remainingCounts[candidate] > 0) { remainingCounts[candidate]--; warnings.push('Preferred pre-assigned shift violated 11h; alternative used'); return finalize(candidate, forcedRestDays, warnings); }
                            else if (!remainingCounts) { warnings.push('Preferred pre-assigned shift violated 11h; alternative used'); return finalize(candidate, forcedRestDays, warnings); }
                        }
                    }
                    // If nothing found, keep preferred but warn
                    warnings.push('Preferred pre-assigned shift could not respect 11h; kept as-is and flagged');
                    // If distribution active, prefer to try allocation (even if it forces rest) before keeping
                    if (remainingCounts) {
                        const alloc2 = tryAllocateDistribution(employee, index, assignmentMap, remainingCounts, numSlots);
                        if (alloc2 && alloc2.slot !== undefined) {
                            if (alloc2.forcedDueToRest) warnings.push('Distribuzione forzata (potrebbe violare riposo)');
                            return finalize(alloc2.slot, forcedRestDays, warnings);
                        }
                    }
                    // As last resort keep preferred
                    return finalize(preferredSlot, forcedRestDays, warnings);
                }
            }
        }

        // 3) Otherwise, general allocation
        const allowed = toIndexArrayFromAllowed(employee, numSlots);

        // If employee has only one allowed slot, enforce it
        if (allowed.length === 1) {
            const only = allowed[0];
            // Respect rest if possible
            const test = buildScheduleFor(employee, only, forcedRestDays);
            if (SM.scheduleRespectsMinRest && !SM.scheduleRespectsMinRest(test.shifts, minRest, prevShift)) {
                warnings.push('Dipendente ha solo un turno ammesso ma viola 11h; assegnato comunque e segnalato');
            }
            // Deduct quota if applicable
            if (remainingCounts && remainingCounts[only] > 0) remainingCounts[only]--; else if (remainingCounts && remainingCounts[only] === 0) warnings.push('Quota per il turno richiesto esaurita, assegnazione comunque forzata');
            return finalize(only, forcedRestDays, warnings);
        }

        // If distribution active
        if (remainingCounts) {
            // prefer rotational index
            const preferred = (index + (STATE.rotationOffset || 0)) % numSlots;
            // prepare candidatePool filtered by allowed
            const candidatePool = allowed.slice();
            // try to find candidate with quota >0 that respects 11h and avoid prevSlot
            const prevSlot = getPrevSlotShim(employee);
            for (let k=0;k<candidatePool.length;k++) {
                const candidate = candidatePool[(candidatePool.indexOf(preferred) >= 0 ? candidatePool.indexOf(preferred) : 0 + k) % candidatePool.length];
                if (candidate === prevSlot && !!CONFIG.AVOID_PREV_SLOT_ALWAYS) continue;
                if (remainingCounts[candidate] > 0 && respectsMinRestFor(employee, candidate, forcedRestDays, prevShift) && candidate !== undefined) {
                    remainingCounts[candidate]--; return finalize(candidate, forcedRestDays);
                }
            }
            // try allowing ones that may violate 11h but have quota
            for (let i=0;i<candidatePool.length;i++) {
                const c = candidatePool[i];
                if (remainingCounts[c] > 0) { remainingCounts[c]--; warnings.push('No slot rispettante 11h disponibile; assegnato slot con quota'); return finalize(c, forcedRestDays, warnings); }
            }
            // try Distribuzione allocation fallback
            const alloc = tryAllocateDistribution(employee, index, assignmentMap, remainingCounts, numSlots);
            if (alloc && alloc.slot !== undefined) {
                if (alloc.forcedDueToRest) warnings.push('Distribuzione forzata (potrebbe violare riposo)');
                return finalize(alloc.slot, forcedRestDays, warnings);
            }
            // As last resort pick any allowed (rotation preferred)
            const pick = allowed[(index + (STATE.rotationOffset || 0)) % allowed.length];
            warnings.push('All slots full; assigned fallback (potrebbe violare vincoli)');
            return finalize(pick, forcedRestDays, warnings);
        }

        // No distribution active -> follow rotation / allowed
        const candidatePool2 = allowed;
        const startIdx = (index + (STATE.rotationOffset || 0)) % candidatePool2.length;
        const prevSlot2 = getPrevSlotShim(employee);
        for (let offset=0; offset<candidatePool2.length; offset++) {
            const candidate = candidatePool2[(startIdx + offset) % candidatePool2.length];
            if (candidate === prevSlot2) continue;
            if (respectsMinRestFor(employee, candidate, forcedRestDays, prevShift)) return finalize(candidate, forcedRestDays);
        }
        // fallback to allow prevSlot if necessary
        for (let offset=0; offset<candidatePool2.length; offset++) {
            const candidate = candidatePool2[(startIdx + offset) % candidatePool2.length];
            if (respectsMinRestFor(employee, candidate, forcedRestDays, prevShift)) { if (candidate === prevSlot2) console.warn(`[RULE] Repeated slot assigned to ${employee.name} (T${candidate+1}) - could not avoid repeat this week`); return finalize(candidate, forcedRestDays); }
        }
        // Hard fallback
        const fallback = candidatePool2[startIdx] || allowed[0];
        warnings.push('No slot rispettante 11h trovato; assegnamento di fallback');
        return finalize(fallback, forcedRestDays, warnings);

        // helpers
        function finalize(slot, frd, warns) {
            const s = buildScheduleFor(employee, slot, frd);
            return { assigned: slot, schedule: s.shifts, stats: s.stats, lastShift: s.lastShift, warnings: warns || [] };
        }
    }

    // small helper to mimic isOperativeState check used elsewhere
    function isOperativeTest(s) {
        if (!s || typeof s !== 'string') return false;
        return s.includes('☕') || s.includes('Riposo') || s.includes('🏖️') || s.includes('Ferie') || s.includes('📋') || s.includes('Permesso') || s.includes('🩺') || s.includes('Malattia') || s.includes('📦') || s.includes('Magazzino') || s.includes('🏢') || s.includes('Ufficio');
    }

    function getPrevSlotShim(emp) {
        try { if (emp.lastShift) { const m = String(emp.lastShift).match(/T(\d+)/i); if (m) return parseInt(m[1],10)-1; } } catch(e) {}
        return null;
    }

    function getSlotIndexFromShiftShim(shiftValue, STATE) {
        if (!shiftValue) return null;
        const tMatch = String(shiftValue).match(/T(\d+)/);
        if (tMatch) return parseInt(tMatch[1], 10) - 1;
        if (STATE && STATE.timeSlots) {
            const m = String(shiftValue).match(/(\d{2}:\d{2})/);
            if (m && m[1]) {
                for (let i=0;i<STATE.timeSlots.length;i++) if (String(STATE.timeSlots[i]).indexOf(m[1])>=0) return i;
            }
        }
        return null;
    }

    // Export
    if (typeof window !== 'undefined') {
        window.Constraints = window.Constraints || {};
        window.Constraints.assignEmployee = assignEmployee;
        window.Constraints._MIN_REST_MINUTES = MIN_REST_MINUTES;
        window.Constraints._helpers = { toIndexArrayFromAllowed };
    }
})();