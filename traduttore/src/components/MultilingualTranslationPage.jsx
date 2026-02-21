import React, { useState, useEffect, useRef } from 'react'
import './MultilingualTranslationPage.css'

// 30+ Lingue supportate
const LANGUAGES_MAP = {
  de: { name: 'Tedesco', emoji: '🇩🇪', nativeName: 'Deutsch', code: 'de-DE' },
  en: { name: 'Inglese', emoji: '🇬🇧', nativeName: 'English', code: 'en-US' },
  es: { name: 'Spagnolo', emoji: '🇪🇸', nativeName: 'Español', code: 'es-ES' },
  fr: { name: 'Francese', emoji: '🇫🇷', nativeName: 'Français', code: 'fr-FR' },
  pt: { name: 'Portoghese', emoji: '🇵🇹', nativeName: 'Português', code: 'pt-BR' },
  ru: { name: 'Russo', emoji: '🇷🇺', nativeName: 'Русский', code: 'ru-RU' },
  pl: { name: 'Polacco', emoji: '🇵🇱', nativeName: 'Polski', code: 'pl-PL' },
  nl: { name: 'Olandese', emoji: '🇳🇱', nativeName: 'Nederlands', code: 'nl-NL' },
  ja: { name: 'Giapponese', emoji: '🇯🇵', nativeName: '日本語', code: 'ja-JP' },
  zh: { name: 'Cinese', emoji: '🇨🇳', nativeName: '中文', code: 'zh-CN' },
  ar: { name: 'Arabo', emoji: '🇸🇦', nativeName: 'العربية', code: 'ar-SA' },
  ko: { name: 'Coreano', emoji: '🇰🇷', nativeName: '한국어', code: 'ko-KR' },
  tr: { name: 'Turco', emoji: '🇹🇷', nativeName: 'Türkçe', code: 'tr-TR' },
  th: { name: 'Tailandese', emoji: '🇹🇭', nativeName: 'ไทย', code: 'th-TH' },
  it: { name: 'Italiano', emoji: '🇮🇹', nativeName: 'Italiano', code: 'it-IT' },
  sv: { name: 'Svedese', emoji: '🇸🇪', nativeName: 'Svenska', code: 'sv-SE' },
  da: { name: 'Danese', emoji: '🇩🇰', nativeName: 'Dansk', code: 'da-DK' },
  fi: { name: 'Finlandese', emoji: '🇫🇮', nativeName: 'Suomi', code: 'fi-FI' },
  no: { name: 'Norvegese', emoji: '🇳🇴', nativeName: 'Norsk', code: 'nb-NO' },
  cs: { name: 'Ceco', emoji: '🇨🇿', nativeName: 'Čeština', code: 'cs-CZ' },
  hu: { name: 'Ungherese', emoji: '🇭🇺', nativeName: 'Magyar', code: 'hu-HU' },
  ro: { name: 'Rumeno', emoji: '🇷🇴', nativeName: 'Română', code: 'ro-RO' },
  el: { name: 'Greco', emoji: '🇬🇷', nativeName: 'Ελληνικά', code: 'el-GR' },
  he: { name: 'Ebraico', emoji: '🇮🇱', nativeName: 'עברית', code: 'he-IL' },
  vi: { name: 'Vietnamita', emoji: '🇻🇳', nativeName: 'Tiếng Việt', code: 'vi-VN' },
  id: { name: 'Indonesiano', emoji: '🇮🇩', nativeName: 'Bahasa Indonesia', code: 'id-ID' },
  ms: { name: 'Malese', emoji: '🇲🇾', nativeName: 'Bahasa Melayu', code: 'ms-MY' },
  tl: { name: 'Tagalog', emoji: '🇵🇭', nativeName: 'Tagalog', code: 'fil-PH' },
  uk: { name: 'Ucraino', emoji: '🇺🇦', nativeName: 'Українська', code: 'uk-UA' },
}

