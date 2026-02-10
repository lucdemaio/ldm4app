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
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1350;
            // Allow efficient readbacks since we sample pixels for debug
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, 1350);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1350);

            // Title
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 70px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CLASSIFICA', 540, 100);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '40px Arial';
            ctx.fillText(torneoNome, 540, 160);

            // Top 5
            console.log('[locandina-generator] generateLocandinaClassifica called, preparing to draw top 5 with number color #0f4b8f');
            const top5 = classifica.slice(0, 5);
            let y = 250;

            for (let index = 0; index < top5.length; index++) {
                const squadra = top5[index];
                // Card background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.roundRect(90, y, 900, 120, 15);
                ctx.fill();

                // Position badge
                const badgeColor = '#667eea';
                ctx.fillStyle = badgeColor;
                // Draw full badge (circle + number) into an offscreen badge canvas and composite atomically
                const number = (index + 1).toString();

                const badge = document.createElement('canvas');
                badge.width = 120; badge.height = 120;
                const bctx = badge.getContext('2d');

                // draw circle
                bctx.fillStyle = '#667eea';
                bctx.beginPath();
                bctx.arc(badge.width/2, badge.height/2, 40, 0, Math.PI * 2);
                bctx.fill();

                // draw number with stroke + fill
                bctx.font = 'bold 40px Arial';
                bctx.textAlign = 'center';
                bctx.textBaseline = 'middle';
                bctx.lineWidth = 4;
                bctx.strokeStyle = '#ffffff';
                bctx.strokeText(number, badge.width/2, badge.height/2);
                bctx.fillStyle = '#0f4b8f';
                bctx.fillText(number, badge.width/2, badge.height/2);

                // Composite badge onto main canvas
                ctx.drawImage(badge, 110, y + 20, 80, 80);

                // Debug: confirm offscreen badge center pixel and main canvas after composite
                try {
                    const bPixel = bctx.getImageData(badge.width/2, badge.height/2, 1, 1).data;
                    console.log('[locandina-debug] badge offscreen center RGBA for', number, bPixel);
                } catch(e) { console.warn('[locandina-debug] badge getImageData failed', e); }
                try {
                    const mainPixel = ctx.getImageData(150, y + 60, 1, 1).data;
                    console.log('[locandina-debug] after-composite main pixel for number', number, 'RGBA:', mainPixel);
                } catch (e) { console.warn('[locandina-debug] main getImageData failed', e); }

                console.log('[locandina-generator] composited badge', number, 'for index', index+1);

                // Squadra name
                ctx.fillStyle = '#333333';
                ctx.font = 'bold 35px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(squadra.nome, 220, y + 50);

                // Stats
                ctx.font = '28px Arial';
                ctx.fillStyle = '#666666';
                ctx.fillText(`Punti: ${squadra.punti}`, 220, y + 85);

                y += 150;
            }

            // QR Code
            const qrCanvas = await this.generateQRCode('https://www.ldm4app.com', 150);
            ctx.drawImage(qrCanvas, 465, y + 50, 150, 150);

            // Branding
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 25px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Creato da www.ldm4app.com', 540, y + 240);

            // Second pass: redraw badges (circle + number) on top to override any accidental overwrites
            for (let index = 0; index < top5.length; index++) {
                const yy = 250 + index * 150;
                const num = (index + 1).toString();
                ctx.save();
                // Draw badge circle
                ctx.fillStyle = '#667eea';
                ctx.beginPath();
                ctx.arc(150, yy + 60, 40, 0, Math.PI * 2);
                ctx.fill();
                // Draw number (stroke + fill)
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#ffffff';
                ctx.strokeText(num, 150, yy + 60);
                ctx.fillStyle = '#0f4b8f';
                ctx.fillText(num, 150, yy + 60);
                ctx.restore();
            }

            // Debug: sample pixel color at each number center and log RGBA after second pass
            for (let i = 0; i < top5.length; i++) {
                const sampleX = 150;
                // sample at badge center y + 60
                const sampleY = 250 + i * 150 + 60;
                try {
                    const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
                    console.log(`[locandina-debug] number ${i+1} pixel RGBA:`, pixel);
                } catch (e) {
                    console.warn('[locandina-debug] getImageData failed', e);
                }
            }

            // Final flatten: draw to a fresh canvas and sample again to detect post-processing overwrites
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvas.width; finalCanvas.height = canvas.height;
            const fctx = finalCanvas.getContext('2d');
            fctx.drawImage(canvas, 0, 0);
            for (let i = 0; i < top5.length; i++) {
                const fx = 150;
                const fy = 250 + i * 150 + 60;
                try {
                    const fp = fctx.getImageData(fx, fy, 1, 1).data;
                    console.log(`[locandina-debug] FINAL canvas number ${i+1} pixel RGBA:`, fp);
                } catch (e) { console.warn('[locandina-debug] final canvas getImageData failed', e); }
            }

            // Return flattened base64
            return finalCanvas.toDataURL('image/png').split(',')[1];
        } catch (error) {
            console.error('Error generating locandina classifica:', error);
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
