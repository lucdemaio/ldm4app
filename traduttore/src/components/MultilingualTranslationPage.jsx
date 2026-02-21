import React, { useState, useEffect } from 'react'
import './MultilingualTranslationPage.css'

const LANGUAGES_MAP = {
  de: { name: 'Tedesco', emoji: '🇩🇪', nativeName: 'Deutsch' },
  pt: { name: 'Portoghese', emoji: '🇵🇹', nativeName: 'Português' },
  ru: { name: 'Russo', emoji: '🇷🇺', nativeName: 'Русский' },
  pl: { name: 'Polacco', emoji: '🇵🇱', nativeName: 'Polski' },
  nl: { name: 'Olandese', emoji: '🇳🇱', nativeName: 'Nederlands' },
  ja: { name: 'Giapponese', emoji: '🇯🇵', nativeName: '日本語' },
  zh: { name: 'Cinese', emoji: '🇨🇳', nativeName: '中文' },
  ar: { name: 'Arabo', emoji: '🇸🇦', nativeName: 'العربية' },
  ko: { name: 'Coreano', emoji: '🇰🇷', nativeName: '한국어' },
  tr: { name: 'Turco', emoji: '🇹🇷', nativeName: 'Türkçe' },
  hi: { name: 'Hindi', emoji: '🇮🇳', nativeName: 'हिंदी' },
  th: { name: 'Tailandese', emoji: '🇹🇭', nativeName: 'ไทย' },
}

