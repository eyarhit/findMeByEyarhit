@echo off
cd /d "%~dp0.."
echo === Power BI Report Server (conteneur Windows) ===
echo Docker Desktop doit etre en mode "Windows containers".
echo URL : http://localhost:8077/reports
echo Login : PBIRSAdmin / FindMe_PBIRS@123
echo.
docker compose -f docker-compose.yml -f docker-compose.powerbi-windows.yml --profile bi-powerbi up -d powerbi-rs
docker compose ps powerbi-rs
exit /b 0
