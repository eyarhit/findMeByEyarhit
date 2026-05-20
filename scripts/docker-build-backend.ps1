# Build Java microservices one-by-one (avoids Maven Central overload / corrupt JARs).
# Usage (from repo root):  .\scripts\docker-build-backend.ps1
# Then:                   docker compose build frontend python-service metabase-seed
#                         docker compose up -d

$ErrorActionPreference = "Stop"
$services = @(
  "discovery-service",
  "gateway-service",
  "user-service",
  "cv-service",
  "mission-service",
  "quiz-service",
  "codingame-service"
)

$env:COMPOSE_PARALLEL_LIMIT = "1"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Building backend services sequentially (COMPOSE_PARALLEL_LIMIT=1)..." -ForegroundColor Cyan

foreach ($svc in $services) {
  Write-Host "`n=== $svc ===" -ForegroundColor Yellow
  docker compose build --no-cache $svc
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed for $svc. Retry this service only:" -ForegroundColor Red
    Write-Host "  docker compose build --no-cache $svc" -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

Write-Host "`nBackend OK. Build remaining images:" -ForegroundColor Green
Write-Host "  docker compose build frontend python-service metabase-seed" -ForegroundColor Green
Write-Host "  docker compose up -d" -ForegroundColor Green
