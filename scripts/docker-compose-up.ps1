# Demarre toute la stack en recreant bi-etl et metabase-seed (evite exit 1 bloquant).
Set-Location $PSScriptRoot\..

docker compose rm -sf bi-etl metabase-seed 2>$null
docker compose build bi-etl metabase-seed
docker compose up -d --force-recreate bi-etl metabase-seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Echec bi-etl via compose up — retry avec compose run..."
    docker compose run --rm bi-etl
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    docker compose run --rm metabase-seed
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
docker compose up -d @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "OK. Verifier : docker compose ps -a"
Write-Host "Logs ETL : docker compose logs bi-etl"
