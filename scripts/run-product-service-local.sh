#!/bin/bash

# Script để chạy product-service local
# Usage: ./scripts/run-product-service-local.sh

set -e

echo "🚀 Đang khởi động product-service local..."
echo "======================================"

# Kiểm tra infrastructure
echo ""
echo "📋 Kiểm tra infrastructure..."
cd "$(dirname "$0")/../deploy"

if ! docker compose ps | grep -q "mongo.*Up"; then
    echo "⚠️  MongoDB chưa chạy. Đang khởi động..."
    docker compose up -d mongo
    sleep 3
fi

if ! docker compose ps | grep -q "kafka.*Up"; then
    echo "⚠️  Kafka chưa chạy. Đang khởi động..."
    docker compose up -d zookeeper kafka
    sleep 5
fi

if ! docker compose ps | grep -q "redis.*Up"; then
    echo "⚠️  Redis chưa chạy. Đang khởi động..."
    docker compose up -d redis
    sleep 2
fi

echo "✅ Infrastructure đã sẵn sàng!"
echo ""

# Quay về thư mục root
cd "$(dirname "$0")/.."

# Export environment variables
export PORT=3002
export PRODUCT_MONGO_URI=mongodb://localhost:27017/product_db
export KAFKA_BROKERS=localhost:9092
export REDIS_HOST=localhost
export REDIS_PORT=6380

echo "📝 Environment variables:"
echo "   PORT=$PORT"
echo "   PRODUCT_MONGO_URI=$PRODUCT_MONGO_URI"
echo "   KAFKA_BROKERS=$KAFKA_BROKERS"
echo "   REDIS_HOST=$REDIS_HOST"
echo "   REDIS_PORT=$REDIS_PORT"
echo ""

# Chạy service
echo "🚀 Đang khởi động product-service..."
./scripts/start-service.sh product-service dev

