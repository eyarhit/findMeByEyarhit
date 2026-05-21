@echo off
REM Stack Find-Me + BI formation (Talend ETL + Power BI sur findme_dw)
cd /d "%~dp0.."
echo === Demarrage application ===
docker compose up -d %*
if errorlevel 1 exit /b 1
echo.
echo === ETL Talend (runtime Docker) ===
docker compose build --no-cache talend-etl
docker compose run --rm talend-etl
if errorlevel 1 (
  echo ERREUR talend-etl. Voir logs ci-dessus.
  exit /b 1
)
echo.
echo === BI : ouvrir Power BI Desktop ===
echo   1. Connexion MySQL localhost:3306 / findme_dw / findme_bi
echo   2. Guide : bi\powerbi\README.md
echo   3. Rapports : bi\powerbi\reports\*.pbix
echo   4. Admin app : http://localhost:4200  (page BI)
echo.
echo OK.
