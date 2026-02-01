@echo off
REM Start a simple HTTP server on port 8000 (tries python first, then falls back to npx http-server)
echo Starting local HTTP server on port 8000...
python -m http.server 8000 2>nul || py -m http.server 8000 2>nul || (
  echo Python not found or failed. Trying npx http-server...
  npx http-server -p 8000
)
pause