import React, { useEffect, useRef, useState } from 'react'
import useTranslator from '../hooks/useTranslator'
import languageMap from '../data/languageMap.json'

export default function TranslationUI() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [srcName, setSrcName] = useState('Autodetect')
  const [tgtName, setTgtName] = useState('Italiano')
  const [translating, setTranslating] = useState(false)
  const debounceRef = useRef(null)

  const { translate, preload, persistStorage, clearModelCache, persisted, loading, progress } = useTranslator()

  // audio recording / STT states
  const [recording, setRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const recognitionRef = useRef(null)
  const languages = ['Autodetect', ...Object.keys(languageMap).sort((a, b) => a.localeCompare(b))]

  function codeFromName(name) {
    if (!name || name === 'Autodetect') return 'und'
    return languageMap[name] || 'und'
  }

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [copied, setCopied] = useState(false)

  // map target language name -> BCP-47 language tag for SpeechSynthesis
  function speakLangFromName(name) {
    if (!name || name === 'Autodetect') return undefined
    const map = {
      Italiano: 'it-IT',
      Inglese: 'en-US',
      Spagnolo: 'es-ES',
      Francese: 'fr-FR',
      Tedesco: 'de-DE',
      Portoghese: 'pt-PT',
      Olandese: 'nl-NL',
      Russo: 'ru-RU',
      'Cinese': 'zh-CN',
      'Cinese (semplicato)': 'zh-CN',
      'Cinese (tradizionale)': 'zh-TW',
      Giapponese: 'ja-JP',
      Coreano: 'ko-KR',
      Arabo: 'ar-SA',
      Hindi: 'hi-IN',
      Turco: 'tr-TR',
      Vietnamita: 'vi-VN',
      Polacco: 'pl-PL',
      Romeno: 'ro-RO',
      Ceco: 'cs-CZ',
      Greco: 'el-GR',
      Svedese: 'sv-SE',
      Norvegese: 'nb-NO',
      Danese: 'da-DK',
      Finlandese: 'fi-FI',
      Ungherese: 'hu-HU',
      Ucraino: 'uk-UA',
      Ebraico: 'he-IL',
      Thailandese: 'th-TH',
      Indonesiano: 'id-ID',
      Malese: 'ms-MY',
      Persiano: 'fa-IR',
      Swahili: 'sw-KE',
      Afrikaans: 'af-ZA'
    }
    return map[name]
  }

  async function doTranslate(text) {
    if (!text) {
      setOutput('')
      return
    }

    setTranslating(true)
    try {
      const srcCode = codeFromName(srcName)
      const tgtCode = codeFromName(tgtName)
      const translated = await translate(text, srcCode, tgtCode)
      setOutput(translated)
    } catch (err) {
      setOutput('Errore: ' + (err?.message || String(err)))
    } finally {
      setTranslating(false)
    }
  }

  // Debounced auto-translate while typing
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!input) {
      setOutput('')
      return
    }
    debounceRef.current = setTimeout(() => {
      doTranslate(input)
    }, 700)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, srcName, tgtName])

  // Cleanup SpeechRecognition on unmount
  useEffect(() => {
    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onresult = null
          recognitionRef.current.onerror = null
          recognitionRef.current.stop && recognitionRef.current.stop()
        }
      } catch (e) {
        /* ignore */
      }
    }
  }, [])

  const sendToWorker = async () => doTranslate(input)
  const preloadModel = async () => { setOutput(''); try { await preload() } catch (err) { setOutput('Errore preload: ' + (err?.message || String(err))) } }

  const swapLanguages = () => {
    setSrcName(tgtName)
    setTgtName(srcName)
  }

  // ----- Recording / Transcription -----
  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setOutput('Registrazione non supportata dal browser')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks = []

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioURL(url)
        // stop all tracks
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start()
      setRecording(true)
      setTranscript('')

      // Try to start SpeechRecognition in parallel (if available)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition()
          recognitionRef.current = rec
          rec.lang = codeToBCP47(codeFromName(srcName)) || 'it-IT'
          rec.interimResults = true
          rec.maxAlternatives = 1

          rec.onresult = (ev) => {
            let interim = ''
            let final = ''
            for (let i = 0; i < ev.results.length; i++) {
              const r = ev.results[i]
              if (r.isFinal) final += r[0].transcript
              else interim += r[0].transcript
            }
            setTranscript((final || interim).trim())
          }
          rec.onerror = () => {
            setIsTranscribing(false)
          }
          rec.onend = () => setIsTranscribing(false)
          setIsTranscribing(true)
          rec.start()
        } catch (e) {
          setIsTranscribing(false)
        }
      }

      // stop recorder after user stops via UI — attach to window for stop action
      // store recorder instance
      window._mediaRecorder = mediaRecorder
    } catch (err) {
      setOutput('Impossibile accedere al microfono: ' + (err?.message || String(err)))
    }
  }

  function stopRecording() {
    try {
      const mr = window._mediaRecorder
      mr && mr.state !== 'inactive' && mr.stop()
    } catch (e) {
      /* ignore */
    }
    setRecording(false)

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    } catch (e) {
      /* ignore */
    }

    setIsTranscribing(false)
  }

  function translateTranscript() {
    if (!transcript) {
      setOutput('Nessuna trascrizione disponibile')
      return
    }
    doTranslate(transcript)
  }

  // helper: convert codeFromName to a BCP-47 tag for SpeechRecognition/Utterance
  function codeToBCP47(code) {
    if (!code) return undefined
    // quick map for the codes we use; fallback undefined
    const map = {
      ita_Latn: 'it-IT',
      eng_Latn: 'en-US',
      spa_Latn: 'es-ES',
      fra_Latn: 'fr-FR',
      deu_Latn: 'de-DE'
    }
    return map[code]
  }

  // --- Export / share helpers ---
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function exportToPDF() {
    if (!output) return
    const footer = 'creato da www.ldm4app.com'
    const safe = escapeHtml(output)
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Traduzione — PDF export</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial;padding:24px;color:#111}pre{white-space:pre-wrap;font-size:14px;line-height:1.45}.footer{margin-top:36px;font-size:12px;color:#666;text-align:right}@media print{body{margin:0}}</style></head><body><pre>${safe}</pre><div class="footer">${footer}</div></body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  function shareWhatsApp() {
    if (!output) return
    const text = `${output}\n\ncreato da www.ldm4app.com`
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  function shareTelegram() {
    if (!output) return
    const text = `${output}\n\ncreato da www.ldm4app.com`
    const url = `https://t.me/share/url?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="label">Input</div>
            <div className="small-muted" style={{ marginTop: 6 }}>Inserisci o incolla qui il testo da tradurre</div>
            <div style={{ marginTop: 8 }}>
              <select className="select-control" value={srcName} onChange={(e) => setSrcName(e.target.value)} aria-label="Lingua sorgente">
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="card-actions">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div className="count">{input.trim() ? `${input.trim().split(/\s+/).length} parole • ${input.length} caratteri` : '0 parole'}</div>
                </div>
              </div>
              <button className="btn small" onClick={() => setInput('')} title="Svuota input">✕</button>
            </div>
          </div>
        </div>

        <textarea className="input-area" value={input} onChange={(e) => setInput(e.target.value)} />

        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={`btn ${recording ? 'primary' : ''}`} onClick={() => (recording ? stopRecording() : startRecording())} aria-pressed={recording}>
              {recording ? (
                <>
                  <svg className="btn-icon ic-red" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>
                  Stop
                </>
              ) : (
                <>
                  <svg className="btn-icon ic-red" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>
                  Registra
                </>
              )}
            </button>
            <button className="btn" onClick={() => { if (audioURL) window.open(audioURL) }} disabled={!audioURL}>
              <svg className="btn-icon ic-indigo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 3v18l15-9L5 3z"/></svg>
              Apri audio
            </button>
            <button className="btn" onClick={() => { if (audioURL) { const a = document.createElement('a'); a.href = audioURL; a.download = 'recording.webm'; a.click() } }} disabled={!audioURL}>
              <svg className="btn-icon ic-green" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14v-2H5v2z"/></svg>
              Scarica audio
            </button>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn small" onClick={swapLanguages} title="Inverti lingue">
              <svg className="btn-icon ic-gray" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 7l10 0M7 7l4-4m-4 4l4 4M17 17l-10 0M17 17l-4 4m4-4l-4-4"/></svg>
            </button>

            <button className="btn primary" onClick={sendToWorker} disabled={!input || loading || translating}>
              <svg className="btn-icon ic-indigo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 12h8l-3-3 1.4-1.4L15 12l-5.6 5.4L6 16l5-4H3z"/></svg>
              Traduci
            </button>
          </div>


        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="label">Output</div>
            <div className="small-muted" style={{ marginTop: 6 }}>Risultato della traduzione</div>
            <div style={{ marginTop: 8 }}>
              <select className="select-control" value={tgtName} onChange={(e) => setTgtName(e.target.value)} aria-label="Lingua destinazione">
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="card-actions">
            <button className="btn small" onClick={async () => { if (!output) return; await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1400) }} disabled={!output} title="Copia risultato">
              <svg className="btn-icon ic-indigo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 1H4a2 2 0 00-2 2v12h2V3h12V1zM19 5H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm-1 12H9V9h9v8z"/></svg>
              Copia
            </button>

            <button className="btn small" onClick={() => { if (!output) return; const blob = new Blob([output + "\n\ncreato da www.ldm4app.com"], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'translation.txt'; a.click(); URL.revokeObjectURL(url); }} disabled={!output} title="Scarica risultato">
              <svg className="btn-icon ic-green" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3v10m0 0l4-4m-4 4l-4-4M5 21h14v-2H5v2z"/></svg>
              Scarica
            </button>

            <button className="btn small" onClick={exportToPDF} disabled={!output} title="Esporta PDF">
              <svg className="btn-icon ic-gray" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 2h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"/><path fill="#fff" d="M13 3v5h5" opacity="0.9"/></svg>
              PDF
            </button>

            <button className="btn small" onClick={shareWhatsApp} disabled={!output} title="Condividi su WhatsApp">
              <svg className="btn-icon ic-whatsapp" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11.9 11.9 0 0012 0C5.373 0 0 5.373 0 12c0 2.115.555 4.091 1.612 5.865L0 24l6.48-1.695A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-1.957-.487-3.8-1.5-5.5zM12 21.5c-1.93 0-3.73-.524-5.28-1.43l-.38-.225L4.5 20l.832-1.94-.234-.4A9.5 9.5 0 0112 2.5c5.246 0 9.5 4.254 9.5 9.5S17.246 21.5 12 21.5z"/></svg>
              WhatsApp
            </button>

            <button className="btn small" onClick={shareTelegram} disabled={!output} title="Condividi su Telegram">
              <svg className="btn-icon ic-telegram" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 3.1L3.9 10.4c-.6.2-.6.6-.1.8l3 1.1 1.1 3c.2.5.5.5.9.3l2.6-1.7 4.6 2.9c.8.4 1.5.1 1.7-.8L24 4c.2-.9-.6-1.3-1.4-1z"/></svg>
              Telegram
            </button>

            <div style={{ width: 8 }} />
            <div className="small-muted">{copied ? 'Copiato!' : ''}</div>
          </div>
        </div>

        <div className={`output-area ${(loading || translating) ? 'shimmer' : ''}`}>
          {(!output && !loading && !translating) ? (
            <div className="small-muted">Risultato della traduzione apparirà qui</div>
          ) : (
            <textarea className="input-area" value={output} readOnly placeholder="Risultato della traduzione" style={{ minHeight: 140, whiteSpace: 'pre-wrap' }} />
          )}
        </div>

        <div className="small-muted" style={{ marginTop: 8, textAlign: 'right' }}>creato da www.ldm4app.com</div>

        {/* Transcription / audio preview */}
        <div style={{ marginTop: 12 }}>
          <div className="label">Trascrizione (da audio)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <textarea className="input-area" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder={isTranscribing ? 'Trascrizione in corso…' : 'Qui comparirà la trascrizione (se supportata)'} style={{ minHeight: 100 }} />
            </div>

            <div style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {audioURL ? <audio src={audioURL} controls style={{ width: '100%' }} /> : <div className="small-muted">Nessuna registrazione</div>}
              <button className="btn primary" onClick={translateTranscript} disabled={!transcript}>
              <svg className="btn-icon ic-indigo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 12h8l-3-3 1.4-1.4L15 12l-5.6 5.4L6 16l5-4H3z"/></svg>
              Traduci trascrizione
            </button>
            </div>
          </div>
        </div>

        {/* TTS controls */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <button
            className="btn"
            onClick={() => {
              // handle speak / pause / resume
              if (!('speechSynthesis' in window)) {
                setOutput('TTS non supportato nel browser.')
                return
              }

              if (!output) return

              if (speechSynthesis.speaking && !speechSynthesis.paused) {
                // pause
                speechSynthesis.pause()
                setIsPaused(true)
                return
              }

              if (speechSynthesis.speaking && speechSynthesis.paused) {
                // resume
                speechSynthesis.resume()
                setIsPaused(false)
                return
              }

              // start speaking
              speechSynthesis.cancel()
              const utter = new SpeechSynthesisUtterance(output)
              const langTag = speakLangFromName(tgtName)
              if (langTag) utter.lang = langTag
              utter.rate = 1
              utter.pitch = 1

              utter.onend = () => {
                setIsSpeaking(false)
                setIsPaused(false)
              }
              utter.onerror = () => {
                setIsSpeaking(false)
                setIsPaused(false)
              }

              setIsSpeaking(true)
              setIsPaused(false)
              speechSynthesis.speak(utter)
            }}
            disabled={!output}
            aria-label="Ascolta traduzione"
          >
            {isSpeaking ? (
              isPaused ? (
                <><svg className="btn-icon ic-indigo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>Riprendi</>
              ) : (
                <><svg className="btn-icon ic-indigo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>Pausa</>
              )
            ) : (
              <><svg className="btn-icon ic-indigo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 9v6h4l5 4V5L9 9H5z"/></svg>Ascolta</>
            )}
          </button>

          <button
            className="btn"
            onClick={() => {
              if ('speechSynthesis' in window) {
                speechSynthesis.cancel()
              }
              setIsSpeaking(false)
              setIsPaused(false)
            }}
            disabled={!isSpeaking}
          >
            <svg className="btn-icon ic-red" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>
            Stop
          </button>

          <div style={{ marginLeft: 'auto' }} className="small-muted">
            {isSpeaking ? (isPaused ? 'In pausa' : 'In riproduzione') : 'TTS: pronto'}
          </div>
        </div>
      </div>
    </div>
  )
}
