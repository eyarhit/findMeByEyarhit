@echo off
REM Telecharge Talend Studio Linux dans bi\talend\studio-docker\installer
REM Usage:
REM   scripts\download-talend.cmd
REM   scripts\download-talend.cmd "https://lien-copie-depuis-talend.com/...."
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0download-talend.ps1" -Url "%~1"
exit /b %ERRORLEVEL%
