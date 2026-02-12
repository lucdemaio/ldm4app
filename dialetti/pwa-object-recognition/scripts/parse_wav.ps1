Param([string]$path)
$fs = [System.IO.File]::OpenRead($path)
$br = New-Object System.IO.BinaryReader($fs)
$chunkID = -join ($br.ReadBytes(4) | ForEach-Object {[char]$_})
$chunkSize = $br.ReadInt32()
$format = -join ($br.ReadBytes(4) | ForEach-Object {[char]$_})
$subchunk1ID = -join ($br.ReadBytes(4) | ForEach-Object {[char]$_})
$subchunk1Size = $br.ReadInt32()
$audioFormat = $br.ReadInt16()
$numChannels = $br.ReadInt16()
$sampleRate = $br.ReadInt32()
$byteRate = $br.ReadInt32()
$blockAlign = $br.ReadInt16()
$bitsPerSample = $br.ReadInt16()
$subchunk2ID = -join ($br.ReadBytes(4) | ForEach-Object {[char]$_})
$subchunk2Size = $br.ReadInt32()
$br.Close(); $fs.Close()
Write-Host "ChunkID: $chunkID"
Write-Host "ChunkSize: $chunkSize"
Write-Host "Format: $format"
Write-Host "Subchunk1ID: $subchunk1ID"
Write-Host "Subchunk1Size: $subchunk1Size"
Write-Host "AudioFormat: $audioFormat"
Write-Host "NumChannels: $numChannels"
Write-Host "SampleRate: $sampleRate"
Write-Host "ByteRate: $byteRate"
Write-Host "BlockAlign: $blockAlign"
Write-Host "BitsPerSample: $bitsPerSample"
Write-Host "Subchunk2ID: $subchunk2ID"
Write-Host "Subchunk2Size: $subchunk2Size"