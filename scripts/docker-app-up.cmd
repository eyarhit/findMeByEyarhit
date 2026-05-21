@echo off
REM Demarrage application Find-Me SANS Talend Studio (evite build apt / 1h de build)
REM Premiere fois : scripts\docker-build-backend.cmd puis relancer ce script.
cd /d "%~dp0.."
echo.
echo === Find-Me : app uniquement (pas de Talend Studio) ===
echo.

echo [1/2] Build frontend...
docker compose build frontend
if errorlevel 1 goto :failed

echo [2/2] Demarrage services...
docker compose up -d mysql minio discovery-service gateway-service user-service cv-service mission-service quiz-service codingame-service python-service frontend
if errorlevel 1 goto :failed

echo.
echo OK : http://localhost:4200  (Ctrl+Shift+R apres git pull)
echo Backends manquants ? Lancez une fois : scripts\docker-build-backend.cmd
goto :eof

:failed
echo ECHEC. Docker Desktop demarre ? Backends deja buildes ?
exit /b 1
