(function(){
    'use strict';
    const SM = window.ShiftManager;

    function exportToExcel() {
        const STATE = SM.STATE;
        if (!STATE.employees.length) { alert('⚠️ Nessun dipendente da esportare!'); return; }

        let csv = '\uFEFF';
        const headers = ['ID', 'Nome', 'Reparto', 'Sottogruppo'];
        if (STATE.weekDates && STATE.weekDates.length > 0) {
            STATE.weekDates.forEach(d => headers.push(getFormattedDateForHeader(d)));
        } else { ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'].forEach(d => headers.push(d)); }
        headers.push('Ore Totali','N. Turni');
        csv += headers.join(';') + '\n';

        STATE.employees.forEach(emp => {
            const row = [ emp.code || '', emp.name || '', emp.department || '', emp.subgroup || '' ];
            if (emp.schedule && emp.schedule.length === 7) emp.schedule.forEach(shift => row.push(shift || '-')); else row.push(...Array(7).fill('-'));
            const stats = emp.stats || { totalHours: 0, shifts: 0 };
            row.push(stats.totalHours?.toFixed(1) || 0, stats.shifts || 0);
            csv += row.join(';') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `turni_${STATE.currentWeek || 'export'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        SM.showNotification('✅ Excel esportato!', 'success');
    }

    function formatShiftForPDF(shift) {
        if (!shift || shift === '-') return '-';
        let formatted = shift
            .replace('☕','')
            .replace('🏖️','')
            .replace('📋','')
            .replace('🩺','')
            .replace('📦','')
            .replace('🏢','')
            .trim();
        return formatted || shift;
    }

    // Helper: return full weekday name + short date (e.g. "Lunedì 9/2")
    function getFormattedDateForHeader(d) {
        // Prefer SM.formatDate if available, otherwise try global formatDate
        const formatted = (SM.formatDate ? SM.formatDate(d) : (typeof formatDate === 'function' ? formatDate(d) : null));
        if (formatted) {
            const name = formatted.fullDayName || formatted.dayName || '';
            const date = formatted.full || (formatted.dayNum ? `${formatted.dayNum}/${formatted.month}` : '');
            return `${name} ${date}`.trim();
        }
        // Fallback: compute from date string
        try {
            const dateObj = new Date(d);
            const fullDayNames = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
            const day = dateObj.getDate();
            const month = dateObj.getMonth() + 1;
            const dayName = fullDayNames[dateObj.getDay()] || '';
            return `${dayName} ${day}/${month}`;
        } catch (e) {
            return String(d);
        }
    }

    function exportToPDF() {
        const STATE = SM.STATE;
        if (!window.jspdf || typeof window.jspdf.jsPDF === 'undefined') { alert('⚠️ Libreria PDF non caricata. Usa Export Excel invece.'); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l','mm','a4');
        doc.setFontSize(14);
        doc.text(`Turni Settimana ${STATE.currentWeek || 'N/A'}`, 14, 15);

        const body = STATE.employees.map(emp => {
            const shifts = emp.schedule?.map(s => s || '-') || Array(7).fill('-');
            return [ emp.code || '', emp.name, emp.department || '-', emp.subgroup || '-', ...shifts, `${emp.stats?.totalHours?.toFixed(1) || 0}h` ];
        });

        const headers = ['Cod.','Nome','Reparto','Sottogr.'];
        if (STATE.weekDates && STATE.weekDates.length > 0) {
            STATE.weekDates.forEach(d => headers.push(getFormattedDateForHeader(d)));
        } else { ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'].forEach(d => headers.push(d)); }
        headers.push('Ore Tot');

        doc.autoTable({ head:[headers], body, startY:20, theme:'grid', styles:{ fontSize:7, cellPadding:2 }, headStyles:{ fillColor:[79,70,229], textColor:255, fontStyle:'bold' }, alternateRowStyles:{ fillColor:[230,230,230] }, columnStyles:{ 0:{cellWidth:18}, 1:{cellWidth:26, halign:'left'}, 2:{cellWidth:18, halign:'left', fontSize:6}, 3:{cellWidth:14, halign:'left', fontSize:6} } });
        doc.save(`turni_${STATE.currentWeek || 'export'}.pdf`);
    }

    function exportPDFWithTitle(customTitle) {
        const STATE = SM.STATE;
        if (!window.jspdf || typeof window.jspdf.jsPDF === 'undefined') { alert('⚠️ Libreria jsPDF non caricata. Ricarica la pagina.'); return; }
        if (!STATE.employees || STATE.employees.length === 0) { alert('⚠️ Nessun dipendente da esportare!'); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l','mm','a4');
        doc.setFontSize(16);
        doc.setFont('helvetica','bold');
        const title = customTitle || `Turni Settimana ${STATE.currentWeek || ''}`;
        doc.text(title, 148, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica','normal');
        if (STATE.weekDates && STATE.weekDates.length > 0) {
            const startDate = (SM.formatDate ? SM.formatDate(STATE.weekDates[0]) : {full:''});
            const endDate = (SM.formatDate ? SM.formatDate(STATE.weekDates[6]) : {full:''});
            doc.text(`Dal ${startDate.full} al ${endDate.full}`, 148, 22, { align: 'center' });
        }

        const body = STATE.employees.map(emp => {
            const row = [ emp.code || '', emp.name || '', emp.department || '-', emp.subgroup || '-' ];
            if (emp.schedule && emp.schedule.length === 7) emp.schedule.forEach(shift => row.push(formatShiftForPDF(shift) || '-')); else row.push(...Array(7).fill('-'));
            row.push(`${emp.stats?.totalHours?.toFixed(1) || 0}h`);
            return row;
        });

        const headers = ['Cod.','Nome','Reparto','Sottogr.'];
        if (STATE.weekDates && STATE.weekDates.length > 0) {
            STATE.weekDates.forEach(d => headers.push(getFormattedDateForHeader(d)));
        } else { ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'].forEach(d => headers.push(d)); }
        headers.push('Ore Tot');

        doc.autoTable({ head:[headers], body, startY:28, theme:'grid', styles:{ fontSize:8, cellPadding:2 }, headStyles:{ fillColor:[79,70,229], textColor:255 } });
        doc.save(`turni_${STATE.currentWeek || 'export'}.pdf`);
    }

    // Helper: build CSV string (return string + filename)
    function buildCSVString() {
        const STATE = SM.STATE;
        let csv = '\uFEFF';
        const headers = ['ID', 'Nome', 'Reparto', 'Sottogruppo'];
        if (STATE.weekDates && STATE.weekDates.length > 0) {
            STATE.weekDates.forEach(d => headers.push(getFormattedDateForHeader(d)));
        } else { ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'].forEach(d => headers.push(d)); }
        headers.push('Ore Totali','N. Turni');
        csv += headers.join(';') + '\n';

        STATE.employees.forEach(emp => {
            const row = [ emp.code || '', emp.name || '', emp.department || '', emp.subgroup || '' ];
            if (emp.schedule && emp.schedule.length === 7) emp.schedule.forEach(shift => row.push(shift || '-')); else row.push(...Array(7).fill('-'));
            const stats = emp.stats || { totalHours: 0, shifts: 0 };
            row.push(stats.totalHours?.toFixed(1) || 0, stats.shifts || 0);
            csv += row.join(';') + '\n';
        });

        const filename = `turni_${SM.STATE.currentWeek || 'export'}.csv`;
        return { csv, filename };
    }

    // Helper: build PDF Blob for current state (returns a Promise<Blob>)
    function buildPDFBlob(customTitle) {
        return new Promise((resolve, reject) => {
            try {
                const STATE = SM.STATE;
                if (!window.jspdf || typeof window.jspdf.jsPDF === 'undefined') { return reject(new Error('Libreria jsPDF non caricata.')); }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('l','mm','a4');
                doc.setFontSize(16);
                doc.setFont('helvetica','bold');
                const title = customTitle || `Turni Settimana ${STATE.currentWeek || ''}`;
                doc.text(title, 148, 15, { align: 'center' });
                doc.setFontSize(10);
                doc.setFont('helvetica','normal');
                if (STATE.weekDates && STATE.weekDates.length > 0) {
                    const startDate = (SM.formatDate ? SM.formatDate(STATE.weekDates[0]) : {full:''});
                    const endDate = (SM.formatDate ? SM.formatDate(STATE.weekDates[6]) : {full:''});
                    doc.text(`Dal ${startDate.full} al ${endDate.full}`, 148, 22, { align: 'center' });
                }

                const body = STATE.employees.map(emp => {
                    const row = [ emp.code || '', emp.name || '', emp.department || '-', emp.subgroup || '-' ];
                    if (emp.schedule && emp.schedule.length === 7) emp.schedule.forEach(shift => row.push(formatShiftForPDF(shift) || '-')); else row.push(...Array(7).fill('-'));
                    row.push(`${emp.stats?.totalHours?.toFixed(1) || 0}h`);
                    return row;
                });

                const headers = ['Cod.','Nome','Reparto','Sottogr.'];
                if (STATE.weekDates && STATE.weekDates.length > 0) {
                    STATE.weekDates.forEach(d => headers.push(getFormattedDateForHeader(d)));
                } else { ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'].forEach(d => headers.push(d)); }
                headers.push('Ore Tot');

                doc.autoTable({ head:[headers], body, startY:28, theme:'grid', styles:{ fontSize:8, cellPadding:2 }, headStyles:{ fillColor:[79,70,229], textColor:255 } });

                // Output as arraybuffer and convert to blob
                try {
                    const arrayBuf = doc.output('arraybuffer');
                    const blob = new Blob([arrayBuf], { type: 'application/pdf' });
                    resolve(blob);
                } catch (e) {
                    // Fallback: use doc.output('datauristring') to get base64
                    try {
                        const uri = doc.output('datauristring');
                        const base64 = uri.split(',')[1];
                        const binary = atob(base64);
                        const len = binary.length;
                        const buffer = new Uint8Array(len);
                        for (let i = 0; i < len; i++) buffer[i] = binary.charCodeAt(i);
                        const blob = new Blob([buffer], { type: 'application/pdf' });
                        resolve(blob);
                    } catch (ex) { reject(ex); }
                }
            } catch (ex) { reject(ex); }
        });
    }

    // Helpers for building from arbitrary data (e.g. backups)
    function buildCSVStringFromData(data) {
        const state = (data && data.state) ? data.state : (SM.STATE || {});
        let csv = '\uFEFF';
        const headers = ['ID', 'Nome', 'Reparto', 'Sottogruppo'];
        if (state.weekDates && state.weekDates.length > 0) {
            state.weekDates.forEach(d => headers.push(getFormattedDateForHeader(d)));
        } else { ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'].forEach(d => headers.push(d)); }
        headers.push('Ore Totali','N. Turni');
        csv += headers.join(';') + '\n';

        const employees = state.employees || [];
        employees.forEach(emp => {
            const row = [ emp.code || '', emp.name || '', emp.department || '', emp.subgroup || '' ];
            if (emp.schedule && emp.schedule.length === 7) emp.schedule.forEach(shift => row.push(shift || '-')); else row.push(...Array(7).fill('-'));
            const stats = emp.stats || { totalHours: 0, shifts: 0 };
            row.push(stats.totalHours?.toFixed(1) || 0, stats.shifts || 0);
            csv += row.join(';') + '\n';
        });

        const filename = `turni_${(state.currentWeek || 'export')}.csv`;
        return { csv, filename };
    }

    async function buildPDFBlobFromData(data, customTitle) {
        const state = (data && data.state) ? data.state : (SM.STATE || {});
        // reuse build logic but operate on provided 'state'
        return new Promise((resolve, reject) => {
            try {
                if (!window.jspdf || typeof window.jspdf.jsPDF === 'undefined') { return reject(new Error('Libreria jsPDF non caricata.')); }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('l','mm','a4');
                doc.setFontSize(16);
                doc.setFont('helvetica','bold');
                const title = customTitle || `Turni Settimana ${state.currentWeek || ''}`;
                doc.text(title, 148, 15, { align: 'center' });
                doc.setFontSize(10);
                doc.setFont('helvetica','normal');
                if (state.weekDates && state.weekDates.length > 0) {
                    const startDate = (SM.formatDate ? SM.formatDate(state.weekDates[0]) : {full:''});
                    const endDate = (SM.formatDate ? SM.formatDate(state.weekDates[6]) : {full:''});
                    doc.text(`Dal ${startDate.full} al ${endDate.full}`, 148, 22, { align: 'center' });
                }

                const body = (state.employees || []).map(emp => {
                    const row = [ emp.code || '', emp.name || '', emp.department || '-', emp.subgroup || '-' ];
                    if (emp.schedule && emp.schedule.length === 7) emp.schedule.forEach(shift => row.push(formatShiftForPDF(shift) || '-')); else row.push(...Array(7).fill('-'));
                    row.push(`${emp.stats?.totalHours?.toFixed(1) || 0}h`);
                    return row;
                });

                const headers = ['Cod.','Nome','Reparto','Sottogr.'];
                if (state.weekDates && state.weekDates.length > 0) {
                    state.weekDates.forEach(d => headers.push(getFormattedDateForHeader(d)));
                } else { ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'].forEach(d => headers.push(d)); }
                headers.push('Ore Tot');

                doc.autoTable({ head:[headers], body, startY:28, theme:'grid', styles:{ fontSize:8, cellPadding:2 }, headStyles:{ fillColor:[79,70,229], textColor:255 } });

                try {
                    const arrayBuf = doc.output('arraybuffer');
                    const blob = new Blob([arrayBuf], { type: 'application/pdf' });
                    resolve(blob);
                } catch (e) {
                    try {
                        const uri = doc.output('datauristring');
                        const base64 = uri.split(',')[1];
                        const binary = atob(base64);
                        const len = binary.length;
                        const buffer = new Uint8Array(len);
                        for (let i = 0; i < len; i++) buffer[i] = binary.charCodeAt(i);
                        const blob = new Blob([buffer], { type: 'application/pdf' });
                        resolve(blob);
                    } catch (ex) { reject(ex); }
                }
            } catch (ex) { reject(ex); }
        });
    }

    // Expose helpers
    SM.buildCSVString = buildCSVString;
    SM.buildPDFBlob = buildPDFBlob;
    SM.buildCSVStringFromData = buildCSVStringFromData;
    SM.buildPDFBlobFromData = buildPDFBlobFromData;

    SM.exportToExcel = exportToExcel;
    SM.exportToPDF = exportToPDF;
    SM.exportPDFWithTitle = exportPDFWithTitle;
    SM.formatShiftForPDF = formatShiftForPDF;

    window.exportToExcel = function(){ return SM.exportToExcel.apply(SM, arguments); };
    window.exportToPDF = function(){ return SM.exportToPDF.apply(SM, arguments); };
})();