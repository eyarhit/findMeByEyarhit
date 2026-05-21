@echo off
REM === Debloque git pull (fichiers Power BI generes localement) ===
cd /d "%~dp0"

echo [1/4] Suppression ancien dossier FindMe-BI (piege .pbip)...
rmdir /s /q "bi\powerbi\FindMe-BI" 2>nul

echo [2/4] Reset modele PBIP + cache rapport local...
git checkout -- bi/powerbi/FindMe-Dashboard/
rmdir /s /q "bi\powerbi\FindMe-Dashboard\FindMe-Dashboard.Report\.pbi" 2>nul
if errorlevel 1 (
  echo git checkout a echoue - essayez : git stash push -m "pbi-tmdl"
  git stash push -m "pbi-tmdl" 2>nul
)
REM NE PAS git clean bi/powerbi/ : supprime FindMe_BI_Auto.pbix non versionne

echo [3/4] git pull...
git pull
if errorlevel 1 (
  echo.
  echo ECHEC. Commandes manuelles :
  echo   git stash -u
  echo   git pull
  pause
  exit /b 1
)

echo [4/4] OK - ETL + dashboard (page 04 sans filtre annee 1900)...
call ONE_COMMANDE_POWERBI.cmd
exit /b %ERRORLEVEL%
