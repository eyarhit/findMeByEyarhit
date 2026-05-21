@echo off
REM Alias : BI PFE Talend + Power BI (remplace ancien flux Metabase)
cd /d "%~dp0"
call fix-bi-pfe.cmd %*
