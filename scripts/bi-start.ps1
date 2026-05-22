# Find-Me - demarrage BI automatique (une commande)
param(
    [switch]$SkipBuild,
    [switch]$SkipEtl,
    [switch]$NoOpenBrowser,
    [switch]$AppOnly,
    [switch]$WithTalendStudio
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

function Load-BiEnv {
    $envFile = Join-Path $PSScriptRoot ".env.bi"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^\s*([^#=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
            }
        }
    }
}

function Ensure-TalendInstaller {
    $dir = Join-Path $Root "bi\talend\studio-docker\installer"
    $existing = Get-ChildItem -Path $dir -Include "Talend-Studio*.tar.xz","Talend-Studio*.tar.gz","Talend*.zip" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($existing) {
        Write-Host "Talend installer : $($existing.Name)"
        return
    }
    $url = $env:TALEND_INSTALLER_URL
    if ([string]::IsNullOrWhiteSpace($url)) {
        Write-Host "Talend : scripts\download-talend.cmd (voir scripts\.env.bi.example)" -ForegroundColor Yellow
        return
    }
    Write-Host "Telechargement Talend depuis TALEND_INSTALLER_URL ..."
    $out = Join-Path $dir "Talend-Studio-downloaded.tar.xz"
    Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
    Write-Host "OK : $out"
}

function Wait-MySql {
    $max = 90
    for ($i = 0; $i -lt $max; $i++) {
        # mysqladmin ecrit un warning sur stderr : ne pas le traiter comme erreur PowerShell
        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = "SilentlyContinue"
        $null = docker compose exec -T mysql mysqladmin ping -h localhost -uroot -proot --silent 2>&1
        $ready = $LASTEXITCODE -eq 0
        $ErrorActionPreference = $prevEap
        if ($ready) { return }
        Start-Sleep -Seconds 2
    }
    throw "MySQL non pret apres ${max}s"
}

# Services app (sans Talend Studio — build apt souvent lent / fragile)
$script:AppStack = @(
    "mysql", "minio", "discovery-service", "gateway-service",
    "user-service", "cv-service", "mission-service", "quiz-service",
    "codingame-service", "python-service", "frontend"
)

function Invoke-MySqlRoot {
    param([Parameter(Mandatory)][string]$Query)
    # MySQL ecrit un warning sur stderr ; avec $ErrorActionPreference Stop, PowerShell le traite comme erreur fatale
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $null = docker exec findme-mysql mysql -uroot -proot -e $Query 2>&1
    $exit = $LASTEXITCODE
    $ErrorActionPreference = $prevEap
    if ($exit -ne 0) {
        throw "mysql exec a echoue (code $exit)"
    }
}

function Ensure-MySqlGrants {
    Invoke-MySqlRoot "GRANT SELECT ON findme_dw.* TO 'findme_bi'@'%'; FLUSH PRIVILEGES;"
}

function Install-PowerBiDesktop {
    if ($env:AUTO_INSTALL_POWERBI_DESKTOP -eq "0") { return }
    $pbi = Get-Command pbidesktop -ErrorAction SilentlyContinue
    if ($pbi) { return }
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
        Write-Host "winget absent - installez Power BI Desktop manuellement si besoin." -ForegroundColor Yellow
        return
    }
    Write-Host "Installation Power BI Desktop (Windows) via winget ..."
    winget install -e --id Microsoft.PowerBIDesktop --accept-package-agreements --accept-source-agreements --silent 2>$null
}

function Try-PowerBiReportServer {
    $os = docker info --format "{{.OSType}}" 2>$null
    if ($os -ne "windows") {
        Write-Host "Power BI RS (Docker Windows) : non demarre (Docker en mode Linux, normal)." -ForegroundColor Yellow
        Write-Host "  Utilisez Power BI Desktop (hote) ou Hub BI http://localhost:3032" -ForegroundColor Yellow
        return
    }
    docker compose -f docker-compose.yml -f docker-compose.powerbi-windows.yml --profile bi-powerbi up -d powerbi-rs
}

Load-BiEnv

Write-Step "1/7 - Verification Docker"
docker info | Out-Null

Write-Step "2/7 - Installateur Talend (optionnel)"
Ensure-TalendInstaller

Write-Step "3/7 - Build images"
if (-not $SkipBuild) {
    if ($AppOnly) {
        docker compose build frontend python-service
    } else {
        docker compose build frontend python-service bi-hub talend-etl
        if ($WithTalendStudio) {
            docker compose --profile talend-ui build talend-studio
        } else {
            Write-Host "Talend Studio : ignore (ajoutez -WithTalendStudio pour http://localhost:6080)" -ForegroundColor Yellow
        }
    }
    Write-Host "Backends Java pas encore buildes ? Lancez : scripts\docker-build-backend.cmd" -ForegroundColor Yellow
}

Write-Step "4/7 - Demarrage stack"
if ($AppOnly) {
    docker compose up -d @script:AppStack
} elseif ($WithTalendStudio) {
    docker compose --profile talend-ui up -d @script:AppStack bi-hub talend-studio
} else {
    docker compose up -d @script:AppStack bi-hub
}

Write-Step "5/7 - Attente MySQL"
Wait-MySql

Write-Step "6/7 - GRANT findme_bi + ETL Talend"
if ($AppOnly) {
    Write-Host "Mode AppOnly : ETL BI ignore (utilisez sans -AppOnly pour la BI)" -ForegroundColor Yellow
} else {
    Ensure-MySqlGrants
    if (-not $SkipEtl) {
        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        docker compose run --rm talend-etl
        $etlExit = $LASTEXITCODE
        $ErrorActionPreference = $prevEap
        if ($etlExit -ne 0) { throw "talend-etl a echoue (code $etlExit)" }
    }
}

Write-Step "7/7 - Power BI"
Install-PowerBiDesktop
Try-PowerBiReportServer

Write-Host ""
Write-Host "========== BI PRET ==========" -ForegroundColor Green
Write-Host "Application : http://localhost:4200  -> Admin -> Tableaux de bord BI"
Write-Host "Talend Studio : http://localhost:6080  (mot de passe : findme)"
Write-Host "Hub BI        : http://localhost:3032"
Write-Host "Power BI      : Desktop (Windows) ou http://localhost:8077/reports si RS actif"
Write-Host "MySQL DW      : localhost:3306 / findme_dw / findme_bi / findme_bi_readonly"
Write-Host ""

if (-not $NoOpenBrowser) {
    Start-Process 'http://localhost:4200'
    Start-Process 'http://localhost:6080'
    Start-Process 'http://localhost:3032'
}
