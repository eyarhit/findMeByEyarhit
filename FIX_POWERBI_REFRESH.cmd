@echo off
REM Regenere le modele + verifie MySQL + rappel Actualiser dans Power BI
REM Si git pull bloque : GIT_PULL_BI.cmd (pas git pull seul)
cd /d "%~dp0"
echo === Verification MySQL findme_dw ===
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verify-mysql-dw.ps1
if errorlevel 1 exit /b 1
echo.
echo === Regeneration modele TMDL ===
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\generate-powerbi-multi-dashboard.ps1
echo.
echo === Dans Power BI (deja ouvert ou apres ONE_COMMANDE_POWERBI.cmd) ===
echo   1. Fermer et rouvrir FindMe-Dashboard.pbip
echo   2. Accueil - Actualiser
echo   3. Parametres : localhost:3306 / findme_dw / findme_bi / findme_bi_readonly
echo   4. Si triangles rouges : Transformer les donnees - Parametres source
echo      - Supprimer les permissions MySQL enregistrees (si anciennes)
echo      - Modifier : findme_bi / findme_bi_readonly
echo   5. Accueil - Actualiser (attendre la fin, 18 tables + mesures DAX)
echo   6. Pages : 01 Executive | 02 Managerial | 03 Operationnel | 04 Technique
pause
