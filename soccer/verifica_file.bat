@echo off
chcp 65001 >nul
echo ============================================================
echo VERIFICA FILE MANCANTI - SOCCER MANAGER
echo ============================================================
echo.
echo Cartella base: C:\Users\Luca\Desktop\lavoro Soccer manager con claude 4.5
echo.

cd /d "C:\Users\Luca\Desktop\lavoro Soccer manager con claude 4.5"

if errorlevel 1 (
    echo ERRORE: La cartella non esiste!
    pause
    exit /b
)

set TOTAL=0
set PRESENTI=0
set MANCANTI=0

echo Controllo file in corso...
echo.
echo ============================================================
echo FILE MANCANTI:
echo ============================================================

REM Controlla CSS
if not exist "assets\css\variables.css" (echo   X assets/css/variables.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\base.css" (echo   X assets/css/base.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\components.css" (echo   X assets/css/components.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\modules.css" (echo   X assets/css/modules.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\premium-ui.css" (echo   X assets/css/premium-ui.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\legal-docs.css" (echo   X assets/css/legal-docs.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\meeting-minutes.css" (echo   X assets/css/meeting-minutes.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\filesystem.css" (echo   X assets/css/filesystem.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\scouting.css" (echo   X assets/css/scouting.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\scanner.css" (echo   X assets/css/scanner.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\logistics.css" (echo   X assets/css/logistics.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\archive.css" (echo   X assets/css/archive.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\help-center.css" (echo   X assets/css/help-center.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\ux-fixes.css" (echo   X assets/css/ux-fixes.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\responsive.css" (echo   X assets/css/responsive.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\css\overrides.css" (echo   X assets/css/overrides.css & set /a MANCANTI+=1) else (set /a PRESENTI+=1)

REM Controlla JavaScript
if not exist "assets\js\pdf-utils.js" (echo   X assets/js/pdf-utils.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\team-manager.js" (echo   X assets/js/team-manager.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\local-team-data.js" (echo   X assets/js/local-team-data.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\utils.js" (echo   X assets/js/utils.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\state-manager.js" (echo   X assets/js/state-manager.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\storage.js" (echo   X assets/js/storage.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\athletes.js" (echo   X assets/js/athletes.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\teams.js" (echo   X assets/js/teams.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\calendar.js" (echo   X assets/js/calendar.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\dashboard.js" (echo   X assets/js/dashboard.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\evaluations.js" (echo   X assets/js/evaluations.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\reports.js" (echo   X assets/js/reports.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\finances.js" (echo   X assets/js/finances.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\matchday.js" (echo   X assets/js/matchday.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\attendance.js" (echo   X assets/js/attendance.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\tactics.js" (echo   X assets/js/tactics.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\fiscal-manager.js" (echo   X assets/js/fiscal-manager.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\legal-docs.js" (echo   X assets/js/legal-docs.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\meeting-minutes.js" (echo   X assets/js/meeting-minutes.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\filesystem-manager.js" (echo   X assets/js/filesystem-manager.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\scouting.js" (echo   X assets/js/scouting.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\scanner.js" (echo   X assets/js/scanner.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\logistics.js" (echo   X assets/js/logistics.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\archive.js" (echo   X assets/js/archive.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\onboarding.js" (echo   X assets/js/onboarding.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\help-center.js" (echo   X assets/js/help-center.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\tooltips.js" (echo   X assets/js/tooltips.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\theme.js" (echo   X assets/js/theme.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\info.js" (echo   X assets/js/info.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\ui.js" (echo   X assets/js/ui.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\ads.js" (echo   X assets/js/ads.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\js\app.js" (echo   X assets/js/app.js & set /a MANCANTI+=1) else (set /a PRESENTI+=1)

REM Controlla altri file
if not exist "manifest.json" (echo   X manifest.json & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "assets\icons\icon-192.svg" (echo   X assets/icons/icon-192.svg & set /a MANCANTI+=1) else (set /a PRESENTI+=1)
if not exist "soccer-app.html" (echo   X soccer-app.html & set /a MANCANTI+=1) else (set /a PRESENTI+=1)

set /a TOTAL=PRESENTI+MANCANTI

echo.
echo ============================================================
echo RIEPILOGO:
echo ============================================================
echo File totali richiesti: %TOTAL%
echo File presenti: %PRESENTI%
echo File mancanti: %MANCANTI%
echo.

if %MANCANTI% EQU 0 (
    echo Tutti i file sono presenti!
) else (
    echo Devi creare %MANCANTI% file mancanti.
)

echo.
pause
