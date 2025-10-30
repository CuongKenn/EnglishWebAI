# PowerShell Script để check logs production

Write-Host "=== EnglishWebAI Logs Checker ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Available Commands:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Xem logs realtime (follow):" -ForegroundColor Green
Write-Host "   docker logs -f englishwebai_backend"
Write-Host ""

Write-Host "2. Xem 100 dòng logs cuối:" -ForegroundColor Green
Write-Host "   docker logs --tail 100 englishwebai_backend"
Write-Host ""

Write-Host "3. Xem logs với timestamp:" -ForegroundColor Green
Write-Host "   docker logs -t englishwebai_backend"
Write-Host ""

Write-Host "4. Vào container xem file logs:" -ForegroundColor Green
Write-Host "   docker exec -it englishwebai_backend ls -lh /app/logs"
Write-Host "   docker exec -it englishwebai_backend cat /app/logs/app.log"
Write-Host "   docker exec -it englishwebai_backend tail -f /app/logs/app.log"
Write-Host ""

Write-Host "5. Copy logs từ container ra máy local:" -ForegroundColor Green
Write-Host "   docker cp englishwebai_backend:/app/logs ./backend-logs-backup"
Write-Host ""

Write-Host "6. Xem logs trong khoảng thời gian:" -ForegroundColor Green
Write-Host "   docker logs --since 1h englishwebai_backend     # 1 giờ qua"
Write-Host "   docker logs --since 2h englishwebai_backend     # 2 giờ qua"
Write-Host "   docker logs --since '2025-10-30T10:00:00' englishwebai_backend"
Write-Host ""

Write-Host "7. Tìm kiếm errors trong logs:" -ForegroundColor Green
Write-Host "   docker logs englishwebai_backend 2>&1 | Select-String -Pattern 'error' -CaseSensitive:$false"
Write-Host "   docker logs englishwebai_backend 2>&1 | Select-String -Pattern 'exception' -CaseSensitive:$false"
Write-Host "   docker logs englishwebai_backend 2>&1 | Select-String -Pattern 'failed' -CaseSensitive:$false"
Write-Host ""

Write-Host "8. Export logs ra file:" -ForegroundColor Green
Write-Host "   docker logs englishwebai_backend > backend_logs_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
Write-Host ""

Write-Host "9. Xem logs các services khác:" -ForegroundColor Green
Write-Host "   docker logs englishwebai_frontend  # Frontend/Nginx logs"
Write-Host "   docker logs englishwebai_db        # Database logs"
Write-Host ""

Write-Host "10. Check thông tin volume chứa logs:" -ForegroundColor Green
Write-Host "    docker volume inspect englishwebai_backend_logs"
Write-Host ""

Write-Host "=== Quick Actions ===" -ForegroundColor Magenta
Write-Host ""

$action = Read-Host "Chọn action (1-10, hoặc Enter để thoát)"

switch ($action) {
    "1" {
        Write-Host "`nXem logs realtime..." -ForegroundColor Yellow
        docker logs -f englishwebai_backend
    }
    "2" {
        Write-Host "`nXem 100 dòng cuối..." -ForegroundColor Yellow
        docker logs --tail 100 englishwebai_backend
    }
    "3" {
        Write-Host "`nXem logs với timestamp..." -ForegroundColor Yellow
        docker logs -t --tail 50 englishwebai_backend
    }
    "4" {
        Write-Host "`nDanh sách file logs trong container..." -ForegroundColor Yellow
        docker exec englishwebai_backend ls -lh /app/logs
        Write-Host "`nBạn có muốn xem nội dung file app.log? (y/n)" -ForegroundColor Cyan
        $response = Read-Host
        if ($response -eq "y") {
            docker exec englishwebai_backend tail -100 /app/logs/app.log
        }
    }
    "5" {
        $backupPath = ".\backend-logs-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Write-Host "`nCopy logs đến: $backupPath" -ForegroundColor Yellow
        docker cp englishwebai_backend:/app/logs $backupPath
        Write-Host "✅ Đã copy logs thành công!" -ForegroundColor Green
        Write-Host "Mở thư mục? (y/n)"
        $open = Read-Host
        if ($open -eq "y") {
            Invoke-Item $backupPath
        }
    }
    "6" {
        Write-Host "`nNhập số giờ muốn xem logs (vd: 1, 2, 3...): " -NoNewline -ForegroundColor Cyan
        $hours = Read-Host
        Write-Host "Xem logs trong $hours giờ qua..." -ForegroundColor Yellow
        docker logs --since "$($hours)h" englishwebai_backend
    }
    "7" {
        Write-Host "`nTìm kiếm errors trong logs..." -ForegroundColor Yellow
        docker logs englishwebai_backend 2>&1 | Select-String -Pattern 'error|exception|failed' -CaseSensitive:$false | Select-Object -Last 50
    }
    "8" {
        $logFile = "backend_logs_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
        Write-Host "`nExport logs ra file: $logFile" -ForegroundColor Yellow
        docker logs englishwebai_backend > $logFile
        Write-Host "✅ Đã export logs thành công!" -ForegroundColor Green
        Write-Host "Mở file? (y/n)"
        $open = Read-Host
        if ($open -eq "y") {
            notepad $logFile
        }
    }
    "9" {
        Write-Host "`nChọn service:" -ForegroundColor Cyan
        Write-Host "1. Frontend"
        Write-Host "2. Database"
        $service = Read-Host
        switch ($service) {
            "1" { docker logs --tail 100 englishwebai_frontend }
            "2" { docker logs --tail 100 englishwebai_db }
        }
    }
    "10" {
        Write-Host "`nThông tin volume logs..." -ForegroundColor Yellow
        docker volume inspect englishwebai_backend_logs
    }
    default {
        Write-Host "`nThoát..." -ForegroundColor Gray
    }
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
