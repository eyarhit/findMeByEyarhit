@echo off
REM ETL + ouverture Power BI avec projet preconfigure (toutes les tables findme_dw)
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0powerbi-open.ps1" %*
exit /b %ERRORLEVEL%
