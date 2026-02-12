# PowerShell helper to create venv and install Coqui TTS (Windows)
python -m venv .venv_coqui
.\.venv_coqui\Scripts\Activate.ps1
pip install --upgrade pip
pip install "TTS[all]" flask
Write-Host "Done. To run: .\.venv_coqui\Scripts\Activate.ps1; python scripts\coqui_server.py --model tts_models/it/mai/vits --host 127.0.0.1 --port 5510"
