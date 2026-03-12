# Setup Guida - Video/Immagine Forensics Analyzer

## Completare la configurazione

### 1. Installare dipendenze Node.js
```bash
npm install
```

Questo installa `multer` e altre dipendenze Express già definite in package.json.

### 2. Installare dipendenze Python (IMPORTANTE)

Prima assicurati che Python 3.8+ sia installato. Puoi verificarlo:
```bash
python --version
```

Poi installa le librerie Python necessarie:

```bash
cd caricavideoefoto
pip install -r requirements.txt
```

Le librerie richieste sono:
- **opencv-python**: Per l'analisi forense dei frame video/immagini
- **numpy**: Per operazioni numeriche e statistiche
- **pillow**: Per manipolazione avanzata di immagini
- **scipy**: Per analisi statistiche e signal processing

### 3. Verificare ffprobe (per metadati video)

Per l'analisi completa dei metadati video, hai bisogno di ffprobe (parte di ffmpeg).

#### Su Windows:
Scarica FFmpeg da https://ffmpeg.org/download.html
Aggiungi la cartella bin di FFmpeg al PATH di sistema, oppure assicurati che ffprobe sia disponibile nel PATH.

Verifica:
```bash
ffprobe -version
```

### 4. Avviare il backend

```bash
npm run backend
# oppure
node server.js
```

Il server si avvierà su `http://localhost:3001`

Dovresti vedere:
```
🚀 Backend server in ascolto su porta 3001
POST /api/translate
POST /api/analyze-video
POST /api/analyze-image
```

### 5. Usare l'analizzatore

Apri il file `index.html` nel browser e carica videi/immagini per l'analisi.

Il sistema farà:
1. ✅ Inviare il file al backend Express
2. ✅ Eseguire lo script Python per analisi forense
3. ✅ Ritornare i risultati dettagliati

## Cosa analizza

### Video Analysis (video_analyzer.py)
- **Metadati**: Codec, bitrate, dimensioni, encoder sospetti
- **Consistenza Frame**: Salti anomali tra frame
- **Compressione**: Pattern H.264, entropia, artefatti
- **Rilevamento Volti**: Dimensione e coerenza
- **Illuminazione**: Continuità luminosa
- **Movimento**: Optical flow e anomalie
- **Firme Codec**: H.264, H.265, VP9, AV1
- **Pattern AI**: Deepfake, DALL-E, Stable Diffusion

### Image Analysis (image_analyzer.py)
- **Metadati EXIF**: Tag di creazione e editor
- **Distribuzione Pixel**: Anomalie cromatiche
- **Artefatti Compressione**: JPEG, DCT analysis
- **Texture Analysis**: Local Binary Pattern
- **Rumore**: Pattern di rumore naturale vs artificiale
- **Edge Detection**: Canny edge analysis
- **Spettro Frequenza**: Pattern tipici di AI
- **Pattern Ripetitivi**: Signature di generazione

## Tolleranza dei Verdetti

- **≥75%**: AUTENTICO ✅ - Alta probabilità di genuinità
- **55-74%**: SOSPETTO ⚠️ - Segni di possibile manipolazione
- **<55%**: ARTIFICIALE ❌ - Probabilità elevata di generazione AI

## Troubleshooting

**Errore: "ffprobe not found"**
→ Installa FFmpeg e aggiungi al PATH

**Errore: "ModuleNotFoundError: No module named 'cv2'"**
→ Esegui: `pip install -r requirements.txt`

**Backend non risponde**
→ Assicurati che il backend sia avviato con `npm run backend`

**Python script timeout**
→ Aumenta il timeout in server.js (attualmente 120 secondi per video, 30 per immagini)
