@echo off
REM === DOUBLE-CLIC ICI (pas FindMe-BI.pbip) ===
REM ETL + connexion MySQL ou .pbix
cd /d "%~dp0\..\.."
call scripts\powerbi-open.cmd
exit /b %ERRORLEVEL%
