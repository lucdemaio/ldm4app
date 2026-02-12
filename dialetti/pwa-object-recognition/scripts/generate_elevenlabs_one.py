"""
Generate a single ElevenLabs voice sample for Romano and Napoletano using the first available voice.
Usage:
  python scripts/generate_elevenlabs_one.py
"""
import os
import requests
from pathlib import Path
import json

KEY = None
key_file = Path(__file__).resolve().parents[1] / 'credentials' / 'elevenlabs.key'
if key_file.exists():
    KEY = key_file.read_text(encoding='utf-8').strip()
elif 'ELEVENLABS_API_KEY' in os.environ:
    KEY = os.environ['ELEVENLABS_API_KEY']
else:
    raise SystemExit('ElevenLabs API key not found. Save it to credentials/elevenlabs.key or set ELEVENLABS_API_KEY')

HEADERS = {'xi-api-key': KEY}
BASE = 'https://api.elevenlabs.io/v1'
OUT = Path(__file__).resolve().parents[1] / 'samples'
OUT.mkdir(exist_ok=True)

# Dialects to test
dialects = ['Romano', 'Napoletano']

# list voices
r = requests.get(f'{BASE}/voices', headers=HEADERS)
if r.status_code != 200:
    print('Failed to list voices:', r.status_code, r.text)
    raise SystemExit(1)
voices = r.json().get('voices', [])
if not voices:
    print('No voices available')
    raise SystemExit(1)

v = voices[0]
vid = v.get('voice_id') or v.get('id') or v.get('voice')
name = v.get('name') or vid
print('Using voice:', name, '(', vid, ')')

for d in dialects:
    p = Path(__file__).resolve().parents[1] / 'audio' / d / 'phrases.json'
    if not p.exists():
        print('Missing', p)
        continue
    phrases = json.loads(p.read_text(encoding='utf-8'))
    text = phrases[0].get('text') or phrases[0].get('italian')
    print(f'Generating for {d}: "{text}"')
    payload = { 'text': text }
    resp = requests.post(f'{BASE}/text-to-speech/{vid}', headers={**HEADERS, 'Accept':'audio/mpeg'}, json=payload, stream=True)
    if resp.status_code == 200:
        out_path = OUT / f'elevenlabs_one_{d.lower()}_{name}.mp3'
        with open(out_path, 'wb') as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk: f.write(chunk)
        print('Wrote', out_path)
    else:
        print('Failed to synthesize:', resp.status_code, resp.text)

print('Done.')