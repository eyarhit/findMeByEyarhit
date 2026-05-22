@echo off
REM Tout en Docker (front nginx). Pour front LOCAL : scripts\docker-back-only.cmd + run-front-local.cmd
cd /d "%~dp0.."
echo.
echo === Find-Me : app complete en Docker ===
echo Astuce dev : scripts\docker-back-only.cmd puis scripts\run-front-local.cmd
echo.

echo [1/2] Build frontend...
docker compose build frontend
if errorlevel 1 goto :failed

echo [2/2] Demarrage services...
docker compose up -d mysql minio discovery-service gateway-service user-service cv-service mission-service quiz-service codingame-service python-service frontend
if errorlevel 1 goto :failed

echo.
echo OK : http://localhost:4200  (Ctrl+Shift+R apres git pull)
echo Front local + back Docker : voir docs\DEV_FRONT_LOCAL.md
echo Backends manquants ? Lancez une fois : scripts\docker-build-backend.cmd
goto :eof

:failed
echo ECHEC. Docker Desktop demarre ? Backends deja buildes ?
exit /b 1
