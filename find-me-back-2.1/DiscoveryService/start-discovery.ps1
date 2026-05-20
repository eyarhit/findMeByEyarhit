# Libere le port 8761 puis demarre Eureka (evite "Port 8761 was already in use").
$ErrorActionPreference = 'SilentlyContinue'
$port = 8761

Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
        Write-Host "Arret du processus PID $($_.OwningProcess) (ecoute sur $port)..."
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }

foreach ($line in (netstat -ano 2>$null | Select-String ":$port\s+.*LISTENING")) {
    if ($line.Line -match 'LISTENING\s+(\d+)\s*$') {
        $p = [int]$Matches[1]
        if ($p -gt 0) {
            Write-Host "Arret du processus PID $p (netstat)..."
            taskkill /F /PID $p 2>$null
        }
    }
}

Start-Sleep -Seconds 2
Set-Location $PSScriptRoot
Write-Host "Demarrage de DiscoveryService..."
mvn spring-boot:run
