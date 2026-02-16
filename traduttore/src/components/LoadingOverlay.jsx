import React from 'react'
import '../styles/LoadingOverlay.css'

export default function LoadingOverlay({ loading, progress, status, error }) {
  // Non mostrare nulla se non c'è attività
  if (!loading && status === 'idle' && !error) return null

  return (
    <div className="loading-overlay">
      {/* Barra di progresso in alto */}
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Overlay semi-trasparente con messaggio */}
      {loading && (
        <div className="loading-modal">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h3 className="loading-title">Caricamento modello...</h3>
            <p className="loading-status">
              {status === 'loading' ? 'Scaricamento e inizializzazione NLLB-200' : status}
            </p>
            <div className="progress-container">
              <div className="progress-percentage">{progress}%</div>
              <div className="progress-bg">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <p className="loading-hint">
              {progress < 30 && 'Preparazione ambiente...'}
              {progress >= 30 && progress < 70 && 'Scaricamento modello IA...'}
              {progress >= 70 && progress < 100 && 'Inizializzazione parser...'}
              {progress >= 100 && 'Completato!'}
            </p>
          </div>
        </div>
      )}

      {/* Messaggio di errore */}
      {error && !loading && (
        <div className="error-banner">
          <div className="error-content">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-12H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-5zm0 0V5a2 2 0 012-2h0a2 2 0 012 2v2m-6 0V5a2 2 0 00-2 2v2" />
            </svg>
            <div className="error-text">
              <strong>Errore nel caricamento</strong>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status ready */}
      {status === 'ready' && !loading && !error && (
        <div className="success-banner">
          <div className="success-content">
            <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="success-text">
              <strong>Modello caricato!</strong>
              <p>NLLB-200 pronto all'uso</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
