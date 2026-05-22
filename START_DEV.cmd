@echo off
REM Dev stable : back Docker + front local (ng serve)
cd /d "%~dp0"
echo === 1/2 Back + MySQL + CodinGame (Docker) ===
call scripts\docker-back-only.cmd
if errorlevel 1 exit /b 1
echo.
echo === 2/2 Front Angular local ===
start "FindMe Front" cmd /k scripts\run-front-local.cmd
echo.
echo Back Docker OK. Front demarre dans une autre fenetre.
echo http://localhost:4200  —  admin@gmail.com / admin
pause
