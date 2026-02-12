# PowerShell helper to create venv and install gTTS server (Windows)
python -m venv .venv_gtts
.\.venv_gtts\Scripts\Activate.ps1
pip install --upgrade pip
pip install gTTS flask flask-cors
Write-Host "Done. To run: .\.venv_gtts\Scripts\Activate.ps1; python scripts\gtts_server.py --host 127.0.0.1 --port 5520"
