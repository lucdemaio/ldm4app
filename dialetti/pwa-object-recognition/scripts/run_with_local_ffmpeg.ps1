Set-StrictMode -Version Latest
$ffBin = Resolve-Path (Join-Path $PSScriptRoot '..\tools\ffmpeg\bin')
$env:PATH = $ffBin.Path + ';' + $env:PATH
Write-Host "ffmpeg is at: $($ffBin.Path)"
Write-Host "ffmpeg version:"; & ffmpeg -version
Write-Host "Running generate_tts_ps.ps1 to convert WAV to MP3"
& (Join-Path $PSScriptRoot 'generate_tts_ps.ps1')
Write-Host "Done."