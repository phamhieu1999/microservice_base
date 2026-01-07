#!/bin/bash

# Script để tự động start database và chạy migrations
# Usage: ./scripts/migrate.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$SERVICE_DIR/../.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

echo "🗄️  Promotion Service Migration Script"
echo "======================================"
echo ""

# Kiểm tra xem container có đang chạy không
if ! docker ps | grep -q "postgres-promo"; then
  echo "📦 Starting postgres-promo container..."
  cd "$DEPLOY_DIR"
  
  if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found in $DEPLOY_DIR"
    exit 1
  fi
  
  docker compose up -d postgres-promo
  
  # Đợi database sẵn sàng
  echo "⏳ Waiting for database to be ready..."
  sleep 5
  
  # Kiểm tra kết nối
  max_attempts=30
  attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if docker exec deploy-postgres-promo-1 pg_isready -U promo_user > /dev/null 2>&1; then
      echo "✅ Database is ready!"
      break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 1
  done
  
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ Error: Database did not become ready in time"
    exit 1
  fi
else
  echo "✅ postgres-promo container is already running"
fi

# Quay lại service directory và chạy migration
cd "$SERVICE_DIR"

echo ""
echo "🔄 Running migrations..."
npm run migrate

echo ""
echo "✅ Migration completed!"

