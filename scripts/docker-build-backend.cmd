@echo off
REM Build Java services one at a time (slow network / Maven download errors).
cd /d "%~dp0.."
set COMPOSE_PARALLEL_LIMIT=1

echo === discovery-service ===
docker compose build discovery-service || goto :failed
echo === gateway-service ===
docker compose build gateway-service || goto :failed
echo === user-service ===
docker compose build user-service || goto :failed
echo === cv-service ===
docker compose build cv-service || goto :failed
echo === mission-service ===
docker compose build mission-service || goto :failed
echo === quiz-service ===
docker compose build quiz-service || goto :failed
echo === codingame-service ===
docker compose build codingame-service || goto :failed

echo.
echo Backend OK. Run:
echo   docker compose build frontend python-service metabase-seed
echo   docker compose up -d
goto :eof

:failed
echo Build failed. Retry the failed service only, e.g.:
echo   docker compose build user-service
exit /b 1
