/**
 * GENERATORE QR CODE E CONDIVISIONE
 * Genera QR codes per tornei, squadre, condivisione rapida
 */

const QRCodeManager = (function(){
  
  // CDN per QR Code generation
  const QR_LIB = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';

  async function init() {
    // Carica libreria se non presente
    if(!window.QRCode) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = QR_LIB;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  function generateTournamentURL(torneo) {
    const url = new URL(window.location.href);
    url.hash = `#/torneo/${torneo.id}`;
    return url.toString();
  }

  async function generateQRCode(text, options = {}) {
    await init();
    
    const opts = {
      width: options.width || 300,
      height: options.height || 300,
      color: {
        dark: options.dark || '#000000',
        light: options.light || '#FFFFFF'
      },
      errorCorrectionLevel: options.errorLevel || 'H',
      type: 'image/png',
      quality: 0.95,
      margin: options.margin || 2,
      ...options
    };

    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        window.QRCode.toCanvas(canvas, text, opts, err => {
          if(err) reject(err);
          else resolve(canvas.toDataURL('image/png'));
        });
      } catch(e) {
        reject(e);
      }
    });
  }

  async function generateTournamentQR(torneo) {
    const url = generateTournamentURL(torneo);
    return await generateQRCode(url, {
      width: 300,
      height: 300,
      errorLevel: 'H'
    });
  }

  async function generateTeamQR(squadra) {
    const url = `${window.location.origin}${window.location.pathname}#/squadra/${squadra.id}`;
    return await generateQRCode(url);
  }

  function createShareLink(torneo) {
    const shareData = {
      torneoId: torneo.id,
      nome: torneo.nome,
      sport: torneo.sport,
      data: new Date().toISOString()
    };

    const encoded = btoa(JSON.stringify(shareData));
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
    
    return shareUrl;
  }

  async function generateLocandina(torneo) {
    // Genera una locandina HTML per il torneo
    return `
      <div class="locandina" style="
        width: 400px;
        min-height: 600px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        text-align: center;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      ">
        <div>
          <p style="font-size: 0.9rem; margin: 0; opacity: 0.9;">TORNEO</p>
          <h1 style="font-size: 2.5rem; margin: 0.5rem 0; font-weight: bold;">
            ${escapeHtml(torneo.nome)}
          </h1>
          <p style="font-size: 1.2rem; margin: 0.5rem 0;">🏆 ${escapeHtml(torneo.sport)}</p>
        </div>

        <div>
          <div style="background: white; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
            <p style="color: #333; margin: 0; font-size: 0.9rem; font-weight: bold;">Scansiona per iscriverti:</p>
            <img id="qr-locandina" src="" style="width: 200px; height: 200px; margin-top: 0.5rem;">
          </div>

          <div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">
              📅 ${torneo.dataInizio ? new Date(torneo.dataInizio).toLocaleDateString('it-IT') : '--'}
            </p>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">
              👥 ${torneo.numSquadre || '--'} squadre
            </p>
          </div>
        </div>

        <div style="font-size: 0.8rem; opacity: 0.8;">
          <p style="margin: 0; font-weight: bold;">Gestionale Tornei Pro</p>
          <p style="margin: 0;">Il miglior programma gratuito</p>
        </div>
      </div>
    `;
  }

  async function downloadAsImage(element, filename = 'torneo.png') {
    // Usa html2canvas per esportare
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    
    document.head.appendChild(script);
    
    script.onload = async () => {
      try {
        const canvas = await html2canvas(element, { scale: 2 });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = filename;
        link.click();
      } catch(e) {
        console.error('Errore nel download:', e);
        alert('Errore durante il download');
      }
    };
  }

  async function shareVia(text, title = 'Torneo') {
    if(navigator.share) {
      try {
        await navigator.share({ title, text, url: window.location.href });
      } catch(e) {
        if(e.name !== 'AbortError') console.error(e);
      }
    } else {
      // Fallback: copia negli appunti
      navigator.clipboard.writeText(text);
      alert('Link copiato negli appunti');
    }
  }

  return {
    generateQRCode,
    generateTournamentQR,
    generateTeamQR,
    generateTournamentURL,
    generateLocandina,
    createShareLink,
    downloadAsImage,
    shareVia,
    init
  };
})();

// Global reference
if(typeof window !== 'undefined') window.QRCodeManager = QRCodeManager;
