@echo off
REM Build UNIQUEMENT le frontend (evite de rebuilder 9 services Java en parallele)
cd /d "%~dp0.."
set MAX=3
set N=1
:retry
echo.
echo === Build frontend Docker (essai %N%/%MAX%) ===
docker compose build frontend %*
if %ERRORLEVEL% equ 0 goto ok
if %N% geq %MAX% (
  echo.
  echo ECHEC apres %MAX% essais.
  echo - Verifiez connexion Internet / VPN / proxy
  echo - Relancez plus tard ou : cd find-me-front-2.1 ^&^& npm install --legacy-peer-deps
  echo   puis docker compose build frontend
  exit /b 1
)
set /a N+=1
echo Nouvelle tentative dans 20 secondes...
timeout /t 20 /nobreak >nul
goto retry
:ok
echo.
echo OK — Lancez : docker compose up -d --force-recreate frontend
exit /b 0
