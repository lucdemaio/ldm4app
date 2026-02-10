// Locandina Generator usando Canvas API e QRCode
console.log('[locandina-generator] loaded v3');
window.locandinaGenerator = {
    // Generate QR code using API fallback if library fails
    generateQRCode: async function(text, size) {
        try {
            // Try using QRCode library if available
            if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
                return await QRCode.toCanvas(text, {
                    width: size,
                    margin: 0,
                    color: { dark: '#667eea', light: '#ffffff' }
                });
            }
        } catch (e) {
            console.warn('QRCode library not available, using API fallback', e);
        }
        
        // Fallback: Use QR code API service
        const qrCanvas = document.createElement('canvas');
        qrCanvas.width = size;
        qrCanvas.height = size;
        const ctx = qrCanvas.getContext('2d');
        
        try {
            const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=667eea&bgcolor=ffffff`;
            const response = await fetch(apiUrl);
            const blob = await response.blob();
            const img = new Image();
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, size, size);
                    resolve(qrCanvas);
                };
                img.onerror = reject;
                img.src = URL.createObjectURL(blob);
            });
        } catch (error) {
            console.error('QR code generation failed, drawing placeholder', error);
            // Draw a placeholder
            ctx.fillStyle = '#667eea';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#ffffff';
            ctx.font = `${size/10}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('QR Code', size/2, size/2);
            return qrCanvas;
        }
    },

    generateLocandina: async function (torneoNome, sport, dataInizio, numeroSquadre) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');

            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1080);

            // Torneo name
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            const lines = this.wrapText(ctx, torneoNome, 1000);
            let y = 200;
            lines.forEach(line => {
                ctx.fillText(line, 540, y);
                y += 90;
            });

            // Sport
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '50px Arial';
            ctx.fillText(sport.toUpperCase(), 540, y + 50);

            // Info box
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.roundRect(90, y + 120, 900, 200, 20);
            ctx.fill();

            ctx.fillStyle = '#667eea';
            ctx.font = 'bold 40px Arial';
            ctx.fillText(`📅 ${dataInizio}`, 540, y + 200);
            ctx.fillText(`👥 ${numeroSquadre} Squadre`, 540, y + 270);

            // QR Code
            const qrCanvas = await this.generateQRCode('https://www.ldm4app.com', 200);
            ctx.drawImage(qrCanvas, 440, y + 350, 200, 200);

            // Branding
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 30px Arial';
            ctx.fillText('Creato da www.ldm4app.com', 540, y + 600);

            // Convert to base64
            return canvas.toDataURL('image/png').split(',')[1];
        } catch (error) {
            console.error('Error generating locandina:', error);
            throw error;
        }
    },

    generateLocandinaClassifica: async function (torneoNome, classifica) {
        try {
            console.log('[locandina-generator] generateLocandinaClassifica (SVG) called');

            // Helper to escape XML entities
            function escapeXml(unsafe) {
                if (!unsafe && unsafe !== 0) return '';
                return String(unsafe)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;');
            }

            const width = 1080;
            const height = 1350;

            // Render QR as data URL (if generateQRCode available)
            let qrDataUrl = '';
            try {
                const qrCanvas = await this.generateQRCode('https://www.ldm4app.com', 150);
                qrDataUrl = qrCanvas.toDataURL('image/png');
            } catch (e) {
                console.warn('[locandina-generator] QR generation failed, leaving placeholder', e);
            }

            // Build SVG
            const title = escapeXml('CLASSIFICA');
            const tournament = escapeXml(torneoNome || '');
            const top5 = (classifica || []).slice(0, 5);

            const cardYStart = 200;
            const cardGap = 150;

            const svgParts = [];
            svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
            svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
            // Gradient
            svgParts.push(`<defs><linearGradient id="g0" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient></defs>`);
            svgParts.push(`<rect width="100%" height="100%" fill="url(#g0)"/>`);

            // Title
            svgParts.push(`<text x="540" y="100" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="70" fill="#FFD700">${title}</text>`);
            svgParts.push(`<text x="540" y="160" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#FFFFFF">${tournament}</text>`);

            // Cards and badges
            for (let i = 0; i < 5; i++) {
                const y = cardYStart + i * cardGap;
                // card rect
                svgParts.push(`<rect x="60" y="${y}" rx="12" ry="12" width="960" height="120" fill="rgba(255,255,255,0.95)" />`);
                if (top5[i]) {
                    const name = escapeXml(top5[i].nome || '');
                    const punti = escapeXml(top5[i].punti || '');

                    // badge circle
                    const cx = 150, cy = y + 60, r = 40;
                    svgParts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#667eea"/>`);
                    // number white
                    svgParts.push(`<text x="${cx}" y="${cy + 2}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="40" fill="#FFFFFF">${i+1}</text>`);

                    // team name and points
                    svgParts.push(`<text x="220" y="${y + 55}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="35" fill="#333333">${name}</text>`);
                    svgParts.push(`<text x="220" y="${y + 90}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#666666">Punti: ${punti}</text>`);
                }
            }

            // QR and branding
            if (qrDataUrl) {
                svgParts.push(`<image x="${540 - 75}" y="${height - 360}" width="150" height="150" href="${qrDataUrl}" />`);
            } else {
                svgParts.push(`<rect x="${540 - 75}" y="${height - 360}" width="150" height="150" fill="#ffffff" />`);
            }
            svgParts.push(`<text x="540" y="${height - 80}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="20" fill="#FFFFFF">Creato da www.ldm4app.com</text>`);

            svgParts.push(`</svg>`);

            const svg = svgParts.join('\n');
            console.log('[locandina-generator] SVG length', svg.length);

            // Rasterize SVG into canvas
            const img = new Image();
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

            const outCanvas = document.createElement('canvas');
            outCanvas.width = width; outCanvas.height = height;
            const outCtx = outCanvas.getContext('2d');
            outCtx.drawImage(img, 0, 0);

            // Return as base64
            return outCanvas.toDataURL('image/png').split(',')[1];
        } catch (error) {
            console.error('Error generating locandina classifica (SVG):', error);
            throw error;
        }
    },

    wrapText: function (ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }
};

// Polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}
