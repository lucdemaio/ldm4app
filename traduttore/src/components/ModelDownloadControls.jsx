import React, { useRef, useState } from 'react'
import './ModelDownloadControls.css'

export default function ModelDownloadControls({ languageCode, languageName, onModelLoaded, loading }) {
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const LANGUAGE_CODES_MAP = {
    es: 'it-es',
    fr: 'it-fr',
    ru: 'it-ru',
    en: 'it-en',
    de: 'it-de-m2m',
    pt: 'it-pt-m2m',
    nl: 'it-nl-m2m',
    pl: 'it-pl-m2m',
  }

  const languagePair = LANGUAGE_CODES_MAP[languageCode]

  // 1. Scarica file nel computer dell'utente
  async function handleDownloadFile() {
    setDownloading(true)
    try {
      // PRIMA: chiedi all'utente dove salvare il file
      const metadataBlob = new Blob([
        JSON.stringify({
          timestamp: new Date().toISOString(),
          languagePair: languagePair,
        }, null, 2)
      ], { type: 'application/json' })

      let fileHandle = null
      let shouldDownload = false

      // Tenta di usare la File System Access API (Chrome, Edge, Opera)
      if ('showSaveFilePicker' in window) {
        try {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: `opus-${languagePair}-metadata.json`,
            types: [{
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] }
            }]
          })
          shouldDownload = true
        } catch (err) {
          if (err.name === 'AbortError') {
            console.log('Salvataggio annullato dall\'utente')
            setDownloading(false)
            return
          } else {
            throw err
          }
        }
      } else {
        // Fallback: chiedi conferma per download automatico
        const userConfirmed = window.confirm(
          '🚀 Scaricherò il modello Opus-MT (Apache 2.0, ~300MB).\n\nClicca OK per continuare, Annulla per fermarsi.'
        )
        if (!userConfirmed) {
          setDownloading(false)
          return
        }
        shouldDownload = true
      }

      // DOPO: scarica il modello solo se l'utente ha confermato
      if (shouldDownload) {
        console.log('[ModelDownloadControls] Scaricamento Opus-MT...') 
        
        // Usa window.TransformerAPI con NLLB-200
        if (window.TransformerAPI?.load) {
          await window.TransformerAPI.load(languagePair)
        } else {
          throw new Error('TransformerAPI non disponibile')
        }

        // Salva il file metadata
        if (fileHandle) {
          const writable = await fileHandle.createWritable()
          await writable.write(metadataBlob)
          await writable.close()
        } else {
          // Fallback: download standard
          const url = URL.createObjectURL(metadataBlob)
          const a = document.createElement('a')
          a.href = url
          a.download = `opus-${languagePair}-metadata.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }

        alert(`✅ Modello ${languageName} scaricato e file metadata salvato!\nIl modello è ora in cache nel browser.`)
        onModelLoaded()
      }
    } catch (err) {
      alert('❌ Errore: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  // 2. Carica file da file system dell'utente
  async function handleUploadFile() {
    // Tenta di usare la File System Access API (Chrome, Edge, Opera)
    if ('showOpenFilePicker' in window) {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] }
          }]
        })
        const file = await fileHandle.getFile()
        await processUploadedFile(file)
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Selezione file annullata dall\'utente')
        } else {
          alert('Errore nella selezione del file: ' + err.message)
        }
      }
    } else {
      // Fallback per browser che non supportano showOpenFilePicker
      fileInputRef.current?.click()
    }
  }

  async function processUploadedFile(file) {
    setUploading(true)
    try {
      // Leggi il file come testo
      const text = await file.text()
      const metadata = JSON.parse(text)

      if (metadata.languagePair !== languagePair) {
        alert(`⚠️ Attenzione: il file è per la coppia ${metadata.languagePair}, non per ${languagePair}`)
      }

      // Carica il modello da CDN (il file era solo metadati)
      if (window.TransformerAPI?.load) {
        await window.TransformerAPI.load(languagePair)
        alert(`✅ Modello ${languageName} caricato dal file!`)
        onModelLoaded()
      }
    } catch (err) {
      alert('Errore nel caricamento del file: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // 3. Scarica direttamente su IndexedDB
  async function handleDownloadToIndexedDB() {
    if (loading) return

    try {
      // Carica il modello con persist=true
      if (window.TransformerAPI?.loadAndPersist) {
        await window.TransformerAPI.loadAndPersist(languagePair)
        alert(`✅ Modello ${languageName} salvato in IndexedDB!\nProssimaccessione sarà più veloce.`)
        onModelLoaded()
      }
    } catch (err) {
      alert('Errore nel salvataggio su IndexedDB: ' + err.message)
    }
  }

  return (
    <div className="download-controls">
      <div className="download-header">
        <h2>Scarica il modello di traduzione</h2>
        <p>Seleziona il metodo di scaricamento per {languageName}</p>
      </div>

      <div className="download-buttons">
        <button
          className="download-btn primary"
          onClick={handleDownloadFile}
          disabled={downloading || loading}
          title="Scarica il modello come file nel tuo computer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9H13V5.5h-2V11H8.5l3.5 3.5 3.5-3.5z"/>
          </svg>
          <span>Scarica File</span>
          <small>(~300MB)</small>
        </button>

        <button
          className="download-btn secondary"
          onClick={handleUploadFile}
          disabled={uploading || loading}
          title="Carica un modello da file precedentemente scaricato"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-9h2.5V7h2v4h2.5L12 14.5 8.5 11z"/>
          </svg>
          <span>Carica File</span>
          <small>(da disco)</small>
        </button>

        <button
          className="download-btn success"
          onClick={handleDownloadToIndexedDB}
          disabled={downloading || uploading || loading}
          title="Scarica direttamente nel browser (IndexedDB) - più veloce per il futuro"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
          </svg>
          <span>Scarica su IndexedDB</span>
          <small>(browser)</small>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processUploadedFile(file)
          e.target.value = '' // Reset input
        }}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <div className="download-info">
        <div className="info-box">
          <strong>💾 Scarica File:</strong>
          <p>Salva il modello nel tuo computer (utile per backup/condivisione)</p>
        </div>
        <div className="info-box">
          <strong>📂 Carica File:</strong>
          <p>Utilizza un modello scaricato precedentemente dal tuo computer</p>
        </div>
        <div className="info-box">
          <strong>⚡ IndexedDB:</strong>
          <p>Scarica nel browser - accesso più veloce in futuro, dati offline persistenti</p>
        </div>
      </div>
    </div>
  )
}
