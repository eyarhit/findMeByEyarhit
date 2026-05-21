@echo off
REM === Debloque git pull (conflits dossier FindMe-BI) ===
cd /d "%~dp0"

echo Suppression locale du vieux dossier FindMe-BI...
rmdir /s /q "bi\powerbi\FindMe-BI" 2>nul

echo Reset fichiers bi/powerbi...
git checkout -- bi/powerbi/ 2>nul
git clean -fd bi/powerbi/ 2>nul

echo git pull...
git pull
if errorlevel 1 (
  echo.
  echo ECHEC git pull. Essayez :
  echo   git stash -u
  echo   git pull
  pause
  exit /b 1
)

echo.
echo OK. Ensuite double-clic : FIX_POWERBI.cmd
echo ou : scripts\powerbi-fix.cmd
pause
