/**
 * Module Integration Test Suite
 * Verifies that all v2.0.0 modules load and initialize correctly
 * Load this file AFTER all other modules in the browser console
 */

const ModuleTest = {
  results: {},
  
  test(name, fn) {
    try {
      fn();
      this.results[name] = { status: '✅ PASS', error: null };
      console.log(`✅ ${name}`);
    } catch(e) {
      this.results[name] = { status: '❌ FAIL', error: e.message };
      console.error(`❌ ${name}: ${e.message}`);
    }
  },

  runAll() {
    console.clear();
    console.log('%c🧪 INTEGRAZIONE TEST v2.0.0', 'font-size:18px;font-weight:bold;color:#2563eb');
    console.log('═'.repeat(50));

    // Test Core Modules
    this.test('Config Module', () => {
      if(!window.Config) throw new Error('Config not found');
      if(!Config.VERSION) throw new Error('Config.VERSION missing');
      if(!Config.FEATURES) throw new Error('Config.FEATURES missing');
      if(typeof Config.FEATURES.ADMIN_PANEL !== 'boolean') throw new Error('Feature flag format invalid');
    });

    this.test('I18n Module', () => {
      if(!window.I18n) throw new Error('I18n not found');
      if(!I18n.get) throw new Error('I18n.get method missing');
      const text = I18n.get('app_name');
      if(!text) throw new Error('Translation system not working');
    });

    this.test('Theme Module', () => {
      if(!window.ThemeManager) throw new Error('ThemeManager not found');
      if(!ThemeManager.setTheme) throw new Error('ThemeManager.setTheme missing');
      if(!ThemeManager.toggleTheme) throw new Error('ThemeManager.toggleTheme missing');
      ThemeManager.setTheme('light');
      const isDark = ThemeManager.isDarkMode();
      if(isDark !== false) throw new Error('Theme state incorrect');
    });

    this.test('Helpers Module', () => {
      if(!window.escapeHtml) throw new Error('escapeHtml not found');
      if(!window.formatDate) throw new Error('formatDate not found');
      if(!window.makeId) throw new Error('makeId not found');
      if(!window.groupBy) throw new Error('groupBy not found');
      const escaped = escapeHtml('<script>');
      if(!escaped.includes('&lt;')) throw new Error('escapeHtml not working');
    });

    this.test('Storage Module (IDB)', () => {
      if(!window.IDB) throw new Error('IDB not found');
      if(!IDB.put) throw new Error('IDB.put missing');
      if(!IDB.getAll) throw new Error('IDB.getAll missing');
      if(!IDB.delete) throw new Error('IDB.delete missing');
    });

    // Test Professional Modules
    this.test('Players Module', () => {
      if(!window.AppGiocatori) throw new Error('AppGiocatori not found');
      if(!AppGiocatori.render) throw new Error('AppGiocatori.render missing');
    });

    this.test('Statistics Module', () => {
      if(!window.AppStatistics) throw new Error('AppStatistics not found');
      if(!AppStatistics.render) throw new Error('AppStatistics.render missing');
    });

    this.test('Admin Module', () => {
      if(!window.AdminPanel) throw new Error('AdminPanel not found');
      if(!AdminPanel.render) throw new Error('AdminPanel.render missing');
      if(!AdminPanel._deleteUser) throw new Error('AdminPanel._deleteUser missing (internal)');
    });

    this.test('QR Code Module', () => {
      if(!window.QRCodeManager) throw new Error('QRCodeManager not found');
      if(!QRCodeManager.generateQRCode) throw new Error('QRCodeManager.generateQRCode missing');
    });

    this.test('Export Module', () => {
      if(!window.ExportPro) throw new Error('ExportPro not found');
      if(!ExportPro.generateCSV) throw new Error('ExportPro.generateCSV missing');
      if(!ExportPro.exportClassificaPDF) throw new Error('ExportPro.exportClassificaPDF missing');
    });

    this.test('Cloud Sync Module', () => {
      if(!window.CloudSync) throw new Error('CloudSync not found');
      if(!CloudSync.apiCall) throw new Error('CloudSync.apiCall missing');
      if(!CloudSync.syncPendingChanges) throw new Error('CloudSync.syncPendingChanges missing');
    });

    // Test External Libraries
    this.test('External: Chart.js', () => {
      if(!window.Chart) throw new Error('Chart.js not loaded - charts will not render');
    });

    this.test('External: jsPDF', () => {
      if(!window.jsPDF) throw new Error('jsPDF not loaded - PDF export not available');
    });

    this.test('External: CryptoJS', () => {
      if(!window.CryptoJS) throw new Error('CryptoJS not loaded - password hashing degraded to Base64');
    });

    this.test('External: qrcode.js', () => {
      if(!window.QRCode) throw new Error('qrcode.js not loaded - QR generation will fail');
    });

    // Test UI Elements
    this.test('UI: Toast Container', () => {
      const container = document.getElementById('toast-container');
      if(!container) throw new Error('Toast container missing from DOM');
    });

    this.test('UI: Theme Toggle Button', () => {
      const btn = document.getElementById('theme-toggle');
      if(!btn) throw new Error('Theme toggle button not found');
    });

    this.test('UI: Language Menu', () => {
      const menu = document.getElementById('languageMenu');
      if(!menu) throw new Error('Language menu not found');
    });

    this.test('UI: Admin Panel Link', () => {
      const link = document.querySelector('a[href="#/admin"]');
      if(!link) throw new Error('Admin panel link not found');
    });

    // Test Router
    this.test('Router: Basic Navigation', () => {
      if(!window.Router) throw new Error('Router not found');
      if(!Router.init) throw new Error('Router.init missing');
      if(!Router.navigate) throw new Error('Router.navigate missing');
    });

    // Summary
    console.log('\n' + '═'.repeat(50));
    const passed = Object.values(this.results).filter(r => r.status.includes('✅')).length;
    const total = Object.values(this.results).length;
    console.log(`%c✅ ${passed}/${total} tests passed`, `font-size:14px;font-weight:bold;color:${passed === total ? '#22c55e' : '#ef4444'}`);
    
    if(passed === total) {
      console.log('%c🎉 APP IS READY FOR PRODUCTION! 🎉', 'font-size:16px;font-weight:bold;color:#22c55e;background:#ecfdf5;padding:8px');
    } else {
      console.warn('⚠️ Some modules are missing or incomplete');
      console.log('%cFailed Tests:', 'font-weight:bold;color:#ef4444');
      Object.entries(this.results).forEach(([name, result]) => {
        if(result.status.includes('FAIL')) {
          console.log(`  ❌ ${name}: ${result.error}`);
        }
      });
    }
    
    return this.results;
  }
};

// Run tests automatically if loaded
console.log('%c⏳ Module tests will run when all modules are loaded', 'color:#8b5cf6');
console.log('💡 After page fully loads, run: ModuleTest.runAll()');

// Auto-run on DOMContentLoaded with delay for external CDN libraries
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('\n%c[AUTO-RUN] Module integration test starting...', 'color:#2563eb;font-weight:bold');
    ModuleTest.runAll();
  }, 3500);  // 3.5s delay for all CDN libraries
});
