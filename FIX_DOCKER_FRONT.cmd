@echo off
REM Repare l'app http://localhost:4200 (rebuild frontend uniquement)
cd /d "%~dp0"
echo === git pull ===
git pull
if errorlevel 1 exit /b 1
echo.
echo === Build frontend (3 essais si reseau coupe) ===
call "%~dp0scripts\docker-build-frontend.cmd"
if errorlevel 1 exit /b 1
echo.
echo === Redemarrage conteneur ===
docker compose up -d --force-recreate frontend
echo.
echo OK — http://localhost:4200  (Ctrl+Shift+R)
echo Admin : admin@gmail.com / admin  — menu Espace Admin
pause
