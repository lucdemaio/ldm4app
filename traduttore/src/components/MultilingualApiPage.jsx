import React, { useState, useEffect, useRef } from 'react'
import APIKeysManager from './APIKeysManager'
import './MultilingualApiPage.css'

const API_LANGUAGES = [
  { code: 'de', name: 'Tedesco', emoji: '🇩🇪', color: '#000000', nativeName: 'Deutsch', voiceCode: 'de-DE' },
  { code: 'en', name: 'Inglese', emoji: '🇬🇧', color: '#002868', nativeName: 'English', voiceCode: 'en-US' },
  { code: 'es', name: 'Spagnolo', emoji: '🇪🇸', color: '#C60B1E', nativeName: 'Español', voiceCode: 'es-ES' },
  { code: 'fr', name: 'Francese', emoji: '🇫🇷', color: '#002395', nativeName: 'Français', voiceCode: 'fr-FR' },
  { code: 'pt', name: 'Portoghese', emoji: '🇵🇹', color: '#009900', nativeName: 'Português', voiceCode: 'pt-BR' },
  { code: 'ru', name: 'Russo', emoji: '🇷🇺', color: '#FF3333', nativeName: 'Русский', voiceCode: 'ru-RU' },
  { code: 'pl', name: 'Polacco', emoji: '🇵🇱', color: '#FFFFFF', nativeName: 'Polski', voiceCode: 'pl-PL' },
  { code: 'nl', name: 'Olandese', emoji: '🇳🇱', color: '#FF6600', nativeName: 'Nederlands', voiceCode: 'nl-NL' },
  { code: 'ja', name: 'Giapponese', emoji: '🇯🇵', color: '#BC002D', nativeName: '日本語', voiceCode: 'ja-JP' },
  { code: 'zh', name: 'Cinese', emoji: '🇨🇳', color: '#DE2910', nativeName: '中文', voiceCode: 'zh-CN' },
  { code: 'ar', name: 'Arabo', emoji: '🇸🇦', color: '#006C00', nativeName: 'العربية', voiceCode: 'ar-SA' },
  { code: 'ko', name: 'Coreano', emoji: '🇰🇷', color: '#C60C30', nativeName: '한국어', voiceCode: 'ko-KR' },
  { code: 'tr', name: 'Turco', emoji: '🇹🇷', color: '#E30A17', nativeName: 'Türkçe', voiceCode: 'tr-TR' },
  { code: 'th', name: 'Tailandese', emoji: '🇹🇭', color: '#002868', nativeName: 'ไทย', voiceCode: 'th-TH' },
  { code: 'it', name: 'Italiano', emoji: '🇮🇹', color: '#00B242', nativeName: 'Italiano', voiceCode: 'it-IT' },
  { code: 'sv', name: 'Svedese', emoji: '🇸🇪', color: '#0066CC', nativeName: 'Svenska', voiceCode: 'sv-SE' },
  { code: 'da', name: 'Danese', emoji: '🇩🇰', color: '#C8102E', nativeName: 'Dansk', voiceCode: 'da-DK' },
  { code: 'fi', name: 'Finlandese', emoji: '🇫🇮', color: '#003580', nativeName: 'Suomi', voiceCode: 'fi-FI' },
  { code: 'no', name: 'Norvegese', emoji: '🇳🇴', color: '#BA0C2F', nativeName: 'Norsk', voiceCode: 'nb-NO' },
  { code: 'cs', name: 'Ceco', emoji: '🇨🇿', color: '#FFFFFF', nativeName: 'Čeština', voiceCode: 'cs-CZ' },
  { code: 'hu', name: 'Ungherese', emoji: '🇭🇺', color: '#CE2B37', nativeName: 'Magyar', voiceCode: 'hu-HU' },
  { code: 'ro', name: 'Rumeno', emoji: '🇷🇴', color: '#002DA0', nativeName: 'Română', voiceCode: 'ro-RO' },
  { code: 'el', name: 'Greco', emoji: '🇬🇷', color: '#0D5EBE', nativeName: 'Ελληνικά', voiceCode: 'el-GR' },
  { code: 'he', name: 'Ebraico', emoji: '🇮🇱', color: '#0038B8', nativeName: 'עברית', voiceCode: 'he-IL' },
  { code: 'vi', name: 'Vietnamita', emoji: '🇻🇳', color: '#CE1126', nativeName: 'Tiếng Việt', voiceCode: 'vi-VN' },
  { code: 'id', name: 'Indonesiano', emoji: '🇮🇩', color: '#FF0000', nativeName: 'Bahasa Indonesia', voiceCode: 'id-ID' },
  { code: 'ms', name: 'Malese', emoji: '🇲🇾', color: '#FF0000', nativeName: 'Bahasa Melayu', voiceCode: 'ms-MY' },
  { code: 'tl', name: 'Tagalog', emoji: '🇵🇭', color: '#0066CC', nativeName: 'Tagalog', voiceCode: 'fil-PH' },
  { code: 'uk', name: 'Ucraino', emoji: '🇺🇦', color: '#0057B8', nativeName: 'Українська', voiceCode: 'uk-UA' },
  { code: 'hi', name: 'Hindi', emoji: '🇮🇳', color: '#FF9900', nativeName: 'हिंदी', voiceCode: 'hi-IN' },
]

