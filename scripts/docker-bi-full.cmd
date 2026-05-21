@echo off
cd /d "%~dp0.."
echo === BI Find-Me — stack complete (Linux) ===
echo Talend Studio : http://localhost:6080  (VNC: findme)
echo Hub BI        : http://localhost:3032
echo.
docker compose build bi-hub talend-studio
docker compose up -d mysql bi-hub talend-studio
echo.
echo ETL initial (si findme_dw vide)...
docker compose run --rm talend-etl
echo.
echo === Power BI Report Server (Windows containers) ===
echo Executez en mode conteneurs Windows :
echo   scripts\docker-bi-powerbi-windows.cmd
echo Puis : http://localhost:8077/reports
exit /b 0
