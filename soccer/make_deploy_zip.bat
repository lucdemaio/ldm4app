@echo off
REM Create a ZIP of the current project into the Desktop as lavoro-soccer-manager-19-gennaio.zip
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Compress-Archive -Path * -DestinationPath \"$env:USERPROFILE\Desktop\lavoro-soccer-manager-19-gennaio.zip\" -CompressionLevel Optimal -Force; $h = Get-FileHash -Path \"$env:USERPROFILE\Desktop\lavoro-soccer-manager-19-gennaio.zip\" -Algorithm SHA256; Write-Output \"ZIP_CREATED|Path:$env:USERPROFILE\\Desktop\\lavoro-soccer-manager-19-gennaio.zip|Size:$((Get-Item \"$env:USERPROFILE\\Desktop\\lavoro-soccer-manager-19-gennaio.zip\").Length)|SHA256:$($h.Hash)\" } catch { Write-Output \"ZIP_FAILED: $_\" }" 
pause