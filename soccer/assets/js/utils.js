/**
 * UTILS.JS
 * Utility Functions - Haptic Feedback, Animations, Helpers
 * Developed by ldm4app
 */

const Utils = (() => {
  /**
   * Haptic Feedback per mobile (Capacitor)
   */
  async function hapticFeedback(type = 'light') {
    try {
      // Check if Capacitor is available
      if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        
        switch (type) {
          case 'light':
            await Haptics.impact({ style: ImpactStyle.Light });
            break;
          case 'medium':
            await Haptics.impact({ style: ImpactStyle.Medium });
            break;
          case 'heavy':
            await Haptics.impact({ style: ImpactStyle.Heavy });
            break;
          case 'success':
            await Haptics.notification({ type: 'SUCCESS' });
            break;
          case 'warning':
            await Haptics.notification({ type: 'WARNING' });
            break;
          case 'error':
            await Haptics.notification({ type: 'ERROR' });
            break;
          default:
            await Haptics.impact({ style: ImpactStyle.Light });
        }
      }
    } catch (error) {
      // Haptic non disponibile, ignora silenziosamente
      console.log('Haptic feedback not available');
    }
  }

  /**
   * Ottieni classe CSS per ruolo atleta
   */
  function getRoleClass(role) {
    const roleMap = {
      'GK': 'gk',
      'Portiere': 'gk',
      'Goalkeeper': 'gk',
      'DF': 'def',
      'Difensore': 'def',
      'Defender': 'def',
      'Difesa': 'def',
      'MF': 'mid',
      'Centrocampista': 'mid',
      'Midfielder': 'mid',
      'Centrocampo': 'mid',
      'FW': 'att',
      'Attaccante': 'att',
      'Forward': 'att',
      'Attacco': 'att'
    };

    const roleKey = Object.keys(roleMap).find(key => 
      role.toLowerCase().includes(key.toLowerCase())
    );

    return roleKey ? roleMap[roleKey] : 'mid'; // Default: midfielder
  }

  /**
   * Ottieni colore per ruolo atleta
   */
  function getRoleColor(role) {
    const roleClass = getRoleClass(role);
    const colors = {
      'gk': '#fbbf24',    // Gold
      'def': '#3b82f6',   // Blue
      'mid': '#22c55e',   // Green
      'att': '#ef4444'    // Red
    };
    return colors[roleClass] || colors.mid;
  }

  /**
   * Ottieni icona Lucide per ruolo
   */
  function getRoleIcon(role) {
    const roleClass = getRoleClass(role);
    const icons = {
      'gk': 'shield',
      'def': 'shield-check',
      'mid': 'target',
      'att': 'zap'
    };
    return icons[roleClass] || icons.mid;
  }

  /**
   * Render skeleton loader
   */
  function renderSkeleton(count = 3, type = 'card') {
    let html = '';
    
    for (let i = 0; i < count; i++) {
      if (type === 'card') {
        html += `
          <div class="skeleton skeleton-card"></div>
        `;
      } else if (type === 'text') {
        html += `
          <div class="skeleton skeleton-text"></div>
        `;
      } else if (type === 'circle') {
        html += `
          <div class="skeleton skeleton-circle"></div>
        `;
      }
    }
    
    return html;
  }

  /**
   * Render empty state
   */
  function renderEmptyState(icon, title, message, actionText = null, actionCallback = null) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i data-lucide="${icon}"></i>
        </div>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-message">${message}</p>
        ${actionText && actionCallback ? `
          <button class="empty-state-action" onclick="${actionCallback}">
            <i data-lucide="plus"></i>
            ${actionText}
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * Animate number count up
   */
  function animateNumber(element, target, duration = 1000) {
    const start = parseInt(element.textContent) || 0;
    const range = target - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.round(current);
    }, 16);
  }

  /**
   * Debounce function
   */
  function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   */
  function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Format currency
   */
  function formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format date
   */
  function formatDate(date, format = 'short') {
    const d = new Date(date);
    
    if (format === 'short') {
      return d.toLocaleDateString('it-IT');
    } else if (format === 'long') {
      return d.toLocaleDateString('it-IT', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (format === 'relative') {
      const now = new Date();
      const diff = Math.floor((now - d) / 1000); // seconds
      
      if (diff < 60) return 'Ora';
      if (diff < 3600) return `${Math.floor(diff / 60)} minuti fa`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`;
      if (diff < 604800) return `${Math.floor(diff / 86400)} giorni fa`;
      return d.toLocaleDateString('it-IT');
    }
    
    return d.toLocaleDateString('it-IT');
  }

  /**
   * Calculate age from date of birth
   */
  function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Generate random ID
   */
  function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}${timestamp}-${random}`;
  }

  /**
   * Generate unique ID
   */
  function generateId(prefix = 'id-') {
    return prefix + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Copy to clipboard
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copiato negli appunti!', 'success');
      hapticFeedback('light');
      return true;
    } catch (error) {
      console.error('Errore copia:', error);
      showToast('Errore durante la copia', 'error');
      return false;
    }

  }

  function addHtml2canvasIgnore(container) {
    if (!container || !(container.querySelectorAll)) return () => {};
    const selector = 'button, [data-lucide], .debug-info, .contatore-auto, .btn-azione, .chip-remove, .drop-zone, .athlete-assign-btn, .vehicle-actions, .logistics-actions, .empty-state-action, .nav-btn';
    const elems = Array.from(container.querySelectorAll(selector));
    const modified = [];
    elems.forEach(el => {
      try {
        if (!el.hasAttribute('data-html2canvas-ignore')) {
          el.setAttribute('data-html2canvas-ignore', 'true');
          modified.push(el);
        }
      } catch (e) {
        // ignore
      }
    });
    return function restore() {
      modified.forEach(el => {
        try { el.removeAttribute('data-html2canvas-ignore'); } catch (e) {}
      });
    };
  }

  /**
   * Safe JSON parse that returns defaultValue on error
   */
  function safeJSONParse(str, defaultValue = null) {
    try {
      if (typeof str === 'undefined' || str === null) return defaultValue;
      if (typeof str === 'object') return str;
      const trimmed = (typeof str === 'string') ? str.trim() : String(str);
      if (trimmed === '') return defaultValue;
      return JSON.parse(str);
    } catch (e) {
      console.warn('safeJSONParse failed:', e);
      return defaultValue;
    }
  }

  /**
   * Fetch JSON with basic checks (returns null on empty body or non-ok status)
   */
  async function fetchJson(url, options = {}) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      if (!text) return null;
      return safeJSONParse(text, null);
    } catch (e) {
      console.warn('fetchJson failed for', url, e);
      return null;
    }
  }

  /**
   * Initialize Lucide icons in dynamically injected HTML
   */
  function initLucideIcons() {
    try {
      if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
      }
    } catch (e) {
      console.warn('Lucide init failed', e);
    }
  }

  /**
   * Show toast via UI or console fallback
   */
  function showToast(message, type = 'info') {
    if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') {
      UI.showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Share content (Web Share API)
   */
  async function share(data) {
    try {
      if (navigator.share) {
        await navigator.share(data);
        hapticFeedback('success');
        return true;
      } else {
        // Fallback: copy to clipboard
        const text = `${data.title}\n${data.text}\n${data.url || ''}`;
        await copyToClipboard(text);
        return false;
      }
    } catch (error) {
      console.error('Errore condivisione:', error);
      return false;
    }
  }

  /**
   * Generate a jersey SVG based on three colors and style
   * style: 'solid' | 'stripes-vertical' | 'stripes-horizontal' | 'diagonal'
   */
  function generateJerseySVG(primary = '#1e40af', secondary = '', accent = '', style = 'solid', width = 48, height = 56) {
    const p = primary || '#1e40af';
    const s = secondary || p;
    const a = accent || '#ffffff';

    // Create pattern defs depending on style
    let pattern = '';
    if (style === 'stripes-vertical') {
      pattern = `
        <defs>
          <pattern id="pv" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="10" height="20" fill="${p}" />
            <rect x="10" width="10" height="20" fill="${s}" />
          </pattern>
        </defs>
        <rect x="4" y="4" width="${width-8}" height="${height-8}" rx="6" fill="url(#pv)" stroke="rgba(0,0,0,0.08)" />
      `;
    } else if (style === 'stripes-horizontal') {
      pattern = `
        <defs>
          <pattern id="ph" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="10" fill="${p}" />
            <rect y="10" width="20" height="10" fill="${s}" />
          </pattern>
        </defs>
        <rect x="4" y="4" width="${width-8}" height="${height-8}" rx="6" fill="url(#ph)" stroke="rgba(0,0,0,0.08)" />
      `;
    } else if (style === 'diagonal') {
      pattern = `
        <defs>
          <linearGradient id="gd" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${p}" />
            <stop offset="100%" stop-color="${s}" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="${width-8}" height="${height-8}" rx="6" fill="url(#gd)" stroke="rgba(0,0,0,0.08)" />
      `;
    } else {
      // solid
      pattern = `<rect x="4" y="4" width="${width-8}" height="${height-8}" rx="6" fill="${p}" stroke="rgba(0,0,0,0.08)" />`;
    }

    // Add neckline/number area using accent
    const accentEl = `<rect x="${width/2 - 8}" y="${height*0.15}" width="16" height="10" rx="3" fill="${a}" opacity="0.9" />`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        ${pattern}
        ${accentEl}
      </svg>`;
    return svg;
  }

  // Esposizione pubblica
  return {
    hapticFeedback,
    getRoleClass,
    getRoleColor,
    getRoleIcon,
    renderSkeleton,
    renderEmptyState,
    animateNumber,
    debounce,
    throttle,
    formatCurrency,
    formatDate,
    calculateAge,
    generateId,
    copyToClipboard,
    share,
    safeJSONParse,
    fetchJson,
    initLucideIcons,
    showToast,
    addHtml2canvasIgnore,
    generateJerseySVG
  };
})();

// Esposizione globale
window.Utils = Utils;
