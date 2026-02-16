import React from 'react'
import useTranslator from '../hooks/useTranslator'

export default function Help() {
  const { preload, persistStorage, persisted, loading, progress } = useTranslator()

  const saveDevice = async () => {
    await preload()
    const ok = await persistStorage()
    // no direct UI state here, persisted will update via hook
    return ok
  }

  return (
    <div className="card">
      <div className="label">Motore Locale — Introduzione e Istruzioni</div>

      <section>
        <h3 style={{ margin: '6px 0' }}>Perché è meglio di Google Translate</h3>
        <ul style={{ marginTop: 8 }}>
          <li><strong>Privacy 100%</strong>: i tuoi dati non lasciano mai il computer.</li>
          <li><strong>Zero Costi</strong>: nessuna chiave API o abbonamento richiesto.</li>
          <li><strong>Offline Ready</strong>: funziona anche in aereo o senza connessione (dopo il primo avvio).</li>
        </ul>
      </section>

      <section style={{ marginTop: 12 }}>
        <h3 style={{ margin: '6px 0' }}>Istruzioni operative (Step‑by‑Step)</h3>
        <ol style={{ marginTop: 8 }}>
          <li><strong>Primo Avvio</strong>: al primo accesso il sistema scaricherà il modello NLLB (≈200–600MB). Vedrai una barra di caricamento. Una volta completato, il motore rimarrà residente nel browser.</li>
          <li><strong>Selezione Lingue</strong>: scegli la lingua di origine e quella di destinazione dal menu a tendina.</li>
          <li><strong>Traduzione</strong>: scrivi o incolla il testo nel campo di sinistra. La traduzione apparirà a destra man mano che digiti (debounced processing).</li>
          <li><strong>Gestione Risorse</strong>: se il PC rallenta, puoi mettere in pausa il motore AI dal tasto <code>Power</code> in basso a sinistra.</li>
        </ol>
      </section>

      <div style={{ marginTop: 16 }} className="controls">
        <div className="small-muted">I controlli per scaricare/salvare/pulire la cache si trovano ora nella barra in alto a destra.</div>
        <div style={{ marginLeft: 'auto' }} className="kv small-muted">{loading ? `Caricamento: ${progress}%` : `Persisted: ${persisted ? '✓' : '—'}`}</div>
      </div>

      <div style={{ marginTop: 12 }} className="small-muted">Nota: il primo download richiede spazio su disco e tempo (200–600MB). Dopo la prima esecuzione, il modello viene servito dalla cache e può funzionare offline.</div>
    </div>
  )
}
