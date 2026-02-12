Param([string]$path)
if (-not $path) { Write-Host "Usage: .\dump_wav_header.ps1 <wav_path>"; exit 1 }
[Byte[]]$b = Get-Content -Path $path -Encoding Byte -TotalCount 64
Write-Host "Bytes (hex):"
$b | ForEach-Object { Write-Host ('{0:X2}' -f $_) -NoNewline; Write-Host ' ' -NoNewline }
Write-Host "`nString form:`n" + ([System.Text.Encoding]::ASCII.GetString($b))
$chunk = [System.Text.Encoding]::ASCII.GetString($b[0..3])
Write-Host "ChunkID: $chunk"
$format = [System.Text.Encoding]::ASCII.GetString($b[8..11])
Write-Host "Format: $format"