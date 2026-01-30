@echo off
REM Start the PowerShell static server (bypasses execution policy)
cd /d "%~dp0"
start "Soccer PWA Server" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8080
