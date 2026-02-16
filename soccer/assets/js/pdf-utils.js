(function(){
    // Utility per footer PDF condiviso
    window.PDFUtils = window.PDFUtils || {};

    window.PDFUtils.addStandardFooter = function(doc, options) {
        try {
            const pageCount = doc.internal.getNumberOfPages();
            const footerFontSize = 8;
            const footerColor = [85, 85, 85]; // #555555

            // Option to hide branding (default = visible)
            const showBranding = !(options && options.showBranding === false);

            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                const pageWidth = doc.internal.pageSize.width;
                const pageHeight = doc.internal.pageSize.height;

                // Separator line
                const lineY = pageHeight - 22;
                doc.setDrawColor(...footerColor);
                doc.setLineWidth(0.3);
                doc.line(14, lineY, pageWidth - 14, lineY);

                // Contacts row
                const contactsY = lineY + 6;
                doc.setFontSize(footerFontSize);
                doc.setTextColor(...footerColor);
                doc.setFont('helvetica', 'normal');

                if (showBranding) {
                    const leftText = 'Creato da www.ldm4app.com';
                    doc.text(leftText, 14, contactsY, { baseline: 'alphabetic' });

                    try {
                        const leftTextWidth = doc.getTextWidth(leftText);
                        doc.link(14, contactsY - footerFontSize / 2, leftTextWidth, footerFontSize + 2, { url: 'https://www.ldm4app.com' });
                    } catch (e) {
                        // ignore linking errors
                    }
                }

                const showSupport = !(options && options.showSupport === false);
                if (showSupport) {
                    const rightText = 'Supporto: ldm4app.com';
                    doc.text(rightText, pageWidth - 14, contactsY, { align: 'right', baseline: 'alphabetic' });
                    try {
                        const rightTextWidth = doc.getTextWidth(rightText);
                        doc.link(pageWidth - 14 - rightTextWidth, contactsY - footerFontSize / 2, rightTextWidth, footerFontSize + 2, { url: 'https://www.ldm4app.com' });
                    } catch (e) {
                        // ignore linking errors
                    }
                }

                // Page meta above the separator
                const metaY = lineY - 6;
                doc.setFontSize(8);
                doc.setTextColor(...footerColor);
                doc.text(`Pagina ${i} di ${pageCount}`, pageWidth / 2, metaY, { align: 'center' });
                doc.text(`Generato il ${new Date().toLocaleString('it-IT')}`, 14, metaY);
            }
        } catch (err) {
            console.warn('PDFUtils.addStandardFooter failed', err);
        }
    };
})();
