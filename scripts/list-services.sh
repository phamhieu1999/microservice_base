#!/bin/bash

# Script để liệt kê tất cả các services và trạng thái của chúng

echo "📋 Danh sách các Services trong dự án"
echo "======================================"
echo ""

SERVICES_DIR="services"

if [ ! -d "$SERVICES_DIR" ]; then
    echo "❌ Thư mục services không tồn tại!"
    exit 1
fi

# Đếm số lượng services
SERVICE_COUNT=0

echo "Các services có sẵn:"
echo ""

for service_dir in "$SERVICES_DIR"/*; do
    if [ -d "$service_dir" ]; then
        SERVICE_COUNT=$((SERVICE_COUNT + 1))
        service_name=$(basename "$service_dir")
        
        # Kiểm tra có package.json không
        if [ -f "$service_dir/package.json" ]; then
            # Đọc port từ .env nếu có
            PORT="N/A"
            if [ -f "$service_dir/.env" ]; then
                PORT=$(grep -E "^PORT=" "$service_dir/.env" 2>/dev/null | cut -d'=' -f2 || echo "N/A")
            fi
            
            # Kiểm tra có dist folder không (đã build)
            BUILD_STATUS="❌ Chưa build"
            if [ -d "$service_dir/dist" ]; then
                BUILD_STATUS="✅ Đã build"
            fi
            
            echo "  $SERVICE_COUNT. $service_name"
            echo "     📁 Thư mục: $service_dir"
            echo "     🔌 Port: $PORT"
            echo "     🏗️  Build: $BUILD_STATUS"
            echo ""
        fi
    fi
done

echo "======================================"
echo "Tổng số services: $SERVICE_COUNT"
echo ""

# Hiển thị các lệnh hữu ích
echo "💡 Các lệnh hữu ích:"
echo "  - Chạy một service: ./scripts/start-service.sh <service-name> [dev|prod]"
echo "  - Build một service: cd services/<service-name> && npm run build"
echo "  - Xem chi tiết: xem file docs/SERVICE_COMMANDS.md"
echo ""

