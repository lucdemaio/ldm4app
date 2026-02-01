# PowerShell script: start a local HTTP server on port 8000
Write-Host "Starting local HTTP server on port 8000..."
if (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server 8000
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server 8000
} else {
  Write-Host "Python not found. Trying npx http-server (requires Node.js)."
  if (Get-Command npx -ErrorAction SilentlyContinue) {
    npx http-server -p 8000
  } else {
    Write-Host "Non ho trovato python né npx. Installa Python 3 o Node (con npx) o usa Live Server in VS Code."
  }
}