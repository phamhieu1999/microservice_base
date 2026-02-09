#!/bin/bash

# Script để chạy một service ở local (development mode)
# Service này sẽ kết nối đến infrastructure (DB, Kafka, Redis) chạy trên Docker
# Usage: ./scripts/run-service-local.sh <service-name> [port]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"
SERVICES_DIR="$PROJECT_ROOT/services"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Check service name
SERVICE_NAME="${1:-}"
if [ -z "$SERVICE_NAME" ]; then
    print_error "Vui lòng chỉ định tên service"
    echo ""
    echo "Usage: $0 <service-name> [port]"
    echo ""
    echo "Ví dụ:"
    echo "  $0 notification-service"
    echo "  $0 product-service 3002"
    echo "  $0 auth-service 3001"
    echo ""
    echo "Các services có sẵn:"
    ls -d "$SERVICES_DIR"/*/ 2>/dev/null | sed 's|.*/||' | sed 's|/$||' | while read -r svc; do
        echo "  - $svc"
    done
    exit 1
fi

SERVICE_DIR="$SERVICES_DIR/$SERVICE_NAME"
if [ ! -d "$SERVICE_DIR" ]; then
    print_error "Service '$SERVICE_NAME' không tồn tại!"
    exit 1
fi

# Get default port from service name or use provided port
PORT="${2:-}"
if [ -z "$PORT" ]; then
    case "$SERVICE_NAME" in
        api-gateway) PORT=3000 ;;
        auth-service) PORT=3001 ;;
        product-service) PORT=3002 ;;
        order-service) PORT=3003 ;;
        payment-service) PORT=3004 ;;
        notification-service) PORT=3005 ;;
        cart-service) PORT=3006 ;;
        review-service) PORT=3007 ;;
        seller-service) PORT=3008 ;;
        promotion-service) PORT=3009 ;;
        shipping-service) PORT=3010 ;;
        chat-service) PORT=3011 ;;
        search-service) PORT=3012 ;;
        dlq-service) PORT=3013 ;;
        analytics-service) PORT=3014 ;;
        loyalty-service) PORT=3015 ;;
        dispute-service) PORT=3016 ;;
        settlement-service) PORT=3017 ;;
        warehouse-service) PORT=3018 ;;
        *) PORT=3000 ;;
    esac
fi

print_header "CHẠY SERVICE Ở LOCAL: $SERVICE_NAME"

# Check infrastructure
print_info "Kiểm tra infrastructure (Docker)..."
cd "$DEPLOY_DIR"

# Check and start MongoDB
if ! docker compose ps | grep -q "mongo.*Up"; then
    print_warning "MongoDB chưa chạy. Đang khởi động..."
    docker compose up -d mongo
    sleep 3
fi

# Check and start PostgreSQL (if needed)
if grep -q "postgres" "$SERVICE_DIR/package.json" 2>/dev/null || grep -q "typeorm" "$SERVICE_DIR/package.json" 2>/dev/null; then
    # Determine which postgres service
    case "$SERVICE_NAME" in
        auth-service)
            if ! docker compose ps | grep -q "postgres-auth.*Up"; then
                print_warning "PostgreSQL (auth) chưa chạy. Đang khởi động..."
                docker compose up -d postgres-auth
                sleep 3
            fi
            ;;
        order-service)
            if ! docker compose ps | grep -q "postgres-order.*Up"; then
                print_warning "PostgreSQL (order) chưa chạy. Đang khởi động..."
                docker compose up -d postgres-order
                sleep 3
            fi
            ;;
        payment-service)
            if ! docker compose ps | grep -q "postgres-payment.*Up"; then
                print_warning "PostgreSQL (payment) chưa chạy. Đang khởi động..."
                docker compose up -d postgres-payment
                sleep 3
            fi
            ;;
    esac
fi

# Check and start Kafka
if ! docker compose ps | grep -q "kafka.*Up"; then
    print_warning "Kafka chưa chạy. Đang khởi động..."
    docker compose up -d zookeeper kafka
    sleep 10
fi

# Check and start Redis
if grep -q "redis\|cache" "$SERVICE_DIR/package.json" 2>/dev/null; then
    if ! docker compose ps | grep -q "redis.*Up"; then
        print_warning "Redis chưa chạy. Đang khởi động..."
        docker compose up -d redis
        sleep 2
    fi
fi

print_success "Infrastructure đã sẵn sàng!"
echo ""

