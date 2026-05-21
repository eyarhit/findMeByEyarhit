@echo off
REM Stack sans bi-etl au "up" (evite exit 1). BI via "compose run" (fiable sous Windows).
cd /d "%~dp0.."
echo === Demarrage services (sans ETL BI) ===
docker compose up -d %*
if errorlevel 1 exit /b 1
echo.
echo === ETL findme_dw ===
docker compose build bi-etl
docker compose run --rm bi-etl
if errorlevel 1 (
  echo ERREUR bi-etl. Logs : docker compose logs bi-etl
  exit /b 1
)
echo.
echo === Seed Metabase + manifest BI ===
docker compose build metabase-seed
docker compose run --rm metabase-seed
if errorlevel 1 (
  echo ERREUR metabase-seed. Logs : docker compose logs metabase-seed
  exit /b 1
)
echo.
echo OK — App http://localhost:4200  Metabase http://localhost:3030
