#!/bin/bash

# Script để chạy core services (infrastructure + core microservices)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Đang khởi động Core Services..."
echo "======================================"

# Kiểm tra docker compose
if ! docker compose version &> /dev/null 2>&1; then
    echo "❌ Không tìm thấy docker compose"
    exit 1
fi

# Chạy infrastructure trước
echo "📦 Khởi động infrastructure..."
docker compose up -d \
  zookeeper kafka mongo redis \
  postgres-auth postgres-order postgres-payment

echo "⏳ Đợi databases sẵn sàng (10 giây)..."
sleep 10

# Chạy core microservices
echo "📦 Khởi động core microservices..."
docker compose up -d \
  auth-service \
  product-service \
  order-service \
  payment-service \
  api-gateway

echo ""
echo "✅ Core services đã được khởi động!"
echo ""
echo "📋 Services đang chạy:"
docker compose ps

echo ""
echo "🌐 API Gateway: http://localhost:3000"
echo "💡 Kiểm tra health: curl http://localhost:3000/health"

