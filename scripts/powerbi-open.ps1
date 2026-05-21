# Une commande : ETL Talend + ouverture Power BI (.pbix recommande, pas .pbip)
param(
    [switch]$SkipEtl,
    [switch]$SkipDocker,
    [switch]$UsePbip
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$LegacyPbipPath = Join-Path $Root "bi\powerbi\FindMe-BI\FindMe-BI.pbip"
$DevPbipPath = Join-Path $Root "bi\powerbi\_dev-pbip-project\FindMe-BI.pbip"
$DashboardPbipPath = Join-Path $Root "bi\powerbi\FindMe-Dashboard\FindMe-Dashboard.pbip"
$DashboardPbirPath = Join-Path $Root "bi\powerbi\FindMe-Dashboard\FindMe-Dashboard.Report\definition.pbir"
$PbixPath = Join-Path $Root "bi\powerbi\reports\FindMe_BI_Auto.pbix"
$SeedPbixPath = Join-Path $Root "bi\powerbi\template\FindMe_BI_Seed.pbix"
$GenDashboardScript = Join-Path $PSScriptRoot "generate-powerbi-multi-dashboard.ps1"
$PbidsPaths = @(
    (Join-Path $Root "bi\powerbi\CONNEXION_FindMe_MySQL.pbids"),
    (Join-Path $Root "bi\powerbi\starter\findme_dw.pbids")
)
$GenScript = Join-Path $PSScriptRoot "generate-powerbi-pbip.ps1"

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

function Remove-PbipTraps {
    foreach ($p in @($LegacyPbipPath, $DevPbipPath)) {
        if (Test-Path $p) {
            Remove-Item -LiteralPath $p -Force
            Write-Host "Supprime (ne pas ouvrir) : $p" -ForegroundColor Yellow
        }
    }
}

function Get-PbidsPath {
    foreach ($p in $PbidsPaths) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

if (-not $UsePbip) { Remove-PbipTraps }

function Ensure-DashboardPbix {
    if (Test-Path $PbixPath) { return }
    if (Test-Path $SeedPbixPath) {
        $dir = Split-Path $PbixPath -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Copy-Item -LiteralPath $SeedPbixPath -Destination $PbixPath -Force
        Write-Host "Dashboard copie depuis le modele : $SeedPbixPath" -ForegroundColor Green
    }
}

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
    Write-Host "Chemin exe non trouve - ouverture via Windows (.pbix / .pbids)..." -ForegroundColor Yellow
    Start-Process -FilePath $ReportPath
}

Write-Step "1/4 - Generation dashboard (3 pages, visuels)"
& $GenDashboardScript

if (-not $UsePbip) {
    Ensure-DashboardPbix
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
Ensure-DashboardPbix

# .pbix deja configure = affichage garanti (donnees + visuels)
if (Test-Path $PbixPath) {
    $openPath = $PbixPath
    Write-Host "Rapport .pbix (recommande) : $openPath" -ForegroundColor Green
    Open-PowerBiReport -ReportPath $openPath
    Write-Host ""
    Write-Host "========== DASHBOARD FIND-ME (.pbix) ==========" -ForegroundColor Green
    Write-Host "Cliquez Accueil - Actualiser si la banniere jaune apparait."
} elseif (Test-Path $DashboardPbirPath) {
    $openPath = $DashboardPbirPath
    Write-Host "Projet PBIR : $openPath" -ForegroundColor Green
    Open-PowerBiReport -ReportPath $openPath
    Write-Host ""
    Write-Host "========== SI ECRAN VIDE ==========" -ForegroundColor Yellow
    Write-Host "  1. Cliquez 'Actualiser maintenant' (banniere jaune)"
    Write-Host "  2. Identifiants : findme_bi / findme_bi_readonly"
    Write-Host "  3. Options - Fonctionnalites preliminaires : activer TMDL + PBIR"
    Write-Host "  4. Fermer PBI, relancer ONE_COMMANDE_POWERBI.cmd"
    Write-Host "  5. Ou enregistrez sous bi\powerbi\reports\FindMe_BI_Auto.pbix (1 fois)"
} elseif (Test-Path $DashboardPbipPath) {
    $openPath = $DashboardPbipPath
    Write-Host "Projet : $openPath" -ForegroundColor Green
    Open-PowerBiReport -ReportPath $openPath
    Write-Host ""
    Write-Host "========== DASHBOARD FIND-ME (3 pages) ==========" -ForegroundColor Green
    Write-Host "  01 Executive | 02 Managerial | 03 Operationnel"
    Write-Host "Premiere fois : findme_bi / findme_bi_readonly puis Actualiser."
} elseif ($UsePbip -and (Test-Path $DevPbipPath)) {
    $openPath = $DevPbipPath
    Write-Host "Fichier (mode dev) : $openPath" -ForegroundColor Green
    Open-PowerBiReport -ReportPath $openPath
} elseif ($pbids = Get-PbidsPath) {
    $openPath = $pbids
    Write-Host "Connexion MySQL : $openPath" -ForegroundColor Green
    Open-PowerBiReport -ReportPath $openPath
    Write-Host ""
    Write-Host "========== CREER VOTRE .pbix (1 fois) ==========" -ForegroundColor Green
    Write-Host "  1. Onglet Base de donnees : findme_bi / findme_bi_readonly"
    Write-Host "  2. Navigateur : cochez les tables findme_dw puis Charger"
    Write-Host "  3. Fichier - Enregistrer sous :"
    Write-Host "     bi\powerbi\reports\FindMe_BI_Auto.pbix"
    Write-Host "  4. Relancez : scripts\powerbi-open.cmd"
} else {
    throw "Aucun fichier Power BI trouve (pbix, pbids ou pbip)."
}

Write-Host ""
Write-Host "Relance : scripts\powerbi-open.cmd"
