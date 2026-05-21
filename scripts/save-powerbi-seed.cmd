@echo off
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0save-powerbi-seed.ps1"
exit /b %ERRORLEVEL%
