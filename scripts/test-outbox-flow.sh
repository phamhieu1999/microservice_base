#!/bin/bash

# Script: test-outbox-flow.sh
# Mục tiêu:
# - Gửi 1 request tạo order để kích hoạt luồng có Outbox
# - In ra dữ liệu trong bảng outbox_events của order_db và payment_db
#
# Yêu cầu trước khi chạy:
# - Docker infra đã chạy (Kafka, Postgres, ...), ví dụ:
#     cd deploy
#     docker compose up -d zookeeper kafka postgres-order postgres-payment
# - order-service và payment-service đang chạy (từ source hoặc trong docker, miễn là
#   chúng dùng code mới có Outbox + payment-service đã chạy migration outbox_events)
#
# Cách dùng:
#   ./scripts/test-outbox-flow.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_COMPOSE="$PROJECT_ROOT/deploy/docker-compose.yml"

ORDER_SERVICE_URL="${ORDER_SERVICE_URL:-http://localhost:3003}"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
error()   { echo -e "${RED}❌ $1${NC}"; }

header() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

# 1) Gửi request tạo order để kích hoạt CreateOrderUseCase (có Outbox)
create_order() {
  header "GỬI REQUEST TẠO ORDER (KÍCH HOẠT OUTBOX)"

  local user_id="outbox-user-$(date +%s)"

  info "Gửi POST ${ORDER_SERVICE_URL}/orders với x-user-id=${user_id}"

  local response
  set +e
  response=$(curl -s -o /tmp/outbox-order-resp.json -w "%{http_code}" \
    -X POST "${ORDER_SERVICE_URL}/orders" \
    -H "Content-Type: application/json" \
    -H "x-user-id: ${user_id}" \
    -d '{
      "items": [
        { "productId": "prod-outbox-1", "quantity": 1, "unitPrice": 100000 }
      ]
    }')
  local status_code="$response"
  set -e

  if [[ "$status_code" != "201" && "$status_code" != "200" ]]; then
    error "Request tạo order thất bại. HTTP status: $status_code"
    info "Body response (lưu ở /tmp/outbox-order-resp.json):"
    cat /tmp/outbox-order-resp.json || true
    exit 1
  fi

  success "Tạo order thành công. HTTP status: $status_code"

  local order_id
  order_id=$(jq -r '.id // .orderId // empty' /tmp/outbox-order-resp.json 2>/dev/null || echo "")

  if [[ -n "$order_id" && "$order_id" != "null" ]]; then
    success "Order ID: $order_id"
  else
    warn "Không parse được orderId từ response, nhưng request đã thành công."
  fi
}

# 2) In nội dung bảng outbox_events của order_db và payment_db
print_outbox_tables() {
  header "DỮ LIỆU TRONG BẢNG outbox_events (order_db)"

  if ! docker compose -f "$DEPLOY_COMPOSE" ps postgres-order >/dev/null 2>&1; then
    warn "Container postgres-order không chạy (bỏ qua phần order_db)"
  else
    docker compose -f "$DEPLOY_COMPOSE" exec -T postgres-order \
      psql -U order_user -d order_db -c \
"SELECT id, topic, status, \"createdAt\", \"publishedAt\"
FROM outbox_events
ORDER BY \"createdAt\" DESC
LIMIT 20;" || warn "Không đọc được bảng outbox_events từ order_db"
  fi

  header "DỮ LIỆU TRONG BẢNG outbox_events (payment_db)"

  if ! docker compose -f "$DEPLOY_COMPOSE" ps postgres-payment >/dev/null 2>&1; then
    warn "Container postgres-payment không chạy (bỏ qua phần payment_db)"
  else
    docker compose -f "$DEPLOY_COMPOSE" exec -T postgres-payment \
      psql -U payment_user -d payment_db -c \
\"SELECT id, topic, status, \\\"createdAt\\\", \\\"publishedAt\\\"
FROM outbox_events
ORDER BY \\\"createdAt\\\" DESC
LIMIT 20;\" || warn \"Không đọc được bảng outbox_events từ payment_db\"
  fi
}

main() {
  create_order

  info "Đợi OutboxRelay xử lý và publish event (2-3 giây)..."
  sleep 3

  print_outbox_tables

  success "Hoàn tất test luồng Outbox. Kiểm tra kết quả ở trên."
}

main "$@"

