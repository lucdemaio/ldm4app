import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
audio_dir = root / 'audio'
human_dir = audio_dir / 'human-recordings'

# dialect name mapping when phrases dir differs from human-recordings dir
mapping = {
    'romano': 'romanesco'
}

# For each phrases.json under audio/*/phrases.json
for phrases_path in audio_dir.glob('*/phrases.json'):
    dialect_dir = phrases_path.parent
    dialect_name = dialect_dir.name
    dialect_key = dialect_name.lower()
    if dialect_key in mapping:
        dialect_key = mapping[dialect_key]
    human_dialect_dir = human_dir / dialect_key
    human_mp3s = []
    if human_dialect_dir.exists():
        # pick mp3 files in directory
        human_mp3s = sorted([p.name for p in human_dialect_dir.glob('*.mp3')])
    if not human_mp3s:
        print(f'No human mp3s for {dialect_name}, skipping: {phrases_path}')
        continue
    with open(phrases_path, 'r', encoding='utf-8') as f:
        phrases = json.load(f)
    # Add human list to each phrase (non-destructive)
    for ph in phrases:
        ph['human'] = [str(Path('human-recordings') / dialect_key / m) for m in human_mp3s]
    # write back
    with open(phrases_path, 'w', encoding='utf-8') as f:
        json.dump(phrases, f, ensure_ascii=False, indent=2)
    print(f'Updated {phrases_path} with {len(human_mp3s)} human alternatives')
