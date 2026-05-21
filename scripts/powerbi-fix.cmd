@echo off
REM Supprime FindMe-BI.pbip (erreur dataset) puis ouvre findme_dw.pbids
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0powerbi-fix.ps1" %*
exit /b %ERRORLEVEL%
