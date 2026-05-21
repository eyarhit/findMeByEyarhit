# Recharge l'entrepôt findme_dw (ETL) puis régénère le manifest Metabase.
Set-Location $PSScriptRoot\..

Write-Host "=== ETL findme_dw (schéma en étoile) ===" -ForegroundColor Cyan
docker compose run --rm bi-etl
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== Seed Metabase + manifest ===" -ForegroundColor Cyan
docker compose run --rm metabase-seed
exit $LASTEXITCODE
