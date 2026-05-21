# Stack sans bi-etl au "up" (evite exit 1). BI via "compose run" (fiable sous Windows).
Set-Location $PSScriptRoot\..

Write-Host "=== Demarrage services (sans ETL BI) ===" -ForegroundColor Cyan
docker compose up -d @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== ETL findme_dw ===" -ForegroundColor Cyan
docker compose build bi-etl
docker compose run --rm bi-etl
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR bi-etl. Logs : docker compose logs bi-etl" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n=== Seed Metabase + manifest BI ===" -ForegroundColor Cyan
docker compose build metabase-seed
docker compose run --rm metabase-seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR metabase-seed. Logs : docker compose logs metabase-seed" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`nOK — App http://localhost:4200  Metabase http://localhost:3030" -ForegroundColor Green
