# Usage: Run this in PowerShell from project root after you placed the JSON file under ./credentials
$credPath = Resolve-Path .\credentials\google-tts-sa.json -ErrorAction SilentlyContinue
if (-not $credPath) { Write-Host "Credentials file not found in ./credentials. Create google-tts-sa.json first." -ForegroundColor Red; exit 1 }
$env:GOOGLE_APPLICATION_CREDENTIALS = $credPath.Path
Write-Host "Set GOOGLE_APPLICATION_CREDENTIALS for this session to: $($env:GOOGLE_APPLICATION_CREDENTIALS)"
Write-Host "You can now run: python scripts/generate_google_tts.py --test"