// PDF Generator usando jsPDF
window.pdfGenerator = {
    generateClassifica: function (torneoNome, classifica) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('Classifica', 105, 15, { align: 'center' });
        doc.setFontSize(14);
        doc.text(torneoNome, 105, 23, { align: 'center' });

        // Table header
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(102, 126, 234);
        doc.rect(10, 40, 190, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Pos', 15, 46);
        doc.text('Squadra', 30, 46);
        doc.text('Pt', 120, 46);
        doc.text('G', 135, 46);
        doc.text('V', 145, 46);
        doc.text('N', 155, 46);
        doc.text('P', 165, 46);
        doc.text('GF', 175, 46);
        doc.text('GS', 185, 46);
        doc.text('DR', 195, 46);

        // Table rows
        doc.setTextColor(0, 0, 0);
        let y = 56;
        classifica.forEach((squadra, index) => {
            if (index % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(10, y - 5, 190, 8, 'F');
            }
            doc.text((index + 1).toString(), 15, y);
            doc.text(squadra.nome, 30, y);
            doc.text(squadra.punti.toString(), 120, y);
            doc.text(squadra.partiteGiocate.toString(), 135, y);
            doc.text(squadra.vittorie.toString(), 145, y);
            doc.text(squadra.pareggi.toString(), 155, y);
            doc.text(squadra.sconfitte.toString(), 165, y);
            doc.text(squadra.golFatti.toString(), 175, y);
            doc.text(squadra.golSubiti.toString(), 185, y);
            doc.text(squadra.differenzaReti.toString(), 195, y);
            y += 8;
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('Creato da www.ldm4app.com', 105, 285, { align: 'center' });

        // Return as base64
        return doc.output('datauristring').split(',')[1];
    },

    generateRisultati: function (torneoNome, giornate) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('Risultati', 105, 15, { align: 'center' });
        doc.setFontSize(14);
        doc.text(torneoNome, 105, 23, { align: 'center' });

        let y = 45;
        doc.setTextColor(0, 0, 0);

        giornate.forEach((giornata) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            // Giornata header
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`Giornata ${giornata.numero}`, 15, y);
            y += 8;

            // Partite
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            giornata.partite.forEach((partita) => {
                const risultato = partita.isGiocata
                    ? `${partita.golCasa} - ${partita.golTrasferta}`
                    : 'Da giocare';
                const testo = `${partita.squadraCasa} vs ${partita.squadraTrasferta}: ${risultato}`;
                doc.text(testo, 20, y);
                y += 6;
            });
            y += 5;
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text('Creato da www.ldm4app.com', 105, 285, { align: 'center' });
        }

        return doc.output('datauristring').split(',')[1];
    },

    generatePlayoff: function (torneoNome, playoff) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');

        // Header
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, 297, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('Tabellone Playoff', 148.5, 15, { align: 'center' });
        doc.setFontSize(14);
        doc.text(torneoNome, 148.5, 23, { align: 'center' });

        let y = 45;
        doc.setTextColor(0, 0, 0);

        playoff.turni.slice().reverse().forEach((turno) => {
            // Turno header
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setFillColor(102, 126, 234);
            doc.rect(10, y - 5, 277, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text(turno.nome, 15, y + 2);
            y += 15;

            // Partite
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            turno.partite.forEach((partita) => {
                doc.setDrawColor(102, 126, 234);
                doc.rect(15, y - 5, 120, 20);

                doc.text(partita.squadra1 || 'TBD', 20, y + 2);
                if (partita.isCompletata) {
                    const risultato = playoff.andataRitorno
                        ? `${partita.golAndata1}-${partita.golAndata2} / ${partita.golRitorno1}-${partita.golRitorno2}`
                        : `${partita.golAndata1} - ${partita.golAndata2}`;
                    doc.text(risultato, 75, y + 6, { align: 'center' });
                    if (partita.vincitrice) {
                        doc.setFont(undefined, 'bold');
                        doc.text(`🏆 ${partita.vincitrice}`, 20, y + 12);
                        doc.setFont(undefined, 'normal');
                    }
                }
                doc.text(partita.squadra2 || 'TBD', 20, y + 8);
                y += 25;
            });
            y += 5;
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('Creato da www.ldm4app.com', 148.5, 200, { align: 'center' });

        return doc.output('datauristring').split(',')[1];
    }
};
