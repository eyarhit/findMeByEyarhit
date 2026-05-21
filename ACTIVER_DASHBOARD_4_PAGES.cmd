@echo off
REM Affiche les 4 pages du dashboard (obligatoire : option PBIR dans Power BI)
cd /d "%~dp0"
echo.
echo ============================================================
echo   DASHBOARD 4 PAGES - ACTIVER LE FORMAT PBIR (1 fois)
echo ============================================================
echo.
echo Si vous voyez seulement "Page 1" vide, c'est normal SANS cette option :
echo.
echo   Power BI Desktop ^> Fichier ^> Options et parametres ^> Options
echo   ^> Fonctionnalites preliminaires
echo.
echo   Cocher OBLIGATOIREMENT :
echo     [x] Stocker les rapports au format de metadonnees ameliore (PBIR)
echo         (en anglais : Store reports using enhanced metadata format)
echo     [x] Option d'enregistrement de projet Power BI (.pbip)
echo     [x] Modèle sémantique TMDL (si propose)
echo.
echo   Redemarrer Power BI Desktop.
echo.
echo Ensuite dans ce dossier :
echo   GIT_PULL_BI.cmd
echo.
echo Vous devez voir en bas : 01 - Executive, 02 - Managerial,
echo   03 - Operationnel, 04 - Technique
echo.
pause
call GIT_PULL_BI.cmd
exit /b %ERRORLEVEL%
