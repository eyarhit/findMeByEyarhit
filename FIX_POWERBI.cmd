@echo off
REM === A la racine du projet : corrige .pbip + ouvre MySQL (sans git pull) ===
cd /d "%~dp0"

echo.
echo [1/3] Suppression ancien FindMe-BI.pbip (erreur dataset)...
del /f /q "bi\powerbi\FindMe-BI\FindMe-BI.pbip" 2>nul
rmdir /s /q "bi\powerbi\FindMe-BI" 2>nul
del /f /q "bi\powerbi\_dev-pbip-project\FindMe-BI.pbip" 2>nul

echo [2/3] Ouverture connexion MySQL...
if exist "bi\powerbi\CONNEXION_FindMe_MySQL.pbids" (
  start "" "%~dp0bi\powerbi\CONNEXION_FindMe_MySQL.pbids"
  goto :done
)
if exist "bi\powerbi\starter\findme_dw.pbids" (
  start "" "%~dp0bi\powerbi\starter\findme_dw.pbids"
  goto :done
)

echo Fichier .pbids absent. Faites d'abord GIT_PULL_BI.cmd puis relancez.
goto :end

:done
echo.
echo [3/3] Power BI doit afficher le Navigateur MySQL.
echo   Utilisateur : findme_bi
echo   Mot de passe : findme_bi_readonly
echo   Puis Enregistrer sous : bi\powerbi\reports\FindMe_BI_Auto.pbix
echo.

:end
pause
