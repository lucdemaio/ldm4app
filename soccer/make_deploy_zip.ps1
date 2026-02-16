# PowerShell script to create ZIP of project into Desktop
param(
    [string]$OutputName = "lavoro-soccer-manager-19-gennaio.zip"
)
$root = (Get-Location).Path
$dest = Join-Path $env:USERPROFILE $OutputName
try {
    Compress-Archive -Path (Join-Path $root '*') -DestinationPath $dest -CompressionLevel Optimal -Force
    $info = Get-Item $dest
    $hash = Get-FileHash $dest -Algorithm SHA256
    Write-Output "ZIP_CREATED|Path:$($info.FullName)|Size:$($info.Length)|SHA256:$($hash.Hash)"
} catch {
    Write-Error "ZIP_FAILED: $_"
}
Read-Host -Prompt "Premi INVIO per chiudere"