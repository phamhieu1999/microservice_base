#!/bin/bash

# Script để tạo file .env mẫu cho services

SERVICE_NAME=$1

if [ -z "$SERVICE_NAME" ]; then
    echo "❌ Vui lòng cung cấp tên service"
    echo "Usage: ./scripts/create-env.sh <service-name>"
    echo ""
    echo "Ví dụ: ./scripts/create-env.sh analytics-service"
    exit 1
fi

SERVICE_DIR="services/$SERVICE_NAME"

if [ ! -d "$SERVICE_DIR" ]; then
    echo "❌ Service không tồn tại: $SERVICE_DIR"
    exit 1
fi

ENV_FILE="$SERVICE_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  File .env đã tồn tại: $ENV_FILE"
    read -p "Bạn có muốn ghi đè? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Đã hủy."
        exit 0
    fi
fi

# Xác định port mặc định dựa trên service name
case $SERVICE_NAME in
    api-gateway)
        PORT=3000
        ;;
    auth-service)
        PORT=3001
        ;;
    product-service)
        PORT=3002
        ;;
    cart-service)
        PORT=3003
        ;;
    order-service)
        PORT=3004
        ;;
    payment-service)
        PORT=3005
        ;;
    shipping-service)
        PORT=3006
        ;;
    warehouse-service)
        PORT=3007
        ;;
    seller-service)
        PORT=3008
        ;;
    review-service)
        PORT=3009
        ;;
    promotion-service)
        PORT=3010
        ;;
    loyalty-service)
        PORT=3011
        ;;
    notification-service)
        PORT=3012
        ;;
    analytics-service)
        PORT=3013
        ;;
    search-service)
        PORT=3014
        ;;
    chat-service)
        PORT=3015
        ;;
    dispute-service)
        PORT=3016
        ;;
    settlement-service)
        PORT=3017
        ;;
    dlq-service)
        PORT=3018
        ;;
    *)
        PORT=3000
        ;;
esac

# Kiểm tra service có dùng MongoDB không
HAS_MONGOOSE=$(grep -r "@nestjs/mongoose" "$SERVICE_DIR/package.json" 2>/dev/null | wc -l)
HAS_MONGOOSE=$((HAS_MONGOOSE > 0 ? 1 : 0))

# Kiểm tra service có dùng TypeORM không
HAS_TYPEORM=$(grep -r "@nestjs/typeorm\|typeorm" "$SERVICE_DIR/package.json" 2>/dev/null | wc -l)
HAS_TYPEORM=$((HAS_TYPEORM > 0 ? 1 : 0))

# Tạo file .env
cat > "$ENV_FILE" << EOF
# Server Configuration
PORT=${PORT}
NODE_ENV=development

EOF

# Thêm MongoDB config nếu cần
if [ $HAS_MONGOOSE -eq 1 ]; then
    cat >> "$ENV_FILE" << EOF
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/${SERVICE_NAME//-/_}_db
ANALYTICS_MONGO_URI=mongodb://localhost:27017/analytics_db
MONGO_POOL_MAX=20
MONGO_POOL_MIN=5
MONGO_SOCKET_TIMEOUT=45000
MONGO_SERVER_SELECTION_TIMEOUT=5000

EOF
fi

# Thêm PostgreSQL config nếu cần
if [ $HAS_TYPEORM -eq 1 ]; then
    cat >> "$ENV_FILE" << EOF
# PostgreSQL Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/${SERVICE_NAME//-/_}_db
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=${SERVICE_NAME//-/_}_db

EOF
fi

# Thêm Redis config (hầu hết services đều dùng)
cat >> "$ENV_FILE" << EOF
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=3600

EOF

# Thêm Kafka config (hầu hết services đều dùng)
cat >> "$ENV_FILE" << EOF
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=${SERVICE_NAME}
KAFKA_GROUP_ID=${SERVICE_NAME}-group

EOF

# Thêm JWT config nếu là auth-service hoặc api-gateway
if [ "$SERVICE_NAME" == "auth-service" ] || [ "$SERVICE_NAME" == "api-gateway" ]; then
    cat >> "$ENV_FILE" << EOF
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

EOF
fi

echo "✅ Đã tạo file .env: $ENV_FILE"
echo ""
echo "📝 Vui lòng kiểm tra và cập nhật các giá trị phù hợp với môi trường của bạn:"
echo "   - Database connection strings"
echo "   - Redis configuration"
echo "   - Kafka brokers"
echo "   - JWT secret (nếu có)"
echo ""

