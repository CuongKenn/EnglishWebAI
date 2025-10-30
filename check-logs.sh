#!/bin/bash

# Script để check logs production

echo "=== EnglishWebAI Logs Checker ==="
echo ""

# 1. Xem logs realtime của backend container
echo "📋 Backend container logs (realtime):"
echo "docker logs -f englishwebai_backend"
echo ""

# 2. Xem logs cuối cùng (100 dòng)
echo "📋 Backend logs (last 100 lines):"
echo "docker logs --tail 100 englishwebai_backend"
echo ""

# 3. Xem logs với timestamp
echo "📋 Backend logs (with timestamps):"
echo "docker logs -t englishwebai_backend"
echo ""

# 4. Vào trong container để xem file logs
echo "📋 Check log files inside container:"
echo "docker exec -it englishwebai_backend ls -lh /app/logs"
echo "docker exec -it englishwebai_backend cat /app/logs/app.log"
echo ""

# 5. Copy log files từ container ra host
echo "📋 Copy logs from container to host:"
echo "docker cp englishwebai_backend:/app/logs ./backend-logs-backup"
echo ""

# 6. Xem logs từ volume
echo "📋 Check logs in volume:"
echo "docker volume inspect englishwebai_backend_logs"
echo ""

# 7. Xem logs theo thời gian
echo "📋 Backend logs (since 1 hour ago):"
echo "docker logs --since 1h englishwebai_backend"
echo ""

# 8. Grep để tìm errors
echo "📋 Search for errors in logs:"
echo "docker logs englishwebai_backend 2>&1 | grep -i error"
echo "docker logs englishwebai_backend 2>&1 | grep -i exception"
echo ""

# 9. Xem frontend logs
echo "📋 Frontend logs:"
echo "docker logs englishwebai_frontend"
echo ""

# 10. Xem database logs
echo "📋 Database logs:"
echo "docker logs englishwebai_db"
echo ""

echo "=== Usage Examples ==="
echo ""
echo "# Xem logs realtime:"
echo "docker logs -f englishwebai_backend"
echo ""
echo "# Xem 200 dòng cuối:"
echo "docker logs --tail 200 englishwebai_backend"
echo ""
echo "# Tìm lỗi:"
echo "docker logs englishwebai_backend 2>&1 | grep ERROR"
echo ""
echo "# Xem logs trong 2 giờ qua:"
echo "docker logs --since 2h englishwebai_backend"
echo ""
echo "# Export logs ra file:"
echo "docker logs englishwebai_backend > backend_logs_$(date +%Y%m%d_%H%M%S).log"
