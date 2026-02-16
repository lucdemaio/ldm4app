import React from 'react'

export default function Sidebar({ active = 'translate', onNavigate = () => {} }) {
  return (
    <nav aria-label="Sidebar" style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <button className={`icon-btn ${active === 'dashboard' ? 'active' : ''}`} title="Dashboard" aria-label="Dashboard" style={{marginBottom: 6}} onClick={() => onNavigate('dashboard')}>
        <svg className="ic-svg ic-indigo" viewBox="0 0 24 24" role="img" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.6" fill="currentColor"/><rect x="13" y="3" width="8" height="8" rx="1.6" fill="#fff" opacity="0.12"/><rect x="3" y="13" width="8" height="8" rx="1.6" fill="#fff" opacity="0.06"/><rect x="13" y="13" width="8" height="8" rx="1.6" fill="#fff" opacity="0.04"/></svg>
      </button>

      <button className={`icon-btn ${active === 'translate' ? 'active' : ''}`} title="Traduci" aria-label="Traduci" onClick={() => onNavigate('translate')}>
        <svg className="ic-svg ic-indigo" viewBox="0 0 24 24" role="img" aria-hidden="true"><path fill="currentColor" d="M3 11h10v2H3z"/><path fill="currentColor" d="M12 4l7 8-7 8-1.5-1.5L16.5 14H3v-2h13.5L10.5 5.5 12 4z" opacity="0.98"/></svg>
      </button>

      <button className="icon-btn" title="Precarica" aria-label="Precarica" style={{marginTop: 6}} onClick={() => { onNavigate('translate'); if (window.translationWorker) window.translationWorker.postMessage({ type: 'load' }) }}>
        <svg className="ic-svg ic-green" viewBox="0 0 24 24" role="img" aria-hidden="true"><path fill="currentColor" d="M12 3a5 5 0 00-4.9 4.06A4 4 0 006 19h10a3 3 0 00.9-5.9A4 4 0 0016 7a5 5 0 00-4-4z" opacity="0.98"/><path fill="#fff" d="M11 8v6H8l4 4 4-4h-3V8z" opacity="0.95"/></svg>
      </button>

      <div style={{flex: 1}} />

      <button className={`icon-btn ${active === 'help' ? 'active' : ''}`} title="Guida" aria-label="Guida" style={{marginTop: 8}} onClick={() => onNavigate('help')}>
        <svg className="ic-svg ic-yellow" viewBox="0 0 24 24" role="img" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M11 7h2v2a1 1 0 01-1 1c-.6 0-1 .4-1 1v1" fill="#fff" opacity="0.95"/><circle cx="12" cy="17" r="1" fill="#fff"/></svg>
      </button>

      <button className={`icon-btn ${active === 'settings' ? 'active' : ''}`} title="Impostazioni" aria-label="Impostazioni" onClick={() => onNavigate('settings')}>
        <svg className="ic-svg ic-gray" viewBox="0 0 24 24" role="img" aria-hidden="true"><path fill="currentColor" d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/><path fill="#fff" opacity="0.06" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-.33-1.82L4.2 13a2 2 0 010-2.83l.06-.06A1.65 1.65 0 005.2 8.3a1.65 1.65 0 00.33-1.82L5.6 6a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 0010.3 4.6 1.65 1.65 0 0012 4V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06A2 2 0 0120.2 6l-.06.06A1.65 1.65 0 0019.4 8.3a1.65 1.65 0 00.33 1.82L19.8 11a2 2 0 010 2.83l-.06.06c-.17.2-.27.45-.34.7z"/></svg>
      </button>
    </nav>
  )
} 
