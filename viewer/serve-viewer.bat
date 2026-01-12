@echo off
REM Serve la cartella corrente su http://localhost:8000 e apre il browser
SET PORT=8000









REM Preferisce npx http-server se disponibile, altrimenti prova Python
where npx >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Avvio http-server (Node) sulla porta %PORT%...
  npx http-server -p %PORT% -c-1
) else (
  echo http-server non trovato, provo con Python...
  python -m http.server %PORT%
)

REM Apri il browser alla pagina del viewer
start "" "http://localhost:%PORT%/index-viewer.html"
