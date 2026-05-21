@echo off
REM Demarre toute la stack en recreant bi-etl et metabase-seed (evite exit 1 bloquant).
cd /d "%~dp0.."
docker compose rm -sf bi-etl metabase-seed 2>nul
docker compose build bi-etl metabase-seed
docker compose up -d --force-recreate bi-etl metabase-seed
if errorlevel 1 (
  echo Echec bi-etl via compose up — retry avec compose run...
  docker compose run --rm bi-etl
  if errorlevel 1 exit /b 1
  docker compose run --rm metabase-seed
  if errorlevel 1 exit /b 1
)
docker compose up -d %*
if errorlevel 1 exit /b 1
echo.
echo OK. Verifier : docker compose ps -a
echo Logs ETL : docker compose logs bi-etl
