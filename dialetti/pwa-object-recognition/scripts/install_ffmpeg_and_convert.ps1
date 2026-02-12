Set-StrictMode -Version Latest

$toolsRoot = Join-Path $PSScriptRoot '..\tools'
if (-not (Test-Path $toolsRoot)) { New-Item -ItemType Directory -Path $toolsRoot -Force | Out-Null }
$ffmpegBin = Join-Path $toolsRoot 'ffmpeg\bin'

if (-not (Test-Path (Join-Path $ffmpegBin 'ffmpeg.exe'))) {
    Write-Host "Downloading ffmpeg..."
    $url = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
    $zip = Join-Path $env:TEMP 'ffmpeg.zip'
    try {
        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -ErrorAction Stop
        Expand-Archive $zip -DestinationPath $toolsRoot -Force
        $extracted = Get-ChildItem -Path $toolsRoot -Directory | Where-Object { $_.Name -like 'ffmpeg*' } | Select-Object -First 1
        if ($extracted) {
            $src = Join-Path $extracted.FullName 'bin'
            New-Item -ItemType Directory -Path $ffmpegBin -Force | Out-Null
            Copy-Item -Path (Join-Path $src '*') -Destination $ffmpegBin -Recurse -Force
            Write-Host "ffmpeg installed to $ffmpegBin"
        } else {
            Write-Host "Failed to find extracted ffmpeg folder" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "Download or extraction failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ffmpeg already present at $ffmpegBin"
}

# Add to PATH for this session
$env:PATH = $ffmpegBin + ';' + $env:PATH

Write-Host "ffmpeg version:"; & ffmpeg -version

Write-Host "Running generate_tts_ps.ps1 to produce MP3s (if any WAV exist)."
& (Join-Path $PSScriptRoot 'generate_tts_ps.ps1')

Write-Host "Done."