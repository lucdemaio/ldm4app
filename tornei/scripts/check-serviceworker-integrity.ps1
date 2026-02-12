<#
PowerShell script per:
 - (opzionale) eseguire `dotnet publish` per generare la cartella `publish`
 - leggere `service-worker-assets.js` dalla cartella publish (o dalla root) e
   confrontare gli hash `sha256-...` con i file corrispondenti

Uso:
  1) Apri PowerShell nella root del progetto
  2) ./scripts/check-serviceworker-integrity.ps1

Opzioni:
  -PublishRoot <path>    Cartella che contiene la wwwroot del publish (default: .\publish\wwwroot)
  -RunPublish            Esegue `dotnet publish -c Release -o .\publish` prima del controllo (default: $false)
  -ExitOnMismatch        Restituisce codice di uscita != 0 se ci sono mismatch (default: $true)
#>
[CmdletBinding()]
param(
    [string]$PublishRoot = ".\publish\wwwroot",
    [switch]$RunPublish = $false,
    [switch]$ExitOnMismatch = $true
)

function Write-Ok($s){ Write-Host "OK     " -ForegroundColor Green -NoNewline; Write-Host " $s" }
function Write-Miss($s){ Write-Host "MISSING" -ForegroundColor Yellow -NoNewline; Write-Host " $s" }
function Write-Bad($s){ Write-Host "MISMATCH" -ForegroundColor Red -NoNewline; Write-Host " $s" }

# 1) opzionale: esegui dotnet publish
if($RunPublish){
    if(!(Get-Command dotnet -ErrorAction SilentlyContinue)){
        Write-Host "dotnet non è presente in PATH. Salto il publish." -ForegroundColor Yellow
    } else {
        Write-Host "Eseguo: dotnet publish -c Release -o .\publish" -ForegroundColor Cyan
        $p = dotnet publish -c Release -o .\publish
        if($LASTEXITCODE -ne 0){ Write-Host "dotnet publish fallito (code=$LASTEXITCODE)" -ForegroundColor Red; exit $LASTEXITCODE }
    }
}

# 2) trova il manifest
$manifestCandidates = @(
    Join-Path $PublishRoot 'service-worker-assets.js'
    'service-worker-assets.js'
    '.\service-worker-assets.js'
)
$manifestPath = $manifestCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if(-not $manifestPath){
    Write-Host "Impossibile trovare 'service-worker-assets.js' in: $PublishRoot o nella root. Specifica PublishRoot se necessario." -ForegroundColor Red
    exit 2
}
Write-Host "Usando manifest: $manifestPath" -ForegroundColor Cyan

$manifest = Get-Content $manifestPath -Raw
$pattern = '"hash"\s*:\s*"sha256-([^\"]+)"\s*,\s*"url"\s*:\s*"([^\"]+)"'
$matches = [regex]::Matches($manifest,$pattern)

$total = 0; $ok = 0; $missing = 0; $mismatch = 0

foreach($m in $matches){
    $total++
    $hash = $m.Groups[1].Value
    $url = $m.Groups[2].Value

    # normalizza il percorso file relativo a PublishRoot
    $rel = $url -replace '^\/', ''
    $filePath = Join-Path $PublishRoot $rel

    if(-not (Test-Path $filePath)){
        Write-Miss "$url  (expected sha256-$hash) -> file non trovato: $filePath"
        $missing++
        continue
    }

    try{
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $computed = [Convert]::ToBase64String([System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes))
    } catch {
        Write-Bad "$url  (read error for $filePath)"
        $mismatch++
        continue
    }

    if($computed -eq $hash){
        Write-Ok "$url"
        $ok++
    } else {
        Write-Bad "$url | manifest: $hash | file: $computed"
        $mismatch++
    }
}

Write-Host "`n--- Riepilogo ---" -ForegroundColor Magenta
Write-Host "Totale asset: $total"
Write-Host "OK:        $ok" -ForegroundColor Green
Write-Host "MISSING:   $missing" -ForegroundColor Yellow
Write-Host "MISMATCH:  $mismatch" -ForegroundColor Red

if($mismatch -gt 0 -or $missing -gt 0){
    Write-Host "ATTENZIONE: ci sono asset mancanti o hash non corrispondenti. Rigenera il publish e ridistribuisci tutti i file." -ForegroundColor Red
    if($ExitOnMismatch){ exit 3 } else { exit 0 }
}

Write-Host "Tutto OK: manifest sincronizzato con i file presenti in $PublishRoot" -ForegroundColor Green
exit 0
