import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'audio'
SAMPLES = Path(__file__).resolve().parents[1] / 'samples'

updated = {}
missing = []

for phrases_path in ROOT.glob('*/phrases.json'):
    dialect = phrases_path.parent.name
    dialect_lower = dialect.lower()
    phrases = json.loads(phrases_path.read_text(encoding='utf-8'))
    changed = False
    for ph in phrases:
        ph_id = ph.get('id')
        if not isinstance(ph_id, int) or ph_id < 6:
            continue
        sample_name = f"{dialect_lower}_{ph_id}_SSML.mp3"
        sample_path = SAMPLES / sample_name
        rel_path = str(Path('samples') / sample_name)
        if sample_path.exists():
            if ph.get('google_ssml') != rel_path:
                ph['google_ssml'] = rel_path
                changed = True
        else:
            missing.append(str(sample_path))
    if changed:
        phrases_path.write_text(json.dumps(phrases, ensure_ascii=False, indent=2), encoding='utf-8')
        updated[ dialect ] = sum(1 for ph in phrases if isinstance(ph.get('id'), int) and ph['id'] >= 6 and ph.get('google_ssml'))

print('Updated dialects:', updated)
if missing:
    print('Missing sample files (not linked):')
    for m in missing:
        print('-', m)
else:
    print('All SSML samples found and linked.')
