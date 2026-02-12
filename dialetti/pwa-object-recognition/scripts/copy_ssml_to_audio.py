import shutil
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / 'samples'
AUDIO = ROOT / 'audio'

copied = []
updated = {}

for sample in SAMPLES.glob('*_SSML.mp3'):
    name = sample.name  # e.g., romano_6_SSML.mp3
    parts = name.split('_')
    if len(parts) < 3:
        continue
    dialect_key = parts[0]
    ph_id = parts[1]
    # Map dialect folder names (lowercase in files) to actual folder names
    # Find matching folder by case-insensitive name
    dialect_dir = None
    for d in AUDIO.iterdir():
        if d.is_dir() and d.name.lower() == dialect_key.lower():
            dialect_dir = d
            break
    if not dialect_dir:
        # skip unknown dialects
        continue
    dest_dir = dialect_dir / 'google_ssml'
    dest_dir.mkdir(exist_ok=True)
    dest = dest_dir / name
    shutil.copy2(sample, dest)
    copied.append(str(dest))
    # update phrases.json
    phrases_file = dialect_dir / 'phrases.json'
    if not phrases_file.exists():
        continue
    phrases = json.loads(phrases_file.read_text(encoding='utf-8'))
    changed = False
    for ph in phrases:
        if not isinstance(ph.get('id'), int):
            continue
        if str(ph['id']) == ph_id or ph['id'] == int(ph_id):
            # set google_ssml_local to relative path inside audio/<Dialect>/
            rel = str(Path('google_ssml') / name)
            if ph.get('google_ssml_local') != rel:
                ph['google_ssml_local'] = rel
                changed = True
    if changed:
        phrases_file.write_text(json.dumps(phrases, ensure_ascii=False, indent=2), encoding='utf-8')
        updated[dialect_dir.name] = updated.get(dialect_dir.name, 0) + 1

print('Copied files:', len(copied))
if copied:
    for c in copied[:20]:
        print('-', c)
print('Updated phrases counts by dialect:', updated)
