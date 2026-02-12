Set-StrictMode -Version Latest

$SampleRate = 16000
$Bits = 16
$Channels = 1
$DurationSeconds = 1
$NumSamples = $SampleRate * $DurationSeconds
$ByteRate = $SampleRate * $Channels * ($Bits/8)
$Subchunk2Size = $NumSamples * $Channels * ($Bits/8)
$ChunkSize = 36 + $Subchunk2Size

$audioRoot = Join-Path $PSScriptRoot '..\audio' | Resolve-Path -ErrorAction Stop
Get-ChildItem -Path $audioRoot -Filter phrases.json -Recurse | ForEach-Object {
    $file = $_.FullName
    $dir = Split-Path $file
    $json = Get-Content $file -Raw | ConvertFrom-Json
    foreach ($p in $json) {
        $wav = Join-Path $dir ($p.mp3 -replace '\.mp3$|\.wav$','.wav')
        Write-Host "Creating WAV: $wav"
        # Build header with BitConverter to avoid BinaryWriter ordering issues
        $list = New-Object System.Collections.Generic.List[byte]
        $list.AddRange([System.Text.Encoding]::ASCII.GetBytes('RIFF'))
        $list.AddRange([BitConverter]::GetBytes([int32]$ChunkSize))
        $list.AddRange([System.Text.Encoding]::ASCII.GetBytes('WAVE'))
        $list.AddRange([System.Text.Encoding]::ASCII.GetBytes('fmt '))
        $list.AddRange([BitConverter]::GetBytes([int32]16))
        $list.AddRange([BitConverter]::GetBytes([int16]1))
        $list.AddRange([BitConverter]::GetBytes([int16]$Channels))
        $list.AddRange([BitConverter]::GetBytes([int32]$SampleRate))
        $list.AddRange([BitConverter]::GetBytes([int32]$ByteRate))
        $list.AddRange([BitConverter]::GetBytes([int16]($Channels*($Bits/8))))
        $list.AddRange([BitConverter]::GetBytes([int16]$Bits))
        $list.AddRange([System.Text.Encoding]::ASCII.GetBytes('data'))
        $list.AddRange([BitConverter]::GetBytes([int32]$Subchunk2Size))
        $zeros = New-Object byte[] $Subchunk2Size
        $list.AddRange($zeros)
        try {
            [System.IO.File]::WriteAllBytes($wav,$list.ToArray())
            Write-Host "Wrote $wav"
        } catch {
            Write-Host ("Failed to write {0}: {1}" -f $wav, $_) -ForegroundColor Red
        }
    }
}
Write-Host "Done."