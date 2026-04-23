@echo off
REM Avvia il server web per visualizzare l'Albero Genealogico
REM Esegui questo file dalla cartella del progetto

echo.
echo ====================================================================
echo  SERVER WEB - Albero Genealogico Famiglia De Maio
echo ====================================================================
echo.
echo Avvio del server in corso...
echo.

cd /d "%~dp0"

python server.py

pause
