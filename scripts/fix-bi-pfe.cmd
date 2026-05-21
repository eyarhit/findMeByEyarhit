@echo off
cd /d "%~dp0.."
echo === GRANT findme_bi sur findme_dw ===
docker exec -i findme-mysql mysql -uroot -proot -e "GRANT SELECT ON findme_dw.* TO 'findme_bi'@'%%'; FLUSH PRIVILEGES;"
if errorlevel 1 exit /b 1
echo.
echo === ETL Talend ===
docker compose build --no-cache talend-etl
docker compose run --rm talend-etl
if errorlevel 1 exit /b 1
echo.
echo === Power BI : ouvrir Desktop et bi\powerbi\README.md ===
exit /b 0
