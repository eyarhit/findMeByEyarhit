@echo off
REM Corrige GRANT findme_dw + rebuild ETL (image Docker souvent obsolete apres git pull).
cd /d "%~dp0.."
echo === GRANT findme_bi sur findme_dw ===
docker exec -i findme-mysql mysql -uroot -proot -e "GRANT SELECT ON findme_dw.* TO 'findme_bi'@'%%'; FLUSH PRIVILEGES;"
if errorlevel 1 exit /b 1
echo.
echo === Rebuild ETL (obligatoire apres git pull) ===
docker compose build --no-cache bi-etl
if errorlevel 1 exit /b 1
echo.
echo Verifier la ligne: build ETL : 852bbf6-fk-grants
docker compose run --rm bi-etl
if errorlevel 1 exit /b 1
echo.
echo === Seed Metabase (rebuild sans cache) ===
docker compose build --no-cache metabase-seed
docker compose run --rm metabase-seed
exit /b %errorlevel%
