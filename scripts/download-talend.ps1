# Telecharge Talend Studio (Linux) vers bi\talend\studio-docker\installer
param(
    [string]$Url = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Dir = Join-Path $Root "bi\talend\studio-docker\installer"
New-Item -ItemType Directory -Force -Path $Dir | Out-Null

$existing = @(
    Get-ChildItem -Path $Dir -Include "Talend-Studio*.tar.xz","Talend-Studio*.tar.gz","Talend*.zip","Talend-Studio*.zip" -ErrorAction SilentlyContinue
)
if ($existing.Count -gt 0) {
    Write-Host "Deja present : $($existing[0].FullName)" -ForegroundColor Green
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Url)) {
    $envFile = Join-Path $PSScriptRoot ".env.bi"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^\s*TALEND_INSTALLER_URL\s*=\s*(.+)\s*$') {
                $Url = $matches[1].Trim().Trim('"')
            }
        }
    }
}

if ([string]::IsNullOrWhiteSpace($Url)) {
    Write-Host ""
    Write-Host "Talend : pas de lien direct public (connexion Qlik/Talend requise)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Etape 1 - Ouvrir la page de telechargement :" -ForegroundColor Cyan
    Write-Host "  https://www.talend.com/products/talend-open-studio/"
    Write-Host "  ou portail etudiant / licence Qlik Data Integration"
    Write-Host ""
    Write-Host "Etape 2 - Choisir Linux x86_64 (.tar.xz ou .zip)"
    Write-Host "Etape 3 - Clic droit sur le bouton Telecharger -> Copier le lien"
    Write-Host ""
    Write-Host "Etape 4 - Une des commandes suivantes :" -ForegroundColor Cyan
    Write-Host '  scripts\download-talend.cmd "https://VOTRE-LIEN-ICI"'
    Write-Host ""
    Write-Host "Ou creer scripts\.env.bi :" -ForegroundColor Cyan
    Write-Host "  TALEND_INSTALLER_URL=https://VOTRE-LIEN-ICI"
    Write-Host "  puis : scripts\download-talend.cmd"
    Write-Host ""
    Start-Process "https://www.talend.com/products/talend-open-studio/"
    exit 1
}

$ext = ".tar.xz"
if ($Url -match '\.zip(\?|$)') { $ext = ".zip" }
elseif ($Url -match '\.tar\.gz') { $ext = ".tar.gz" }

$Out = Join-Path $Dir ("Talend-Studio-linux" + $ext)
Write-Host "Telechargement vers $Out ..."
Write-Host "URL : $Url"

Invoke-WebRequest -Uri $Url -OutFile $Out -UseBasicParsing
Write-Host "OK. Relancez :" -ForegroundColor Green
Write-Host "  docker compose build talend-studio"
Write-Host "  docker compose up -d talend-studio"
