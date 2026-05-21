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
    if ($env:PBI_DESKTOP_EXE -and (Test-Path $env:PBI_DESKTOP_EXE)) {
        return $env:PBI_DESKTOP_EXE
    }

    $exeNames = @("PBIDesktop.exe", "PBIDesktopStore.exe")
    $candidates = @(
        "${env:ProgramFiles}\Microsoft Power BI Desktop\bin\PBIDesktop.exe",
        "${env:ProgramFiles}\Microsoft Power BI Desktop\bin\PBIDesktopStore.exe",
        "${env:ProgramFiles}\Microsoft Power BI Desktop\PBIDesktop.exe",
        "${env:ProgramFiles(x86)}\Microsoft Power BI Desktop\bin\PBIDesktop.exe",
        "${env:LOCALAPPDATA}\Microsoft\WindowsApps\PBIDesktop.exe",
        "${env:LOCALAPPDATA}\Microsoft\WindowsApps\PBIDesktopStore.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }

    $searchRoots = @(
        "${env:ProgramFiles}\Microsoft Power BI Desktop",
        "${env:ProgramFiles(x86)}\Microsoft Power BI Desktop",
        "${env:ProgramFiles}\WindowsApps"
    )
    foreach ($root in $searchRoots) {
        if (-not (Test-Path $root)) { continue }
        foreach ($name in $exeNames) {
            $found = Get-ChildItem -Path $root -Filter $name -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { return $found.FullName }
        }
    }

    $regPaths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )
    foreach ($regPath in $regPaths) {
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "SilentlyContinue"
        $apps = Get-ItemProperty $regPath -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -match "Power BI Desktop" }
        $ErrorActionPreference = $prev
        foreach ($app in $apps) {
            if ($app.InstallLocation) {
                foreach ($name in $exeNames) {
                    $p = Join-Path $app.InstallLocation "bin\$name"
                    if (Test-Path $p) { return $p }
                    $p = Join-Path $app.InstallLocation $name
                    if (Test-Path $p) { return $p }
                }
            }
            if ($app.DisplayIcon -match '\.exe') {
                $icon = ($app.DisplayIcon -split ',')[0].Trim('"')
                if (Test-Path $icon) { return $icon }
            }
        }
    }

    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    foreach ($name in $exeNames) {
        $where = (& where.exe $name 2>$null | Select-Object -First 1)
        if ($where -and (Test-Path $where)) {
            $ErrorActionPreference = $prev
            return $where
        }
    }
    $ErrorActionPreference = $prev
    return $null
}

function Open-PowerBiReport {
    param([string]$ReportPath)
    $pbi = Find-PbiDesktop
    if ($pbi) {
        Write-Host "Power BI : $pbi" -ForegroundColor Gray
        Start-Process -FilePath $pbi -ArgumentList "`"$ReportPath`""
        return
    }
    Write-Host "Chemin exe non trouve - ouverture via Windows (fichier .pbip / .pbix)..." -ForegroundColor Yellow
    Start-Process -FilePath $ReportPath
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
$openPath = if (Test-Path $PbixPath) { $PbixPath } else { $PbipPath }
if (-not (Test-Path $openPath)) {
    throw "Fichier introuvable : $openPath"
}
Write-Host "Fichier : $openPath" -ForegroundColor Green
Open-PowerBiReport -ReportPath $openPath

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
