# Enregistre le .pbix avec visuels comme modele pour toute l'equipe (a lancer 1 fois)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Src = Join-Path $Root "bi\powerbi\reports\FindMe_BI_Auto.pbix"
$Dst = Join-Path $Root "bi\powerbi\template\FindMe_BI_Seed.pbix"

if (-not (Test-Path $Src)) {
    Write-Host "Fichier introuvable : $Src" -ForegroundColor Red
    Write-Host "Creez d'abord le rapport dans Power BI puis Enregistrer sous ce chemin."
    exit 1
}

$dir = Split-Path $Dst -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

Copy-Item -LiteralPath $Src -Destination $Dst -Force
$mb = [math]::Round((Get-Item $Dst).Length / 1MB, 2)
Write-Host "Modele enregistre : $Dst ($mb Mo)" -ForegroundColor Green
Write-Host "Commit Git : git add bi/powerbi/template/FindMe_BI_Seed.pbix"
Write-Host "Ensuite : scripts\powerbi-open.cmd ouvre le dashboard automatiquement."
