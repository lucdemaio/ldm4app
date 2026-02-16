import os
from pathlib import Path

# Percorso da verificare
base_path = r"C:\Users\Luca\Desktop\lavoro Soccer manager con claude 4.5"

# File CSS richiesti
css_files = [
    "assets/css/variables.css",
    "assets/css/base.css",
    "assets/css/components.css",
    "assets/css/modules.css",
    "assets/css/premium-ui.css",
    "assets/css/legal-docs.css",
    "assets/css/meeting-minutes.css",
    "assets/css/filesystem.css",
    "assets/css/scouting.css",
    "assets/css/scanner.css",
    "assets/css/logistics.css",
    "assets/css/archive.css",
    "assets/css/help-center.css",
    "assets/css/ux-fixes.css",
    "assets/css/responsive.css",
    "assets/css/overrides.css"
]

# File JavaScript richiesti
js_files = [
    "assets/js/pdf-utils.js",
    "assets/js/team-manager.js",
    "assets/js/local-team-data.js",
    "assets/js/utils.js",
    "assets/js/state-manager.js",
    "assets/js/storage.js",
    "assets/js/athletes.js",
    "assets/js/teams.js",
    "assets/js/calendar.js",
    "assets/js/dashboard.js",
    "assets/js/evaluations.js",
    "assets/js/reports.js",
    "assets/js/finances.js",
    "assets/js/matchday.js",
    "assets/js/attendance.js",
    "assets/js/tactics.js",
    "assets/js/fiscal-manager.js",
    "assets/js/legal-docs.js",
    "assets/js/meeting-minutes.js",
    "assets/js/filesystem-manager.js",
    "assets/js/scouting.js",
    "assets/js/scanner.js",
    "assets/js/logistics.js",
    "assets/js/archive.js",
    "assets/js/onboarding.js",
    "assets/js/help-center.js",
    "assets/js/tooltips.js",
    "assets/js/theme.js",
    "assets/js/info.js",
    "assets/js/ui.js",
    "assets/js/ads.js",
    "assets/js/app.js"
]

# Altri file
other_files = [
    "manifest.json",
    "assets/icons/icon-192.svg",
    "soccer-app.html"
]

all_files = css_files + js_files + other_files

print("=" * 60)
print("VERIFICA FILE MANCANTI - SOCCER MANAGER")
print("=" * 60)
print(f"\nCartella base: {base_path}\n")

if not os.path.exists(base_path):
    print(f"ERRORE: La cartella non esiste!\n")
else:
    missing = []
    existing = []

    for file in all_files:
        full_path = os.path.join(base_path, file)
        if os.path.exists(full_path):
            existing.append(file)
        else:
            missing.append(file)

    print(f"FILE PRESENTI: {len(existing)}/{len(all_files)}\n")

    if missing:
        print("=" * 60)
        print("FILE MANCANTI:")
        print("=" * 60)
        for file in sorted(missing):
            print(f"  ✗ {file}")

        # Raggruppa per cartella
        print("\n" + "=" * 60)
        print("RIEPILOGO PER CARTELLA:")
        print("=" * 60)

        css_missing = [f for f in missing if f.startswith("assets/css/")]
        js_missing = [f for f in missing if f.startswith("assets/js/")]
        other_missing = [f for f in missing if not f.startswith("assets/")]

        if css_missing:
            print(f"\nCSS mancanti ({len(css_missing)}):")
            for f in css_missing:
                print(f"  - {f}")

        if js_missing:
            print(f"\nJavaScript mancanti ({len(js_missing)}):")
            for f in js_missing:
                print(f"  - {f}")

        if other_missing:
            print(f"\nAltri file mancanti ({len(other_missing)}):")
            for f in other_missing:
                print(f"  - {f}")
    else:
        print("✓ Tutti i file sono presenti!\n")

print("\n" + "=" * 60)
