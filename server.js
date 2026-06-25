import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import multer from 'multer'
import nodemailer from 'nodemailer'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    : undefined
})

// Configura storage multer
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname)
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png']
    cb(null, allowedMimes.includes(file.mimetype))
  },
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('.'))

app.post('/api/newsletter', async (req, res) => {
  try {
    const { nome, cognome, email, azienda, messaggio, privacy } = req.body

    if (!nome || !cognome || !email || !privacy) {
      return res.status(400).json({ ok: false, error: 'Dati obbligatori mancanti' })
    }

    const html = `
      <h2>Nuova iscrizione newsletter</h2>
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Cognome:</strong> ${cognome}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Azienda:</strong> ${azienda || 'Non specificata'}</p>
      <p><strong>Messaggio:</strong> ${messaggio || 'Nessun messaggio'}</p>
      <p><strong>Privacy:</strong> ${privacy}</p>
    `

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const logLine = `[newsletter] ${new Date().toISOString()} | ${email} | ${nome} ${cognome}\n`
      fs.appendFileSync(path.join(__dirname, 'newsletter-log.txt'), logLine)
      console.warn('[Newsletter] SMTP non configurato, dati salvati in newsletter-log.txt')
      return res.json({ ok: true, mode: 'logged' })
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'info@ldm4app.com',
      replyTo: email,
      subject: 'Nuova iscrizione newsletter LDM4APP',
      html
    })

    res.json({ ok: true, mode: 'sent' })
  } catch (error) {
    console.error('[Newsletter] Errore invio:', error)
    res.status(500).json({ ok: false, error: 'Errore durante l’invio del modulo' })
  }
})

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

// Endpoint analisi video
app.post('/api/analyze-video', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File non fornito' })
    }

    const uploadedFile = req.file.path
    console.log(`[Backend] 📹 Analisi video: ${req.file.originalname}`)

    // Esegui script Python
    const pythonScript = path.join(__dirname, 'caricavideoefoto', 'video_analyzer.py')
    
    return new Promise((resolve, reject) => {
      const python = spawn('python', [pythonScript, uploadedFile], {
        timeout: 120000 // 2 minuti timeout
      })

      let stdout = ''
      let stderr = ''

      python.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      python.stderr.on('data', (data) => {
        stderr += data.toString()
        console.warn(`[Backend] ⚠️ Python stderr: ${data}`)
      })

      python.on('close', (code) => {
        // Pulisci file temporaneo
        try {
          fs.unlinkSync(uploadedFile)
        } catch (e) {}

        if (code !== 0) {
          console.error(`[Backend] ❌ Python exit code: ${code}`)
          console.error(`[Backend] stderr: ${stderr}`)
          return res.status(500).json({ 
            error: 'Analisi fallita',
            details: stderr 
          })
        }

        try {
          const results = JSON.parse(stdout)
          console.log(`[Backend] ✅ Analisi completata`)
          res.json(results)
          resolve()
        } catch (e) {
          console.error(`[Backend] ❌ JSON parse error: ${e.message}`)
          res.status(500).json({ 
            error: 'Errore parsing risultati',
            details: e.message 
          })
          resolve()
        }
      })

      python.on('error', (err) => {
        console.error(`[Backend] ❌ Errore esecuzione Python: ${err.message}`)
        fs.unlinkSync(uploadedFile)
        res.status(500).json({ 
          error: 'Errore analisi',
          details: err.message 
        })
        resolve()
      })
    })
  } catch (err) {
    console.error(`[Backend] ❌ Errore:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// Endpoint analisi immagine
app.post('/api/analyze-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File non fornito' })
    }

    const uploadedFile = req.file.path
    console.log(`[Backend] 🖼️ Analisi immagine: ${req.file.originalname}`)

    // Esegui script Python per immagine
    const pythonScript = path.join(__dirname, 'caricavideoefoto', 'image_analyzer.py')
    
    return new Promise((resolve, reject) => {
      const python = spawn('python', [pythonScript, uploadedFile], {
        timeout: 30000 // 30 secondi timeout
      })

      let stdout = ''
      let stderr = ''

      python.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      python.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      python.on('close', (code) => {
        try {
          fs.unlinkSync(uploadedFile)
        } catch (e) {}

        if (code !== 0) {
          return res.status(500).json({ 
            error: 'Analisi immagine fallita',
            details: stderr 
          })
        }

        try {
          const results = JSON.parse(stdout)
          console.log(`[Backend] ✅ Analisi immagine completata`)
          res.json(results)
          resolve()
        } catch (e) {
          res.status(500).json({ 
            error: 'Errore parsing risultati',
            details: e.message 
          })
          resolve()
        }
      })

      python.on('error', (err) => {
        fs.unlinkSync(uploadedFile)
        res.status(500).json({ 
          error: 'Errore analisi',
          details: err.message 
        })
        resolve()
      })
    })
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
  console.log(`POST /api/analyze-video`)
  console.log(`POST /api/analyze-image`)
})
