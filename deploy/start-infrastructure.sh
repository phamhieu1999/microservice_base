#!/bin/bash

# Script để chạy chỉ infrastructure services (databases, message brokers, cache)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Đang khởi động Infrastructure Services..."
echo "======================================"

# Kiểm tra docker compose
if ! docker compose version &> /dev/null 2>&1; then
    echo "❌ Không tìm thấy docker compose"
    exit 1
fi

# Chạy infrastructure services
docker compose up -d \
  zookeeper \
  kafka \
  mongo \
  redis \
  postgres-auth \
  postgres-order \
  postgres-payment \
  postgres-seller \
  postgres-promo \
  postgres-loyalty \
  postgres-dispute \
  postgres-settlement \
  elasticsearch \
  clickhouse

echo ""
echo "✅ Infrastructure services đã được khởi động!"
echo ""
echo "📋 Services đang chạy:"
docker compose ps | grep -E "zookeeper|kafka|mongo|redis|postgres|elasticsearch|clickhouse"

echo ""
echo "💡 Các lệnh hữu ích:"
echo "   - Xem logs: docker compose logs -f"
echo "   - Dừng: docker compose stop"
echo "   - Xem trạng thái: docker compose ps"

