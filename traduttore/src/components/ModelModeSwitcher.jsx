import React, { useEffect, useState } from 'react'

export default function ModelModeSwitcher() {
  const [mobileMode, setMobileMode] = useState(false)
  const [currentModel, setCurrentModel] = useState('mbart')

  useEffect(() => {
    // Rilevazione mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setMobileMode(isMobile)
  }, [])

  useEffect(() => {
    // Ascolta i cambiamenti di modello
    const handleModelChanged = (e) => {
      setCurrentModel(e.detail.model)
    }
    
    window.addEventListener('transformer:model-changed', handleModelChanged)
    
    return () => window.removeEventListener('transformer:model-changed', handleModelChanged)
  }, [])

  const handleToggleModel = async () => {
    const newModel = currentModel === 'mbart' ? 'opus' : 'mbart'
    
    if (window.TransformerAPI && window.TransformerAPI.setModel) {
      try {
        await window.TransformerAPI.setModel(newModel)
        setCurrentModel(newModel)
      } catch (err) {
        console.error('Errore nel cambio modello:', err)
      }
    }
  }

  return (
    <div style={{
      marginTop: '16px',
      padding: '12px',
      background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.1) 100%)',
      borderRadius: '8px',
      border: '1px solid rgba(16,185,129,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        {mobileMode && (
          <span style={{
            fontSize: '0.75rem',
            background: '#f59e0b',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            📱 MOBILE
          </span>
        )}
        
        <strong style={{ fontSize: '0.9rem', color: '#0f1724' }}>
          🤖 Modalità modello:
        </strong>
        
        <button
          onClick={handleToggleModel}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(99,102,241,0.3)',
            background: currentModel === 'mbart' ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.15)',
            color: currentModel === 'mbart' ? '#4f46e5' : '#16a34a',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
          title="Clicca per cambiare tra mBART (qualità) e Opus-MT (velocità)"
        >
          {currentModel === 'mbart' ? (
            <>💎 mBART-50 (1.5GB, multilingue)</>
          ) : (
            <>⚡ Opus-MT (100MB, leggero)</>
          )}
        </button>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#666', lineHeight: '1.5' }}>
        {currentModel === 'mbart' ? (
          <>
            <strong>mBART-50:</strong> Modello grande e potente, ottimo per qualità. Consigliato per desktop.<br/>
            Scaricamento: ~1.5GB | Lingue: Italiano ↔ Inglese ↔ Tedesco
          </>
        ) : (
          <>
            <strong>Opus-MT:</strong> Modello leggero, perfetto per mobile. Scarca più velocemente.<br/>
            Scaricamento: ~100MB per coppia di lingue | Lingue: Italiano ↔ Inglese ↔ Tedesco
          </>
        )}
      </div>

      {mobileMode && currentModel === 'mbart' && (
        <div style={{
          marginTop: '8px',
          padding: '6px 8px',
          background: '#fef3c7',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: '#92400e',
          border: '1px solid #fcd34d'
        }}>
          ⚠️ <strong>Su mobile, considera Opus-MT</strong> per minore spazio (100MB vs 1.5GB) e scaricamento più veloce.
        </div>
      )}
    </div>
  )
}
