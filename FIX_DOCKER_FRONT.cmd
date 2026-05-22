@echo off
REM Repare l'app http://localhost:4200 (image Docker obsolete ou app.module casse)
cd /d "%~dp0"
echo === git pull ===
git pull
if errorlevel 1 exit /b 1
echo.
echo === Rebuild frontend (sans cache) ===
docker compose build --no-cache frontend
if errorlevel 1 exit /b 1
echo.
echo === Redemarrage conteneur ===
docker compose up -d --force-recreate frontend
echo.
echo OK — Ouvrez http://localhost:4200 (Ctrl+Shift+R)
echo Login admin : admin@gmail.com / admin
echo Espace Admin : menu lateral ^> Espace Admin
pause
