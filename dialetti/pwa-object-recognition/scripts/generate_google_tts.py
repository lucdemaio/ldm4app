"""
Generate MP3s using Google Cloud Text-to-Speech (WaveNet)

Usage:
1) pip install google-cloud-texttospeech
2) Set environment variable GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file path
   (e.g. setx GOOGLE_APPLICATION_CREDENTIALS "C:\path\to\sa.json")
3) python scripts/generate_google_tts.py          # generates for all phrases
   python scripts/generate_google_tts.py --test   # generates a small test (Romano first phrase)

Notes:
- Uses voice: it-IT-Wavenet-A (can be changed)
- Outputs MP3 files (overwrites existing if --overwrite used)
"""
import argparse
import json
from pathlib import Path
import os

try:
    from google.cloud import texttospeech
except Exception as e:
    raise SystemExit("Missing dependency: pip install google-cloud-texttospeech")

ROOT = Path(__file__).resolve().parents[1] / 'audio'

parser = argparse.ArgumentParser()
parser.add_argument('--test', action='store_true', help='Generate a small test sample')
parser.add_argument('--voice', default='it-IT-Wavenet-A', help='Voice name (WaveNet)')
parser.add_argument('--overwrite', action='store_true', help='Overwrite existing MP3 files')
args = parser.parse_args()

# validate credentials
if 'GOOGLE_APPLICATION_CREDENTIALS' not in os.environ:
    raise SystemExit('Please set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account JSON file path')

client = texttospeech.TextToSpeechClient()

# Choose audio config
audio_config = texttospeech.AudioConfig(
    audio_encoding=texttospeech.AudioEncoding.MP3,
    speaking_rate=1.0,
    pitch=0.0,
)

voice_params = texttospeech.VoiceSelectionParams(
    language_code='it-IT',
    name=args.voice,
)

def synthesize_to_mp3(text, out_path):
    input_text = texttospeech.SynthesisInput(text=text)
    response = client.synthesize_speech(input=input_text, voice=voice_params, audio_config=audio_config)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'wb') as f:
        f.write(response.audio_content)

if args.test:
    # find Romano and first phrase
    ph_file = ROOT / 'Romano' / 'phrases.json'
    if not ph_file.exists():
        print('Test file not found:', ph_file)
        raise SystemExit(1)
    p = json.loads(ph_file.read_text(encoding='utf-8'))[0]
    text = p.get('text') or p.get('italian')
    out = ph_file.parent / ( (p['mp3'].rsplit('.',1)[0]) + '.mp3')
    if out.exists() and not args.overwrite:
        print('Skipping existing', out)
    else:
        print('Synthesizing test:', text)
        synthesize_to_mp3(text, out)
        print('Wrote', out)
    raise SystemExit(0)

# Full generation
for phrases_file in ROOT.rglob('phrases.json'):
    phrases = json.loads(phrases_file.read_text(encoding='utf-8'))
    for p in phrases:
        text = p.get('text') or p.get('italian')
        out = Path(phrases_file.parent) / ( (p['mp3'].rsplit('.',1)[0]) + '.mp3')
        if out.exists() and not args.overwrite:
            print('Skipping', out)
            continue
        print('Synthesizing ->', out)
        synthesize_to_mp3(text, out)

print('Done.')