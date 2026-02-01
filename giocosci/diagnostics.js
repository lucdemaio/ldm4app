// diagnostics.js - Sistema di diagnostica per debug
'use strict';

// Create diagnostic panel
function createDiagnosticPanel() {
    const panel = document.createElement('div');
    panel.id = 'diagnosticPanel';
    panel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: #0f0;
        padding: 15px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        border: 2px solid #0f0;
        border-radius: 8px;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 99999;
    `;
    
    panel.innerHTML = '<h3 style="margin: 0 0 10px 0; color: #0ff;">🔍 DIAGNOSTICA SISTEMA 3D</h3>';
    document.body.appendChild(panel);
    return panel;
}

function addDiagnosticMessage(message, type = 'info') {
    const panel = document.getElementById('diagnosticPanel') || createDiagnosticPanel();
    const colors = {
        info: '#0ff',
        success: '#0f0',
        warning: '#ff0',
        error: '#f00'
    };
    
    const msg = document.createElement('div');
    msg.style.cssText = `
        margin: 5px 0;
        padding: 5px;
        border-left: 3px solid ${colors[type]};
        padding-left: 8px;
        color: ${colors[type]};
    `;
    msg.textContent = `${type.toUpperCase()}: ${message}`;
    panel.appendChild(msg);
    
    // Auto scroll to bottom
    panel.scrollTop = panel.scrollHeight;
}

// Run diagnostics on page load
window.addEventListener('DOMContentLoaded', () => {
    addDiagnosticMessage('Inizio diagnostica...', 'info');
    
    // Check WebGL
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
        addDiagnosticMessage('✅ WebGL disponibile', 'success');
        addDiagnosticMessage(`GPU: ${gl.getParameter(gl.RENDERER)}`, 'info');
    } else {
        addDiagnosticMessage('❌ WebGL NON disponibile!', 'error');
    }
    
    // Check Three.js
    setTimeout(() => {
        if (window.THREE) {
            addDiagnosticMessage('✅ Three.js caricato correttamente', 'success');
            addDiagnosticMessage(`Versione: ${window.THREE.REVISION}`, 'info');
        } else {
            addDiagnosticMessage('❌ Three.js NON caricato!', 'error');
        }
        
        // Check scene
        if (window._scene) {
            addDiagnosticMessage('✅ Scena 3D creata', 'success');
            addDiagnosticMessage(`Oggetti nella scena: ${window._scene.children.length}`, 'info');
        } else {
            addDiagnosticMessage('❌ Scena 3D NON creata!', 'error');
        }
        
        // Check renderer
        if (window._renderer) {
            addDiagnosticMessage('✅ Renderer 3D attivo', 'success');
        } else {
            addDiagnosticMessage('❌ Renderer 3D NON attivo!', 'error');
        }
        
        // Check camera
        if (window._camera) {
            addDiagnosticMessage('✅ Camera 3D configurata', 'success');
        } else {
            addDiagnosticMessage('❌ Camera 3D NON configurata!', 'error');
        }
        
        // Check fallback mode
        if (window._use2DFallbackForce) {
            addDiagnosticMessage('⚠️ MODALITÀ FALLBACK 2D ATTIVA!', 'warning');
        } else {
            addDiagnosticMessage('✅ Modalità 3D attiva', 'success');
        }
        
        // Check graphics engine
        if (window.GraphicsEngine) {
            addDiagnosticMessage('✅ Graphics Engine caricato', 'success');
        } else {
            addDiagnosticMessage('⚠️ Graphics Engine non caricato', 'warning');
        }
        
        // Check championship
        if (window.Championship) {
            addDiagnosticMessage('✅ Sistema Campionato caricato', 'success');
        } else {
            addDiagnosticMessage('⚠️ Sistema Campionato non caricato', 'warning');
        }
        
        // Check for errors in console
        addDiagnosticMessage('Controlla la Console (F12) per eventuali errori JavaScript', 'info');
        
    }, 2000);
});

// Intercept console errors
const originalError = console.error;
console.error = function(...args) {
    if (document.body) {
        addDiagnosticMessage(args.join(' '), 'error');
    }
    originalError.apply(console, args);
};

const originalWarn = console.warn;
console.warn = function(...args) {
    if (document.body) {
        addDiagnosticMessage(args.join(' '), 'warning');
    }
    originalWarn.apply(console, args);
};

// Aspetta che il DOM sia pronto prima di iniziare la diagnostica
if (document.readyState === 'loading') {
    // DOM non ancora pronto
} else {
    // DOM già pronto
    addDiagnosticMessage('Sistema di diagnostica attivo', 'success');
}
