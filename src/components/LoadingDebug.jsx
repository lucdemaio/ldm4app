import React, { useState, useEffect } from 'react'
import '../styles/LoadingDebug.css'

export default function LoadingDebug({ loading, progress, status, error }) {
  const [logs, setLogs] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  // Log dei cambiamenti di stato
  useEffect(() => {
    console.log('[LoadingDebug state]', { loading, progress, status, error })
    
    const msg = []
    if (loading) msg.push(`⏳ Loading: ${progress}%`)
    if (status && status !== 'idle') msg.push(`📊 Status: ${status}`)
    if (error) msg.push(`❌ Error: ${error}`)

    if (msg.length > 0) {
      setLogs((prev) => {
        const newLogs = [
          { time: new Date().toLocaleTimeString(), message: msg.join(' | ') },
          ...prev
        ]
        return newLogs.slice(0, 20) // Mantieni ultimi 20 log
      })
    }
  }, [loading, progress, status, error])

  // Auto-mostra il debug se c'è un errore o durante caricamento
  useEffect(() => {
    if (error || loading) setIsVisible(true)
  }, [error, loading])

  return (
    <>
      {/* Toggle button */}
      <button 
        className="debug-toggle"
        onClick={() => setIsVisible(!isVisible)}
        title="Toggle debug log"
      >
        {isVisible ? '▼' : '▶'}
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="debug-panel">
          <div className="debug-header">
            <h4>🔍 Debug - Model Loading Status</h4>
            <button className="close-btn" onClick={() => setIsVisible(false)}>✕</button>
          </div>

          <div className="debug-info">
            <div className="info-row">
              <span className="label">Loading:</span>
              <span className={`value ${loading ? 'active' : ''}`}>{loading ? '⏳ YES' : '✓ NO'}</span>
            </div>
            <div className="info-row">
              <span className="label">Progress:</span>
              <span className="value">{progress}%</span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span className="value">{status}</span>
            </div>
            {error && (
              <div className="info-row error">
                <span className="label">Error:</span>
                <span className="value">{error}</span>
              </div>
            )}
          </div>

          <div className="debug-logs">
            <h5>Activity Log:</h5>
            <div className="logs-container">
              {logs.length === 0 ? (
                <p className="no-logs">Waiting for activity...</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="log-entry">
                    <span className="log-time">{log.time}</span>
                    <span className="log-msg">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
