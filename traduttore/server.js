import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Endpoint di traduzione
app.post('/api/translate', async (req, res) => {
  try {
    const { text, target } = req.body

    if (!text || !target) {
      return res.status(400).json({ error: 'Text e target richiesti' })
    }

    console.log(`[Backend] 🔄 Traduzione: "${text.substring(0, 30)}..." → ${target}`)

    // Mappa codici lingua
    const langMap = {
      de: 'de',
      pt: 'pt',
      ru: 'ru',
      pl: 'pl',
      nl: 'nl',
      ja: 'ja',
      zh: 'zh',
      ar: 'ar',
      ko: 'ko',
      tr: 'tr',
      hi: 'hi',
      th: 'th'
    }

    const langCode = langMap[target] || target

    // Prova 1: MyMemory API
    try {
      console.log(`[Backend] 🔄 Tentativo 1: MyMemory`)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=it|${langCode}`
      )
      const data = await response.json()
      if (data?.responseData?.translatedText && data.responseData.translatedText !== text) {
        console.log(`[Backend] ✅ MyMemory riuscito`)
        return res.json({ translatedText: data.responseData.translatedText.trim() })
      }
    } catch (err) {
      console.warn(`[Backend] MyMemory fallito:`, err.message)
    }

    // Prova 2: LibreTranslate API
    try {
      console.log(`[Backend] 🔄 Tentativo 2: LibreTranslate`)
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({
          q: text,
          source: 'it',
          target: langCode,
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data?.translatedText) {
        console.log(`[Backend] ✅ LibreTranslate riuscito`)
        return res.json({ translatedText: data.translatedText.trim() })
      }
    } catch (err) {
      console.warn(`[Backend] LibreTranslate fallito:`, err.message)
    }

    // Se tutti falliscono
    console.error(`[Backend] ❌ Nessun servizio disponibile`)
    throw new Error('Tutti i servizi di traduzione falliti')
  } catch (err) {
    console.error(`[Backend] ❌ Errore:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`🚀 Backend server in ascolto su porta ${PORT}`)
  console.log(`POST /api/translate`)
})
