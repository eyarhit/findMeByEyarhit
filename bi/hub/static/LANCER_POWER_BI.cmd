@echo off
cd /d "%~dp0..\..\repo"
if exist "ONE_COMMANDE_POWERBI.cmd" (
  call ONE_COMMANDE_POWERBI.cmd
  exit /b %ERRORLEVEL%
)
echo Clone findMeByEyarhit puis lancez ONE_COMMANDE_POWERBI.cmd a la racine.
pause
exit /b 1
