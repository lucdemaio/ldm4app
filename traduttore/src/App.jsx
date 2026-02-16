import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TranslationUI from './components/TranslationUI'
import Help from './components/Help'
import LoadingOverlay from './components/LoadingOverlay'
import LoadingDebug from './components/LoadingDebug'
import useTranslator from './hooks/useTranslator'

export default function App() {
  const [view, setView] = useState('translate')
  const { preload, persistStorage, clearModelCache, persisted, loading, progress, status, error } = useTranslator()
  
  // NOTA: non avviare più il download automatico al mount —
  // l'utente può scaricare il modello manualmente e poi premere "Carica modello".
  useEffect(() => {
    // intentionally empty: preload must be avviato manualmente dall'utente
    console.log('[App] mounted — automatic preload disabled')
  }, [])

  const downloadModel = async () => {
    try {
      await preload()
    } catch (e) {
      // ignore - hook shows errors elsewhere
    }
  }

  const saveModel = async () => {
    try {
      await preload()
      await persistStorage()
    } catch (e) {
      // ignore
    }
  }

  const clearCache = async () => {
    try {
      await clearModelCache()
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="app-shell">
      {/* Overlay di caricamento con barra progress */}
      <LoadingOverlay loading={loading} progress={progress} status={status} error={error} />
      
      {/* Debug panel (visible con tasto in basso a destra) */}
      <LoadingDebug loading={loading} progress={progress} status={status} error={error} />

      <aside className="sidebar">
        <Sidebar active={view} onNavigate={setView} />
      </aside>

      <main className="app-main">
        <div className="header">
          <div className="title">Traduzioni Ldm4app</div>

          <div style={{ marginLeft: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* link per scaricare il modello (apre la pagina del modello su Hugging Face) */}
            <a className="btn" href="https://huggingface.co/Xenova/nllb-200-distilled-600M" target="_blank" rel="noopener noreferrer" title="Scarica il modello (nllb-200)">
              <svg className="btn-icon ic-green" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3v10m0 0l4-4m-4 4l-4-4M5 21h14v-2H5v2z"/></svg>
              Scarica modello
            </a>

            {/* pulsante manuale richiesto dall'utente: avvia il caricamento/gestionale */}
            <button className="btn primary" onClick={downloadModel} disabled={loading} title="Carica modello">
              <svg className="btn-icon ic-indigo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2l7 4v6c0 5-3.6 9.7-7 11-3.4-1.3-7-6-7-11V6l7-4z"/></svg>
              Carica modello
            </button>

            <button className="btn" onClick={saveModel} disabled={loading} title="Salva sul dispositivo">
              <svg className="btn-icon ic-indigo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2l7 4v6c0 5-3.6 9.7-7 11-3.4-1.3-7-6-7-11V6l7-4z"/></svg>
              Salva sul dispositivo
            </button>

            <button className="btn" onClick={clearCache} disabled={loading} title="Pulisci cache">
              <svg className="btn-icon ic-gray" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 7h12v13a2 2 0 01-2 2H8a2 2 0 01-2-2V7z"/><path fill="#fff" d="M9 3h6v2H9z" opacity="0.9"/></svg>
              Pulisci cache
            </button>

            <div className="kv small-muted" style={{ marginLeft: 12 }}>
              {loading ? `Caricamento: ${progress}%` : `Persisted: ${persisted ? '✓' : '—'}`}
            </div>
          </div>

          <div style={{ marginLeft: 'auto' }} className="kv small-muted">{view === 'translate' ? 'Traduci' : view === 'help' ? 'Guida' : view}</div>
        </div>

        {view === 'translate' && <TranslationUI />}
        {view === 'help' && <Help />}
      </main>
    </div>
  )
}  
