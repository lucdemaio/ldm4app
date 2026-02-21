import React, { useState, useEffect } from 'react'
import './APIKeysManager.css'

export default function APIKeysManager({ onKeysUpdate, isOpen, onClose }) {
  const [grokKey, setGrokKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [validating, setValidating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Carica le chiavi salvate
    const saved = JSON.parse(localStorage.getItem('api-keys') || '{}')
    setGrokKey(saved.grok || '')
    setGeminiKey(saved.gemini || '')
  }, [isOpen])

  const handleSave = async () => {
    setValidating(true)
    setMessage('')

    try {
      const keys = {
        grok: grokKey.trim(),
        gemini: geminiKey.trim(),
      }

      // Salva le chiavi
      localStorage.setItem('api-keys', JSON.stringify(keys))
      
      setMessage('✅ Chiavi salvate con successo!')
      if (onKeysUpdate) {
        onKeysUpdate(keys)
      }
      
      setTimeout(onClose, 2000)
    } catch (err) {
      setMessage('❌ Errore nel salvataggio: ' + err.message)
    } finally {
      setValidating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="api-keys-overlay">
      <div className="api-keys-modal">
        <div className="modal-header">
          <h2>🔑 Configura le chiavi API</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          <p className="info-text">
            Aggiungi le chiavi API gratuite per sbloccare traduzioni in più lingue.
          </p>

          {/* Grok API Key */}
          <div className="key-input-group">
            <label>
              <span className="service-name">🤖 Grok API (X.AI)</span>
              <p className="service-desc">Veloce e affidabile per traduzioni</p>
            </label>
            <input
              type="password"
              placeholder="Incolla la tua chiave Grok qui..."
              value={grokKey}
              onChange={(e) => setGrokKey(e.target.value)}
              disabled={validating}
            />
            <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="get-key-link">
              → Ottieni gratis su console.x.ai
            </a>
          </div>

          {/* Gemini API Key */}
          <div className="key-input-group">
            <label>
              <span className="service-name">✨ Gemini API (Google)</span>
              <p className="service-desc">Modello avanzato Google con tier gratuito</p>
            </label>
            <input
              type="password"
              placeholder="Incolla la tua chiave Gemini qui..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              disabled={validating}
            />
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="get-key-link">
              → Ottieni gratis su AI Studio
            </a>
          </div>

          {/* Message */}
          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {/* Info */}
          <div className="info-box">
            <strong>ℹ️ Con le chiavi API puoi:</strong>
            <ul>
              <li>✅ Tradurre in tutte le lingue (non solo 3)</li>
              <li>✅ Traduzione bidirezionale</li>
              <li>✅ Qualità maggiore su testi lunghi</li>
              <li>✅ Nessun limite offline</li>
            </ul>
            <p style={{ marginTop: '12px', fontSize: '0.85rem', opacity: 0.8 }}>
              <strong>Nota:</strong> Le chiavi rimangono nel tuo browser e non vengono inviate ai nostri server.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={validating}>
            Annulla
          </button>
          <button className="btn-save" onClick={handleSave} disabled={validating}>
            {validating ? '⏳ Salvataggio...' : '💾 Salva chiavi'}
          </button>
        </div>
      </div>
    </div>
  )
}
