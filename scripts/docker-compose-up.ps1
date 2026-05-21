# Demarre toute la stack en recreant bi-etl et metabase-seed (evite exit 1 bloquant).
Set-Location $PSScriptRoot\..

docker compose rm -sf bi-etl metabase-seed 2>$null
docker compose up -d @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "OK. Verifier : docker compose ps -a"
Write-Host "Logs ETL : docker compose logs bi-etl"