export default function MultilingualTranslationPage() {
  const [input, setInput] = useState('')
  const [selectedLangs, setSelectedLangs] = useState([])
  const [translations, setTranslations] = useState({})
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')
  
  // Voice Recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState({})
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)

  // Leggi le lingue da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const langs = params.get('langs')?.split(',') || []
    setSelectedLangs(langs)
  }, [])

  // ===== VOICE RECORDING =====
  async function startRecording() {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setRecordedAudio(audioBlob)
        // Trascrivi automaticamente
        transcribeAudio(audioBlob)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      setError('❌ Errore accesso microfono: ' + err.message)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  // ===== SPEECH-TO-TEXT (Web Speech API) =====
  function transcribeAudio(audioBlob) {
    // Usa Web Speech API per riconoscimento vocale browser-nativo
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('❌ Speech Recognition non supportato nel tuo browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'it-IT'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => console.log('[Speech-to-Text] Ascolto in corso...')
    
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      console.log('[Speech-to-Text] ✅ Testo riconosciuto:', transcript)
      setInput(transcript)
    }
    
    recognition.onerror = (event) => {
      console.error('[Speech-to-Text] ❌ Errore:', event.error)
      if (event.error !== 'no-speech') {
        setError(`❌ Errore riconoscimento vocale: ${event.error}`)
      }
    }
    
    recognition.onend = () => console.log('[Speech-to-Text] ✅ Fine ascolto')

    recognition.start()
  }

  // ===== TEXT-TO-SPEECH =====
  function speakTranslation(text, lang) {
    if (isSpeaking[lang]) {
      window.speechSynthesis.cancel()
      setIsSpeaking(prev => ({ ...prev, [lang]: false }))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = LANGUAGES_MAP[lang]?.code || 'it-IT'
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onstart = () => {
      setIsSpeaking(prev => ({ ...prev, [lang]: true }))
      console.log(`[TTS] 🔊 Leggendo ${LANGUAGES_MAP[lang]?.name}...`)
    }
    
    utterance.onend = () => {
      setIsSpeaking(prev => ({ ...prev, [lang]: false }))
      console.log(`[TTS] ✅ Fine lettura`)
    }
    
    utterance.onerror = (err) => {
      setIsSpeaking(prev => ({ ...prev, [lang]: false }))
      console.error('[TTS] ❌ Errore:', err)
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  // ===== TRADUZIONE (stesso backend di prima) =====
  async function translateWithMyMemory(text, targetLang) {
    const langCodeMap = {
      de: 'de', en: 'en', es: 'es', fr: 'fr', pt: 'pt-BR', ru: 'ru', pl: 'pl',
      nl: 'nl', ja: 'ja', zh: 'zh-CN', ar: 'ar', ko: 'ko', tr: 'tr', th: 'th',
      it: 'it', sv: 'sv', da: 'da', fi: 'fi', no: 'no-NO', cs: 'cs', hu: 'hu',
      ro: 'ro', el: 'el', he: 'he', vi: 'vi', id: 'id', ms: 'ms', tl: 'tl',
      uk: 'uk'
    }
    
    const langCode = langCodeMap[targetLang] || targetLang
    
    try {
      console.log(`[MyMemory] 🔄 Traduzione verso ${targetLang}`)
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=it|${langCode}`
      const response = await fetch(url)

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      if (data.responseStatus !== 200) throw new Error(`Errore ${data.responseStatus}`)
      const translated = data.translatedText?.trim()
      
      if (!translated || translated === text) {
        throw new Error('Testo vuoto')
      }

      console.log(`[MyMemory] ✅ Tradotto`)
      return translated
    } catch (err) {
      console.warn(`[MyMemory] Fallito:`, err.message)
      throw err
    }
  }

  async function translateWithBackend(text, targetLang) {
    try {
      console.log(`[Backend] 📡 Connessione al backend`)
      
      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/translate'
        : 'https://ldm4app-backend.onrender.com/api/translate'
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target: targetLang }),
        timeout: 8000
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      if (!data.translatedText) throw new Error('Risposta vuota')
      console.log(`[Backend] ✅ Tradotto`)
      return data.translatedText
    } catch (err) {
      console.warn(`[Backend] Fallito:`, err.message)
      throw err
    }
  }

  async function handleTranslate() {
    if (!input.trim()) {
      setError('❌ Inserisci il testo da tradurre')
      return
    }

    if (!selectedLangs.length) {
      setError('❌ Nessuna lingua selezionata')
      return
    }

    setTranslating(true)
    setError('')
    setTranslations({})

    console.log('[Translation] 🚀 Inizio traduzione')
    console.log('[Translation] Lingue:', selectedLangs)

    try {
      for (const lang of selectedLangs) {
        try {
          console.log(`[Traduzione] Verso ${lang}...`)
          let translated = null

          // Priority 1: MyMemory
          try {
            translated = await translateWithMyMemory(input, lang)
          } catch {
            // Priority 2: Backend
            translated = await translateWithBackend(input, lang)
          }

          if (translated) {
            setTranslations(prev => ({ ...prev, [lang]: translated }))
          }
        } catch (err) {
          console.error(`[${lang}] ❌ Errore:`, err.message)
          setTranslations(prev => ({ ...prev, [lang]: `❌ Errore: ${err.message}` }))
        }
      }
      
      console.log('[Translation] ✅ Completata')
    } catch (err) {
      setError('❌ Errore: ' + err.message)
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div className="multilingue-translate-page">
      {/* Header Mobile-Friendly */}
      <div className="translate-header">
        <button 
          className="back-btn"
          onClick={() => window.location.href = window.location.origin + import.meta.env.BASE_URL}
        >
          ← Home
        </button>
        <div className="header-title">
          <h1>🌐 Traduzioni</h1>
        </div>
      </div>

      <div className="translate-container">
        {/* Input Section */}
        <div className="translate-input-section">
          <label className="input-label">Testo italiano</label>
          <textarea
            className="translate-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi o registra audio..."
            disabled={translating || isRecording}
          />
          
          {/* Voice Controls - Mobile Optimized */}
          <div className="voice-controls">
            <button
              className={`btn-voice ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={translating}
              title={isRecording ? 'Ferma registrazione' : 'Inizia registrazione'}
            >
              {isRecording ? '⏹️ Ferma' : '🎤 Registra'}
            </button>
            
            <button
              className="btn-transcribe"
              onClick={() => transcribeAudio(null)}
              disabled={translating || isRecording}
              title="Riconosci voce"
            >
              🎙️ Ascolta
            </button>
          </div>

          {/* Main Translate Button */}
          <button
            className="btn-translate-main"
            onClick={handleTranslate}
            disabled={translating || !input.trim() || isRecording}
          >
            {translating ? '⏳ Traduzione...' : '🚀 Traduci'}
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Results Grid - Mobile Responsive */}
        {Object.keys(translations).length > 0 && (
          <div className="translations-grid">
            {selectedLangs.map(lang => {
              const config = LANGUAGES_MAP[lang] || { name: lang, emoji: '🌍' }
              const text = translations[lang] || ''
              return (
                <div key={lang} className="translation-result-card">
                  <div className="result-header">
                    <span className="result-emoji">{config.emoji}</span>
                    <div className="result-lang-info">
                      <div className="result-lang-name">{config.name}</div>
                      <div className="result-lang-native">{config.nativeName}</div>
                    </div>
                  </div>
                  
                  <div className="result-text">{text}</div>
                  
                  {/* Action Buttons */}
                  <div className="result-buttons">
                    <button
                      className={`btn-speak ${isSpeaking[lang] ? 'active' : ''}`}
                      onClick={() => !text.includes('❌') && speakTranslation(text, lang)}
                      title={isSpeaking[lang] ? 'Stop audio' : 'Riproduci audio'}
                      disabled={text.includes('❌')}
                    >
                      {isSpeaking[lang] ? '⏹️ Stop' : '🔊 Ascolta'}
                    </button>
                    
                    <button
                      className="btn-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(text)
                        alert('✅ Copiato!')
                      }}
                      disabled={text.includes('❌')}
                    >
                      📋 Copia
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
