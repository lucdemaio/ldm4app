/**
 * ExportManager - Gestisce export PDF, immagini social e condivisione
 */
class ExportManager {
  constructor() {
    this.brandUrl = 'www.ldm4app.com';
    this.brandText = 'creato da www.ldm4app.com';
  }

  /**
   * Genera PDF con footer branding e QR code
   */
  async exportToPDF(contentElement, fileName) {
    try {
      // Crea container temporaneo per il PDF
      const pdfContent = document.createElement('div');
      pdfContent.style.padding = '20px';
      pdfContent.style.backgroundColor = 'white';

      // Clona il contenuto
      const clonedContent = contentElement.cloneNode(true);
      pdfContent.appendChild(clonedContent);

      // Aggiungi footer con QR code
      const footer = document.createElement('div');
      footer.style.marginTop = '40px';
      footer.style.borderTop = '2px solid #e5e7eb';
      footer.style.paddingTop = '20px';
      footer.style.textAlign = 'center';
      footer.style.fontSize = '12px';

      // Contenitore QR
      const qrContainer = document.createElement('div');
      qrContainer.id = 'pdf-qr-temp';
      qrContainer.style.display = 'flex';
      qrContainer.style.justifyContent = 'center';
      qrContainer.style.marginBottom = '10px';

      footer.appendChild(qrContainer);
      footer.appendChild(document.createTextNode(this.brandText));

      pdfContent.appendChild(footer);
      document.body.appendChild(pdfContent);

      // Genera QR code
      new QRCode(document.getElementById('pdf-qr-temp'), {
        text: `https://${this.brandUrl}`,
        width: 100,
        height: 100,
        correctLevel: QRCode.CorrectLevel.H
      });

      // Attendi il rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Genera PDF
      const options = {
        margin: 10,
        filename: fileName || 'export.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      html2pdf().set(options).from(pdfContent).save();

      // Pulizia
      document.body.removeChild(pdfContent);
      Utils.showAlert('PDF generato con successo!', 'success');
    } catch (error) {
      console.error('Errore esportazione PDF:', error);
      Utils.showAlert('Errore durante l\'esportazione PDF', 'danger');
    }
  }

  /**
   * Esporta evento come PDF
   */
  exportEventPDF(eventId) {
    const event = eventsManager.getEventById(eventId);
    if (!event) {
      Utils.showAlert('Evento non trovato', 'danger');
      return;
    }

    const container = document.createElement('div');
    container.innerHTML = `
      <div style="padding: 20px;">
        <h1 style="color: #6366f1; margin-bottom: 20px;">${event.title}</h1>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #374151;">Dettagli Evento</h3>
          <p><strong>Data:</strong> ${event.date} ${event.time}</p>
          <p><strong>Luogo:</strong> ${event.location}</p>
          <p><strong>Categoria:</strong> ${event.category}</p>
          <p><strong>Visitatori Attesi:</strong> ${event.expectedVisitors || '-'}</p>
          <p><strong>Budget:</strong> €${parseFloat(event.budget || 0).toFixed(2)}</p>
        </div>

        <div style="background: white; padding: 20px; border-left: 4px solid #6366f1;">
          <h3 style="margin-top: 0; color: #1f2937;">Descrizione</h3>
          <p>${event.description || 'N/A'}</p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-radius: 8px;">
          <p style="margin: 0; color: #0369a1;"><strong>Stato:</strong> ${event.status || 'Attivo'}</p>
        </div>
      </div>
    `;

    this.exportToPDF(container, `evento-${event.title}.pdf`);
  }

  /**
   * Esporta lista volontari come PDF
   */
  exportVolunteersPDF() {
    const volunteers = volunteersManager.getAllVolunteers();

    const container = document.createElement('div');
    let volunteerRows = volunteers.map(v => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${v.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${v.email}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${v.phone}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${v.role}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${v.skills || '-'}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="padding: 20px;">
        <h1 style="color: #6366f1; margin-bottom: 20px;">Lista Volontari</h1>
        <p style="color: #6b7280; margin-bottom: 20px;">Totale: ${volunteers.length} volontari</p>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold;">Nome</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold;">Email</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold;">Telefono</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold;">Ruolo</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold;">Abilità</th>
            </tr>
          </thead>
          <tbody>
            ${volunteerRows}
          </tbody>
        </table>
      </div>
    `;

    this.exportToPDF(container, 'lista-volontari.pdf');
  }

  /**
   * Esporta budget come PDF
   */
  exportBudgetPDF() {
    const entries = budgetManager.getAllEntries();
    const stats = budgetManager.getStats();

    const container = document.createElement('div');
    let entryRows = entries.map(e => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${e.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; 
                       background: ${e.type === 'income' ? '#d1fae5' : '#fee2e2'}; 
                       color: ${e.type === 'income' ? '#065f46' : '#991b1b'};">
            ${e.type === 'income' ? 'Entrata' : 'Spesa'}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${e.category}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; text-align: right;">
          €${parseFloat(e.amount).toFixed(2)}
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="padding: 20px;">
        <h1 style="color: #6366f1; margin-bottom: 20px;">Riepilogo Budget</h1>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">ENTRATE TOTALI</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #065f46;">
              €${stats.totalIncome.toFixed(2)}
            </p>
          </div>
          <div style="background: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">SPESE TOTALI</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #991b1b;">
              €${stats.totalExpense.toFixed(2)}
            </p>
          </div>
          <div style="background: #ede9fe; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">NETTO</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: ${stats.balance >= 0 ? '#065f46' : '#991b1b'};">
              €${stats.balance.toFixed(2)}
            </p>
          </div>
        </div>

        <h3 style="color: #1f2937; margin: 30px 0 15px 0;">Dettagli Transazioni</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold;">Descrizione</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #d1d5db; font-weight: bold;">Tipo</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold;">Categoria</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #d1d5db; font-weight: bold;">Importo</th>
            </tr>
          </thead>
          <tbody>
            ${entryRows}
          </tbody>
        </table>
      </div>
    `;

    this.exportToPDF(container, 'budget-riepilogo.pdf');
  }

  /**
   * Esporta lista compiti come PDF
   */
  exportTasksPDF() {
    const tasks = tasksManager.getAllTasks();

    const container = document.createElement('div');
    let taskRows = tasks.map(t => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${t.title}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="padding: 3px 8px; border-radius: 4px; font-size: 11px; 
                       background: ${t.priority === 'high' ? '#fee2e2' : t.priority === 'low' ? '#dbeafe' : '#f3e8ff'}; 
                       color: ${t.priority === 'high' ? '#991b1b' : t.priority === 'low' ? '#075985' : '#6b0a9f'};">
            ${t.priority}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${t.dueDate}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;"><strong>${t.status || 'Attivo'}</strong></td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="padding: 20px;">
        <h1 style="color: #6366f1; margin-bottom: 20px;">Lista Compiti</h1>
        <p style="color: #6b7280; margin-bottom: 20px;">Totale: ${tasks.length} compiti</p>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold;">Titolo</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold;">Priorità</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold;">Scadenza</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #d1d5db; font-weight: bold;">Stato</th>
            </tr>
          </thead>
          <tbody>
            ${taskRows}
          </tbody>
        </table>
      </div>
    `;

    this.exportToPDF(container, 'compiti-lista.pdf');
  }

  /**
   * Genera immagine social per evento
   */
  async generateEventSocialImage(eventId) {
    const event = eventsManager.getEventById(eventId);
    if (!event) {
      Utils.showAlert('Evento non trovato', 'danger');
      return;
    }

    try {
      // Crea un elemento temporaneo con il QR code
      const qrContainer = document.createElement('div');
      qrContainer.id = 'temp-qr-social';
      qrContainer.style.position = 'absolute';
      qrContainer.style.left = '-9999px';
      qrContainer.style.backgroundColor = 'white';
      qrContainer.style.padding = '10px';
      qrContainer.style.width = '130px';
      qrContainer.style.height = '130px';
      document.body.appendChild(qrContainer);

      // Genera QR code
      new QRCode(qrContainer, {
        text: `https://www.ldm4app.com/evento/${event.id}`,
        width: 110,
        height: 110,
        correctLevel: QRCode.CorrectLevel.H
      });

      // Attendi che il QR sia generato
      await new Promise(resolve => setTimeout(resolve, 800));

      // Cattura il QR come immagine
      const qrCanvas = await html2canvas(qrContainer, { 
        backgroundColor: '#ffffff',
        scale: 2 
      });
      const qrImage = qrCanvas.toDataURL('image/png');

      // Ora genera il canvas social
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;

      const ctx = canvas.getContext('2d');

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#a78bfa');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // White content area
      ctx.fillStyle = 'white';
      ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);

      // Title
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.fillText(event.title.substring(0, 40), 80, 150);

      // Event details
      ctx.font = '24px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`📅 ${event.date} - ${event.time}`, 80, 220);
      ctx.fillText(`📍 ${event.location}`, 80, 280);
      ctx.fillText(`👥 Visitatori: ${event.expectedVisitors || '-'}`, 80, 340);
      ctx.fillText(`💰 Budget: €${parseFloat(event.budget || 0).toFixed(2)}`, 80, 400);

      // QR Code - Carica l'immagine generata
      const qrImg = new Image();
      qrImg.src = qrImage;
      qrImg.onload = () => {
        ctx.drawImage(qrImg, canvas.width - 180, canvas.height - 180, 130, 130);

        // Footer branding
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('creato da www.ldm4app.com', 80, canvas.height - 20);

        // Download
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `evento-${event.title}-social.png`;
          a.click();
          URL.revokeObjectURL(url);
          
          // Pulizia
          document.body.removeChild(qrContainer);
          Utils.showAlert('Immagine social generata con QR code!', 'success');
        });
      };
    } catch (error) {
      console.error('Errore generazione immagine:', error);
      Utils.showAlert('Errore durante la creazione dell\'immagine', 'danger');
      const qrEl = document.getElementById('temp-qr-social');
      if (qrEl) document.body.removeChild(qrEl);
    }
  }

  /**
   * Condividi su WhatsApp
   */
  shareWhatsApp(title, description) {
    const text = `${title}\n${description}\n\nCreato con Pro Loco Gestionale\nwww.ldm4app.com`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  /**
   * Condividi su Facebook
   */
  shareFacebook() {
    const url = 'https://www.ldm4app.com';
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  }

  /**
   * Condividi su Twitter/X
   */
  shareTwitter(text) {
    const encoded = encodeURIComponent(text + '\nwww.ldm4app.com');
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
  }
}

// Istanza globale
const exportManager = new ExportManager();
