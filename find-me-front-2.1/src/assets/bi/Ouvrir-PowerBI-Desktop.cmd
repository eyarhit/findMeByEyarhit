@echo off
title Find-Me - Ouvrir Power BI Desktop
setlocal EnableDelayedExpansion

REM Cherche le clone findMeByEyarhit (Desktop, Documents, lecteur courant)
set "FOUND="
for %%R in ("%USERPROFILE%\Desktop" "%USERPROFILE%\Documents" "D:\" "C:\" "%~dp0..\..\..\..") do (
  if exist "%%~fR\findMeByEyarhit\ONE_COMMANDE_POWERBI.cmd" (
    set "FOUND=%%~fR\findMeByEyarhit"
    goto :launch
  )
)

echo.
echo Projet Find-Me introuvable automatiquement.
echo Ouvrez une invite CMD dans le dossier du clone puis executez :
echo   ONE_COMMANDE_POWERBI.cmd
echo.
pause
exit /b 1

:launch
cd /d "%FOUND%"
echo Ouverture Power BI Desktop - %FOUND%
call ONE_COMMANDE_POWERBI.cmd
exit /b %ERRORLEVEL%