# Go back to project root
cd "$PROJECT_ROOT"

# Set environment variables based on service
export PORT=$PORT
export NODE_ENV=development

# MongoDB configuration
if grep -q "mongoose" "$SERVICE_DIR/package.json" 2>/dev/null; then
    case "$SERVICE_NAME" in
        notification-service)
            export NOTIFICATION_MONGO_URI="mongodb://localhost:27017/notification_db"
            ;;
        product-service)
            export PRODUCT_MONGO_URI="mongodb://localhost:27017/product_db"
            ;;
        cart-service)
            export CART_MONGO_URI="mongodb://localhost:27017/cart_db"
            ;;
        review-service)
            export REVIEW_MONGO_URI="mongodb://localhost:27017/review_db"
            ;;
        chat-service)
            export CHAT_MONGO_URI="mongodb://localhost:27017/chat_db"
            ;;
        search-service)
            export SEARCH_MONGO_URI="mongodb://localhost:27017/search_db"
            ;;
        analytics-service)
            export ANALYTICS_MONGO_URI="mongodb://localhost:27017/analytics_db"
            ;;
        dlq-service)
            export DLQ_MONGO_URI="mongodb://localhost:27017/dlq_db"
            ;;
    esac
fi

# PostgreSQL configuration
case "$SERVICE_NAME" in
    auth-service)
        export AUTH_DB_HOST="localhost"
        export AUTH_DB_PORT="5433"
        export AUTH_DB_USER="auth_user"
        export AUTH_DB_PASSWORD="auth_password"
        export AUTH_DB_NAME="auth_db"
        ;;
    order-service)
        export ORDER_DB_HOST="localhost"
        export ORDER_DB_PORT="5434"
        export ORDER_DB_USER="order_user"
        export ORDER_DB_PASSWORD="order_password"
        export ORDER_DB_NAME="order_db"
        ;;
    payment-service)
        export PAYMENT_DB_HOST="localhost"
        export PAYMENT_DB_PORT="5435"
        export PAYMENT_DB_USER="payment_user"
        export PAYMENT_DB_PASSWORD="payment_password"
        export PAYMENT_DB_NAME="payment_db"
        ;;
esac

# Kafka configuration
export KAFKA_BROKERS="localhost:9092"

# Redis configuration
export REDIS_HOST="localhost"
export REDIS_PORT="6380"  # Docker Redis port

# JWT configuration (if needed)
if [ "$SERVICE_NAME" == "auth-service" ] || [ "$SERVICE_NAME" == "api-gateway" ] || [ "$SERVICE_NAME" == "notification-service" ]; then
    export JWT_ACCESS_SECRET="access-secret"
    export JWT_REFRESH_SECRET="refresh-secret"
fi

# Display configuration
print_info "Environment variables:"
echo "  PORT=$PORT"
echo "  NODE_ENV=$NODE_ENV"
[ ! -z "$NOTIFICATION_MONGO_URI" ] && echo "  NOTIFICATION_MONGO_URI=$NOTIFICATION_MONGO_URI"
[ ! -z "$PRODUCT_MONGO_URI" ] && echo "  PRODUCT_MONGO_URI=$PRODUCT_MONGO_URI"
[ ! -z "$AUTH_DB_HOST" ] && echo "  AUTH_DB_HOST=$AUTH_DB_HOST:$AUTH_DB_PORT"
[ ! -z "$ORDER_DB_HOST" ] && echo "  ORDER_DB_HOST=$ORDER_DB_HOST:$ORDER_DB_PORT"
[ ! -z "$KAFKA_BROKERS" ] && echo "  KAFKA_BROKERS=$KAFKA_BROKERS"
[ ! -z "$REDIS_HOST" ] && echo "  REDIS_HOST=$REDIS_HOST:$REDIS_PORT"
echo ""

# Check if node_modules exists
if [ ! -d "$SERVICE_DIR/node_modules" ]; then
    print_warning "node_modules chưa có. Đang cài đặt dependencies..."
    cd "$SERVICE_DIR"
    npm install
    cd "$PROJECT_ROOT"
fi

# Run service
print_info "Đang khởi động $SERVICE_NAME ở local (port $PORT)..."
print_info "Service sẽ kết nối đến infrastructure trên Docker"
print_info "Nhấn Ctrl+C để dừng"
echo ""

cd "$SERVICE_DIR"
npm run start:dev

