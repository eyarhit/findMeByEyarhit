@echo off
REM === NE PAS ouvrir FindMe-BI.pbip (double-clic) ===
REM Utilisez cette commande : ETL + connexion MySQL ou .pbix
cd /d "%~dp0\..\.."
call scripts\powerbi-open.cmd
exit /b %ERRORLEVEL%
