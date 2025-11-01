# Fix Port 80 Issue on Windows
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix Port 80 for EnglishWebAI Docker  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit 1
}

Write-Host "Step 1: Checking what's using port 80..." -ForegroundColor Yellow
Write-Host ""

$port80 = netstat -ano | Select-String ":80\s" | Select-String "LISTENING"
if ($port80) {
    Write-Host "Port 80 is currently in use:" -ForegroundColor Red
    $port80 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""
} else {
    Write-Host "Port 80 is already free!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit 0
}

Write-Host "Step 2: Stopping Windows HTTP Service (http.sys)..." -ForegroundColor Yellow

try {
    # Stop HTTP Service
    $httpService = Get-Service -Name "HTTP" -ErrorAction SilentlyContinue
    if ($httpService -and $httpService.Status -eq "Running") {
        Write-Host "  Stopping HTTP Service..." -ForegroundColor Cyan
        Stop-Service -Name "HTTP" -Force -ErrorAction Stop
        Write-Host "  ✓ HTTP Service stopped" -ForegroundColor Green
    } else {
        Write-Host "  HTTP Service is not running" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠ Could not stop HTTP Service: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Stopping IIS services..." -ForegroundColor Yellow

# Stop World Wide Web Publishing Service (W3SVC)
try {
    $w3svc = Get-Service -Name "W3SVC" -ErrorAction SilentlyContinue
    if ($w3svc -and $w3svc.Status -eq "Running") {
        Write-Host "  Stopping W3SVC (IIS)..." -ForegroundColor Cyan
        Stop-Service -Name "W3SVC" -Force -ErrorAction Stop
        Write-Host "  ✓ W3SVC stopped" -ForegroundColor Green
    } else {
        Write-Host "  W3SVC is not running" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠ Could not stop W3SVC: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Stop IIS Admin Service
try {
    $iisadmin = Get-Service -Name "IISADMIN" -ErrorAction SilentlyContinue
    if ($iisadmin -and $iisadmin.Status -eq "Running") {
        Write-Host "  Stopping IISADMIN..." -ForegroundColor Cyan
        Stop-Service -Name "IISADMIN" -Force -ErrorAction Stop
        Write-Host "  ✓ IISADMIN stopped" -ForegroundColor Green
    } else {
        Write-Host "  IISADMIN is not running" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠ Could not stop IISADMIN: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 4: Restarting WinNAT (Network Address Translation)..." -ForegroundColor Yellow

try {
    # Restart WinNAT to release reserved ports
    $winnat = Get-Service -Name "winnat" -ErrorAction SilentlyContinue
    if ($winnat) {
        Write-Host "  Stopping WinNAT..." -ForegroundColor Cyan
        net stop winnat 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        Write-Host "  Starting WinNAT..." -ForegroundColor Cyan
        net start winnat 2>&1 | Out-Null
        Write-Host "  ✓ WinNAT restarted" -ForegroundColor Green
    } else {
        Write-Host "  WinNAT service not found (this is OK)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠ Could not restart WinNAT: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 5: Verifying port 80 is now free..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2

$port80After = netstat -ano | Select-String ":80\s" | Select-String "LISTENING"
if ($port80After) {
    Write-Host "⚠ WARNING: Port 80 is still in use!" -ForegroundColor Red
    $port80After | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "You may need to:" -ForegroundColor Yellow
    Write-Host "  1. Restart your computer" -ForegroundColor Yellow
    Write-Host "  2. Disable IIS in Windows Features" -ForegroundColor Yellow
    Write-Host "  3. Check for other applications using port 80" -ForegroundColor Yellow
} else {
    Write-Host "✓ SUCCESS! Port 80 is now free!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: docker-compose up -d" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')



