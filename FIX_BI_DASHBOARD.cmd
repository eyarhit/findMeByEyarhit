@echo off
REM Reconstruit Hub BI + frontend admin (graphiques findme_dw)
cd /d "%~dp0"
echo Build bi-hub + frontend...
docker compose build bi-hub frontend
if errorlevel 1 exit /b 1
echo Redemarrage...
docker compose up -d mysql bi-hub frontend
echo.
echo Ouvrir: http://localhost:4200/utilisateur/bi/executive
echo Admin: admin@gmail.com / admin
pause
