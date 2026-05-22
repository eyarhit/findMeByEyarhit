@echo off
REM Apres git pull : reconstruit front + hub (corrige page blanche / freeze admin BI)
cd /d "%~dp0"
echo [1/3] Build frontend + bi-hub...
docker compose build frontend bi-hub
if errorlevel 1 exit /b 1
echo [2/3] Demarrage mysql + hub + front...
docker compose up -d mysql bi-hub frontend
echo [3/3] ETL (entrepot findme_dw)...
docker compose run --rm talend-etl
echo.
echo OK : http://localhost:4200/login
echo BI : http://localhost:4200/utilisateur/bi/executive
echo admin@gmail.com / admin  — Ctrl+F5 si besoin
pause
