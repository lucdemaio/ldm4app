import React, { useEffect, useRef, useState } from 'react'
import useTranslator from '../hooks/useTranslator'
import ModelDownloadControls from './ModelDownloadControls'
import './LanguageTranslationPage.css'

const LANGUAGE_CONFIG = {
  en: { name: 'Inglese', emoji: '🇬🇧', nativeName: 'English', color: '#2D5016', flores: 'eng_Latn', model: 'opus' },
  es: { name: 'Spagnolo', emoji: '🇪🇸', nativeName: 'Español', color: '#FF6B35', flores: 'spa_Latn', model: 'opus' },
  fr: { name: 'Francese', emoji: '🇫🇷', nativeName: 'Français', color: '#4169E1', flores: 'fra_Latn', model: 'opus' },
}

// Lingue offline per traduzione real-time
const OFFLINE_LANGS = ['en', 'es', 'fr']

export default function LanguageTranslationPage({ languageCode, onBack }) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [translating, setTranslating] = useState(false)
  const [recording, setRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [isReverse, setIsReverse] = useState(false)
  const [realtimeTranslations, setRealtimeTranslations] = useState({})
  const [apiKeys, setApiKeys] = useState(() => JSON.parse(localStorage.getItem('api-keys') || '{}'))
  const [showApiLanguages, setShowApiLanguages] = useState(false)
  const [selectedApiLanguages, setSelectedApiLanguages] = useState({})
  const debounceRef = useRef(null)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)

  const { translate, error, clearError, loading, progress } = useTranslator()

  const langConfig = LANGUAGE_CONFIG[languageCode]
  if (!langConfig) {
    return <div className="lang-page">Lingua non supportata</div>
  }

  // 🔑 Ascolta i cambi nel localStorage per le chiavi API
  useEffect(() => {
    const handleStorageChange = (event) => {
      // Cambi nel localStorage in questo tab
      if (event.key === 'api-keys' || event === null) {
        const newKeys = JSON.parse(localStorage.getItem('api-keys') || '{}')
        console.log('[LanguageTranslationPage] Chiavi API aggiornate:', newKeys)
        setApiKeys(newKeys)
      }
    }

    // Ascolta cambi da altri tabs
    window.addEventListener('storage', handleStorageChange)
    
    // Ascolta visibility change (quando l'utente ritorna a questo tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const newKeys = JSON.parse(localStorage.getItem('api-keys') || '{}')
        setApiKeys(newKeys)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // NON preload automatico - aspetta che l'utente scelga un metodo
  function handleModelLoaded() {
    console.log('[LanguageTranslationPage] Modello caricato!')
    setModelLoaded(true)
  }

  async function doTranslate(text) {
    if (!text) {
      setOutput('')
      return
    }

    setTranslating(true)
    try {
      if (isReverse) {
        // Traduzione inversa: da lingua a italiano
        const translated = await translate(text, langConfig.flores, 'ita_Latn')
        setOutput(translated)
      } else {
        // Traduzione normale: da italiano a lingua
        const translated = await translate(text, 'ita_Latn', langConfig.flores)
        setOutput(translated)
      }
    } catch (err) {
      setOutput('Errore: ' + (err?.message || String(err)))
    } finally {
      setTranslating(false)
    }
  }

  // 🔥 Traduce testo in tutte le lingue offline simultaneamente
  async function translateToAllOfflineLanguages(text) {
    if (!text || text.length < 2) return;

    try {
      for (const lang of OFFLINE_LANGS) {
        if (lang === languageCode) continue; // Salta la lingua corrente
        
        try {
          const translatedText = await translate(text, 'ita_Latn', LANGUAGE_CONFIG[lang].flores);
          setRealtimeTranslations(prev => ({ ...prev, [lang]: translatedText }));
        } catch (err) {
          console.warn(`[Realtime] Errore traduzione ${lang}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Realtime Translation Error]', err);
    }
  }

  async function handleTranslate() {
    await doTranslate(input)
  }

  function startRecording() {
    console.log('[Recording] Starting...')
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setOutput('❌ Registrazione non supportata dal browser')
      console.error('[Recording] getUserMedia not available')
      return
    }

    // Ferma eventuali registrazioni precedenti
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        console.warn('[Recording] Error stopping previous recorder:', e.message)
      }
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        console.log('[Recording] ✅ Microfono accesso concesso')
        streamRef.current = stream

        try {
          const mediaRecorder = new MediaRecorder(stream)
          mediaRecorderRef.current = mediaRecorder
          const chunks = []

          console.log('[Recording] MediaRecorder creato')

          mediaRecorder.ondataavailable = (e) => {
            console.log('[Recording] Data available:', e.data.size, 'bytes')
            chunks.push(e.data)
          }

          mediaRecorder.onstop = () => {
            console.log('[Recording] ✅ Stopped. Total chunks:', chunks.length)
            if (chunks.length > 0) {
              const blob = new Blob(chunks, { type: 'audio/webm' })
              const url = URL.createObjectURL(blob)
              setAudioBlob(blob)
              setAudioURL(url)
              console.log('[Recording] Audio blob size:', blob.size)
            }
            stream.getTracks().forEach((t) => {
              t.stop()
              console.log('[Recording] Track stopped')
            })
          }

          mediaRecorder.onerror = (e) => {
            console.error('[Recording] ❌ MediaRecorder error:', e.error)
            setOutput('Errore nella registrazione: ' + e.error)
          }

          mediaRecorder.start()
          console.log('[Recording] 🎤 MediaRecorder started')
          setRecording(true)
          setTranscript('')
          setRealtimeTranslations({})

          // SpeechRecognition
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
          if (SpeechRecognition) {
            try {
              const rec = new SpeechRecognition()
              recognitionRef.current = rec
              rec.lang = 'it-IT'
              rec.continuous = true
              rec.interimResults = true
              rec.maxAlternatives = 1

              let collectedText = ''
              let lastResultIndex = 0

              rec.onstart = () => {
                console.log('[SpeechRecognition] 🎤 Started')
                collectedText = ''
                lastResultIndex = 0
              }

              rec.onresult = (ev) => {
                console.log('[SpeechRecognition] Results:', ev.results.length)
                
                let newTranscript = ''
                for (let i = lastResultIndex; i < ev.results.length; i++) {
                  const text = ev.results[i][0].transcript
                  if (ev.results[i].isFinal) {
                    newTranscript += text + ' '
                    console.log('[SpeechRecognition] Final:', text)
                    lastResultIndex = i + 1
                  } else {
                    console.log('[SpeechRecognition] Interim:', text)
                  }
                }
                
                if (newTranscript.trim()) {
                  collectedText += newTranscript
                  const finalText = collectedText.trim()
                  console.log('[SpeechRecognition] Transcript updated:', finalText)
                  setTranscript(finalText)
                  translateToAllOfflineLanguages(finalText)
                }
              }
              
              rec.onerror = (ev) => {
                console.error('[SpeechRecognition] Error:', ev.error)
              }
              
              rec.onend = () => {
                console.log('[SpeechRecognition] Ended')
                setIsTranscribing(false)
                const finalText = collectedText.trim()
                if (finalText) {
                  setTranscript(finalText)
                  setInput(finalText)
                  doTranslate(finalText)
                } else {
                  setOutput('⚠️ Nessun testo catturato')
                }
              }
              
              setIsTranscribing(true)
              rec.start()
              console.log('[SpeechRecognition] 🚀 Listening started')
            } catch (e) {
              console.error('[SpeechRecognition] Exception:', e.message)
              setIsTranscribing(false)
              setOutput('Errore SpeechRecognition: ' + e.message)
            }
          } else {
            console.warn('[SpeechRecognition] Not available in this browser')
          }
        } catch (e) {
          console.error('[Recording] MediaRecorder creation error:', e.message)
          setOutput('Errore MediaRecorder: ' + e.message)
          stream.getTracks().forEach(t => t.stop())
        }
      })
      .catch((err) => {
        console.error('[Recording] ❌ Microfono error:', err.message, err.name)
        let errorMsg = 'Impossibile accedere al microfono'
        if (err.name === 'NotAllowedError') {
          errorMsg = 'Permesso microfono negato. Controlla i permessi del browser.'
        } else if (err.name === 'NotFoundError') {
          errorMsg = 'Nessun microfono disponibile'
        }
        setOutput('❌ ' + errorMsg)
      })
  }

  function stopRecording() {
    console.log('[Recording] Stopping...')
    
    // Ferma MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      console.log('[Recording] MediaRecorder stopped')
    }
    
    // Ferma stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      console.log('[Recording] Stream stopped')
    }
    
    setRecording(false)

    // Ferma SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        console.log('[SpeechRecognition] Stopped')
      } catch (e) {
        console.warn('[SpeechRecognition] Error stopping:', e.message)
      }
      recognitionRef.current = null
    }
  }

  return (
    <>
      {/* BARRA DI CARICAMENTO - FUORI dal div principale */}
      {translating && (
        <div className="loading-bar">
          <span className="loading-bar-text">Traduzione in corso...</span>
        </div>
      )}

      <div className="lang-page" style={{ '--accent-color': langConfig.color }}>
        <button className="back-btn" onClick={onBack} title="Torna alla home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Home
        </button>
        <div className="lang-title">
          <div className="lang-emoji">{langConfig.emoji}</div>
          <div>
            <h1>{langConfig.name}</h1>
            <p className="lang-native">{langConfig.nativeName}</p>
          </div>
          {/* Toggle Bidirezionale */}
          <button
            className={`btn-bidirectional ${isReverse ? 'active' : ''}`}
            onClick={() => setIsReverse(!isReverse)}
            title="Attiva traduzione inversa (Lingua → Italiano)"
          >
            ⇄
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-banner">
          <div className="spinner"></div>
          Caricamento modello ({Math.round(progress)}%)...
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <strong>Errore:</strong> {error}
          <button className="close-btn" onClick={clearError}>✕</button>
        </div>
      )}

      {!modelLoaded ? (
        <ModelDownloadControls 
          languageCode={languageCode}
          languageName={langConfig.name}
          onModelLoaded={handleModelLoaded}
          loading={loading}
        />
      ) : (
        <>
          {loading && (
            <div className="loading-banner">
              <div className="spinner"></div>
              Caricamento modello ({Math.round(progress)}%)...
            </div>
          )}

      <div className="translation-container">
        <div className="translation-card input-card">
          <div className="card-label">Italiano</div>
          <textarea
            className="translation-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi il testo da tradurre..."
          />
          <div className="card-actions">
            <button
              className={`btn recording-btn ${recording ? 'active' : ''}`}
              onClick={() => (recording ? stopRecording() : startRecording())}
            >
              {recording ? (
                <>
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="6"/>
                  </svg>
                  Registra
                </>
              )}
            </button>
            <button className="btn secondary" onClick={() => setInput('')}>Svuota</button>
          </div>
        </div>

        <div className="translation-divider">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M12 3v18"/>
          </svg>
        </div>

        <div className="translation-card output-card">
          <div className="card-label">{langConfig.name}</div>
          
          {/* INDICATORE TRADUZIONE IN CORSO */}
          {translating && (
            <div className="translation-loading">
              <div className="translation-loading-spinner" />
              <span>📝 Traduzione in corso...</span>
            </div>
          )}
          
          <textarea
            className="translation-output"
            value={output}
            readOnly
            placeholder="Il risultato apparirà qui..."
          />
          <div className="card-actions">
            <button
              className="btn primary"
              onClick={handleTranslate}
              disabled={!input || loading || translating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
              }}
            >
              {translating ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                  <span>Traduzione in corso...</span>
                </>
              ) : (
                <>
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18M12 3v18"/>
                  </svg>
                  <span>Traduci</span>
                </>
              )}
            </button>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
            <button
              className="btn secondary"
              onClick={() => {
                if (output) navigator.clipboard.writeText(output).then(() => alert('Copiato!'))
              }}
              disabled={!output}
            >
              Copia
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                if (output) {
                  const text = `${langConfig.name}:\n${output}`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(whatsappUrl, '_blank');
                }
              }}
              disabled={!output}
              title="Condividi su WhatsApp"
            >
              💬 WhatsApp
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                if (output) {
                  const text = `${langConfig.name}:\n${output}`;
                  const telegramUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;
                  window.open(telegramUrl, '_blank');
                }
              }}
              disabled={!output}
              title="Condividi su Telegram"
            >
              ✈️ Telegram
            </button>
          </div>
        </div>
      </div>

      {/* 🌐 SEZIONE LINGUE API */}
      {(apiKeys.grok || apiKeys.gemini) && (
        <div className="api-languages-section">
          <div className="api-section-header">
            <h3>🌐 Traduzioni aggiuntive (con API)</h3>
            <button
              className={`btn-toggle-api ${showApiLanguages ? 'active' : ''}`}
              onClick={() => setShowApiLanguages(!showApiLanguages)}
            >
              {showApiLanguages ? '▼ Nascondi' : '▶ Espandi'}
            </button>
          </div>

          {showApiLanguages && (
            <div className="api-languages-grid">
              {['de', 'it', 'pt', 'ru', 'pl', 'nl', 'ja', 'zh', 'ar'].map(lang => (
                <label key={lang} className="api-lang-checkbox">
                  <input
                    type="checkbox"
                    checked={!!selectedApiLanguages[lang]}
                    onChange={(e) => {
                      setSelectedApiLanguages(prev => ({
                        ...prev,
                        [lang]: e.target.checked ? true : undefined
                      }))
                    }}
                  />
                  <span>{lang === 'de' ? '🇩🇪 Tedesco' : lang === 'it' ? '🇮🇹 Italiano' : lang === 'pt' ? '🇵🇹 Portoghese' : lang === 'ru' ? '🇷🇺 Russo' : lang === 'pl' ? '🇵🇱 Polacco' : lang === 'nl' ? '🇳🇱 Olandese' : lang === 'ja' ? '🇯🇵 Giapponese' : lang === 'zh' ? '🇨🇳 Cinese' : '🌍 Arabo'}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {transcript && (
        <div className="transcript-section">
          <div className="card-label">Trascrizione da audio</div>
          <textarea
            className="transcript-input"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Trascrizione..."
          />
          <button
            className="btn primary"
            onClick={() => doTranslate(transcript)}
            style={{ marginTop: '12px' }}
          >
            Traduci trascrizione
          </button>
        </div>
      )}

      {/* 🔥 TRADUZIONI REAL-TIME IN TUTTE LE LINGUE OFFLINE */}
      {(Object.keys(realtimeTranslations).length > 0 || transcript) && (
        <div className="realtime-translations-section">
          <div className="card-label">📝 Traduzione in tempo reale</div>
          <div className="realtime-grid">
            {OFFLINE_LANGS.map(lang => {
              if (lang === languageCode) return null;
              const config = LANGUAGE_CONFIG[lang];
              return (
                <div key={lang} className="realtime-card" style={{ '--lang-color': config.color }}>
                  <div className="realtime-header">
                    <span className="realtime-emoji">{config.emoji}</span>
                    <span className="realtime-name">{config.name}</span>
                  </div>
                  <div className="realtime-content">
                    {realtimeTranslations[lang] ? (
                      <p>{realtimeTranslations[lang]}</p>
                    ) : (
                      <p style={{ opacity: 0.5, fontStyle: 'italic' }}>In attesa di traduzione...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>
    )}
  </>
  )
}
