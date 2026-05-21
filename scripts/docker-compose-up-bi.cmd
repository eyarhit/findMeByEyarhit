@echo off
REM Projet BI ESB : Talend ETL + Power BI (sans Metabase)
cd /d "%~dp0.."
echo === Application Find-Me ===
docker compose up -d
if errorlevel 1 exit /b 1
echo.
echo === GRANT MySQL findme_dw ===
docker exec -i findme-mysql mysql -uroot -proot -e "GRANT SELECT ON findme_dw.* TO 'findme_bi'@'%%'; FLUSH PRIVILEGES;" 2>nul
echo.
echo === ETL Talend (runtime Docker) ===
docker compose build --no-cache talend-etl
docker compose run --rm talend-etl
if errorlevel 1 exit /b 1
echo.
echo === Manifest BI + guide Power BI ===
docker compose build powerbi-seed
docker compose run --rm powerbi-seed
docker compose up -d powerbi-guide
if errorlevel 1 exit /b 1
echo.
echo OK — App http://localhost:4200
echo     Guide Power BI http://localhost:8088
echo     Ouvrir Power BI Desktop et connecter findme_dw sur localhost:3306
