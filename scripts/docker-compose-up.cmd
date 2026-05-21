@echo off
REM Demarre toute la stack en recreant bi-etl et metabase-seed (evite exit 1 bloquant).
cd /d "%~dp0.."
docker compose rm -sf bi-etl metabase-seed 2>nul
docker compose up -d %*
if errorlevel 1 exit /b 1
echo.
echo OK. Verifier : docker compose ps -a
echo Logs ETL : docker compose logs bi-etl
