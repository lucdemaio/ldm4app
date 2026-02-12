# Google TTS Service Account (local credentials)

Place your Google Cloud service account JSON credentials into this folder and follow the steps below.

1. Rename the template `google-tts-sa.json.template` to `google-tts-sa.json` and replace its content with the full JSON you downloaded from Google Cloud console (do NOT share this file).

2. To set the variable for the current PowerShell session:
   - $env:GOOGLE_APPLICATION_CREDENTIALS = (Resolve-Path .\google-tts-sa.json).Path

3. To set it permanently (Windows):
   - setx GOOGLE_APPLICATION_CREDENTIALS "C:\path\to\your\project\credentials\google-tts-sa.json"
   - then close and reopen your terminal.

4. Quick test (from workspace root):
   - python scripts/generate_google_tts.py --test

Security note: do NOT commit `google-tts-sa.json` to source control. Add it to .gitignore.
