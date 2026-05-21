# Recharge findme_dw (ETL Talend) — PFE BIS
Set-Location $PSScriptRoot\..

Write-Host "=== ETL Talend (findme_dw) ===" -ForegroundColor Cyan
docker compose build talend-etl
docker compose run --rm talend-etl
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== Ouvrir Power BI Desktop et actualiser les .pbix ===" -ForegroundColor Cyan
Write-Host "Guide : bi/powerbi/README.md"
