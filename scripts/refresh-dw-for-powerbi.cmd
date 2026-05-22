@echo off
REM Apres inscription / candidat / mission dans l'app : alimenter findme_dw puis Actualiser Power BI
cd /d "%~dp0.."
echo === ETL Talend : user_bd -^> findme_dw ===
docker compose run --rm talend-etl
if errorlevel 1 (
  echo ECHEC ETL. Verifiez : docker compose ps  (mysql healthy)
  exit /b 1
)
echo.
echo === Verification CANDIDAT dans l'entrepot ===
docker compose exec mysql mysql -ufindme_bi -pfindme_bi_readonly -e "SELECT d.role_name, SUM(f.user_count) AS nb FROM findme_dw.fact_user f JOIN findme_dw.dim_user d ON d.user_key=f.user_key GROUP BY d.role_name ORDER BY nb DESC;"
echo.
echo OK — Dans Power BI Desktop : bouton **Actualiser** (Accueil)
echo Page 03 : anneau role_name + mesure Total utilisateurs
pause
