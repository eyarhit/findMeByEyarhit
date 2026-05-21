# Export PDF des 3 dashboards Metabase Find-Me
Set-Location $PSScriptRoot\..

$exportsDir = "bi\presentation\exports"
if (-not (Test-Path $exportsDir)) {
    New-Item -ItemType Directory -Force -Path $exportsDir | Out-Null
}

Write-Host "=== Export PDF Metabase ===" -ForegroundColor Cyan
Write-Host "Assurez-vous que Metabase tourne sur http://localhost:3030" -ForegroundColor Gray

$python = "python"
if (Get-Command python -ErrorAction SilentlyContinue) { $python = "python" }
elseif (Get-Command py -ErrorAction SilentlyContinue) { $python = "py" }
else {
    Write-Host "Python introuvable. Export manuel: bi/presentation/GUIDE_EXPORT_PDF.md" -ForegroundColor Yellow
    exit 1
}

& $python -m pip install -q -r bi\presentation\requirements-export.txt
& $python bi\presentation\export_metabase_pdfs.py
exit $LASTEXITCODE
