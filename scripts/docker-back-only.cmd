@echo off
REM Backend + MySQL + CodinGame + BI — SANS conteneur frontend (front = ng serve local)
cd /d "%~dp0.."
echo.
echo === Find-Me : Docker back + BD (pas de front Docker) ===
echo.

docker compose stop frontend 2>nul
docker compose rm -f frontend 2>nul

echo Demarrage : mysql, minio, services Java, python, quiz, codingame, bi-hub...
docker compose up -d mysql minio discovery-service gateway-service user-service cv-service mission-service quiz-service codingame-service python-service bi-hub
if errorlevel 1 (
  echo ECHEC. Lancez une fois : scripts\docker-build-backend.cmd
  exit /b 1
)

echo.
echo OK — Backends Docker :
echo   MySQL      localhost:3306
echo   User       localhost:9068
echo   CV         localhost:9158
echo   Mission    localhost:9055
echo   Quiz       localhost:9074
echo   CodinGame  localhost:9056
echo   Python     localhost:8000
echo   Gateway    localhost:9082
echo   Hub BI     localhost:3032
echo.
echo Front LOCAL : scripts\run-front-local.cmd  puis  http://localhost:4200
exit /b 0
