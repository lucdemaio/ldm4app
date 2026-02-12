"""
Generate TTS samples using ElevenLabs API.
Usage:
  1) pip install requests
  2) Save your key in './credentials/elevenlabs.key' (only the key) OR set env ELEVENLABS_API_KEY
  3) python scripts/generate_elevenlabs.py

Outputs to: samples/elevenlabs_<dialect>_<voice_name>.mp3
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
# use first phrase from each phrases.json
for d in dialects:
    p = Path(__file__).resolve().parents[1] / 'audio' / d / 'phrases.json'
    if not p.exists():
        print('Missing', p)
        continue
    phrases = json.loads(p.read_text(encoding='utf-8'))
    text = phrases[0].get('text') or phrases[0].get('italian')
    # list voices
    r = requests.get(f'{BASE}/voices', headers=HEADERS)
    if r.status_code != 200:
        print('Failed to list voices:', r.status_code, r.text)
        raise SystemExit(1)
    voices = r.json().get('voices', [])
    # pick up to 3 voices
    selected = voices[:3]
    for v in selected:
        vid = v.get('voice_id') or v.get('id') or v.get('voice')
        name = v.get('name') or vid
        print(f'Generating for {d} voice {name}...')
        payload = { 'text': text }
        # POST /v1/text-to-speech/{voice_id}
        resp = requests.post(f'{BASE}/text-to-speech/{vid}', headers={**HEADERS, 'Accept':'audio/mpeg'}, json=payload, stream=True)
        if resp.status_code == 200:
            out_path = OUT / f'elevenlabs_{d.lower()}_{name}.mp3'
            with open(out_path, 'wb') as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk: f.write(chunk)
            print('Wrote', out_path)
        else:
            print('Failed to synthesize:', resp.status_code, resp.text)

print('Done.')