export default function MultilingualTranslationPage() {
  const [input, setInput] = useState('')
  const [selectedLangs, setSelectedLangs] = useState([])
  const [translations, setTranslations] = useState({})
  const [translating, setTranslating] = useState(false)
  const [apiKeys, setApiKeys] = useState(() => JSON.parse(localStorage.getItem('api-keys') || '{}'))
  const [error, setError] = useState('')

  // Leggi le lingue da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const langs = params.get('langs')?.split(',') || []
    setSelectedLangs(langs)
  }, [])

  // Listener per chiavi API
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'api-keys' || event === null) {
        const newKeys = JSON.parse(localStorage.getItem('api-keys') || '{}')
        setApiKeys(newKeys)
      }
    }

    window.addEventListener('storage', handleStorageChange)
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

  // Backend API - Chiamata al server proxy (DISABILITATO: libretranslate.de API non più disponibile)
  async function translateWithBackend(text, targetLang) {
    throw new Error('Backend non disponibile - usare MyMemory')
  }

  // MyMemory API - Fallback locale
  async function translateWithMyMemory(text, targetLang) {
    // Mappa dei codici lingua supportati da MyMemory
    const langCodeMap = {
      de: 'de',
      pt: 'pt-BR',
      ru: 'ru',
      pl: 'pl',
      nl: 'nl',
      ja: 'ja',
      zh: 'zh-CN',
      ar: 'ar',
      ko: 'ko',
      tr: 'tr',
      hi: 'hi',
      th: 'th'
    }
    
    const langCode = langCodeMap[targetLang] || targetLang
    
    try {
      console.log(`[MyMemory] 🔄 Traduzione verso ${targetLang}`)
      
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=it|${langCode}`
      
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`[MyMemory] HTTP Error: ${response.status}`)
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.responseStatus !== 200) {
        console.warn(`[MyMemory] API Error: ${data.responseStatus}`)
        throw new Error(data.responseDetails || `Errore ${data.responseStatus}`)
      }

      const translated = data.translatedText?.trim()
      
      if (!translated || translated === text) {
        // Se ritorna vuoto o il testo originale, prova con EN come intermediario
        console.warn(`[MyMemory] Risultato vuoto per IT|${langCode}, provo EN|${langCode}`)
        throw new Error('Testo vuoto - prova intermediario EN')
      }

      console.log(`[MyMemory] ✅ Tradotto`)
      return translated
    } catch (err) {
      console.warn(`[MyMemory] Non disponibile:`, err.message)
      throw err
    }
  }

  // MyMemory con Inglese come intermediario: IT → EN (browser) → targetLang (MyMemory)
  async function translateWithMyMemoryChain(text, targetLang) {
    try {
      console.log(`[MyMemory-Chain] 🔄 Traduzione via EN intermediario: IT → EN → ${targetLang}`)
      
      const langCodeMap = {
        de: 'de',
        pt: 'pt-BR',
        ru: 'ru',
        pl: 'pl',
        nl: 'nl',
        ja: 'ja',
        zh: 'zh-CN',
        ar: 'ar',
        ko: 'ko',
        tr: 'tr',
        hi: 'hi',
        th: 'th'
      }
      
      const langCode = langCodeMap[targetLang] || targetLang

      // Step 1: Traduce IT → EN usando MyMemory
      console.log(`[MyMemory-Chain] Step 1: IT → EN`)
      const url1 = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=it|en`
      
      const response1 = await fetch(url1)
      if (!response1.ok) throw new Error(`HTTP ${response1.status}`)
      
      const data1 = await response1.json()
      if (data1.responseStatus !== 200) throw new Error('MyMemory IT→EN fallito')
      
      let englishText = data1.translatedText?.trim()
      if (!englishText) throw new Error('Testo IT→EN vuoto')
      
      console.log(`[MyMemory-Chain] ✓ EN intermediario: "${englishText}"`)

      // Step 2: Traduce EN → targetLang usando MyMemory
      console.log(`[MyMemory-Chain] Step 2: EN → ${targetLang}`)
      const url2 = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(englishText)}&langpair=en|${langCode}`
      
      const response2 = await fetch(url2)
      if (!response2.ok) throw new Error(`HTTP ${response2.status}`)
      
      const data2 = await response2.json()
      if (data2.responseStatus !== 200) throw new Error('MyMemory EN→target fallito')
      
      let translated = data2.translatedText?.trim()
      if (!translated) throw new Error('Testo EN→target vuoto')
      
      console.log(`[MyMemory-Chain] ✅ Tradotto via EN`)
      return translated
    } catch (err) {
      console.warn(`[MyMemory-Chain] Fallito:`, err.message)
      throw err
    }
  }

  // Fallback Backend - Usa il server Node.js come proxy
  async function translateWithBackend(text, targetLang) {
    try {
      console.log(`[Backend] 📡 Fallback al server proxy`)
      
      // In development: tenta localhost:3001
      // In production: tenta Render.com backend
      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/translate'
        : 'https://ldm4app-backend.onrender.com/api/translate'
      
      console.log(`[Backend] Tentando connessione a: ${backendUrl}`)
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          target: targetLang
        }),
        timeout: 8000
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.translatedText) {
        throw new Error('Backend risposta vuota')
      }

      console.log(`[Backend] ✅ Tradotto`)
      return data.translatedText
    } catch (err) {
      console.warn(`[Backend] Fallito:`, err.message)
      throw err
    }
  }

  // Fallback Simpl e - Mostra istruzioni se nessun servizio disponibile
  async function showSetupInstructions(lang) {
    throw new Error(
      `❌ Nessun servizio di traduzione configurato per ${lang}.\n\n` +
      `📝 Soluzione:\n` +
      `1. In development: assicurati che il backend Node.js sia in esecuzione (npm run backend)\n` +
      `2. In production: configura il backend Node.js su www.ldm4app.com\n\n` +
      `Backend: npm run backend (localhost:3001)\n` +
      `Controlla i log della console per più dettagli.`
    )
  }

  // Fallback Apertium - API pubblica open source, gratuita
  // Usa un CORS proxy per evitare il blocco CORS del browser
  async function translateWithApertium(text, targetLang) {
    try {
      console.log(`[Apertium] 🔓 Fallback API Apertium (open source + CORS proxy)`)
      
      const langCodeMap = {
        de: 'deu',
        pt: 'por',
        ru: 'rus',
        pl: 'pol',
        nl: 'nld',
        ja: 'jpn',
        zh: 'zho',
        ar: 'ara',
        ko: 'kor',
        tr: 'tur',
        hi: 'hin',
        th: 'tha'
      }
      
      const langCode = langCodeMap[targetLang] || targetLang

      // Usa un CORS proxy pubblico per aggirare il CORS blocking
      // cors-anywhere.herokuapp.com è uno dei CORS proxy più usati
      const apertiumUrl = `https://apertium.projectjj.com/apy/translate?langpair=ita|${langCode}&q=${encodeURIComponent(text)}`
      const corsProxyUrl = `https://cors-anywhere.herokuapp.com/${apertiumUrl}`
      
      const response = await fetch(corsProxyUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.translatedText) {
        throw new Error('Apertium risposta vuota')
      }

      let translated = data.translatedText.trim()
      
      if (!translated) {
        throw new Error('Testo vuoto da Apertium')
      }

      console.log(`[Apertium] ✅ Tradotto`)
      return translated
    } catch (err) {
      console.warn(`[Apertium] Fallito:`, err.message)
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
    console.log('[Translation] Testo:', input.substring(0, 50) + '...')

    try {
      const results = {}

      for (const lang of selectedLangs) {
        try {
          console.log(`\n[Translation] Traduzione verso ${lang}...`)
          let translated = null

          // Priority 1: MyMemory diretto (IT → targetLang)
          try {
            translated = await translateWithMyMemory(input, lang)
            console.log(`[${lang}] ✅ Tradotto con MyMemory`)
          } catch (err) {
            console.warn(`[${lang}] ⚠️ MyMemory diretto fallito, provo catena EN intermediario`)
            
            // Priority 2: MyMemory Chain (IT → EN → targetLang)
            try {
              translated = await translateWithMyMemoryChain(input, lang)
              console.log(`[${lang}] ✅ Tradotto con MyMemory-Chain`)
            } catch (chainErr) {
              console.warn(`[${lang}] ⚠️ MyMemory-Chain fallito, provo Yandex Translate`)
              
              // Priority 3: Backend Server (LibreTranslate via proxy Node.js)
              try {
                translated = await translateWithBackend(input, lang)
                console.log(`[${lang}] ✅ Tradotto con Backend`)
              } catch (backendErr) {
                console.warn(`[${lang}] ⚠️ Backend fallito, provo MyMemory Chain alternativo...`)
                
                // Priority 4: MyMemory Chain alternativo (EN → target via MyMemory)
                try {
                  console.log(`[${lang}] 🔄 MyMemory Chain alternativo: IT → EN → ${lang}`)
                  
                  // Step 1: Traduci IT → EN usando MyMemory
                  const enResponse = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=it|en`
                  )
                  const enData = await enResponse.json()
                  const enText = enData?.responseData?.translatedText
                  
                  if (!enText || enText === input) {
                    throw new Error('EN translation vuota')
                  }
                  
                  // Step 2: Traduci EN → target usando MyMemory
                  const targetResponse = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(enText)}&langpair=en|${lang}`
                  )
                  const targetData = await targetResponse.json()
                  translated = targetData?.responseData?.translatedText
                  
                  if (!translated) {
                    throw new Error('Target translation vuota')
                  }
                  
                  console.log(`[${lang}] ✅ Tradotto con MyMemory Chain alternativo`)
                } catch (chainErr) {
                  console.warn(`[${lang}] ⚠️ MyMemory Chain fallito, nessun'altra soluzione disponibile`)
                  console.error(`[${lang}] ❌ Errore traduzione:`, chainErr.message)
                  try {
                    await showSetupInstructions(lang)
                  } catch (setupErr) {
                    throw setupErr
                  }
                }
              }
            }
          }

          if (!translated) {
            throw new Error('Nessun servizio di traduzione disponibile')
          }

          results[lang] = translated
          setTranslations(prev => ({ ...prev, [lang]: translated }))
        } catch (err) {
          console.error(`[${lang}] ❌ Errore:`, err.message)
          setTranslations(prev => ({ ...prev, [lang]: `❌ Errore: ${err.message}` }))
        }
      }
      
      console.log('[Translation] ✅ Traduzione completata')
    } catch (err) {
      console.error('[Translation] ❌ Errore generale:', err.message)
      setError('❌ Errore nella traduzione: ' + err.message)
    } finally {
      setTranslating(false)
    }
  }

  const hasNoKeys = !apiKeys.grok && !apiKeys.gemini

  return (
    <div className="multilingue-translate-page">
      {/* Header */}
      <div className="translate-header">
        <button 
          className="back-btn"
          onClick={() => window.location.href = window.location.origin + import.meta.env.BASE_URL}
          title="Torna alla home"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Home
        </button>
        <div className="header-title">
          <div className="header-emoji">🌐</div>
          <h1>Traduzioni Multilingue</h1>
        </div>
      </div>

      <div className="translate-container">
        <div className="translate-input-section">
          <label className="input-label">Testo italiano</label>
          <textarea
            className="translate-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi il testo in italiano da tradurre..."
            disabled={translating}
          />
          <button
            className="btn-translate-main"
            onClick={handleTranslate}
            disabled={translating || !input.trim()}
          >
            {translating ? '⏳ Traduzione in corso...' : '🚀 Traduci'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {Object.keys(translations).length > 0 && (
          <div className="translations-grid">
            {selectedLangs.map(lang => {
              const config = LANGUAGES_MAP[lang] || { name: lang, emoji: '🌍' }
              return (
                <div key={lang} className="translation-result-card">
                  <div className="result-header">
                    <span className="result-emoji">{config.emoji}</span>
                    <div className="result-lang-info">
                      <div className="result-lang-name">{config.name}</div>
                      <div className="result-lang-native">{config.nativeName}</div>
                    </div>
                  </div>
                  <div className="result-text">
                    {translations[lang]}
                  </div>
                  <button
                    className="btn-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(translations[lang])
                      alert('✅ Copiato!')
                    }}
                  >
                    📋 Copia
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
