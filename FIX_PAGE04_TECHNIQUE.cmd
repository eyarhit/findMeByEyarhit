@echo off
REM Page 04 vide : remplit fact_quiz / fact_codingame + regenere mesures DAX
cd /d "%~dp0"
echo === Verification comptages findme_dw ===
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verify-mysql-dw.ps1
if errorlevel 1 exit /b 1
echo.
echo === ETL Talend (seed demo quiz/CodinGame si vide) ===
docker compose run --rm talend-etl
if errorlevel 1 exit /b 1
echo.
echo === Regeneration modele Power BI ===
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\generate-powerbi-multi-dashboard.ps1
rmdir /s /q "bi\powerbi\FindMe-Dashboard\FindMe-Dashboard.Report\.pbi" 2>nul
echo.
echo Dans Power BI : Fermer, rouvrir FindMe-Dashboard.pbip, puis Actualiser.
echo Page 04 attendu : Tentatives quiz 3, Sessions codingame 3, graphiques remplis.
pause
