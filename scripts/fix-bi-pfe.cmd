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
echo === Console BI (navigateur) ===
echo http://localhost:3032/?tab=talend
echo http://localhost:3032/?tab=powerbi
echo Ou Admin Angular - Tableaux de bord BI
exit /b 0
