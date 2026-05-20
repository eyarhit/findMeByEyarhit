# Check that the running frontend container serves a large Tailwind CSS bundle.
# Usage: .\scripts\verify-frontend-css.ps1

$ErrorActionPreference = "Stop"
$base = "http://localhost:4200"

Write-Host "Fetching $base ..." -ForegroundColor Cyan
$html = Invoke-WebRequest -Uri $base -UseBasicParsing
if ($html.StatusCode -ne 200) {
    Write-Host "FAIL: HTTP $($html.StatusCode)" -ForegroundColor Red
    exit 1
}

$cssHref = [regex]::Match($html.Content, 'href="([^"]*styles[^"]*\.css)"').Groups[1].Value
if (-not $cssHref) {
    Write-Host "FAIL: no styles*.css link in index.html" -ForegroundColor Red
    exit 1
}

$cssUrl = if ($cssHref.StartsWith("http")) { $cssHref } else { "$base/$($cssHref.TrimStart('/'))" }
Write-Host "CSS: $cssUrl" -ForegroundColor Cyan
$css = Invoke-WebRequest -Uri $cssUrl -UseBasicParsing
$bytes = $css.RawContentLength
Write-Host "CSS size: $bytes bytes" -ForegroundColor $(if ($bytes -gt 20000) { "Green" } else { "Red" })

if ($bytes -lt 20000) {
    Write-Host "FAIL: CSS too small — rebuild frontend with: docker compose build --no-cache frontend" -ForegroundColor Red
    exit 1
}

Write-Host "OK: frontend CSS looks healthy." -ForegroundColor Green
