#!/usr/bin/env python3
"""
Generate 1-second silent WAV files for each phrase in audio/*/phrases.json.
Run: python scripts/create_silent_wavs.py
"""
import json
from pathlib import Path
import wave

ROOT = Path(__file__).resolve().parents[1] / 'audio'
SAMPLE_RATE = 16000
DURATION_SECONDS = 1
NUM_SAMPLES = SAMPLE_RATE * DURATION_SECONDS

for dialect_dir in ROOT.iterdir():
    if not dialect_dir.is_dir():
        continue
    phrases_file = dialect_dir / 'phrases.json'
    if not phrases_file.exists():
        continue
    with phrases_file.open('r', encoding='utf-8') as f:
        phrases = json.load(f)
    for p in phrases:
        filename = p['mp3']
        wav_path = dialect_dir / filename
        if wav_path.exists():
            print(f"Skipping existing {wav_path}")
            continue
        # create 1s of silence (16-bit PCM mono) using wave module (safe)
        try:
            with wave.open(str(wav_path), 'wb') as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)  # 16-bit
                wf.setframerate(SAMPLE_RATE)
                silence = (b'\x00\x00' * NUM_SAMPLES)
                wf.writeframes(silence)
            print(f"Created {wav_path}")
        except Exception as e:
            # Fallback: write header manually
            import struct
            with open(wav_path, 'wb') as f:
                subchunk2_size = NUM_SAMPLES * 2
                chunk_size = 36 + subchunk2_size
                f.write(b'RIFF')
                f.write(struct.pack('<I', chunk_size))
                f.write(b'WAVE')
                f.write(b'fmt ')
                f.write(struct.pack('<I', 16))
                f.write(struct.pack('<H', 1))  # PCM
                f.write(struct.pack('<H', 1))  # channels
                f.write(struct.pack('<I', SAMPLE_RATE))
                byte_rate = SAMPLE_RATE * 1 * 2
                f.write(struct.pack('<I', byte_rate))
                f.write(struct.pack('<H', 2))
                f.write(struct.pack('<H', 16))
                f.write(b'data')
                f.write(struct.pack('<I', subchunk2_size))
                f.write(b'\x00' * subchunk2_size)
            print(f"Created (fallback) {wav_path}")

print('Done.')