Set-StrictMode -Version Latest

$audioRoot = Join-Path $PSScriptRoot '..\audio' | Resolve-Path -ErrorAction Stop

# Choose voice if available
function Select-ItalianVoice($synth) {
    $voices = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo }
    $itVoice = $voices | Where-Object { $_.Culture.Name -like 'it*' } | Select-Object -First 1
    if ($itVoice) { return $itVoice.Name }
    return $null
}

Get-ChildItem -Path $audioRoot -Filter phrases.json -Recurse | ForEach-Object {
    $file = $_.FullName
    $dir = Split-Path $file
    $json = Get-Content $file -Raw | ConvertFrom-Json
    foreach ($p in $json) {
        $base = ($p.mp3 -replace '\.mp3$|\.wav$','')
        $wav = Join-Path $dir ($base + '.wav')
        $mp3 = Join-Path $dir ($base + '.mp3')
        # Generate WAV spoken audio with Windows TTS
        try {
            $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
            $voice = Select-ItalianVoice $synth
            if ($voice) { $synth.SelectVoice($voice) }
            $synth.Rate = 0
            $synth.Volume = 100
            $synth.SetOutputToWaveFile($wav)
            $text = $p.text
            if (-not $text) { $text = $p.italian }
            $synth.Speak($text)
            $synth.Dispose()
            Write-Host "Generated WAV: $wav"
        } catch {
            Write-Host "TTS failed for $($p.text): $_" -ForegroundColor Red
        }
        # Convert to MP3 with ffmpeg (overwrite)
        if (Test-Path $wav) {
            & .\tools\ffmpeg\bin\ffmpeg.exe -y -loglevel error -i $wav -codec:a libmp3lame -qscale:a 2 $mp3
            if ($LASTEXITCODE -eq 0) { Write-Host "Created MP3: $mp3" } else { Write-Host "ffmpeg conversion failed for $wav" -ForegroundColor Red }
        }
    }
}

Write-Host "Done."