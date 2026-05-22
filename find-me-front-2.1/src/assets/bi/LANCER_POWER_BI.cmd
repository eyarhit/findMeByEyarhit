@echo off
REM Telecharge depuis l'app admin BI — placez a la racine findMeByEyarhit si besoin
cd /d "%~dp0..\..\..\"
if exist "ONE_COMMANDE_POWERBI.cmd" (
  call ONE_COMMANDE_POWERBI.cmd
  exit /b %ERRORLEVEL%
)
echo Erreur : lancez depuis le dossier clone findMeByEyarhit (git clone eyarhit/findMeByEyarhit)
pause
exit /b 1
