import React, { useState } from 'react'
import './HomePage.css'
import APIKeysManager from './APIKeysManager'

export default function HomePage({ onSelectLanguage }) {
  const [showAPIModal, setShowAPIModal] = useState(false)
  
  // Lingue offline (ONNX locale)
  const offlineLanguages = [
    { code: 'en', name: 'Inglese', emoji: '🇬🇧', color: '#2D5016', type: 'offline' },
    { code: 'es', name: 'Spagnolo', emoji: '🇪🇸', color: '#FF6B35', type: 'offline' },
    { code: 'fr', name: 'Francese', emoji: '🇫🇷', color: '#4169E1', type: 'offline' },
  ]

  return (
    <div className="home-page">
      <div className="home-header">
        <svg className="home-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7V12C2 18.627 7.373 24 12 24C16.627 24 22 18.627 22 12V7L12 2Z"/>
          <circle cx="12" cy="10" r="2" fill="currentColor"/>
          <path d="M12 13V18"/>
        </svg>
        <h1>TRADUZIONI</h1>
        <p className="home-subtitle">www.ldm4app.com</p>
        <p className="home-description">Seleziona la lingua in cui desideri tradurre da italiano</p>
      </div>

      {/* Sezione Offline (sempre disponibile) */}
      <div className="section-title">
        <span>⚡ Traduzioni Offline (sempre disponibili)</span>
      </div>
      <div className="languages-grid">
        {offlineLanguages.map((lang) => (
          <button
            key={lang.code}
            className="language-card offline"
            onClick={() => onSelectLanguage(lang.code)}
            style={{ '--accent-color': lang.color }}
          >
            <div className="language-emoji">{lang.emoji}</div>
            <div className="language-name">{lang.name}</div>
            <div className="language-info">Modello locale ~100MB</div>
          </button>
        ))}
      </div>

      <div className="home-footer">
        <p>💡 Traduzioni bidirezionali: italiano ↔ lingua</p>
        <p>🎤 Registra audio e traduci istantaneamente</p>
        <p>🔒 Dati privati - rimangono nel browser</p>
        
        {/* Pulsante API Keys - Multilingue */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid rgba(255,255,255,0.2)' }}>
          <p style={{ marginBottom: '12px', opacity: 0.8 }}>🔓 Vuoi sbloccare più lingue?</p>
          <button
            onClick={() => window.location.href = `${import.meta.env.BASE_URL}multilingue.html`}
            className="btn-unlock-api"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            🌐 Traduzioni Multilingue (con API)
          </button>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '8px' }}>
            Seleziona le lingue e traduci con Grok/Gemini
          </p>
          
          <button
            onClick={() => setShowAPIModal(true)}
            className="btn-unlock-api"
            style={{ marginTop: '12px', background: 'rgba(255,255,255,0.2)' }}
          >
            🔑 Configura chiavi API
          </button>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '8px' }}>
            Gratis: tier free disponibili per Grok e Gemini
          </p>
        </div>

        {/* Social Share */}
        <div className="share-section" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ marginBottom: '12px' }}>📱 Condividi questa app:</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const url = window.location.href;
                const text = 'Traduci da italiano in moltissime lingue direttamente dal browser - offline e gratuito!';
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
              }}
              style={{
                padding: '10px 16px',
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              💬 WhatsApp
            </button>
            <button
              onClick={() => {
                const url = window.location.href;
                const text = 'Traduci da italiano in moltissime lingue direttamente dal browser - offline e gratuito!';
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
              }}
              style={{
                padding: '10px 16px',
                background: '#0088cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              ✈️ Telegram
            </button>
          </div>
        </div>
      </div>

      {/* Modal API Keys */}
      <APIKeysManager 
        isOpen={showAPIModal} 
        onClose={() => setShowAPIModal(false)}
      />
    </div>
  )
}
