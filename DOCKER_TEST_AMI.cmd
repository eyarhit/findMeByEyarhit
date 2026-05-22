@echo off
REM Test ami 100%% Docker — app + BI + ETL (pas de npm/Java local)
cd /d "%~dp0"
echo === Find-Me : demarrage Docker (ami testeur) ===
call "%~dp0scripts\docker-compose-up.cmd"
if errorlevel 1 exit /b 1
echo.
echo === URLs ===
echo Application + admin BI : http://localhost:4200
echo   Login admin : admin@gmail.com / admin
echo   Menu : Tableaux de bord BI
echo Hub BI                 : http://localhost:3032
echo.
echo ETL manuel si besoin :
echo   docker compose run --rm talend-etl
echo.
echo Power BI (Windows, hors Docker) :
echo   GIT_PULL_BI.cmd
echo.
echo Guide : bi\GUIDE_TEST_AMI_APRES_PULL.md
pause
