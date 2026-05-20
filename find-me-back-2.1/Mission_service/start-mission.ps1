# Frees port 9055 (stale Mission_service / DevTools) then starts the app.
$ErrorActionPreference = 'SilentlyContinue'
$port = 9055

Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
        Write-Host "Stopping PID $($_.OwningProcess) (listening on $port)..."
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }

foreach ($line in (netstat -ano 2>$null | Select-String ":$port\s+.*LISTENING")) {
    if ($line.Line -match 'LISTENING\s+(\d+)\s*$') {
        $p = [int]$Matches[1]
        if ($p -gt 0) {
            Write-Host "Stopping PID $p (netstat)..."
            taskkill /F /PID $p 2>$null
        }
    }
}

Start-Sleep -Seconds 2
Set-Location $PSScriptRoot
Write-Host "Starting Mission_service (Eureka: http://localhost:8761, MySQL required)..."
mvn spring-boot:run
