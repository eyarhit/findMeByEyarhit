# Une commande : ETL Talend + ouverture Power BI avec toutes les tables findme_dw
param(
    [switch]$SkipEtl,
    [switch]$SkipDocker,
    [switch]$RegeneratePbip
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$PbipPath = Join-Path $Root "bi\powerbi\FindMe-BI\FindMe-BI.pbip"
$PbixPath = Join-Path $Root "bi\powerbi\reports\FindMe_BI_Auto.pbix"
$GenScript = Join-Path $PSScriptRoot "generate-powerbi-pbip.ps1"

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

function Wait-MySql {
    $max = 60
    for ($i = 0; $i -lt $max; $i++) {
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "SilentlyContinue"
        $null = docker compose exec -T mysql mysqladmin ping -h localhost -uroot -proot --silent 2>&1
        $ok = $LASTEXITCODE -eq 0
        $ErrorActionPreference = $prev
        if ($ok) { return }
        Start-Sleep -Seconds 2
    }
    throw "MySQL non pret apres ${max}s - demarrez Docker Desktop."
}

function Find-PbiDesktop {
    $candidates = @(
        "${env:ProgramFiles}\Microsoft Power BI Desktop\bin\PBIDesktop.exe",
        "${env:ProgramFiles}\Microsoft Power BI Desktop\PBIDesktop.exe",
        "${env:LOCALAPPDATA}\Microsoft\WindowsApps\PBIDesktop.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    $found = Get-ChildItem -Path "${env:ProgramFiles}\Microsoft Power BI Desktop" -Filter "PBIDesktop.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }
    return $null
}

Write-Step "1/4 - Projet Power BI (PBIP)"
if ($RegeneratePbip -or -not (Test-Path $PbipPath)) {
    & $GenScript
} else {
    Write-Host "PBIP deja present : $PbipPath"
}

if (-not $SkipDocker) {
    Write-Step "2/4 - Docker MySQL"
    docker info | Out-Null
    docker compose up -d mysql
    Wait-MySql
}

if (-not $SkipEtl) {
    Write-Step "3/4 - ETL Talend (remplit findme_dw)"
    docker compose run --rm talend-etl
    if ($LASTEXITCODE -ne 0) {
        throw "talend-etl a echoue - corrigez avant Power BI."
    }
}

Write-Step "4/4 - Ouverture Power BI Desktop"
$pbi = Find-PbiDesktop
if (-not $pbi) {
    Write-Host "Power BI Desktop introuvable. Installez-le :" -ForegroundColor Yellow
    Write-Host "  winget install -e --id Microsoft.PowerBIDesktop"
    Write-Host "Puis relancez : scripts\powerbi-open.cmd"
    exit 1
}

$openPath = if (Test-Path $PbixPath) { $PbixPath } else { $PbipPath }
Write-Host "Fichier : $openPath" -ForegroundColor Green
Start-Process -FilePath $pbi -ArgumentList "`"$openPath`""

Write-Host ""
Write-Host "========== POWER BI ==========" -ForegroundColor Green
if (Test-Path $PbixPath) {
    Write-Host "Rapport enregistre detecte - ouverture directe (tables + connexion memorisees)."
} else {
    Write-Host "Premiere ouverture (projet PBIP) :"
    Write-Host "  1. Identifiants MySQL : findme_bi / findme_bi_readonly"
    Write-Host "  2. Actualiser les requetes si demande"
    Write-Host "  3. Enregistrer sous : bi\powerbi\reports\FindMe_BI_Auto.pbix"
    Write-Host "     (les prochains scripts\powerbi-open.cmd ouvriront ce fichier)"
}
Write-Host ""
Write-Host "Relance : scripts\powerbi-open.cmd"
