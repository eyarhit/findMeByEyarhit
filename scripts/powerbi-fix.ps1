# Supprime l'ancien piege FindMe-BI.pbip et ouvre la connexion MySQL (.pbids)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$legacyDir = Join-Path $Root "bi\powerbi\FindMe-BI"
$legacyPbip = Join-Path $legacyDir "FindMe-BI.pbip"
$devPbip = Join-Path $Root "bi\powerbi\_dev-pbip-project\FindMe-BI.pbip"

Write-Host "=== Correction Power BI (suppression .pbip invalide) ===" -ForegroundColor Cyan

if (Test-Path $legacyPbip) {
    Remove-Item -LiteralPath $legacyPbip -Force
    Write-Host "Supprime : $legacyPbip" -ForegroundColor Green
}

if (Test-Path $legacyDir) {
    $left = Get-ChildItem -Path $legacyDir -Force -ErrorAction SilentlyContinue
    if (-not $left -or ($left.Count -eq 0)) {
        Remove-Item -LiteralPath $legacyDir -Force -Recurse
        Write-Host "Dossier vide supprime : $legacyDir" -ForegroundColor Green
    } else {
        Write-Host "Dossier legacy restant (fichiers locaux) : $legacyDir" -ForegroundColor Yellow
        Write-Host "  Supprimez-le manuellement si vous voyez encore FindMe-BI.pbip" -ForegroundColor Yellow
    }
}

if (Test-Path $devPbip) {
    Remove-Item -LiteralPath $devPbip -Force
    Write-Host "Supprime (dev) : $devPbip" -ForegroundColor Green
}

Write-Host ""
Write-Host "Ouverture connexion MySQL (pas de .pbip)..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "powerbi-open.ps1") @args
