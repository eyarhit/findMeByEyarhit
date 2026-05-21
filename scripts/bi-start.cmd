@echo off
REM === Find-Me : UNE commande = app + Talend Studio + ETL + Power BI + front ===
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0bi-start.ps1" %*
if errorlevel 1 (
  echo.
  echo ECHEC. Verifiez Docker Desktop demarre.
  exit /b 1
)
exit /b 0
