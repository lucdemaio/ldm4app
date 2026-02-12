# Audio phrases (sarcastic/humor)

- Ogni sottocartella contiene un file `phrases.json` con 5 frasi (testo in dialetto, traduzione italiana, tono e nome file MP3 suggerito).
- Le trascrizioni dialettali sono approssimative; revisionali se necessiti di corrispondenza più autentica.
- I file audio sono placeholder: puoi generare TTS reali con lo script `scripts/generate_tts.py` (usa `gTTS`) oppure creare WAV silenziosi come placeholder con `scripts/create_silent_wavs.py`.

Esempio di uso dello script TTS:

1. pip install gTTS
2. python scripts/generate_tts.py

Per creare i WAV silenziosi (veloce, nessuna dipendenza):

1. python scripts/create_silent_wavs.py

Nota: la sintesi vocale userà la pronuncia italiana standard; per registrazioni autentiche preferisci audio nativi.