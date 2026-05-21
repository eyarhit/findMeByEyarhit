@echo off
REM Si le .pbip est vide : ouvre le .pbix deja configure
cd /d "%~dp0\..\.."
if not exist "bi\powerbi\reports\FindMe_BI_Auto.pbix" (
  echo.
  echo Fichier manquant : bi\powerbi\reports\FindMe_BI_Auto.pbix
  echo.
  echo 1. Lancez ONE_COMMANDE_POWERBI.cmd
  echo 2. Connectez MySQL, chargez les tables, creez vos visuels
  echo 3. Enregistrer sous : bi\powerbi\reports\FindMe_BI_Auto.pbix
  echo 4. Relancez ce script
  pause
  exit /b 1
)
call ONE_COMMANDE_POWERBI.cmd
