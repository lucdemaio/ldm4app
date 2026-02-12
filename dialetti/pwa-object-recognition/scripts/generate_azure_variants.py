#!/usr/bin/env python3
"""
Synthesize phrases in audio/<Dialect>/phrases.json using Azure Neural TTS REST API.
Writes MP3 files to audio/<Dialect>/azure/<id>_azure.mp3 and updates phrases.json adding field "azure_mp3": "azure/<id>_azure.mp3".

Usage:
  python scripts/generate_azure_variants.py --dialect Romano --min-id 6

Requires: requests
"""
import os
import json
import argparse
import pathlib
import time

import requests

ROOT = pathlib.Path(__file__).resolve().parents[1]
CRED_PATH = ROOT / 'credentials' / 'azure-tts.json'

if not CRED_PATH.exists():
    print(f"Credentials file not found: {CRED_PATH}. Create it with your Azure subscription_key and region.")
    raise SystemExit(1)

with open(CRED_PATH, 'r', encoding='utf-8') as f:
    creds = json.load(f)

SUBSCRIPTION_KEY = creds.get('subscription_key')
REGION = creds.get('region')
VOICE_MAP = creds.get('voice_map', {})
OUTPUT_FORMAT = creds.get('output_format', 'audio-16khz-128kbitrate-mono-mp3')

if not SUBSCRIPTION_KEY or not REGION:
    print('Please fill subscription_key and region in credentials/azure-tts.json')
    raise SystemExit(1)

ENDPOINT = f'https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1'
HEADERS = {
    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    'Content-Type': 'application/ssml+xml',
    'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
    'User-Agent': 'pwa-dialetti-azure-tts'
}

parser = argparse.ArgumentParser()
parser.add_argument('--dialect', required=True, help='Dialect name as in audio/<Dialect>/phrases.json')
parser.add_argument('--min-id', type=int, default=0, help='Only synthesize phrases with id >= MIN_ID')
parser.add_argument('--limit', type=int, default=0, help='Limit number of phrases synthesized (0 = all)')
args = parser.parse_args()

phrases_file = ROOT / 'audio' / args.dialect / 'phrases.json'
if not phrases_file.exists():
    print('phrases.json not found for dialect', args.dialect)
    raise SystemExit(1)

with open(phrases_file, 'r', encoding='utf-8') as f:
    phrases = json.load(f)

out_dir = ROOT / 'audio' / args.dialect / 'azure'
out_dir.mkdir(parents=True, exist_ok=True)

count = 0
for ph in phrases:
    pid = ph.get('id')
    if pid is None: continue
    if pid < args.min_id: continue
    if args.limit and count >= args.limit: break
    text = ph.get('text') or ph.get('phrase') or ph.get('translation') or ph.get('label')
    if not text:
        continue
    filename = f"{pid}_azure.mp3"
    out_path = out_dir / filename
    relative_path = f"azure/{filename}"
    if out_path.exists():
        print('Skipping (exists):', out_path)
        ph['azure_mp3'] = relative_path
        count += 1
        continue

    voice = VOICE_MAP.get(args.dialect) or VOICE_MAP.get('default') or 'it-IT-IsabellaNeural'
    ssml = f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="it-IT">'
    ssml += f'<voice name="{voice}">{text}</voice></speak>'

    print('Synthesizing:', args.dialect, pid, text)
    try:
        resp = requests.post(ENDPOINT, headers=HEADERS, data=ssml.encode('utf-8'), timeout=30)
        if resp.status_code == 200:
            with open(out_path, 'wb') as of:
                of.write(resp.content)
            ph['azure_mp3'] = relative_path
            print('Wrote', out_path)
            count += 1
        else:
            print('Azure TTS failed', resp.status_code, resp.text[:200])
            time.sleep(0.5)
    except Exception as e:
        print('Exception calling Azure TTS', e)
        time.sleep(0.5)

# Persist updated phrases.json
with open(phrases_file, 'w', encoding='utf-8') as f:
    json.dump(phrases, f, ensure_ascii=False, indent=2)

print('Done. Synthesized', count, 'files for dialect', args.dialect)