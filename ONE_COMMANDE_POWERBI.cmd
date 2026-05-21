@echo off
REM === UNE commande : ETL + dashboard Power BI 3 pages (.pbip) ===
REM Ancien .pbix 1 page : ONE_COMMANDE_POWERBI.cmd -UsePbix
cd /d "%~dp0"
call scripts\powerbi-open.cmd %*
exit /b %ERRORLEVEL%
