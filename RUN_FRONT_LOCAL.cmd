@echo off
REM Front Angular en local (4200) — backends restent sur Docker
cd /d "%~dp0"
echo === 1) Docker : tout SAUF le conteneur frontend ===
docker compose stop frontend 2>nul
docker compose up -d mysql minio discovery-service gateway-service user-service cv-service mission-service quiz-service codingame-service python-service bi-hub
echo.
echo Attendre 1-2 min que MySQL et les services soient Up...
echo   docker compose ps
echo.
echo === 2) Front local ===
cd find-me-front-2.1
if not exist node_modules (
  echo npm install --legacy-peer-deps ...
  call npm install --legacy-peer-deps
)
echo.
echo Lancement : http://localhost:4200
echo   npm run dev   (ou npm start)
echo.
call npm run dev
