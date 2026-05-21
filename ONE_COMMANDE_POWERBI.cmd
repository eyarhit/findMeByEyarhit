@echo off
REM === UNE commande : ETL + dashboard Power BI professionnel (.pbix) ===
cd /d "%~dp0"
call scripts\powerbi-open.cmd %*
exit /b %ERRORLEVEL%
