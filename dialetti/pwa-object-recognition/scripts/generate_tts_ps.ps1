<#
Generate WAV files using Windows TTS (System.Speech) and optionally convert to MP3 with ffmpeg.
Run: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\generate_tts_ps.ps1
#>

Set-StrictMode -Version Latest

try {
    Add-Type -AssemblyName System.Speech -ErrorAction Stop
} catch {
    Write-Host "System.Speech assembly not available: $_" -ForegroundColor Yellow
}

$root = Join-Path $PSScriptRoot '..\audio' | Resolve-Path -ErrorAction Stop
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue

Get-ChildItem -Path $root -Filter phrases.json -Recurse | ForEach-Object {
    $file = $_.FullName
    $dir = Split-Path $file
    $json = Get-Content $file -Raw | ConvertFrom-Json
    foreach ($p in $json) {
        $baseName = ($p.mp3 -replace '\.mp3$|\.wav$', '')
        $wav = Join-Path $dir ($baseName + '.wav')
        $mp3 = Join-Path $dir ($baseName + '.mp3')

        if (-not (Test-Path $wav)) {
            try {
                $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
                # Prefer Italian voice if available
                $it = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.TwoLetterISOLanguageName -eq 'it' } | Select-Object -First 1
                if ($it) { $synth.SelectVoice($it.VoiceInfo.Name) }
                $synth.SetOutputToWaveFile($wav)
                $synth.Speak($p.text)
                $synth.Dispose()
                Write-Host "Created WAV: $wav"
            } catch {
                Write-Host "TTS failed for $($p.text): $_" -ForegroundColor Red
            }
        } else {
            Write-Host "Skipping existing WAV: $wav"
        }

        if ($ffmpeg) {
            if (-not (Test-Path $mp3)) {
                Write-Host "Converting to MP3: $mp3"
                & ffmpeg -y -loglevel error -i $wav -codec:a libmp3lame -qscale:a 2 $mp3
                if ($LASTEXITCODE -eq 0) { Write-Host "Created MP3: $mp3" } else { Write-Host "ffmpeg conversion failed for $wav" -ForegroundColor Red }
            } else {
                Write-Host "Skipping existing MP3: $mp3"
            }
        } else {
            Write-Host "ffmpeg not found; MP3 conversion skipped (install ffmpeg to enable)." -ForegroundColor Yellow
        }
    }
}

Write-Host "Done."