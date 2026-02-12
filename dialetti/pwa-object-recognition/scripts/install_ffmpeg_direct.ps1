Set-StrictMode -Version Latest

$toolsRoot = Join-Path $PSScriptRoot '..\tools' -Resolve
if (-not (Test-Path $toolsRoot)) { New-Item -ItemType Directory -Path $toolsRoot -Force | Out-Null }
$zip = Join-Path $env:TEMP 'ffmpeg_direct.zip'
$url = 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-n5.1-latest-win64-gpl.zip'

Write-Host "Downloading ffmpeg from: $url"
try {
    Remove-Item -Force $zip -ErrorAction SilentlyContinue
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -Verbose -ErrorAction Stop
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

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

# Find extracted folder and copy bin to tools\ffmpeg\bin
$extracted = Get-ChildItem -Path $toolsRoot -Directory | Where-Object { $_.Name -match 'ffmpeg' } | Select-Object -First 1
if (-not $extracted) { Write-Host "No extracted ffmpeg folder found" -ForegroundColor Red; exit 1 }
$srcBin = Join-Path $extracted.FullName 'bin'
$destBin = Join-Path $toolsRoot 'ffmpeg\bin'
if (-not (Test-Path $srcBin)) { Write-Host "Expected bin not found at $srcBin" -ForegroundColor Red; exit 1 }
New-Item -ItemType Directory -Path $destBin -Force | Out-Null
Copy-Item -Path (Join-Path $srcBin '*') -Destination $destBin -Recurse -Force
Write-Host "ffmpeg installed to $destBin"

# Add to PATH for session
$env:PATH = $destBin + ';' + $env:PATH
Write-Host "ffmpeg version:"; & ffmpeg -version

# Run conversion script
Write-Host "Running generate_tts_ps.ps1 to convert WAV to MP3"
& (Join-Path $PSScriptRoot 'generate_tts_ps.ps1')
Write-Host "Done."