@echo off
REM === Debloque git pull (fichiers Power BI generes localement) ===
cd /d "%~dp0"

echo [1/4] Suppression ancien dossier FindMe-BI (piege .pbip)...
rmdir /s /q "bi\powerbi\FindMe-BI" 2>nul

echo [2/4] Reset bi/powerbi (fichiers .tmdl modifies par Power BI)...
git checkout -- bi/powerbi/
if errorlevel 1 (
  echo git checkout a echoue - essayez : git stash push -u -m "pbi-local"
  git stash push -u -m "pbi-local" 2>nul
)
git clean -fd bi/powerbi/

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

echo [4/4] OK - lancement dashboard...
call ONE_COMMANDE_POWERBI.cmd
exit /b %ERRORLEVEL%
