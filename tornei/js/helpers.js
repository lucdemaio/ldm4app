/**
 * HELPER FUNCTIONS & UTILITIES
 * Funzioni auxiliary usate in tutta l'applicazione
 */

// HTML escaping (XSS prevention)
function escapeHtml(text) {
  if(!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Formatta data in formato italiano
function formatDate(dateStr) {
  if(!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch(e) {
    return dateStr;
  }
}

// Formatta data e ora
function formatDateTime(dateStr) {
  if(!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch(e) {
    return dateStr;
  }
}

// Formatta solo ora
function formatTime(dateStr) {
  if(!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch(e) {
    return dateStr;
  }
}

// Genera ID univoco
function makeId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Delay/Sleep promise
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Deep clone
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Merge objects
function merge(target, source) {
  return { ...target, ...source };
}

// Get object value by dot notation path
function getByPath(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

// Set object value by dot notation path
function setByPath(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => current[key] = current[key] || {}, obj);
  target[lastKey] = value;
  return obj;
}

// Debounce function
function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Throttle function
function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if(!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Format file size
function formatFileSize(bytes) {
  if(bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Calculate age from birthdate
function calculateAge(birthdate) {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if(monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Validate email
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate phone
function isValidPhone(phone) {
  const regex = /^[\d\s\-\+\(\)]{10,}$/;
  return regex.test(phone);
}

// Group array by property
function groupBy(arr, key) {
  return arr.reduce((result, item) => {
    const group = item[key];
    if(!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
}

// Flatten array of arrays
function flatten(arr) {
  return arr.reduce((flat, item) => 
    flat.concat(Array.isArray(item) ? flatten(item) : item), 
  []);
}

// Unique array items
function unique(arr, key = null) {
  if(!key) return [...new Set(arr)];
  
  return arr.reduce((unique, item) => {
    const val = item[key];
    if(!unique.map(u => u[key]).includes(val)) {
      unique.push(item);
    }
    return unique;
  }, []);
}

// Sort array
function sortBy(arr, key, desc = false) {
  const sorted = [...arr].sort((a, b) => {
    const val1 = a[key];
    const val2 = b[key];
    
    if(typeof val1 === 'string') {
      return desc 
        ? val2.localeCompare(val1)
        : val1.localeCompare(val2);
    }
    
    return desc ? val2 - val1 : val1 - val2;
  });
  
  return sorted;
}

// Filter array
function filterBy(arr, criteria) {
  return arr.filter(item => {
    return Object.keys(criteria).every(key => {
      if(typeof criteria[key] === 'function') {
        return criteria[key](item[key]);
      }
      return item[key] === criteria[key];
    });
  });
}

// Safe JSON parse
function safeJsonParse(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch(e) {
    console.error('JSON parse error:', e);
    return fallback;
  }
}

// Safe JSON stringify
function safeJsonStringify(obj, replacer = null, space = 2) {
  try {
    return JSON.stringify(obj, replacer, space);
  } catch(e) {
    console.error('JSON stringify error:', e);
    return '{}';
  }
}

// Get query params from URL
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// Get hash params
function getHashParams() {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const result = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// Open modal
function showModal(id) {
  const modal = document.getElementById(id);
  if(modal) {
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  }
}

// Close modal
function hideModal(id) {
  const modal = document.getElementById(id);
  if(modal) {
    const bsModal = bootstrap.Modal.getInstance(modal);
    if(bsModal) bsModal.hide();
  }
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
  const toastHtml = `
    <div class="toast align-items-center text-white bg-${type}" role="alert">
      <div class="d-flex">
        <div class="toast-body">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;
  
  const toastContainer = document.getElementById('toast-container');
  if(!toastContainer) return;
  
  const toastEl = document.createElement('div');
  toastEl.innerHTML = toastHtml;
  toastContainer.appendChild(toastEl);
  
  const toast = new bootstrap.Toast(toastEl.querySelector('.toast'));
  toast.show();
  
  setTimeout(() => toastEl.remove(), duration);
}

// Capitalize string
function capitalize(str) {
  if(!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Pluralize word
function pluralize(word, count) {
  return count === 1 ? word : word + 's';
}

// Download file
function downloadFile(data, filename, type = 'text/plain') {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch(e) {
    console.error('Copy error:', e);
    return false;
  }
}

// Get browser info
function getBrowserInfo() {
  const ua = navigator.userAgent;
  return {
    userAgent: ua,
    platform: navigator.platform,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    deviceMemory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency
  };
}

// Check if mobile
function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Request permission
async function requestPermission(permission) {
  try {
    const result = await navigator.permissions.query({ name: permission });
    return result.state;
  } catch(e) {
    console.error('Permission error:', e);
    return 'denied';
  }
}

// Global exports
if(typeof window !== 'undefined') {
  window.escapeHtml = escapeHtml;
  window.formatDate = formatDate;
  window.formatDateTime = formatDateTime;
  window.formatTime = formatTime;
  window.makeId = makeId;
  window.sleep = sleep;
  window.deepClone = deepClone;
  window.merge = merge;
  window.debounce = debounce;
  window.throttle = throttle;
  window.groupBy = groupBy;
  window.unique = unique;
  window.sortBy = sortBy;
  window.filterBy = filterBy;
  window.showModal = showModal;
  window.hideModal = hideModal;
  window.showToast = showToast;
  window.downloadFile = downloadFile;
  window.copyToClipboard = copyToClipboard;
  window.capitalize = capitalize;
  window.isMobile = isMobile;
}
