# Verifie que findme_dw est joignable depuis la machine hote (avant Actualiser dans Power BI)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "Test MySQL findme_dw (Docker)..." -ForegroundColor Cyan
docker compose up -d mysql | Out-Null
$q = @"
SELECT 'v_bi_kpi_recrutement' AS tbl, COUNT(*) AS n FROM v_bi_kpi_recrutement
UNION ALL SELECT 'fact_user', COUNT(*) FROM fact_user
UNION ALL SELECT 'fact_notification', COUNT(*) FROM fact_notification
UNION ALL SELECT 'fact_quiz', COUNT(*) FROM fact_quiz
UNION ALL SELECT 'fact_codingame', COUNT(*) FROM fact_codingame
UNION ALL SELECT 'etl_run_log', COUNT(*) FROM etl_run_log;
"@
docker compose exec -T mysql mysql -ufindme_bi -pfindme_bi_readonly findme_dw -e $q
if ($LASTEXITCODE -ne 0) {
    Write-Host "Echec connexion BI. Verifiez Docker et : docker compose run --rm talend-etl" -ForegroundColor Red
    exit 1
}
Write-Host ""
$check = docker compose exec -T mysql mysql -ufindme_bi -pfindme_bi_readonly findme_dw -N -e "SELECT COUNT(*) FROM fact_quiz"
if ($check -match '^\s*0\s*$') {
    Write-Host "ATTENTION fact_quiz = 0 : lancez docker compose run --rm talend-etl" -ForegroundColor Yellow
    Write-Host "  ou FIX_PAGE04_TECHNIQUE.cmd" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "OK - Dans Power BI : Actualiser, localhost:3306, findme_dw, findme_bi / findme_bi_readonly" -ForegroundColor Green
