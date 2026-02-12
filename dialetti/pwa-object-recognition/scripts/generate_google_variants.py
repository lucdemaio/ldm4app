"""
Generate A/B/SSML variants using Google Cloud WaveNet for selected dialects.
Produces files in ./samples/<dialect>_<variant>.mp3

Usage:
  python scripts/generate_google_variants.py
"""
from pathlib import Path
import json
import os

try:
    from google.cloud import texttospeech
except Exception:
    raise SystemExit('Missing dependency: pip install google-cloud-texttospeech')

ROOT = Path(__file__).resolve().parents[1] / 'audio'
OUT = Path(__file__).resolve().parents[1] / 'samples'
OUT.mkdir(exist_ok=True)

# Initialize client; prefer ADC but fall back to credentials file if available
try:
    client = texttospeech.TextToSpeechClient()
except Exception as e:
    creds_file = Path(__file__).resolve().parents[1] / 'credentials' / 'google-tts-sa.json'
    if creds_file.exists():
        print('ADC not found, using service account file at', creds_file)
        from google.oauth2 import service_account
        creds = service_account.Credentials.from_service_account_file(str(creds_file))
        client = texttospeech.TextToSpeechClient(credentials=creds)
    else:
        raise


audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

variants = [
    ('A', {'voice': 'it-IT-Wavenet-A', 'type': 'text'}),
    ('B', {'voice': 'it-IT-Wavenet-B', 'type': 'text'}),
    ('SSML', {'voice': 'it-IT-Wavenet-A', 'type': 'ssml'})
]

# Minimum phrase id to synthesize
MIN_ID = 6

# Find all dialect folders under audio
for dialect_dir in ROOT.iterdir():
    if not dialect_dir.is_dir():
        continue
    dialect = dialect_dir.name
    p = dialect_dir / 'phrases.json'
    if not p.exists():
        print('Missing phrases.json for', dialect)
        continue
    phrases = json.loads(p.read_text(encoding='utf-8'))
    if not phrases:
        continue
    for ph in phrases:
        ph_id = ph.get('id', 0)
        if ph_id < MIN_ID:
            continue
        text = ph.get('text') or ph.get('italian')
        if not text:
            continue
        for code, cfg in variants:
            out_path = OUT / f"{dialect.lower()}_{ph_id}_{code}.mp3"
            print('Generating', out_path)
            voice_params = texttospeech.VoiceSelectionParams(language_code='it-IT', name=cfg['voice'])
            if cfg['type'] == 'text':
                input_text = texttospeech.SynthesisInput(text=text)
            else:
                # Slightly slower rate for a more natural sarcastic delivery
                ssml = f"<speak><prosody rate='0.95' pitch='-1st'>{text}</prosody></speak>"
                input_text = texttospeech.SynthesisInput(ssml=ssml)
            try:
                resp = client.synthesize_speech(input=input_text, voice=voice_params, audio_config=audio_config)
                with open(out_path, 'wb') as f:
                    f.write(resp.audio_content)
                print('Wrote', out_path)
            except Exception as e:
                print('Failed to generate', out_path, e)

print('Done.')