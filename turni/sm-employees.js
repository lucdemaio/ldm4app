(function(){
    'use strict';
    const SM = window.ShiftManager;

    function addEmployee(data) {
        const contractType = parseFloat(data.contractType || data.contractHours || 40);
        const restDaysPerWeek = (contractType === 33.20 || contractType === 31.15) ? 2 : 1;

        const employee = {
            id: data.id || Date.now().toString(),
            code: data.code || '',
            name: data.name || '',
            department: data.department || 'Operativo',
            subgroup: data.subgroup || '',
            contractType: contractType,
            restDaysPerWeek: restDaysPerWeek,
            customStart: data.customStart,
            allowedDepartments: data.allowedDepartments,
            currentDepartmentIndex: data.currentDepartmentIndex || 0,
            schedule: [],
            stats: { totalHours: 0, shifts: 0 },
            absences: data.absences || [],
            lastShift: data.lastShift || null
        };

        SM.STATE.employees.push(employee);
        if (typeof SM.renderTable === 'function') SM.renderTable();
        SM.saveData();
        if (typeof SM.populateDepartmentSelect === 'function') SM.populateDepartmentSelect();
        return employee;
    }

    function removeEmployee(id) {
        SM.STATE.employees = SM.STATE.employees.filter(e => e.id !== id);
        if (typeof SM.renderTable === 'function') SM.renderTable();
        SM.saveData();
        if (typeof SM.populateDepartmentSelect === 'function') SM.populateDepartmentSelect();
    }

    function updateEmployee(id, data) {
        const index = SM.STATE.employees.findIndex(e => e.id === id);
        if (index !== -1) {
            SM.STATE.employees[index] = { ...SM.STATE.employees[index], ...data };
            if (typeof SM.renderTable === 'function') SM.renderTable();
            SM.saveData();
            if (typeof SM.populateDepartmentSelect === 'function') SM.populateDepartmentSelect();
        }
    }

    // ROTAZIONE REPARTI e gestione rotazioni
    function addDepartmentRotation(department, allowedSlots) {
        if (!department || !allowedSlots) return;
        SM.STATE.departmentRotations[department] = allowedSlots.split('-').map(s => s.trim());
        localStorage.setItem('departmentRotations', JSON.stringify(SM.STATE.departmentRotations));
        updateDepartmentRotationsList();
        populateDepartmentSelect();
    }

    function removeDepartmentRotation(department) {
        delete SM.STATE.departmentRotations[department];
        localStorage.setItem('departmentRotations', JSON.stringify(SM.STATE.departmentRotations));
        updateDepartmentRotationsList();
        populateDepartmentSelect();
    }

    function updateDepartmentRotationsList() {
        const list = document.getElementById('departmentRotationsList');
        if (!list) return;

        let html = '';
        const allDepartments = new Set();
        SM.STATE.employees.forEach(emp => {
            if (emp.department) allDepartments.add(emp.department);
            if (emp.subgroup) allDepartments.add(`${emp.department}|${emp.subgroup}`);
        });

        const totalDepts = allDepartments.size;
        const assignedDepts = Object.keys(SM.STATE.departmentRotations).length;

        if (totalDepts > 0) {
            const missingDepts = totalDepts - assignedDepts;
            if (missingDepts > 0) {
                html += `<div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin-bottom: 12px; font-size: 12px; color: #92400e;">
                    <strong>⚠️ Attenzione:</strong> ${missingDepts} reparto/i senza fasce assegnate su ${totalDepts} totali.<br>
                    <small>I dipendenti senza vincoli di reparto useranno la rotazione normale (T1-T2-T3).</small>
                </div>`;
            } else {
                html += `<div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 6px; padding: 12px; margin-bottom: 12px; font-size: 12px; color: #065f46;">
                    <strong>✓ Perfetto:</strong> Tutti i ${totalDepts} reparti/sottogruppi hanno fasce assegnate.
                </div>`;
            }
        }

        for (const dept in SM.STATE.departmentRotations) {
            const slotIds = SM.STATE.departmentRotations[dept];
            const slotsDisplay = slotIds.map(slotId => {
                const time = (SM.getTimeFromSlotId ? SM.getTimeFromSlotId(slotId) : null);
                return time ? `${slotId} (${time})` : slotId;
            }).join(', ');

            html += `<div class="rotation-item">
                <span><strong>${dept.replace('|', ' → ')}:</strong> ${slotsDisplay}</span>
                <button onclick="ShiftManager.removeDepartmentRotation('${dept}')" class="btn-remove-rotation">×</button>
            </div>`;
        }

        if (assignedDepts === 0 && totalDepts === 0) {
            html = '<p style="color: #94a3b8; font-size: 11px; text-align: center; padding: 20px;">Nessun reparto disponibile. Aggiungi prima dei dipendenti.</p>';
        } else if (assignedDepts === 0) {
            html += '<p style="color: #94a3b8; font-size: 11px; text-align: center; padding: 20px;">Nessuna rotazione configurata</p>';
        }

        list.innerHTML = html;
    }

    function populateDepartmentSelect() {
        const select = document.getElementById('rotationDepartment');
        if (!select) return;

        const departments = new Set();
        SM.STATE.employees.forEach(emp => {
            if (emp.department) departments.add(emp.department);
            if (emp.subgroup) departments.add(`${emp.department}|${emp.subgroup}`);
        });

        select.innerHTML = '<option value="">Seleziona Reparto o Sottogruppo</option>';
        Array.from(departments).sort().forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            const hasRotation = SM.STATE.departmentRotations[dept] !== undefined;
            const displayText = dept.replace('|', ' → ');
            if (hasRotation) option.textContent = `✓ ${displayText} (assegnato)`;
            else { option.textContent = `⚠️ ${displayText} (nessuna fascia)`; option.style.color = '#f59e0b'; }
            select.appendChild(option);
        });
    }

    function handleAddDepartmentRotation() {
        const departmentSelect = document.getElementById('rotationDepartment');
        const slotsInput = document.getElementById('rotationSlots');
        if (!departmentSelect || !slotsInput) { console.error('Elementi form rotazione non trovati'); return; }
        const department = departmentSelect.value.trim();
        const allowedSlots = slotsInput.value.trim().toUpperCase();
        if (!department) { alert('⚠️ Seleziona un reparto o sottogruppo'); return; }
        if (!allowedSlots) { alert('⚠️ Inserisci i turni ammessi (es: T1 o T1-T2 o T1-T2-T3)'); return; }
        const slotPattern = /^T\d+(-T\d+)*$/;
        if (!slotPattern.test(allowedSlots)) { alert('⚠️ Formato non valido. Usa: T1 o T1-T2 o T1-T2-T3'); return; }
        addDepartmentRotation(department, allowedSlots);
        slotsInput.value = '';
        updateDepartmentRotationsList();
        populateDepartmentSelect();
        SM.showNotification('✅ Rotazione reparto aggiunta', 'success');
    }

    // Esporta nel namespace
    SM.addEmployee = addEmployee;
    SM.removeEmployee = removeEmployee;
    SM.updateEmployee = updateEmployee;
    SM.addDepartmentRotation = addDepartmentRotation;
    SM.removeDepartmentRotation = removeDepartmentRotation;
    SM.updateDepartmentRotationsList = updateDepartmentRotationsList;
    SM.populateDepartmentSelect = populateDepartmentSelect;
    SM.handleAddDepartmentRotation = handleAddDepartmentRotation;

    // Compatibilità globale
    window.addEmployee = function(){ return SM.addEmployee.apply(SM, arguments); };
    window.removeEmployee = function(){ return SM.removeEmployee.apply(SM, arguments); };
    window.updateEmployee = function(){ return SM.updateEmployee.apply(SM, arguments); };
})();