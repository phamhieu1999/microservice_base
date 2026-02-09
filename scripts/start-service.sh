#!/bin/bash

# Script để chạy một service cụ thể
# Usage: ./scripts/start-service.sh <service-name> [dev|prod]

SERVICE_NAME=$1
MODE=${2:-dev}  # Mặc định là dev mode

# Danh sách các services hợp lệ
VALID_SERVICES=(
    "api-gateway"
    "auth-service"
    "product-service"
    "cart-service"
    "order-service"
    "payment-service"
    "shipping-service"
    "warehouse-service"
    "seller-service"
    "review-service"
    "promotion-service"
    "loyalty-service"
    "notification-service"
    "analytics-service"
    "search-service"
    "chat-service"
    "dispute-service"
    "settlement-service"
    "dlq-service"
)

# Kiểm tra service name có hợp lệ không
if [[ ! " ${VALID_SERVICES[@]} " =~ " ${SERVICE_NAME} " ]]; then
    echo "❌ Service không hợp lệ: $SERVICE_NAME"
    echo ""
    echo "Các services hợp lệ:"
    for service in "${VALID_SERVICES[@]}"; do
        echo "  - $service"
    done
    exit 1
fi

# Kiểm tra mode
if [[ "$MODE" != "dev" && "$MODE" != "prod" ]]; then
    echo "❌ Mode không hợp lệ: $MODE"
    echo "Sử dụng: dev hoặc prod"
    exit 1
fi

SERVICE_DIR="services/$SERVICE_NAME"

# Kiểm tra service directory có tồn tại không
if [ ! -d "$SERVICE_DIR" ]; then
    echo "❌ Thư mục service không tồn tại: $SERVICE_DIR"
    exit 1
fi

echo "🚀 Đang khởi động service: $SERVICE_NAME"
echo "📁 Thư mục: $SERVICE_DIR"
echo "🔧 Mode: $MODE"
echo ""

# Lưu thư mục gốc
ROOT_DIR=$(pwd)

# Kiểm tra và cài đặt dependencies từ root (cho npm workspaces)
if [ -f "package.json" ] && grep -q "workspaces" package.json; then
    if [ ! -d "node_modules" ] || [ ! -d "node_modules/.bin" ]; then
        echo "📦 Đang cài đặt dependencies từ root (npm workspaces)..."
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Cài đặt dependencies thất bại!"
            exit 1
        fi
    fi
fi

cd "$SERVICE_DIR"

# Kiểm tra node_modules trong service (có thể không có nếu dùng workspaces)
# Với workspaces, dependencies có thể ở root, nên không bắt buộc phải có node_modules ở đây
# Nhưng vẫn kiểm tra để cài đặt nếu cần
if [ ! -d "node_modules" ] && [ ! -f "../package.json" ] || ! grep -q "workspaces" ../package.json 2>/dev/null; then
    echo "📦 Đang cài đặt dependencies cho service..."
    npm install
fi

# Chạy service
if [ "$MODE" == "prod" ]; then
    echo "🏗️  Đang build service..."
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ Build thất bại!"
        exit 1
    fi
    
    echo "✅ Build thành công!"
    echo "🚀 Đang chạy service ở chế độ production..."
    npm run start
else
    echo "🚀 Đang chạy service ở chế độ development..."
    npm run start:dev
fi

