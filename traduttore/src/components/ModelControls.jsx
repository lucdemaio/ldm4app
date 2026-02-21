import React, { useState, useEffect } from 'react'

export default function ModelControls() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const [loadingMode, setLoadingMode] = useState(null)

  // Determina il percorso del browser
  const getStoragePath = () => {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('win')) {
      return `C:\\Users\\[TuoNome]\\AppData\\Local\\${ua.includes('chrome') ? 'Google\\Chrome' : ua.includes('edge') ? 'Microsoft\\Edge' : 'Mozilla Firefox'}\\IndexedDB\\`
    } else if (ua.includes('mac')) {
      return `~/Library/Application Support/${ua.includes('chrome') ? 'Google/Chrome' : ua.includes('edge') ? 'Microsoft Edge' : 'Firefox'}/IndexedDB/`
    } else {
      return `~/.config/${ua.includes('chrome') ? 'google-chrome' : ua.includes('edge') ? 'microsoft-edge' : 'firefox'}/IndexedDB/`
    }
  }

  useEffect(() => {
    // Ascolta gli eventi dal transformer-loader
    const handleReady = () => {
      console.log('[ModelControls] Transformer ready')
      setStatus('✅ Modello pronto per la traduzione')
      setLoading(false)
      setProgress(100)
      setError(null)
      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setStatus('')
        setProgress(0)
      }, 5000)
    }

    const handleError = (e) => {
      console.log('[ModelControls] Transformer error:', e.detail?.error)
      setError(e.detail?.error?.message || 'Errore nel caricamento')
      setLoading(false)
      setProgress(0)
    }

    window.addEventListener('transformer:ready', handleReady)
    window.addEventListener('transformer:error', handleError)

    return () => {
      window.removeEventListener('transformer:ready', handleReady)
      window.removeEventListener('transformer:error', handleError)
    }
  }, [])

  const handleDownloadOnly = async () => {
    setLoadingMode('download')
    setError(null)
    setStatus('⬇️ Scaricamento modello...')
    setLoading(true)
    setProgress(0)
    try {
      if (window.TransformerAPI && window.TransformerAPI.loadSessionOnly) {
        await window.TransformerAPI.loadSessionOnly()
      }
    } catch (err) {
      console.error('Errore caricamento sessione:', err)
      setError(err.message)
      setProgress(0)
    } finally {
      setLoadingMode(null)
    }
  }

  const handleLoadIndexedDB = async () => {
    setLoadingMode('indexed')
    setError(null)
    setStatus(`💾 Scaricamento da HuggingFace CDN...`)
    setLoading(true)
    setProgress(0)
    try {
      if (window.TransformerAPI && window.TransformerAPI.loadAndPersist) {
        await window.TransformerAPI.loadAndPersist()
      }
    } catch (err) {
      console.error('Errore caricamento IndexedDB:', err)
      setError(err.message)
      setProgress(0)
    } finally {
      setLoadingMode(null)
    }
  }

  const handleSessionOnly = async () => {
    setLoadingMode('session')
    setError(null)
    setStatus('⚡ Caricamento per sessione...')
    setLoading(true)
    setProgress(0)
    try {
      if (window.TransformerAPI && window.TransformerAPI.loadSessionOnly) {
        await window.TransformerAPI.loadSessionOnly()
      }
    } catch (err) {
      console.error('Errore caricamento sessione:', err)
      setError(err.message)
      setProgress(0)
    } finally {
      setLoadingMode(null)
    }
  }

  const isLoading = loading || loadingMode !== null

  return (
    <div className="model-controls">
      <div className="controls-group">
        <button 
          className="btn btn-primary"
          onClick={handleDownloadOnly}
          disabled={isLoading}
          title="Scarica il modello da HuggingFace CDN (salvataggio temporaneo)"
        >
          {isLoading && loadingMode === 'download' ? '⏳ Scaricando...' : '⬇️ Scarica modello'}
        </button>
        
        <button 
          className="btn btn-success"
          onClick={handleLoadIndexedDB}
          disabled={isLoading}
          title={`Scarica e salva il modello su disco: ${getStoragePath()}`}
        >
          {isLoading && loadingMode === 'indexed' ? '💾 Salvando su PC...' : '💾 Salva su PC (IndexedDB)'}
        </button>
        
        <button 
          className="btn btn-info"
          onClick={handleSessionOnly}
          disabled={isLoading}
          title="Carica il modello solo durante questa sessione (non salvato)"
        >
          {isLoading && loadingMode === 'session' ? '⏳ Caricando...' : '⚡ Sessione corrente'}
        </button>
      </div>

      <div className="model-info" style={{ marginTop: '12px', fontSize: '0.85rem', color: '#666', lineHeight: '1.5' }}>
        <strong>ℹ️ Come funziona:</strong><br/>
        • <strong>Scarica modello:</strong> Scarica da HuggingFace CDN (temporaneo per questa sessione)<br/>
        • <strong>Salva su PC:</strong> Scarica da HuggingFace e salva in IndexedDB del tuo browser (~1.5GB su disco)<br/>
        • <strong>Sessione:</strong> Usa solo la RAM, non salva nulla<br/>
        <em>Il modello non viene mai caricato su ldm4app.com</em>
      </div>

      {status && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '0.95rem', color: '#0f1724', marginBottom: '8px', fontWeight: '500' }}>
            {status}
          </div>
          
          {progress > 0 && progress < 100 && (
            <div style={{ marginTop: '10px' }}>
              {/* Barra progress grande e visibile */}
              <div style={{ 
                width: '100%', 
                height: '12px', 
                background: '#e5e7eb', 
                borderRadius: '6px', 
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(2,6,23,0.1)'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  transition: 'width 0.3s ease',
                  borderRadius: '6px',
                  boxShadow: '0 0 10px rgba(59,130,246,0.5)'
                }} />
              </div>
              {/* Percentuale sotto */}
              <div style={{ 
                marginTop: '8px', 
                fontSize: '0.9rem', 
                color: '#0f1724',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Scaricamento in corso...</span>
                <strong style={{ fontSize: '1.1rem', color: '#3b82f6' }}>{progress}%</strong>
              </div>
            </div>
          )}

          {progress === 100 && (
            <div style={{ 
              marginTop: '8px',
              fontSize: '0.95rem',
              color: '#10b981',
              fontWeight: '500',
              padding: '10px',
              background: 'rgba(16,185,129,0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(16,185,129,0.3)'
            }}>
              ✅ Completato! Modello pronto per la traduzione.
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: '12px', 
          color: '#dc2626', 
          fontSize: '0.9rem',
          padding: '10px',
          background: 'rgba(220,38,38,0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(220,38,38,0.2)'
        }}>
          ❌ {error}
        </div>
      )}

      {loadingMode === 'indexed' && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(99,102,241,0.1)',
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#4f46e5',
          lineHeight: '1.6',
          borderLeft: '4px solid #4f46e5'
        }}>
          <strong>📁 Destinazione di salvataggio:</strong><br/>
          <code style={{ 
            fontSize: '0.75rem', 
            color: '#666',
            display: 'block',
            marginTop: '6px',
            padding: '8px',
            background: '#f3f4f6',
            borderRadius: '4px',
            overflowX: 'auto',
            border: '1px solid #e5e7eb'
          }}>
            {getStoragePath()}
          </code><br/>
          <em style={{ fontSize: '0.8rem', color: '#666', marginTop: '6px', display: 'block' }}>
            Il modello sarà disponibile offline dopo il primo scaricamento (circa 1-1.5GB).
          </em>
        </div>
      )}
    </div>
  )
}
