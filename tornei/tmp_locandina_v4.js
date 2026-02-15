<<<<<<< HEAD
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
            const ctx = canvas.getContext('2d');

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
                ctx.beginPath();
                ctx.arc(150, y + 60, 40, 0, Math.PI * 2);
                ctx.fill();

                // Draw number using an SVG image to guarantee color fidelity
                const number = (index + 1).toString();
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><style>text{font: bold 40px Arial; fill:#0f4b8f; text-anchor:middle; dominant-baseline:central;}</style><text x="60" y="64">${number}</text></svg>`;
                const img = new Image();
                img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
                await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
                ctx.drawImage(img, 110, y + 25, 80, 80);

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

            // Convert to base64
            return canvas.toDataURL('image/png').split(',')[1];
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
=======
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
            const ctx = canvas.getContext('2d');

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
                ctx.beginPath();
                ctx.arc(150, y + 60, 40, 0, Math.PI * 2);
                ctx.fill();

                // Draw number using an SVG image to guarantee color fidelity
                const number = (index + 1).toString();
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><style>text{font: bold 40px Arial; fill:#0f4b8f; text-anchor:middle; dominant-baseline:central;}</style><text x="60" y="64">${number}</text></svg>`;
                const img = new Image();
                img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
                await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
                ctx.drawImage(img, 110, y + 25, 80, 80);

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

            // Convert to base64
            return canvas.toDataURL('image/png').split(',')[1];
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
>>>>>>> 864310ad9a57111b0d674f025b9b8724f87cdd58
