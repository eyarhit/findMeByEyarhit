@echo off
REM Supprime l'ancien .pbip casse et ouvre la connexion MySQL (pbids)
cd /d "%~dp0.."
if exist "bi\powerbi\FindMe-BI\FindMe-BI.pbip" del /f /q "bi\powerbi\FindMe-BI\FindMe-BI.pbip"
echo Ancien .pbip supprime si present.
call scripts\powerbi-open.cmd
exit /b %ERRORLEVEL%
