@echo off
REM Angular en local (port 4200) — backends doivent tourner : scripts\docker-back-only.cmd
cd /d "%~dp0..\find-me-front-2.1"
echo.
echo === Find-Me : front local (ng serve) ===
echo Backends : docker compose ps  (mysql, user, cv, mission, quiz, codingame...)
echo URL : http://localhost:4200
echo.

if not exist node_modules (
  echo Installation npm...
  call npm install --legacy-peer-deps
  if errorlevel 1 exit /b 1
)

call npm run dev
exit /b %ERRORLEVEL%
