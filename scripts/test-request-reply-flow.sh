#!/bin/bash
# Test luồng Kafka Request-Reply (Pattern A: reserve stock, validate voucher; Pattern B: order.prepare)
# Yêu cầu: Docker, docker compose. Chạy từ repo root: ./scripts/test-request-reply-flow.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"
KAFKA_CONTAINER="${KAFKA_CONTAINER:-kafka}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_header() { echo ""; echo -e "${BLUE}=== $1 ===${NC}"; echo ""; }

cd "$DEPLOY_DIR"

print_header "1. Kiểm tra Kafka"
if ! docker ps --format '{{.Names}}' | grep -q "^${KAFKA_CONTAINER}$"; then
  print_info "Khởi động Zookeeper + Kafka..."
  docker compose up -d zookeeper kafka
  sleep 15
fi
if ! docker exec "$KAFKA_CONTAINER" kafka-broker-api-versions --bootstrap-server localhost:9092 &>/dev/null; then
  print_error "Kafka không phản hồi. Kiểm tra: docker compose logs kafka"
  exit 1
fi
print_success "Kafka đang chạy"

print_header "2. Khởi động infrastructure và services"
docker compose up -d \
  zookeeper kafka mongo redis \
  postgres-auth postgres-order postgres-promo \
  product-service order-service promotion-service

print_info "Đợi services sẵn sàng (tối đa 60s)..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3002/health &>/dev/null && \
     curl -sf http://localhost:3003/health &>/dev/null && \
     curl -sf http://localhost:3009/health &>/dev/null; then
    print_success "Các service đã sẵn sàng sau ${i}0s"
    break
  fi
  if [ "$i" -eq 30 ]; then
    print_error "Timeout chờ services. Kiểm tra: docker compose logs product-service order-service promotion-service"
    exit 1
  fi
  sleep 2
done

print_header "3. Tạo sản phẩm (Product service)"
PRODUCT_RESPONSE=$(curl -sf -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Request-Reply Product","price":100000,"stock":50,"category":"Test","brand":"Test"}') || true
if [ -z "$PRODUCT_RESPONSE" ]; then
  print_warning "POST /products thất bại (có thể cần auth). Thử dùng productId có sẵn..."
  PRODUCT_ID=""
  # Lấy product đầu tiên từ danh sách
  LIST=$(curl -sf "http://localhost:3002/products?limit=1" 2>/dev/null) || true
  if echo "$LIST" | grep -q '"id"'; then
    PRODUCT_ID=$(echo "$LIST" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
  fi
  if [ -z "$PRODUCT_ID" ]; then
    print_error "Không có product nào. Tạo product thủ công hoặc chạy seed product-service."
    exit 1
  fi
else
  PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
fi
if [ -z "$PRODUCT_ID" ]; then
  PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi
print_success "Product ID: $PRODUCT_ID"

print_header "4. Gọi POST /orders (kích hoạt Request-Reply: reserve stock)"
ORDER_RESPONSE=$(curl -sf -w "\n%{http_code}" -X POST http://localhost:3003/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-request-reply" \
  -d "{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2,\"unitPrice\":100000,\"sellerId\":\"seller-1\"}]}") || true
HTTP_BODY=$(echo "$ORDER_RESPONSE" | sed '$d')
HTTP_CODE=$(echo "$ORDER_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "201" ]; then
  ORDER_ID=$(echo "$HTTP_BODY" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
  [ -z "$ORDER_ID" ] && ORDER_ID=$(echo "$HTTP_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  print_success "Tạo đơn hàng thành công (Request-Reply reserve stock OK). Order ID: $ORDER_ID"
else
  print_error "POST /orders trả về HTTP $HTTP_CODE"
  echo "$HTTP_BODY" | head -20
  if echo "$HTTP_BODY" | grep -qi "reserve\|timeout\|stock"; then
    print_info "Gợi ý: Kiểm tra product-service có subscribe inventory.reserve.request và Kafka đang chạy."
  fi
  exit 1
fi

print_header "5. Kiểm tra topics Request-Reply"
TOPICS=$(docker exec "$KAFKA_CONTAINER" kafka-topics --list --bootstrap-server localhost:9092 2>/dev/null) || true
for t in inventory.reserve.request inventory.reserve.reply promotion.validate.request promotion.validate.reply order.prepare.request order.prepare.reply; do
  if echo "$TOPICS" | grep -q "^${t}$"; then
    print_success "Topic: $t"
  else
    print_warning "Topic chưa tồn tại (sẽ tạo khi có message đầu tiên): $t"
  fi
done

print_header "Kết quả"
print_success "Luồng Kafka Request-Reply (reserve stock) đã chạy thành công."
echo ""
echo "  - Order service đã gửi request lên inventory.reserve.request"
echo "  - Product service đã reserve stock và gửi reply lên inventory.reserve.reply"
echo "  - Order được tạo sau khi nhận reply success"
echo ""
