#!/usr/bin/env python3
"""
Simple script to generate MP3 files from the phrases JSON files using gTTS.
Install: pip install gTTS
Run: python scripts/generate_tts.py
"""
import json
from pathlib import Path
from gtts import gTTS

ROOT = Path(__file__).resolve().parents[0].parent / 'audio'

for dialect_dir in ROOT.iterdir():
    if not dialect_dir.is_dir():
        continue
    phrases_file = dialect_dir / 'phrases.json'
    if not phrases_file.exists():
        continue
    with phrases_file.open('r', encoding='utf-8') as f:
        phrases = json.load(f)
    for p in phrases:
        mp3_path = dialect_dir / p['mp3']
        if mp3_path.exists():
            print(f"Skipping existing {mp3_path}")
            continue
        text = p.get('text') or p.get('italian')
        # gTTS will use Italian pronunciation
        tts = gTTS(text, lang='it')
        tts.save(str(mp3_path))
        print(f"Generated {mp3_path}")

print('Done.')