export default function MultilingualApiPage() {
  const [apiKeys, setApiKeys] = useState(() => JSON.parse(localStorage.getItem('api-keys') || '{}'))
  const [showAPIModal, setShowAPIModal] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState({})

  // 🔑 Listener per cambi nel localStorage
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'api-keys' || event === null) {
        const newKeys = JSON.parse(localStorage.getItem('api-keys') || '{}')
        console.log('[MultilingualApiPage] Chiavi API aggiornate:', newKeys)
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

  const hasKeys = apiKeys.grok || apiKeys.gemini

  const handleLanguageToggle = (langCode) => {
    setSelectedLanguages(prev => ({
      ...prev,
      [langCode]: !prev[langCode]
    }))
  }

  const handleTranslateSelected = async () => {
    const selected = Object.keys(selectedLanguages).filter(k => selectedLanguages[k])
    if (!selected.length) {
      alert('❌ Seleziona almeno una lingua')
      return
    }

    // Naviga a multilingue-translate.html con i parametri
    const baseUrl = window.location.origin + import.meta.env.BASE_URL
    const targetUrl = `${baseUrl}multilingue-translate.html?langs=${selected.join(',')}`
    console.log('🌍 Navigazione a:', targetUrl)
    window.location.href = targetUrl
  }

  return (
    <div className="multilingue-page">
      {/* Barra superiore */}
      <div className="multilingue-header">
        <button className="back-btn" onClick={() => window.location.href = window.location.origin + import.meta.env.BASE_URL} title="Torna alla home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Home
        </button>
        <div className="header-title">
          <div className="header-emoji">🌐</div>
          <div>
            <h1>Traduzioni Multilingue</h1>
            <p className="header-subtitle">Tradurre da italiano in tutte le lingue</p>
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="multilingue-container">
        <div className="languages-section">
          <div className="section-info">
            <h2>🌍 Seleziona le lingue di destinazione</h2>
            <p>Scegli da qui i lingue in cui vuoi tradurre il tuo testo italiano</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.85, marginTop: '12px', color: '#48bb78' }}>
              ✅ Traduzioni con MyMemory gratuite e sempre disponibili!
            </p>
          </div>

          <div className="languages-grid">
            {API_LANGUAGES.map(lang => (
              <label key={lang.code} className="language-checkbox">
                <input
                  type="checkbox"
                  checked={!!selectedLanguages[lang.code]}
                  onChange={() => handleLanguageToggle(lang.code)}
                />
                <div className="checkbox-content">
                  <div className="checkbox-emoji">{lang.emoji}</div>
                  <div className="checkbox-text">
                    <div className="checkbox-name">{lang.name}</div>
                    <div className="checkbox-native">{lang.nativeName}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="selection-summary">
            <span className="selected-count">
              {Object.values(selectedLanguages).filter(Boolean).length} lingua/e selezionata/e
            </span>
            <button
              className="btn-translate"
              onClick={handleTranslateSelected}
              disabled={!Object.values(selectedLanguages).filter(Boolean).length}
            >
              🚀 Traduci
            </button>
          </div>

          {(apiKeys.grok || apiKeys.gemini) && (
            <div className="manage-keys-section">
              <button 
                className="btn-manage-keys"
                onClick={() => setShowAPIModal(true)}
              >
                🔧 Gestisci chiavi API
              </button>
            </div>
          )}

          {(!apiKeys.grok && !apiKeys.gemini) && (
            <div className="manage-keys-section">
              <button 
                className="btn-manage-keys"
                onClick={() => setShowAPIModal(true)}
              >
                🔑 Aggiungi chiavi API opzionali
              </button>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '8px' }}>Opzionale: Grok e Gemini offrono traduzioni più accurate</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal API Keys */}
      <APIKeysManager 
        isOpen={showAPIModal} 
        onClose={() => {
          setShowAPIModal(false)
          // Ricarica le chiavi
          const newKeys = JSON.parse(localStorage.getItem('api-keys') || '{}')
          setApiKeys(newKeys)
        }}
      />
    </div>
  )
}
