@echo off
REM ETL + Power BI : .pbix ou findme_dw.pbids (NE PAS ouvrir FindMe-BI.pbip)
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0powerbi-open.ps1" %*
exit /b %ERRORLEVEL%
