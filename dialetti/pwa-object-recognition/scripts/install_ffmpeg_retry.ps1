Set-StrictMode -Version Latest

$toolsRoot = Join-Path $PSScriptRoot '..\tools' -Resolve
if (-not (Test-Path $toolsRoot)) { New-Item -ItemType Directory -Path $toolsRoot -Force | Out-Null }
$zip = Join-Path $env:TEMP 'ffmpeg_retry.zip'
$url = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'

$maxAttempts = 3
$success = $false
for ($i = 1; $i -le $maxAttempts; $i++) {
    Write-Host ("Attempt {0}: Downloading {1}" -f $i, $url)
    try {
        Remove-Item -Force $zip -ErrorAction SilentlyContinue
        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -ErrorAction Stop
        $info = Get-Item $zip
        if ($info.Length -gt 1000000) { $success = $true; break } else { Write-Host ("Downloaded file too small ({0} bytes), retrying..." -f $info.Length) }
    } catch {
        Write-Host ("Download attempt {0} failed: {1}" -f $i, $_) -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2
}
if (-not $success) { Write-Host "All download attempts failed" -ForegroundColor Red; exit 1 }

Write-Host "Extracting archive to $toolsRoot"
try {
    Expand-Archive -LiteralPath $zip -DestinationPath $toolsRoot -Force -ErrorAction Stop
} catch {
    Write-Host "Expand-Archive failed, trying .NET ZipFile method" -ForegroundColor Yellow
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zip,$toolsRoot)
    } catch {
        Write-Host "Extraction failed: $_" -ForegroundColor Red
        exit 1
    }
}

$extracted = Get-ChildItem -Path $toolsRoot -Directory | Where-Object { $_.Name -match 'ffmpeg' } | Select-Object -First 1
if (-not $extracted) { Write-Host "No extracted ffmpeg folder found" -ForegroundColor Red; exit 1 }
$srcBin = Join-Path $extracted.FullName 'bin'
$destBin = Join-Path $toolsRoot 'ffmpeg\bin'
if (-not (Test-Path $srcBin)) { Write-Host "Expected bin not found at $srcBin" -ForegroundColor Red; exit 1 }
New-Item -ItemType Directory -Path $destBin -Force | Out-Null
Copy-Item -Path (Join-Path $srcBin '*') -Destination $destBin -Recurse -Force
Write-Host "ffmpeg installed to $destBin"

$env:PATH = $destBin + ';' + $env:PATH
Write-Host "ffmpeg version:"; & ffmpeg -version
Write-Host "Running generate_tts_ps.ps1 to produce MP3s"
& (Join-Path $PSScriptRoot 'generate_tts_ps.ps1')
Write-Host "Done."