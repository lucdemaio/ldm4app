(function(){
    // Distribuzione module - gestisce configurazione e applicazione distribuzione per turno
    // Helper: returns true if shift string represents an operative work shift
    const isWorkShift = function(s) {
        if (!s) return false;
        // If getSlotIndexFromShift exists, prefer it but fall back if it cannot parse
        if (typeof getSlotIndexFromShift === 'function') {
            try {
                const idx = getSlotIndexFromShift(s);
                if (idx !== null && idx !== undefined && idx >= 0) return true;
                // fall back to basic heuristics if parsing failed
            } catch(e) { /* ignore parse errors and fallback */ }
        }
        return (typeof s === 'string') && (s.includes(' - ') || /\d{2}:\d{2}/.test(s) || /^T\d+$/i.test(String(s)));
    };

    const Distribuzione = {
        parseDistributionString(input) {
            if (!input || typeof input !== 'string') return [];
            const parts = input.split('-').map(p => parseInt(p.trim(),10)).filter(n => !isNaN(n) && n > 0);
            return parts;
        },
        validateDistribution(arr, numSlots) {
            if (!Array.isArray(arr)) return false;
            if (arr.length === 0) return true;
            if (numSlots && arr.length > numSlots) return false;
            return arr.every(n => Number.isInteger(n) && n >= 0);
        },
        setDistribution(arr) {
            if (!Array.isArray(arr)) arr = [];
            const SM = window.ShiftManager;
            if (SM && SM.STATE) SM.STATE.distributionPerShift = arr;
            try { localStorage.setItem('distributionPerShift', JSON.stringify(arr)); } catch(e) { console.warn('Failed to persist distributionPerShift', e); }
        },
        clearDistribution() { this.setDistribution([]); },
        getDistribution() {
            const SM = window.ShiftManager;
            return SM && SM.STATE ? (SM.STATE.distributionPerShift || []) : [];
        },

        // Prepara assignmentMap e remainingCounts a partire da STATE.distributionPerShift
        prepareAssignment(numSlots, STATE) {
            let distribution = (STATE && STATE.distributionPerShift) ? (Array.isArray(STATE.distributionPerShift) ? STATE.distributionPerShift.slice() : []) : [];
            let assignmentMap = [];
            let remainingCounts = null;
            if (Array.isArray(distribution) && distribution.length > 0) {
                console.info(`[INFO] Distribuzione attiva: ${distribution.join('-')}`);
                // Normalize to numSlots: trim or pad
                if (distribution.length > numSlots) {
                    console.warn('[WARN] distributionPerShift contains more entries than timeSlots; trimming extras');
                    distribution = distribution.slice(0, numSlots);
                } else if (distribution.length < numSlots) {
                    console.warn('[WARN] distributionPerShift has fewer entries than timeSlots; padding with zeros');
                    distribution = distribution.concat(new Array(numSlots - distribution.length).fill(0));
                }

                // Check sum equals employees (strict mode)
                const totalEmployees = (STATE && STATE.employees) ? STATE.employees.length : null;
                if (totalEmployees !== null && distribution.reduce((s,n)=>s+n,0) !== totalEmployees) {
                    console.error('[ERROR] distributionPerShift sum does not equal number of employees. Expected sum:', totalEmployees, 'got:', distribution.reduce((s,n)=>s+n,0));
                }

                remainingCounts = new Array(numSlots).fill(0);
                for (let i = 0; i < distribution.length && i < numSlots; i++) {
                    remainingCounts[i] = distribution[i];
                }

                // Build assignmentMap only for valid slot indices
                for (let shiftIndex = 0; shiftIndex < Math.min(distribution.length, numSlots); shiftIndex++) {
                    const count = distribution[shiftIndex];
                    for (let i = 0; i < count; i++) assignmentMap.push(shiftIndex);
                }

                const rotatedMap = [];
                for (let i=0;i<assignmentMap.length;i++) {
                    const newIndex = (i + (STATE.rotationOffset || 0)) % assignmentMap.length;
                    rotatedMap.push(assignmentMap[newIndex]);
                }
                assignmentMap = rotatedMap;

                console.debug('[DEBUG][Distribuzione] prepared assignmentMap length=', assignmentMap.length, 'remainingCounts=', JSON.stringify(remainingCounts));

                // Deduct already-locked or pre-existing employee assignments from remainingCounts
                const CONFIG = window.ShiftManager ? window.ShiftManager.CONFIG : { DAYS_PER_WEEK: 7 };
                const lockedEmployees = (STATE.employees || []).filter(e => Array.isArray(e.schedule) && e.schedule.length === CONFIG.DAYS_PER_WEEK && e.schedule.some(s => isWorkShift(s)));
                lockedEmployees.forEach(e => {
                    const freq = {};
                    e.schedule.forEach(s => {
                        if (!s) return;
                        if (window.isOperativeState && isOperativeState(s)) return;
                        const idx = (typeof window.getSlotIndexFromShift === 'function') ? getSlotIndexFromShift(s) : null;
                        if (idx === null || idx === undefined) return;
                        if (idx >= 0 && idx < numSlots) freq[idx] = (freq[idx] || 0) + 1;
                    });
                    const entries = Object.entries(freq).sort((a,b) => b[1] - a[1]);
                    if (entries.length > 0) {
                        const slot = parseInt(entries[0][0], 10);
                        if (remainingCounts && remainingCounts[slot] !== undefined) {
                            remainingCounts[slot] = Math.max(0, remainingCounts[slot] - 1);
                        }
                    }
                });
                console.debug('[DEBUG][Distribuzione] after locked deduction remainingCounts=', JSON.stringify(remainingCounts));
            } else {
                for (let i=0;i<(STATE.employees || []).length;i++) assignmentMap.push((i + (STATE.rotationOffset || 0)) % numSlots);
            }
            return { assignmentMap, remainingCounts };
        },

        // Allocazione vincolante: prova a scegliere uno slot che abbia ancora "remainingCounts" > 0
        allocateSlotForEmployee(employee, index, assignmentMap, remainingCounts, numSlots) {
            const SM = window.ShiftManager;
            const STATE = SM ? SM.STATE : null;
            const preferred = (assignmentMap && assignmentMap.length > 0) ? assignmentMap[index % assignmentMap.length] : null;
            // Build candidate pool
            let candidatePool = Array.from({length: numSlots}, (_,i)=>i);
            if (Array.isArray(employee.customStart) && employee.customStart.length > 0) {
                candidatePool = employee.customStart.map(n => parseInt(n,10)).filter(n => !isNaN(n));
            }
            const prevSlot = employee.lastShift ? ((typeof getSlotIndexFromShift === 'function') ? getSlotIndexFromShift(employee.lastShift) : null) : null;
            const minRestMinutes = 11 * 60;

            // Helper: test if slot respects rest
            const respects = (candidate) => {
                try {
                    const test = SM.generateEmployeeSchedule ? SM.generateEmployeeSchedule(employee, candidate, candidate) : null;
                    return test ? (SM.scheduleRespectsMinRest ? SM.scheduleRespectsMinRest(test.shifts, minRestMinutes, prevSlot) : true) : true;
                } catch (e) { return false; }
            };

            // First try: preferred if has remainingCounts
            console.debug(`[DEBUG][Distribuzione.alloc] employee=${employee.name} index=${index} preferred=${preferred} remainingCounts=${JSON.stringify(remainingCounts)} prevSlot=${prevSlot}`);
            if (preferred !== null && remainingCounts && remainingCounts[preferred] > 0 && candidatePool.indexOf(preferred) >= 0 && respects(preferred) && preferred !== prevSlot) {
                remainingCounts[preferred]--;
                console.debug(`[DEBUG][Distribuzione.alloc] reserved preferred slot T${preferred+1} for ${employee.name}; remainingCounts now=${JSON.stringify(remainingCounts)}`);
                return { slot: preferred, reserved: true };
            }

            // Second: search candidatePool for any slot with remainingCounts > 0 and respecting rest (avoid prevSlot first)
            for (let k = 0; k < candidatePool.length; k++) {
                const candidate = candidatePool[(k) % candidatePool.length];
                if (candidate === prevSlot) continue;
                if (remainingCounts && remainingCounts[candidate] > 0 && respects(candidate)) {
                    remainingCounts[candidate]--;
                    console.debug(`[DEBUG][Distribuzione.alloc] reserved slot T${candidate+1} for ${employee.name}; remainingCounts now=${JSON.stringify(remainingCounts)}`);
                    return { slot: candidate, reserved: true };
                }
            }
            // Third: allow prevSlot if necessary
            for (let k = 0; k < candidatePool.length; k++) {
                const candidate = candidatePool[(k) % candidatePool.length];
                if (remainingCounts && remainingCounts[candidate] > 0 && respects(candidate)) {
                    remainingCounts[candidate]--;
                    return { slot: candidate, reserved: true };
                }
            }

            // If no slot respecting rest with available quota found, try to enforce distribution ignoring rest (forced)
            for (let k = 0; k < candidatePool.length; k++) {
                const candidate = candidatePool[k];
                if (remainingCounts && remainingCounts[candidate] > 0) {
                    // force allocation even if violates rest
                    console.warn(`[WARN] Forcing distribution slot assignment for ${employee.name} to T${candidate+1} (may violate min rest)`);
                    remainingCounts[candidate]--;
                    console.debug(`[DEBUG][Distribuzione.alloc] forced reservation T${candidate+1} for ${employee.name}; remainingCounts now=${JSON.stringify(remainingCounts)}`);
                    return { slot: candidate, reserved: true, forcedDueToRest: true };
                }
            }
            // No slot with available quota - fallback to preference with rest
            if (preferred !== null && candidatePool.indexOf(preferred) >= 0 && respects(preferred)) {
                return { slot: preferred, reserved: false };
            }
            for (let k=0;k<candidatePool.length;k++) {
                const candidate = candidatePool[k];
                if (respects(candidate)) return { slot: candidate, reserved: false };
            }
            // as last resort return preferred or 0
            return { slot: preferred !== null ? preferred : 0, reserved: false };
        }
    };

    // Rebalancing helpers
    // Robustly determine an employee's primary assigned slot index using multiple fallbacks
    Distribuzione.getEmployeePrimarySlot = function(emp, STATE) {
        if (!emp) return null;
        // 1) look into schedule array for first occupational entry matching isWorkShift or slot id like T1
        if (Array.isArray(emp.schedule)) {
            for (let s of emp.schedule) {
                if (!s) continue;
                // direct slot id e.g. 'T1'
                const mt = String(s).match(/^T(\d+)$/i);
                if (mt) return parseInt(mt[1],10) - 1;
                if (isWorkShift(s)) {
                    // try to use getSlotIndexFromShift, but if it fails, attempt heuristic match against STATE.timeSlots using start time
                    if (typeof getSlotIndexFromShift === 'function') {
                        try {
                            const idx = getSlotIndexFromShift(s);
                            if (idx !== null && idx !== undefined && !isNaN(idx)) return idx;
                        } catch(e) { /* ignore */ }
                    }
                    // fallback: parse first HH:MM and try to match against STATE.timeSlots entries
                    const m = String(s).match(/(\d{2}:\d{2})/);
                    if (m && m[1] && STATE && Array.isArray(STATE.timeSlots)) {
                        const start = m[1];
                        for (let i=0;i<STATE.timeSlots.length;i++) {
                            const ts = STATE.timeSlots[i];
                            try {
                                if (typeof ts === 'string' && ts.indexOf(start) >= 0) return i;
                            } catch(e) {}
                        }
                    }
                    // if heuristics failed, still consider it a work shift but continue scanning other entries
                }
            }
        }
        // 2) try lastShift property
        if (emp.lastShift) {
            const ls = String(emp.lastShift);
            const mt2 = ls.match(/^T(\d+)$/i);
            if (mt2) return parseInt(mt2[1],10) - 1;
            if (isWorkShift(ls) && typeof getSlotIndexFromShift === 'function') {
                const idx = getSlotIndexFromShift(ls);
                if (idx !== null && idx !== undefined && !isNaN(idx)) return idx;
            }
        }
        // 3) try weeklySchedules snapshot for recent week entries
        try {
            if (STATE && STATE.weeklySchedules) {
                const keys = Object.keys(STATE.weeklySchedules || {}).filter(k => k !== undefined && k !== null);
                for (let i = keys.length - 1; i >= 0; i--) {
                    const wk = STATE.weeklySchedules[keys[i]];
                    if (wk && wk[String(emp.id)] && Array.isArray(wk[String(emp.id)].schedule)) {
                        const sch = wk[String(emp.id)].schedule;
                        for (let s of sch) {
                            if (!s) continue;
                            const m = String(s).match(/^T(\d+)$/i);
                            if (m) return parseInt(m[1],10) - 1;
                            if (isWorkShift(s) && typeof getSlotIndexFromShift === 'function') {
                                const idx = getSlotIndexFromShift(s);
                                if (idx !== null && idx !== undefined && !isNaN(idx)) return idx;
                            }
                        }
                    }
                }
            }
        } catch(e) { /* ignore */ }
        return null;
    };

    Distribuzione.computeAssignedCounts = function(STATE) {
        const numSlots = (STATE.timeSlots && STATE.timeSlots.length) ? STATE.timeSlots.length : 3;
        const assignedCounts = new Array(numSlots).fill(0);
        // helper to count from an array of employee-like objects
        const countFromEmployees = (emps) => {
            (emps || []).forEach(e => {
                const idx = this.getEmployeePrimarySlot(e, STATE);
                if (idx !== null && idx !== undefined && idx >= 0 && idx < numSlots) assignedCounts[idx]++;
            });
        };

        // Count from in-memory employees first
        countFromEmployees(STATE.employees);

        // If nothing found, try to use weeklySchedules snapshot for current week (fallback)
        const totalAssigned = assignedCounts.reduce((s,n)=>s+n,0);
        if (totalAssigned === 0 && STATE.weeklySchedules && STATE.weeklySchedules[STATE.currentWeek]) {
            const week = STATE.weeklySchedules[STATE.currentWeek];
            const fakeEmps = Object.keys(week).map(id => ({ id, schedule: week[id] && week[id].schedule ? week[id].schedule : [] }));
            countFromEmployees(fakeEmps);
            console.debug('[DEBUG][Distribuzione] computeAssignedCounts used weeklySchedules snapshot for currentWeek', STATE.currentWeek, 'assignedCounts=', JSON.stringify(assignedCounts));
        }

        return assignedCounts;
    };

    // Generate move suggestions to cover deficits using donors from surplus slots
    Distribuzione.computeRebalanceSuggestions = function(STATE, assignedOverride) {
        const numSlots = (STATE.timeSlots && STATE.timeSlots.length) ? STATE.timeSlots.length : 3;
        const distribution = STATE.distributionPerShift || new Array(numSlots).fill(0);
        const assigned = Array.isArray(assignedOverride) ? assignedOverride.slice(0, numSlots) : this.computeAssignedCounts(STATE);
        const deficits = [];
        const surpluses = [];
        for (let i=0;i<numSlots;i++) {
            const diff = distribution[i] - (assigned[i] || 0);
            if (diff > 0) deficits.push({slot:i, need:diff});
            else if (diff < 0) surpluses.push({slot:i, extra:-diff});
        }

        const suggestions = [];
        // Helper to test move of employee id -> target
        const canMove = (emp, toSlot) => {
            try {
                if (Array.isArray(emp.customStart) && emp.customStart.length>0 && emp.customStart.indexOf(toSlot)===-1) return {ok:false, reason:'not-allowed-by-customStart'};
                const test = (typeof window.ShiftManager !== 'undefined' && window.ShiftManager.generateEmployeeSchedule) ? window.ShiftManager.generateEmployeeSchedule(emp, toSlot, toSlot) : null;
                const respects = test ? (window.ShiftManager && window.ShiftManager.scheduleRespectsMinRest ? window.ShiftManager.scheduleRespectsMinRest(test.shifts, 11*60, emp.lastShift) : true) : true;
                return {ok:respects, test};
            } catch (e) { return {ok:false, reason:'error'}; }
        };

        // For each deficit slot, try to find donors
        deficits.forEach(def => {
            let needed = def.need;
            // sort surpluses to try larger donors first
            surpluses.sort((a,b)=>b.extra-a.extra);
            for (let sIdx=0;sIdx<surpluses.length && needed>0;sIdx++) {
                const donorSlot = surpluses[sIdx].slot;
                if (surpluses[sIdx].extra<=0) continue;
                // find employees currently assigned to donorSlot
                const donors = (STATE.employees||[]).filter(e => {
                    const idx = this.getEmployeePrimarySlot(e, STATE);
                    return idx === donorSlot;
                });
                // evaluate donors for this def slot
                for (let d=0; d<donors.length && needed>0 && surpluses[sIdx].extra>0; d++) {
                    const emp = donors[d];
                    const res = canMove(emp, def.slot);
                    const cost = res.ok ? 0 : 1; // 0 no-rest-violation, 1 would violate or not allowed
                    suggestions.push({empId: emp.id, empName: emp.name, from: donorSlot, to: def.slot, cost, previewNewSchedule: res.test ? res.test.shifts : null});
                    needed--; surpluses[sIdx].extra--; // tentatively consume donor
                }
            }
        });

        // Sort suggestions by cost (prefer 0)
        suggestions.sort((a,b)=>a.cost - b.cost);
        return {assigned, distribution, suggestions};
    };

    // Compute a pure candidate list (donors grouped per deficit) WITHOUT applying anything or looping
    Distribuzione.computeCandidates = function(STATE, assigned, deficits) {
        if (!Array.isArray(deficits) || deficits.length===0) return [];
        const candidates = [];
        // find previous week snapshot if available (prefer currentWeek-1 or the most recent other week)
        let prevWeekKey = null;
        try {
            if (STATE.weeklySchedules) {
                const keys = Object.keys(STATE.weeklySchedules || {}).filter(k => k !== undefined && k !== null);
                if (STATE.currentWeek && keys.indexOf(STATE.currentWeek) >= 0) {
                    const others = keys.filter(k => k !== STATE.currentWeek);
                    if (others.length > 0) prevWeekKey = others.sort().pop();
                } else if (keys.length > 0) prevWeekKey = keys.sort().pop();
            }
        } catch(e) { /* ignore */ }

        const numSlots = (STATE.timeSlots && STATE.timeSlots.length) ? STATE.timeSlots.length : (assigned && assigned.length) ? assigned.length : 3;

        console.info('[INFO][Distribuzione.computeCandidates] deficits=', JSON.stringify(deficits), 'assigned=', JSON.stringify(assigned), 'prevWeekKey=', prevWeekKey, 'employees=', (STATE.employees||[]).length, 'numSlots=', numSlots);

        // Build slot buckets for diagnostics and quicker lookup
        const slotBuckets = new Array(numSlots).fill(0).map(()=>[]);
        const unknown = [];
        (STATE.employees||[]).forEach(e => {
            const idx = this.getEmployeePrimarySlot(e, STATE);
            const rec = { id: e.id, name: e.name, idx, schedule: Array.isArray(e.schedule) ? e.schedule.slice(0,4) : e.schedule };
            if (idx === null || idx === undefined || idx < 0 || idx >= numSlots) unknown.push(rec);
            else slotBuckets[idx].push(rec);
        });

        // Log summary per slot
        const slotSummary = slotBuckets.map((arr, i) => ({slot:i, count: arr.length, sample: arr.slice(0,6).map(a=>a.name)}));
        console.info('[INFO][Distribuzione.computeCandidates] slotSummary=', slotSummary, 'unknownCount=', unknown.length, 'unknownSample=', unknown.slice(0,6));
        // Dump a little more detail for first few unknown employees to inspect schedule formats
        if (unknown.length>0) {
            const detail = unknown.slice(0,6).map(u => ({id:u.id, name:u.name, scheduleSample: Array.isArray(u.schedule)? u.schedule.slice(0,6): u.schedule}));
            console.info('[INFO][Distribuzione.computeCandidates] unknown employee schedules sample=', JSON.stringify(detail));
        }

        for (let di=0; di<deficits.length; di++) {
            const def = deficits[di];
            const need = def.need;
            const distribution = STATE.distributionPerShift || [];
            const donors = [];
            // Surplus slots are those where assigned > distribution
            const surplusSlots = [];
            for (let s=0;s<numSlots;s++) {
                if ((assigned[s]||0) > (distribution[s]||0)) surplusSlots.push(s);
            }
            // Gather donors from surplusSlots
            surplusSlots.forEach(donorSlot => {
                const arr = slotBuckets[donorSlot] || [];
                arr.forEach(eRec => {
                    // Determine last week's shift for this employee if available
                    let lastWeekShift = null; let lastWeekSlot = null;
                    try {
                        if (prevWeekKey && STATE.weeklySchedules && STATE.weeklySchedules[prevWeekKey] && STATE.weeklySchedules[prevWeekKey][String(eRec.id)]) {
                            const wk = STATE.weeklySchedules[prevWeekKey][String(eRec.id)];
                            const wkSchedule = wk && wk.schedule ? wk.schedule : null;
                            if (Array.isArray(wkSchedule)) {
                                // try to find a work shift or Tn
                                let cand = wkSchedule.find(s => isWorkShift(s) || /^T\d+$/i.test(String(s)));
                                if (!cand) cand = wkSchedule[0] || null;
                                lastWeekShift = cand || null;
                                if (lastWeekShift && typeof getSlotIndexFromShift === 'function') {
                                    const maybe = (typeof lastWeekShift === 'string' && lastWeekShift.match(/^T(\d+)$/i)) ? (parseInt(lastWeekShift.match(/^T(\d+)$/i)[1],10)-1) : getSlotIndexFromShift(lastWeekShift);
                                    if (maybe !== null && maybe !== undefined && !isNaN(maybe)) lastWeekSlot = maybe;
                                }
                            }
                        }
                    } catch (err) { /* ignore */ }
                    if (!lastWeekShift) {
                        const cur = eRec.schedule && eRec.schedule.length>0 ? eRec.schedule.find(s => isWorkShift(s) || /^T\d+$/i.test(String(s))) : null;
                        lastWeekShift = cur || null;
                        lastWeekSlot = eRec.idx;
                    }
                    donors.push({empId: eRec.id, empName: eRec.name, from: donorSlot, lastWeekShift, lastWeekSlot});
                });
            });

            console.info('[INFO][Distribuzione.computeCandidates] deficit T'+def.slot+' surplusSlots='+JSON.stringify(surplusSlots)+' donorsFound='+donors.length, donors.slice(0,20).map(d=>({id:d.empId, name:d.empName})));
            // Trim donors to requested need
            candidates.push({ to: def.slot, need: need, donors: donors.slice(0, Math.max(need, donors.length)) });
        }
        return candidates;
    };
    Distribuzione.applySuggestion = function(suggestion, opts = {}) {
        const SM = window.ShiftManager;
        if (!SM || !SM.STATE) {
            console.warn('[WARN][Distribuzione.apply] ShiftManager or STATE missing');
            return false;
        }
        const force = !!opts.force;
        console.debug('[DEBUG][Distribuzione.apply] applying suggestion', suggestion, 'force=', force);
        // find employee tolerating id type differences
        const emp = (SM.STATE.employees || []).find(e => String(e.id) === String(suggestion.empId));
        if (!emp) {
            console.warn('[WARN][Distribuzione.apply] employee not found for suggestion', suggestion.empId);
            return false;
        }
        try {
            const gen = (typeof SM.generateEmployeeSchedule === 'function') ? SM.generateEmployeeSchedule : (typeof window.generateEmployeeSchedule === 'function' ? window.generateEmployeeSchedule : null);
            if (!gen) {
                console.error('[ERROR][Distribuzione.apply] generateEmployeeSchedule not available');
                return false;
            }
            let schedule = null;
            try { schedule = gen(emp, suggestion.to, suggestion.to); } catch(e) { console.warn('[WARN][Distribuzione.apply] generateEmployeeSchedule threw', e); }
            // If schedule invalid and force is requested, build a synthetic forced schedule using slot mapping
            if ((!schedule || !Array.isArray(schedule.shifts) || schedule.shifts.length === 0) && force) {
                console.warn('[WARN][Distribuzione.apply] generateEmployeeSchedule returned invalid, building forced schedule');
                const slotId = (SM.getTimeFromSlotId && typeof SM.getTimeFromSlotId === 'function') ? SM.getTimeFromSlotId(`T${suggestion.to+1}`) : `T${suggestion.to+1}`;
                const forcedShifts = (SM.STATE && SM.CONFIG && SM.CONFIG.DAYS_PER_WEEK) ? new Array(SM.CONFIG.DAYS_PER_WEEK).fill(slotId) : new Array(7).fill(slotId);
                schedule = { shifts: forcedShifts, stats: null, lastShift: forcedShifts[forcedShifts.length-1] };
            }
            if (!schedule || !Array.isArray(schedule.shifts)) {
                console.warn('[WARN][Distribuzione.apply] generated schedule invalid or empty for', emp.name, schedule);
                return false;
            }
            const prev = Array.isArray(emp.schedule) ? emp.schedule.slice(0,3) : emp.schedule;
            emp.schedule = schedule.shifts;
            emp.stats = schedule.stats || emp.stats;
            emp.lastShift = schedule.lastShift || emp.lastShift;
            emp._appliedDecision = `rebalance ${suggestion.from}->${suggestion.to}${force? ' (forced)':''}`;
            try { SM.saveData(); } catch (e) { console.warn('[WARN][Distribuzione.apply] SM.saveData failed', e); }
            try { if (typeof SM.renderTable === 'function') SM.renderTable(); } catch(e) { console.warn('[WARN][Distribuzione.apply] SM.renderTable failed', e); }
            // Also update riepilogo presenze so the summary reflects manual changes
            try {
                if (typeof SM.generateRiepilogoPresenza === 'function') SM.generateRiepilogoPresenza();
                else if (typeof window.generateRiepilogoPresenza === 'function') window.generateRiepilogoPresenza();
            } catch(e) { console.warn('[WARN][Distribuzione.apply] generateRiepilogoPresenza failed', e); }
            // update lastAssigned snapshot so UI reflects change immediately
            try { SM._lastAssignedCounts = this.computeAssignedCounts(SM.STATE); } catch(e) {}
            console.info('[INFO][Distribuzione.apply] applied suggestion, prev=', JSON.stringify(prev), 'new=', JSON.stringify(emp.schedule.slice(0,3)), 'new assignedCounts=', JSON.stringify(SM._lastAssignedCounts));
            return true;
        } catch (e) { console.error('[ERROR][Distribuzione.apply] applySuggestion failed', e); return false; }
    };

    // UI helper: show suggestions in modal (modal element expected in DOM)
    Distribuzione.getLiveAssignedCounts = function(STATE) {
        // Try multiple sources to compute assigned counts robustly
        const fromCompute = this.computeAssignedCounts(STATE);
        const numSlots = (STATE.timeSlots && STATE.timeSlots.length) ? STATE.timeSlots.length : fromCompute.length || 3;
        const assigned = fromCompute.slice(0, numSlots);
        const sum = assigned.reduce((s,n)=>s+n,0);
        if (sum > 0) return assigned;

        // Fallback: try weeklySchedules for currentWeek if present
        if (STATE.weeklySchedules && STATE.weeklySchedules[STATE.currentWeek]) {
            const week = STATE.weeklySchedules[STATE.currentWeek];
            const temp = new Array(numSlots).fill(0);
            Object.values(week).forEach(x => {
                const sch = x && x.schedule ? x.schedule : [];
                const most = Array.isArray(sch) ? sch.find(isWorkShift) : null;
                if (most) {
                    const idx = (typeof getSlotIndexFromShift === 'function') ? getSlotIndexFromShift(most) : null;
                    if (idx !== null && idx !== undefined && idx >= 0 && idx < numSlots) temp[idx]++;
                }
            });
            if (temp.reduce((s,n)=>s+n,0) > 0) return temp;
        }

        // Last resort: scan all weeklySchedules for any non-empty week
        if (STATE.weeklySchedules) {
            const temp = new Array(numSlots).fill(0);
            for (const k of Object.keys(STATE.weeklySchedules)) {
                const wk = STATE.weeklySchedules[k];
                Object.values(wk).forEach(x => {
                    const sch = x && x.schedule ? x.schedule : [];
                    const most = Array.isArray(sch) ? sch.find(isWorkShift) : null;
                    if (most) {
                        const idx = (typeof getSlotIndexFromShift === 'function') ? getSlotIndexFromShift(most) : null;
                        if (idx !== null && idx !== undefined && idx >= 0 && idx < numSlots) temp[idx]++;
                    }
                });
                if (temp.reduce((s,n)=>s+n,0) > 0) return temp;
            }
        }

        return assigned; // may be all zeros
    };

    Distribuzione.showSuggestionsModal = function(attemptsLeft = 20) {
        const SM = window.ShiftManager; if (!SM || !SM.STATE) return console.warn('[WARN][Distribuzione] ShiftManager or STATE missing');
        let waitingForSave = false;
        try {
            if (typeof window.showDistributionSuggestionsModal === 'function') return window.showDistributionSuggestionsModal();

            // If generation recently completed and save hasn't finished, do NOT block opening the modal; instead show a banner that save is pending
            const genTime = SM._lastGenerationCompleteTime || 0;
            const lastSave = SM._lastSaveTime || 0;
            if (genTime > 0 && lastSave < genTime) {
                console.debug('[DEBUG][Distribuzione] Save not completed yet; opening modal and showing waiting banner. genTime=', genTime, 'lastSave=', lastSave);
                waitingForSave = true;
            }
            // diagnostic: log modal opening and state
            console.info('[INFO][Distribuzione.showSuggestionsModal] opened waitingForSave=', waitingForSave, 'genTime=', genTime, 'lastSave=', lastSave, 'employees=', (SM.STATE && SM.STATE.employees) ? SM.STATE.employees.length : 0);
        } catch (e) {
            console.error('[ERROR][Distribuzione.showSuggestionsModal] initialization failed', e);
            // attempt to open modal DOM directly
            try {
                const modal = document.getElementById('distributionSuggestionsModal');
                if (modal) { modal.style.display='block'; modal.classList.add('active'); }
            } catch (ex) { console.error('[ERROR][Distribuzione.showSuggestionsModal] forced modal open failed', ex); }
            return;
        }

        const modal = document.getElementById('distributionSuggestionsModal');
        if (!modal) return console.warn('Modal not found');

        // Immediately attach delegated handler and debug helper so they exist even if render is skipped
        try {
            if (!modal._hasDelegatedShowCandidatesEarly) {
                modal.addEventListener('click', (ev) => {
                    try {
                        const b = ev.target.closest && ev.target.closest('button[data-action]');
                        if (!b) return;
                        if (b.dataset.action === 'showCandidates') {
                            console.info('[INFO][Distribuzione] delegated early showCandidates click');
                            // Attempt to call the handler exposed on modal if present
                            try { if (typeof modal._doShowCandidates === 'function') modal._doShowCandidates(); else { /* no-op */ } } catch(e) { console.info('[INFO][Distribuzione] delegated handler error', e); }
                        }
                    } catch (e) { console.info('[INFO][Distribuzione] delegated handler internal error', e); }
                });
                modal._hasDelegatedShowCandidatesEarly = true;
            }
            // Expose quick debug helper early
            window.Distribuzione = window.Distribuzione || {};
            if (!window.Distribuzione.debugCandidates) {
                window.Distribuzione.debugCandidates = () => {
                    try {
                        const chosen = (SM && SM._lastAssignedCounts && Array.isArray(SM._lastAssignedCounts) && SM._lastAssignedCounts.reduce((s,n)=>s+n,0)>0) ? SM._lastAssignedCounts : (this.computeAssignedCounts(SM.STATE));
                        const dist = (SM.STATE && SM.STATE.distributionPerShift) ? SM.STATE.distributionPerShift : [];
                        const deficitsLocal = [];
                        for (let i=0;i<dist.length;i++) { const delta = (dist[i]||0) - (chosen[i]||0); if (delta>0) deficitsLocal.push({slot:i, need:delta}); }
                        console.info('[INFO][Distribuzione.debugCandidates] chosen=', chosen, 'dist=', dist, 'deficits=', deficitsLocal);
                        const res = this.computeCandidates(SM.STATE, chosen, deficitsLocal);
                        console.info('[INFO][Distribuzione.debugCandidates] candidates=', res);
                        return res;
                    } catch(e) { console.info('[INFO][Distribuzione.debugCandidates] error', e); return null; }
                };
            }
        } catch(e) { console.info('[INFO][Distribuzione] early attach failed', e); }
        const list = modal.querySelector('.suggestions-list');
        const header = modal.querySelector('.suggestions-header');

        // diagnostic computed assigned using same logic as sm-engine for reliability
        const computeAssignedLocal = () => {
            const numSlots = (SM.STATE && SM.STATE.timeSlots && SM.STATE.timeSlots.length) ? SM.STATE.timeSlots.length : 3;
            const assigned = new Array(numSlots).fill(0);
            (SM.STATE && SM.STATE.employees || []).forEach(e => {
                const most = Array.isArray(e.schedule) ? e.schedule.find(isWorkShift) : null;
                if (most) {
                    const idx = (typeof getSlotIndexFromShift === 'function') ? getSlotIndexFromShift(most) : null;
                    if (idx !== null && idx !== undefined && idx >= 0 && idx < numSlots) assigned[idx]++;
                }
            });
            return assigned;
        };

        const render = (res) => {
            // header will be cleared after we decide to render to avoid flashing/vanishing when snapshots match

            const computedAssigned = computeAssignedLocal();
            const live = this.getLiveAssignedCounts(SM.STATE);
            const computedDebug = this.computeAssignedCounts(SM.STATE);
            const lastAssigned = (SM && SM._lastAssignedCounts && Array.isArray(SM._lastAssignedCounts)) ? SM._lastAssignedCounts : null;

            // Avoid repeated renders/logs: skip if snapshot identical to previous, BUT always render if we're waiting for engine counts or if we don't have any assigned counts yet
            try {
                const suggestionsSummary = (res && res.suggestions) ? res.suggestions.map(s => ({empId: String(s.empId), from: s.from, to: s.to, cost: s.cost})) : [];
                const snapObj = { computedAssigned, computedDebug, live, lastAssigned, distribution: (SM.STATE && SM.STATE.distributionPerShift) ? SM.STATE.distributionPerShift : [], suggestions: suggestionsSummary, waitingForEngine: !!res.waitingForEngine, waitingForSave: !!res.waitingForSave };
                const snap = JSON.stringify(snapObj);
                // compute sums to detect lack of assigned counts
                const sumLast = lastAssigned && Array.isArray(lastAssigned) ? lastAssigned.reduce((s,n)=>s+n,0) : 0;
                const sumComputed = Array.isArray(computedAssigned) ? computedAssigned.reduce((s,n)=>s+n,0) : 0;
                const sumLive = Array.isArray(live) ? live.reduce((s,n)=>s+n,0) : 0;
                const sumChosen = Math.max(sumLast, sumComputed, sumLive);
                if (modal._lastRenderSnapshot === snap && !res.waitingForEngine && !res.waitingForSave && sumChosen > 0) {
                    console.debug('[DEBUG][Distribuzione] render skipped — no changes since last render');
                    return;
                }
                modal._lastRenderSnapshot = snap;
            } catch (e) { /* ignore snapshot errors */ }

            console.debug('[INFO][Distribuzione] computedAssigned=', JSON.stringify(computedAssigned), 'computeAssignedCounts=', JSON.stringify(computedDebug), 'getLiveAssignedCounts=', JSON.stringify(live), 'lastAssignedCounts=', JSON.stringify(lastAssigned), 'distribution=', JSON.stringify((SM.STATE && SM.STATE.distributionPerShift) ? SM.STATE.distributionPerShift : []));

            // Determine chosen assigned counts
            const chosenAssigned = (lastAssigned && lastAssigned.reduce((s,n)=>s+n,0) > 0) ? lastAssigned : ((computedAssigned.reduce((s,n)=>s+n,0) > 0) ? computedAssigned : live);

            // Compute deficits/surpluses and required moves
            const distribution = (SM.STATE && SM.STATE.distributionPerShift) ? SM.STATE.distributionPerShift.slice() : new Array(chosenAssigned.length).fill(0);
            const deficits = []; const surpluses = [];
            let movesNeeded = 0;
            for (let i=0;i<distribution.length;i++) {
                const diff = (distribution[i] || 0) - (chosenAssigned[i] || 0);
                if (diff > 0) { deficits.push({slot:i, need:diff}); movesNeeded += diff; }
                else if (diff < 0) surpluses.push({slot:i, extra:-diff});
            }

            const violationsEstimate = (res.suggestions || []).filter(s=>s.cost && s.cost>0).length;

            // Now clear header (after snapshot check) and render banner
            header.innerHTML = '';
            // Banner
            const banner = document.createElement('div'); banner.style.padding='8px'; banner.style.border='1px solid #fde047'; banner.style.borderRadius='6px'; banner.style.marginBottom='8px';
            banner.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <div style="font-weight:600; color:#92400e;">⚠️ Distribuzione non rispettata — Mancano <strong>${movesNeeded}</strong> assegnazioni</div>
                <div style="font-size:12px; color:#92400e;">Violazioni possibili stimate: <strong>${violationsEstimate}</strong></div>
            </div>`;
            header.appendChild(banner);

            // Controls: Force checkbox and Apply all
            const controls = document.createElement('div'); controls.style.display='flex'; controls.style.gap='8px'; controls.style.justifyContent='flex-end'; controls.style.marginBottom='8px';
            const forceWrap = document.createElement('label'); forceWrap.style.display='flex'; forceWrap.style.alignItems='center';
            const forceCheckbox = document.createElement('input'); forceCheckbox.type='checkbox'; forceCheckbox.style.marginRight='6px';
            const forceLabel = document.createElement('span'); forceLabel.textContent='Forza (override riposo)'; forceLabel.style.fontSize='12px';
            forceWrap.appendChild(forceCheckbox); forceWrap.appendChild(forceLabel);

            const showCandidatesBtn = document.createElement('button'); showCandidatesBtn.className='btn'; showCandidatesBtn.textContent='Mostra candidati'; showCandidatesBtn.dataset.action = 'showCandidates'; // for delegated handling
            const applyAllBtn = document.createElement('button'); applyAllBtn.className='btn btn-primary'; applyAllBtn.textContent='Applica tutto'; applyAllBtn.disabled = true;
            controls.appendChild(showCandidatesBtn); controls.appendChild(forceWrap); controls.appendChild(applyAllBtn);
            header.appendChild(controls);

            // container for candidates (manual, no automatic loops)
            const candidatesContainer = document.createElement('div'); candidatesContainer.style.marginTop='8px'; candidatesContainer.style.padding='8px'; candidatesContainer.style.border='1px dashed #e2e8f0'; candidatesContainer.style.borderRadius='6px'; candidatesContainer.style.display='none';
            header.appendChild(candidatesContainer);

            // define a local handler function so we can call it both from the button and from delegated click
            const doShowCandidates = () => {
                // Do NOT trigger loops or auto-apply; purely compute and display candidates based on current snapshot
                const chosen = chosenAssigned;
                const dist = distribution;
                const deficitsLocal = [];
                for (let i=0;i<dist.length;i++) {
                    const delta = (dist[i]||0) - (chosen[i]||0);
                    if (delta > 0) deficitsLocal.push({slot:i, need:delta});
                }
                console.info('[INFO][Distribuzione] Mostra candidati invoked; deficitsLocal=', JSON.stringify(deficitsLocal), 'chosenAssigned=', JSON.stringify(chosen), 'distribution=', JSON.stringify(dist));
                const candidates = this.computeCandidates(SM.STATE, chosen, deficitsLocal);
                candidatesContainer.innerHTML = '';
                if (!candidates || candidates.length===0) {
                    console.info('[INFO][Distribuzione] computeCandidates returned empty for deficitsLocal=', JSON.stringify(deficitsLocal));
                    candidatesContainer.textContent = 'Nessun candidato disponibile per colmare i deficit.';
                } else {
                    candidates.forEach(cg => {
                        const block = document.createElement('div'); block.style.marginBottom='6px';
                        const h = document.createElement('div'); h.style.fontWeight='600'; h.textContent = `Per T${cg.to+1} (necessarie ${cg.need}):`;
                        block.appendChild(h);
                        const list = document.createElement('div'); list.style.marginLeft='8px';
                        cg.donors.forEach(d => {
                            const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.gap='12px'; row.style.alignItems='center';
                            // Determine human-friendly labels
                            const fromLabel = (typeof SM.getTimeFromSlotId === 'function') ? (SM.getTimeFromSlotId(`T${d.from+1}`) || `T${d.from+1}`) : `T${d.from+1}`;
                            const lastWeekLabel = d.lastWeekShift || fromLabel;
                            const toLabel = (typeof SM.getTimeFromSlotId === 'function') ? (SM.getTimeFromSlotId(`T${cg.to+1}`) || `T${cg.to+1}`) : `T${cg.to+1}`;

                            row.innerHTML = `<div style="flex:1"><strong>${d.empName}</strong></div><div style="font-size:12px;color:#475569">Scorsa settimana: <strong>${lastWeekLabel}</strong></div><div style="font-size:12px;color:#0f766e">Proposto: <strong>${toLabel}</strong></div>`;
                            // Add apply button for each candidate
                            const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px';
                            const applyBtn = document.createElement('button'); applyBtn.className='btn-sm btn-primary'; applyBtn.textContent='Applica';
                            applyBtn.onclick = () => {
                                console.info('[INFO][Distribuzione] apply candidate clicked', {empId: d.empId, empName: d.empName, from: d.from, to: cg.to, force: !!forceCheckbox.checked});
                                if (!forceCheckbox.checked) {
                                    if (!confirm('Applichi questo candidato? Potrebbe violare riposi se non compatibile. Confermi?')) return;
                                }
                                applyBtn.disabled = true;
                                const ok = Distribuzione.applySuggestion({ empId: d.empId, from: d.from, to: cg.to }, { force: forceCheckbox.checked });
                                console.info('[INFO][Distribuzione] apply candidate result=', ok, 'candidate=', d.empName);
                                if (ok) {
                                    try { SM._lastAssignedCounts = computeAssignedLocal(); } catch(e) {}
                                    const r2 = this.computeRebalanceSuggestions(SM.STATE);
                                    r2.assigned = (SM && SM._lastAssignedCounts) ? SM._lastAssignedCounts : this.getLiveAssignedCounts(SM.STATE);
                                    render(r2);
                                } else {
                                    applyBtn.disabled = false; alert('Applica candidato fallito');
                                }
                            };
                            actions.appendChild(applyBtn);
                            row.appendChild(actions);
                            list.appendChild(row);
                        });
                        block.appendChild(list);
                        candidatesContainer.appendChild(block);
                    });
                }
                candidatesContainer.style.display = 'block';
            };
            showCandidatesBtn.onclick = doShowCandidates;
            // Delegated handler: ensure clicks are handled even if button instance changes
            try {
                if (!modal._hasDelegatedShowCandidates) {
                    modal.addEventListener('click', (ev) => {
                        try {
                            const b = ev.target.closest && ev.target.closest('button[data-action]');
                            if (!b) return;
                            if (b.dataset.action === 'showCandidates') {
                                console.debug('[DEBUG][Distribuzione] delegated showCandidates click');
                                doShowCandidates();
                            }
                        } catch (e) { console.debug('[DEBUG][Distribuzione] delegated handler error', e); }
                    });
                    modal._hasDelegatedShowCandidates = true;
                }
            } catch(e) { console.debug('[DEBUG][Distribuzione] failed to attach delegated handler', e); }

            // Helper to update applyAll enabled state
            const updateApplyAllState = () => {
                const anySuggestions = res.suggestions && res.suggestions.length>0;
                const allOk = anySuggestions && res.suggestions.every(s=>s.cost===0);
                applyAllBtn.disabled = !(anySuggestions && (allOk || forceCheckbox.checked));
            };
            forceCheckbox.onchange = updateApplyAllState;
            updateApplyAllState();

            // Predictions area (before the list)
            const pred = document.createElement('div'); pred.style.fontSize='12px'; pred.style.color='#334155'; pred.style.marginBottom='8px';
            pred.innerHTML = `<div>Assegnati attuali: <strong>${chosenAssigned.join('-')}</strong> | Richiesta: <strong>${distribution.join('-')}</strong></div>`;
            header.appendChild(pred);

            // If we don't have any assigned counts yet, show a waiting message and disable actions; polling will update when engine reports counts
            const sumChosen = (chosenAssigned || []).reduce((s,n)=>s+n,0);
            if (res.waitingForEngine || res.waitingForSave || sumChosen === 0) {
                const waitDiv = document.createElement('div');
                waitDiv.style.padding='8px';
                waitDiv.style.background='#fff8e1';
                waitDiv.style.border='1px solid #fde047';
                waitDiv.style.borderRadius='6px';
                waitDiv.style.marginBottom='8px';
                if (res.waitingForSave && sumChosen > 0) {
                    waitDiv.textContent = 'Salvataggio del motore ancora in corso: i conteggi potrebbero non essere aggiornati. La finestra si aggiornerà automaticamente quando il salvataggio sarà completato.';
                    // allow candidate view, but prevent bulk apply until save completes (unless forced)
                    showCandidatesBtn.disabled = false;
                    applyAllBtn.disabled = true;
                } else {
                    waitDiv.textContent = 'Attendi i conteggi dal motore di generazione. La finestra si aggiornerà automaticamente quando saranno disponibili.';
                    showCandidatesBtn.disabled = true;
                    applyAllBtn.disabled = true;
                }
                header.appendChild(waitDiv);
                list.innerHTML = '<div>Nessun suggerimento — in attesa dei conteggi del motore.</div>';
            } else {
                list.innerHTML = '';
            }

            if (!res.suggestions || res.suggestions.length===0) {
                const info = document.createElement('div'); info.textContent = 'Nessun suggerimento necessario o non disponibile.'; list.appendChild(info);
            } else {
                res.suggestions.forEach((s, idx) => {
                    const item = document.createElement('div'); item.className = 'suggestion-item'; item.style.borderBottom='1px solid #e6e6e6'; item.style.padding='8px 0';
                    const left = document.createElement('div'); left.style.display='flex'; left.style.justifyContent='space-between';
                    left.innerHTML = `<div><strong>${s.empName}</strong> T${s.from+1} → T${s.to+1} ${s.cost===0?'<span style="color:green;">(OK)</span>':'<span style="color:#b91c1c;">(violazione possibile)</span>'}</div>`;

                    const btns = document.createElement('div'); btns.style.display='flex'; btns.style.gap='6px';
                    const btnPreview = document.createElement('button'); btnPreview.className='btn-sm'; btnPreview.textContent='Anteprima';
                    const btnApply = document.createElement('button'); btnApply.className='btn-sm btn-primary'; btnApply.textContent='Applica';
                    const btnIgnore = document.createElement('button'); btnIgnore.className='btn-sm'; btnIgnore.textContent='Ignora';

                    btns.appendChild(btnPreview); btns.appendChild(btnApply); btns.appendChild(btnIgnore);
                    left.appendChild(btns);
                    item.appendChild(left);

                    // preview area
                    const previewArea = document.createElement('div'); previewArea.style.marginTop='6px'; previewArea.style.fontSize='12px'; previewArea.style.color='#475569'; previewArea.style.display='none';
                    if (s.previewNewSchedule) {
                        previewArea.textContent = s.previewNewSchedule.join(' | ');
                    } else {
                        // try to compute a preview schedule
                        try { const emp = (SM.STATE && SM.STATE.employees) ? SM.STATE.employees.find(e=>e.id===s.empId) : null; if (emp && typeof SM.generateEmployeeSchedule === 'function') { const sch = SM.generateEmployeeSchedule(emp, s.to, s.to); previewArea.textContent = sch.shifts.join(' | '); } } catch(e) {}
                    }
                    item.appendChild(previewArea);

                    btnPreview.onclick = () => { previewArea.style.display = (previewArea.style.display==='none') ? 'block' : 'none'; };

                    btnApply.onclick = () => {
                        const force = !!forceCheckbox.checked;
                        if (!force && s.cost>0) {
                            if (!confirm('Questa mossa potrebbe violare il riposo minimo. Confermi?')) return;
                        }
                        btnApply.disabled = true;
                        const ok = Distribuzione.applySuggestion(s, { force });
                        if (ok) {
                            // refresh local assigned snapshot immediately
                            try { SM._lastAssignedCounts = computeAssignedLocal(); } catch(e) {}
                            const r2 = this.computeRebalanceSuggestions(SM.STATE);
                            r2.assigned = (SM && SM._lastAssignedCounts) ? SM._lastAssignedCounts : this.getLiveAssignedCounts(SM.STATE);
                            render(r2);
                        } else {
                            btnApply.disabled = false;
                            alert('Applica suggerimento fallito');
                        }
                    };

                    btnIgnore.onclick = () => {
                        // Try to replace this suggestion with another candidate for the same target slot instead of simply removing it
                        try {
                            const targetSlot = s.to;
                            modal._ignoredPerSlot = modal._ignoredPerSlot || {};
                            modal._ignoredPerSlot[targetSlot] = modal._ignoredPerSlot[targetSlot] || new Set();
                            modal._ignoredPerSlot[targetSlot].add(String(s.empId));

                            console.info('[INFO][Distribuzione] Ignore suggestion for', s.empName, '-> trying alternative candidates for T'+(targetSlot+1));

                            // chosen snapshot
                            const chosen = (lastAssigned && Array.isArray(lastAssigned) && lastAssigned.reduce((a,b)=>a+b,0)>0) ? lastAssigned : ((computedAssigned && computedAssigned.reduce((a,b)=>a+b,0)>0)? computedAssigned : live);
                            const deficitsLocal = [{slot: targetSlot, need: 1}];
                            const candidatesForSlot = this.computeCandidates(SM.STATE, chosen, deficitsLocal).find(c=>c && c.to===targetSlot);
                            const donors = candidatesForSlot ? candidatesForSlot.donors : [];

                            // Exclude already used employees in suggestions for same slot and the ignored set
                            const usedEmpIds = new Set((res.suggestions||[]).filter(x=>x.to===targetSlot).map(x=>String(x.empId)));
                            let nextDonor = null;
                            for (let d of donors) {
                                const idStr = String(d.empId);
                                if (modal._ignoredPerSlot[targetSlot].has(idStr)) continue;
                                if (usedEmpIds.has(idStr)) continue;
                                nextDonor = d; break;
                            }

                            if (!nextDonor) {
                                // No alternative available
                                console.info('[INFO][Distribuzione] No alternative donor found for T'+(targetSlot+1)+'; removing suggestion');
                                res.suggestions.splice(idx,1);
                                render(res);
                                alert('Nessun altro candidato disponibile per questo slot.');
                                return;
                            }

                            // Build new suggestion from donor
                            const emp = (SM.STATE && SM.STATE.employees) ? SM.STATE.employees.find(e => String(e.id) === String(nextDonor.empId)) : null;
                            let preview = null; let cost = 1;
                            if (emp) {
                                try {
                                    const test = (typeof SM.generateEmployeeSchedule === 'function') ? SM.generateEmployeeSchedule(emp, targetSlot, targetSlot) : null;
                                    if (test) {
                                        preview = test.shifts; 
                                        try {
                                            const ok = (SM.scheduleRespectsMinRest) ? SM.scheduleRespectsMinRest(test.shifts, 11*60, emp.lastShift) : true;
                                            cost = ok ? 0 : 1;
                                        } catch(e) { cost = 1; }
                                    }
                                } catch(e) { console.info('[INFO][Distribuzione] generateEmployeeSchedule failed for candidate', emp.name, e); }
                            }

                            const newSuggestion = { empId: nextDonor.empId, empName: nextDonor.empName, from: nextDonor.from, to: targetSlot, cost, previewNewSchedule: preview };
                            res.suggestions[idx] = newSuggestion;
                            console.info('[INFO][Distribuzione] Replaced suggestion with candidate', newSuggestion.empName, 'for T'+(targetSlot+1));
                            render(res);
                        } catch (err) {
                            console.error('[ERROR][Distribuzione] ignore replace failed', err);
                            try { res.suggestions.splice(idx,1); render(res); } catch(e) {}
                        }
                    };

                    list.appendChild(item);
                });
            }

            // Apply all behavior
            applyAllBtn.onclick = () => {
                const toApply = (res.suggestions || []).filter(s => (s.cost===0) || forceCheckbox.checked);
                if (!toApply || toApply.length===0) { alert('Nessuna mossa applicabile con le impostazioni correnti'); return; }
                // build predicted assigned counts if applied
                const predicted = chosenAssigned.slice();
                toApply.forEach(s => { predicted[s.from] = (predicted[s.from]||0) - 1; predicted[s.to] = (predicted[s.to]||0) + 1; });
                const predictedViolations = toApply.filter(s=>s.cost>0).length;
                const ok = confirm(`Applichi ${toApply.length} mosse (violazioni previste: ${predictedViolations})?\nAssegnati previsti: ${predicted.join('-')}`);
                if (!ok) return;
                applyAllBtn.disabled = true; forceCheckbox.disabled = true;
                let applied = 0;
                toApply.forEach(s => {
                    try { const resOk = Distribuzione.applySuggestion(s, { force: forceCheckbox.checked }); if (resOk) applied++; } catch(e) {}
                });
                // update snapshot
                try { SM._lastAssignedCounts = computeAssignedLocal(); } catch(e) {}
                const r2 = this.computeRebalanceSuggestions(SM.STATE);
                r2.assigned = (SM && SM._lastAssignedCounts) ? SM._lastAssignedCounts : this.getLiveAssignedCounts(SM.STATE);
                applyAllBtn.disabled = false; forceCheckbox.disabled = false;
                render(r2);
            };

            // Show modal and start polling for engine-assigned counts (to update header if engine reports later)
            modal.classList.add('active'); modal.style.display='block';
            // clear previous poll if any
            try { if (modal._pollId) { clearInterval(modal._pollId); delete modal._pollId; delete modal._lastAssignedSnapshot; } } catch(e){}

            // Expose quick debug helper to console: Distribuzione.debugCandidates()
            try {
                window.Distribuzione = window.Distribuzione || {};
                window.Distribuzione.debugCandidates = () => {
                    try {
                        const chosen = (lastAssigned && Array.isArray(lastAssigned) && lastAssigned.reduce((s,n)=>s+n,0)>0) ? lastAssigned : ((computedAssigned && computedAssigned.reduce((s,n)=>s+n,0)>0) ? computedAssigned : live);
                        const dist = (SM.STATE && SM.STATE.distributionPerShift) ? SM.STATE.distributionPerShift : [];
                        const deficitsLocal = [];
                        for (let i=0;i<dist.length;i++) { const delta = (dist[i]||0) - (chosen[i]||0); if (delta>0) deficitsLocal.push({slot:i, need:delta}); }
                        console.debug('[DEBUG][Distribuzione.debugCandidates] chosen=', chosen, 'dist=', dist, 'deficits=', deficitsLocal);
                        const res = Distribuzione.computeCandidates(SM.STATE, chosen, deficitsLocal);
                        console.debug('[DEBUG][Distribuzione.debugCandidates] candidates=', res);
                        return res;
                    } catch(e) { console.debug('[DEBUG][Distribuzione.debugCandidates] error', e); return null; }
                };
            } catch(e) { /* ignore */ }
            // attach a closer handler to clear poll
            try {
                const closeBtn = modal.querySelector('button[onclick*="distributionSuggestionsModal"]') || modal.querySelector('button[onclick*="distributionSuggestionsModal" i]') || modal.querySelector('button:contains("Chiudi")');
                if (closeBtn && !closeBtn._hasPollHandler) {
                    closeBtn.addEventListener('click', () => { try { if (modal._pollId) { clearInterval(modal._pollId); delete modal._pollId; } } catch(e){} });
                    closeBtn._hasPollHandler = true;
                }
            } catch(e){ /* ignore */ }

            modal._pollId = setInterval(() => {
                try {
                    const lastAssigned = (SM && SM._lastAssignedCounts) ? SM._lastAssignedCounts : null;
                            if (lastAssigned && JSON.stringify(lastAssigned) !== modal._lastAssignedSnapshot) {
                        modal._lastAssignedSnapshot = JSON.stringify(lastAssigned);
                        const newRes = this.computeRebalanceSuggestions(SM.STATE, lastAssigned);
                        newRes.assigned = lastAssigned;
                        // If modal was opened while waiting for save, clear that flag once engine published counts
                        newRes.waitingForSave = false;
                        render(newRes);
                    }
                } catch (e) { console.debug('[DEBUG][Distribuzione] poll error', e); }
            }, 500);
            // Expose a force-open helper so you can open modal bypassing any save-related checks
            try {
                window.Distribuzione = window.Distribuzione || {};
                window.Distribuzione.forceOpen = () => {
                    try {
                        const modal = document.getElementById('distributionSuggestionsModal');
                        if (!modal) { console.warn('[WARN][Distribuzione.forceOpen] modal not found'); return; }
                        // show minimal waiting UI and ensure polling is active
                        modal.querySelector('.suggestions-header').innerHTML = '<div style="padding:8px;border:1px solid #fde047;border-radius:6px;background:#fff8e1;">Modal aperta forzatamente. Attendi conteggi motore o usa <strong>Mostra candidati</strong>.</div>';
                        modal.querySelector('.suggestions-list').innerHTML = '<div>In attesa...</div>';
                        modal.classList.add('active'); modal.style.display = 'block';
                        // trigger a poll render immediately
                        try { const lastAssigned = (SM && SM._lastAssignedCounts) ? SM._lastAssignedCounts : null; const res = this.computeRebalanceSuggestions(SM.STATE, lastAssigned); if (lastAssigned) res.assigned = lastAssigned; render(res); } catch(e){ console.debug('[DEBUG][Distribuzione.forceOpen] immediate render failed', e); }
                    } catch (e) { console.error('[ERROR][Distribuzione.forceOpen] failed', e); }
                };
            } catch(e) { /* ignore */ }        };

        // Try computing suggestions; if assigned counts are all zero, retry a few times with small delay
        const tryCompute = (attemptsLeft) => {
            // precompute diagnostic assigned arrays (safe to call)
            const fromCompute = this.computeAssignedCounts(SM.STATE);
            const fromLive = this.getLiveAssignedCounts(SM.STATE);
            // Prefer lastAssignedCounts if engine produced them; fallback to live computed counts
            const lastAssigned = (SM && SM._lastAssignedCounts) ? SM._lastAssignedCounts : null;
            let res;
            if (lastAssigned && Array.isArray(lastAssigned) && lastAssigned.reduce((s,n)=>s+n,0) > 0) {
                res = this.computeRebalanceSuggestions(SM.STATE, lastAssigned);
                res.assigned = lastAssigned;
            } else {
                res = this.computeRebalanceSuggestions(SM.STATE);
                res.assigned = fromLive;
            }
            const sum = (res.assigned || []).reduce((s,n)=>s+n,0);
            // Diagnostic logging
            console.debug('[DEBUG][Distribuzione] tryCompute attempt=', 6 - attemptsLeft, 'employees=', (SM.STATE && SM.STATE.employees) ? SM.STATE.employees.length : 0, 'weeklySnapshots=', (SM.STATE && SM.STATE.weeklySchedules) ? Object.keys(SM.STATE.weeklySchedules).length : 0);
            console.debug('[DEBUG][Distribuzione] assigned(from computeAssignedCounts)=', JSON.stringify(fromCompute), 'assigned(fromLive)=', JSON.stringify(fromLive), 'distribution=', JSON.stringify((SM.STATE && SM.STATE.distributionPerShift) ? SM.STATE.distributionPerShift : []));
            // Print small sample of employees schedules for debugging
            try {
                const sample = (SM.STATE && SM.STATE.employees) ? SM.STATE.employees.slice(0,5).map(e => ({id: e.id, name: e.name, hasSchedule: Array.isArray(e.schedule), scheduleSample: Array.isArray(e.schedule)? e.schedule.slice(0,4): e.schedule })) : [];
                console.debug('[DEBUG][Distribuzione] employee sample=', JSON.stringify(sample));
                const weeks = (SM.STATE && SM.STATE.weeklySchedules) ? Object.keys(SM.STATE.weeklySchedules).slice(0,3).map(k => ({week:k, count: Object.keys(SM.STATE.weeklySchedules[k]).length})) : [];
                console.debug('[DEBUG][Distribuzione] weeklySchedules summary=', JSON.stringify(weeks));
            } catch (e) { console.debug('[DEBUG][Distribuzione] sample logging failed', e); }
            if (sum === 0) {
                console.debug('[DEBUG][Distribuzione] assignedCounts zero, rendering placeholder and waiting for engine counts; no retry loop');
                res.waitingForEngine = true;
                // propagate waitingForSave state so UI shows an appropriate banner if needed
                if (waitingForSave) res.waitingForSave = true;
                render(res);
                return;
            }
            // propagate waitingForSave state to render so the banner is shown if needed
            if (waitingForSave) res.waitingForSave = true;
            render(res);
        };

        tryCompute(5);
    };

    window.Distribuzione = Distribuzione;
    if (window.ShiftManager) window.ShiftManager.Distribuzione = Distribuzione;
})();
