#!/bin/bash

# Script để chạy migrations và seed data cho tất cả services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🗄️  Đang setup databases cho tất cả services..."
echo "======================================"
echo ""

# Danh sách services cần setup
declare -a POSTGRES_SERVICES=(
  "auth-service"
  "order-service"
  "payment-service"
  "seller-service"
  "promotion-service"
  "loyalty-service"
  "dispute-service"
  "settlement-service"
)

declare -a MONGO_SERVICES=(
  "analytics-service"
  "product-service"
  "cart-service"
  "review-service"
  "chat-service"
  "search-service"
  "notification-service"
  "dlq-service"
  "shipping-service"
)

declare -a CLICKHOUSE_SERVICES=(
  "warehouse-service"
)

# Function để setup một service
setup_service() {
  local service=$1
  local service_path="$PROJECT_ROOT/services/$service"
  
  if [ ! -d "$service_path" ]; then
    echo "⚠️  Service $service không tồn tại, bỏ qua..."
    return
  fi
  
  echo "📦 Đang setup $service..."
  cd "$service_path"
  
  # Kiểm tra package.json
  if [ ! -f "package.json" ]; then
    echo "⚠️  Không tìm thấy package.json trong $service, bỏ qua..."
    return
  fi
  
  # Cài đặt dependencies nếu chưa có node_modules
  if [ ! -d "node_modules" ]; then
    echo "   📥 Đang cài đặt dependencies..."
    npm install || echo "   ⚠️  Lỗi khi cài đặt dependencies"
  fi
  
  # Chạy migration nếu có script
  if grep -q "\"migrate\"" package.json; then
    echo "   🔄 Đang chạy migration..."
    npm run migrate || echo "   ⚠️  Lỗi khi chạy migration"
  else
    echo "   ℹ️  Không có script migrate"
  fi
  
  # Chạy seed nếu có script
  if grep -q "\"seed\"" package.json; then
    echo "   🌱 Đang chạy seed..."
    npm run seed || echo "   ⚠️  Lỗi khi chạy seed"
  else
    echo "   ℹ️  Không có script seed"
  fi
  
  echo "   ✅ Hoàn thành $service"
  echo ""
}

# Setup PostgreSQL services
echo "📊 Setup PostgreSQL Services..."
echo "--------------------------------"
for service in "${POSTGRES_SERVICES[@]}"; do
  setup_service "$service"
done

# Setup MongoDB services
echo "📊 Setup MongoDB Services..."
echo "--------------------------------"
for service in "${MONGO_SERVICES[@]}"; do
  setup_service "$service"
done

# Setup ClickHouse services
echo "📊 Setup ClickHouse Services..."
echo "--------------------------------"
for service in "${CLICKHOUSE_SERVICES[@]}"; do
  setup_service "$service"
done

echo "======================================"
echo "✅ Hoàn thành setup databases!"
echo ""
echo "💡 Tiếp theo:"
echo "   1. Kiểm tra health endpoints: curl http://localhost:3000/health"
echo "   2. Xem logs: docker compose logs -f"
echo "   3. Test API: Xem QUICK-START.md"

