Param(
    [switch]$Test,
    [string]$Dialect = 'Romano',
    [int]$MinId = 1
)
Set-StrictMode -Version Latest
$audioRoot = Join-Path $PSScriptRoot '..\audio' | Resolve-Path -ErrorAction Stop
$ffmpeg = Join-Path $PSScriptRoot '..\tools\ffmpeg\bin\ffmpeg.exe'

function Select-ItalianVoice($voice) {
    try {
        $tokens = $voice.GetVoices()
        foreach ($t in $tokens) {
            $desc = $t.GetDescription()
            if ($desc -match 'ital' -or $desc -match 'Ital' -or $desc -match 'Anna' -or $desc -match 'Luca') { return $t }
        }
        # fallback: return first token
        return $tokens.Item(0)
    } catch { }
    return $null
}

$voice = New-Object -ComObject SAPI.SpVoice
$selected = Select-ItalianVoice $voice
if ($selected) { Write-Host "Selecting voice: $($selected.GetDescription())"; $voice.Voice = $selected }

$targets = Get-ChildItem -Path $audioRoot -Filter phrases.json -Recurse | ForEach-Object { $_.FullName }
if ($Test) {
    $file = Join-Path $audioRoot $Dialect
    $phrasesFile = Join-Path $file 'phrases.json'
    $targets = @($phrasesFile)
}

foreach ($pf in $targets) {
    $dir = Split-Path $pf
    $json = Get-Content $pf -Raw | ConvertFrom-Json
    foreach ($p in $json) {
        if ($p.id -lt $MinId) { continue }
        $base = ($p.mp3 -replace '\.mp3$|\.wav$','')
        $wav = Join-Path $dir ($base + '.wav')
        $mp3 = Join-Path $dir ($base + '.mp3')
        $text = $p.text
        if (-not $text) { $text = $p.italian }
        try {
            $stream = New-Object -ComObject SAPI.SpFileStream
            # 3 = SSFMCreateForWrite
            $stream.Open($wav, 3)
            $voice.AudioOutputStream = $stream
            $voice.Speak($text)
            $stream.Close()
            Write-Host "TTS generated WAV: $wav"
        } catch {
            Write-Host "TTS failed for $($p.text): $_" -ForegroundColor Red
            continue
        }
        # convert to mp3
        if (Test-Path $ffmpeg) {
            & $ffmpeg -y -loglevel error -i $wav -codec:a libmp3lame -qscale:a 2 $mp3
            if ($LASTEXITCODE -eq 0) { Write-Host "Created MP3: $mp3" } else { Write-Host "ffmpeg conversion failed for $wav" -ForegroundColor Red }
        } else {
            Write-Host "ffmpeg not found at $ffmpeg" -ForegroundColor Yellow
        }
        if ($Test) { break }
    }
    if ($Test) { break }
}
Write-Host "Done."