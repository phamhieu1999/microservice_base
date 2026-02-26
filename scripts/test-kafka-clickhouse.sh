#!/bin/bash

# Test luồng Kafka Events → ClickHouse (qua warehouse-service)
# Gửi events vào Kafka → warehouse-service consume → insert vào ClickHouse → verify dữ liệu
#
# Usage: ./scripts/test-kafka-clickhouse.sh [action]
# Actions: full-test (default), send-events, verify, count, clean

set -euo pipefail

KAFKA_CONTAINER="${KAFKA_CONTAINER:-kafka}"
CLICKHOUSE_HOST="${CLICKHOUSE_HOST:-localhost}"
CLICKHOUSE_PORT="${CLICKHOUSE_PORT:-8123}"
CLICKHOUSE_USER="${CLICKHOUSE_USER:-warehouse_user}"
CLICKHOUSE_PASSWORD="${CLICKHOUSE_PASSWORD:-warehouse_password}"
CLICKHOUSE_DB="${CLICKHOUSE_DB:-warehouse_db}"
WAIT_SECONDS="${WAIT_SECONDS:-15}"

CLICKHOUSE_URL="http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}"
TEST_PREFIX="test_$(date +%s)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()      { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()    { echo -e "${RED}[FAIL]${NC}  $1"; }
header()  { echo -e "\n${CYAN}══════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}══════════════════════════════════════════${NC}\n"; }

TOTAL_TESTS=0
PASSED_TESTS=0

assert_row_exists() {
  local table=$1
  local condition=$2
  local label=$3

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  local count
  count=$(curl -s -G "${CLICKHOUSE_URL}/" \
    --data-urlencode "query=SELECT count(*) FROM ${CLICKHOUSE_DB}.${table} WHERE ${condition} FORMAT TabSeparated" \
    --user "${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}" 2>/dev/null | tr -d '[:space:]')

  if [[ "$count" =~ ^[0-9]+$ ]] && [ "$count" -gt 0 ]; then
    ok "$label  (${count} rows)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    fail "$label  (0 rows, expected > 0)"
  fi
}

ch_query() {
  local query_str="$1"
  local format="${2:-TabSeparated}"
  curl -s -G "${CLICKHOUSE_URL}/" \
    --data-urlencode "query=${query_str} FORMAT ${format}" \
    --user "${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}" 2>/dev/null
}

ch_exec() {
  local query_str="$1"
  curl -s -X POST "${CLICKHOUSE_URL}/" \
    --data-urlencode "query=${query_str}" \
    --user "${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}" 2>/dev/null
}

send_kafka_message() {
  local topic=$1
  local message=$2
  echo "$message" | docker exec -i "$KAFKA_CONTAINER" kafka-console-producer \
    --bootstrap-server localhost:9092 \
    --topic "$topic" 2>/dev/null
}

# ─────────────────────────────────────────
# CHECK PREREQUISITES
# ─────────────────────────────────────────
check_services() {
  header "KIỂM TRA SERVICES"

  if ! docker ps --format '{{.Names}}' | grep -q "^${KAFKA_CONTAINER}$"; then
    fail "Kafka container '${KAFKA_CONTAINER}' chưa chạy"
    info "Khởi động: docker compose -f deploy/docker-compose.yml up -d kafka zookeeper"
    exit 1
  fi
  ok "Kafka container đang chạy"

  if ! curl -s -o /dev/null -w "%{http_code}" "${CLICKHOUSE_URL}/ping" --user "${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}" | grep -q "200"; then
    fail "ClickHouse không thể kết nối tại ${CLICKHOUSE_URL}"
    info "Khởi động: docker compose -f deploy/docker-compose.yml up -d clickhouse"
    exit 1
  fi
  ok "ClickHouse đang chạy tại ${CLICKHOUSE_URL}"

  local tables
  tables=$(ch_query "SELECT name FROM system.tables WHERE database='${CLICKHOUSE_DB}'" 2>/dev/null || echo "")
  if [ -z "$tables" ]; then
    warn "Database '${CLICKHOUSE_DB}' chưa có tables. Cần chạy migration trước."
    info "cd services/warehouse-service && npm run migration"
    exit 1
  fi
  ok "ClickHouse database '${CLICKHOUSE_DB}' có tables: $(echo $tables | tr '\n' ', ')"
}

# ─────────────────────────────────────────
# COUNT RECORDS BEFORE TEST
# ─────────────────────────────────────────
count_records() {
  header "SỐ LƯỢNG RECORDS HIỆN TẠI TRONG CLICKHOUSE"

  local tables=("fact_order" "fact_payment" "fact_settlement" "fact_loyalty" "dim_user" "dim_product" "dim_user_activity" "dim_seller_activity" "dim_product_activity")
  for table in "${tables[@]}"; do
    local count
    count=$(ch_query "SELECT count(*) FROM ${CLICKHOUSE_DB}.${table}" 2>/dev/null | tr -d '[:space:]')
    info "$table: ${count:-0} rows"
  done
}

# ─────────────────────────────────────────
# SEND TEST EVENTS TO KAFKA
# ─────────────────────────────────────────
send_events() {
  header "GỬI TEST EVENTS VÀO KAFKA"

  local now_iso
  now_iso=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  local user_id="${TEST_PREFIX}_user_001"
  local seller_id="${TEST_PREFIX}_seller_001"
  local product_id="${TEST_PREFIX}_prod_001"
  local order_id="${TEST_PREFIX}_order_001"
  local payment_id="${TEST_PREFIX}_pay_001"

  # 1) user.created
  info "1/6 - Gửi user.created → dim_user"
  send_kafka_message "user.created" \
    "{\"id\":\"${user_id}\",\"email\":\"${user_id}@test.com\",\"name\":\"Test User\",\"role\":\"USER\",\"createdAt\":\"${now_iso}\"}"
  ok "  Sent user.created (userId=${user_id})"

  # 2) product.created
  info "2/6 - Gửi product.created → dim_product"
  send_kafka_message "product.created" \
    "{\"id\":\"${product_id}\",\"name\":\"Test Product Alpha\",\"price\":150.00,\"category\":\"Electronics\",\"brand\":\"TestBrand\",\"sellerId\":\"${seller_id}\",\"stock\":200,\"createdAt\":\"${now_iso}\"}"
  ok "  Sent product.created (productId=${product_id})"

  # 3) order.created (with items)
  info "3/6 - Gửi order.created → fact_order"
  send_kafka_message "order.created" \
    "{\"id\":\"${order_id}\",\"userId\":\"${user_id}\",\"sellerId\":\"${seller_id}\",\"items\":[{\"productId\":\"${product_id}\",\"quantity\":3,\"price\":150.00,\"sellerId\":\"${seller_id}\"}],\"totalAmount\":450.00,\"status\":\"PENDING\",\"createdAt\":\"${now_iso}\"}"
  ok "  Sent order.created (orderId=${order_id}, total=450.00)"

  # 4) payment.success
  info "4/6 - Gửi payment.success → fact_payment"
  send_kafka_message "payment.success" \
    "{\"id\":\"${payment_id}\",\"orderId\":\"${order_id}\",\"userId\":\"${user_id}\",\"sellerId\":\"${seller_id}\",\"amount\":450.00,\"fee\":4.50,\"method\":\"CREDIT_CARD\",\"provider\":\"stripe\",\"status\":\"SUCCESS\",\"createdAt\":\"${now_iso}\"}"
  ok "  Sent payment.success (paymentId=${payment_id}, amount=450.00)"

  # 5) settlement.balance.updated
  info "5/6 - Gửi settlement.balance.updated → fact_settlement"
  send_kafka_message "settlement.balance.updated" \
    "{\"settlementId\":\"${TEST_PREFIX}_settle_001\",\"sellerId\":\"${seller_id}\",\"orderId\":\"${order_id}\",\"netRevenue\":405.00,\"commission\":45.00,\"payoutAmount\":405.00,\"payoutStatus\":\"PENDING\",\"createdAt\":\"${now_iso}\"}"
  ok "  Sent settlement.balance.updated (sellerId=${seller_id}, net=405.00)"

  # 6) loyalty.points.earned
  info "6/6 - Gửi loyalty.points.earned → fact_loyalty"
  send_kafka_message "loyalty.points.earned" \
    "{\"transactionId\":\"${TEST_PREFIX}_loyalty_001\",\"userId\":\"${user_id}\",\"orderId\":\"${order_id}\",\"pointsEarned\":450,\"balanceAfter\":1200,\"createdAt\":\"${now_iso}\"}"
  ok "  Sent loyalty.points.earned (userId=${user_id}, points=450)"

  echo ""
  ok "Đã gửi 6 events vào Kafka thành công!"
  echo ""

  # Gửi thêm batch events để test batch processing
  info "Gửi thêm batch events (5 orders, 5 payments) để test batch processing..."
  for i in $(seq 2 6); do
    local batch_order_id="${TEST_PREFIX}_order_00${i}"
    local batch_payment_id="${TEST_PREFIX}_pay_00${i}"
    local amount=$((100 * i))

    send_kafka_message "order.created" \
      "{\"id\":\"${batch_order_id}\",\"userId\":\"${user_id}\",\"sellerId\":\"${seller_id}\",\"totalAmount\":${amount},\"status\":\"PENDING\",\"createdAt\":\"${now_iso}\"}"

    send_kafka_message "payment.success" \
      "{\"id\":\"${batch_payment_id}\",\"orderId\":\"${batch_order_id}\",\"userId\":\"${user_id}\",\"sellerId\":\"${seller_id}\",\"amount\":${amount},\"method\":\"BANK_TRANSFER\",\"provider\":\"vnpay\",\"status\":\"SUCCESS\",\"createdAt\":\"${now_iso}\"}"
  done
  ok "Đã gửi thêm 10 batch events (5 orders + 5 payments)"
}

# ─────────────────────────────────────────
# VERIFY DATA IN CLICKHOUSE
# ─────────────────────────────────────────
verify_data() {
  header "VERIFY DỮ LIỆU TRONG CLICKHOUSE"

  local user_id="${TEST_PREFIX}_user_001"
  local seller_id="${TEST_PREFIX}_seller_001"
  local product_id="${TEST_PREFIX}_prod_001"
  local order_id="${TEST_PREFIX}_order_001"
  local payment_id="${TEST_PREFIX}_pay_001"

  info "--- Kiểm tra Fact Tables ---"
  echo ""

  # fact_order
  assert_row_exists "fact_order" "order_id = '${order_id}'" \
    "fact_order: order ${order_id}"

  assert_row_exists "fact_order" "order_id LIKE '${TEST_PREFIX}_order_%'" \
    "fact_order: tất cả orders test (expected 6)"

  # fact_payment
  assert_row_exists "fact_payment" "payment_id = '${payment_id}'" \
    "fact_payment: payment ${payment_id}"

  assert_row_exists "fact_payment" "payment_id LIKE '${TEST_PREFIX}_pay_%'" \
    "fact_payment: tất cả payments test (expected 6)"

  # fact_settlement
  assert_row_exists "fact_settlement" "settlement_id = '${TEST_PREFIX}_settle_001'" \
    "fact_settlement: settlement ${TEST_PREFIX}_settle_001"

  # fact_loyalty
  assert_row_exists "fact_loyalty" "transaction_id = '${TEST_PREFIX}_loyalty_001'" \
    "fact_loyalty: loyalty ${TEST_PREFIX}_loyalty_001"

  echo ""
  info "--- Kiểm tra Dimension Tables ---"
  echo ""

  # dim_user
  assert_row_exists "dim_user" "user_id = '${user_id}'" \
    "dim_user: user ${user_id}"

  # dim_product
  assert_row_exists "dim_product" "product_id = '${product_id}'" \
    "dim_product: product ${product_id}"

  echo ""
  info "--- Kiểm tra Activity Dimensions (auto-rebuilt) ---"
  echo ""

  # dim_user_activity
  assert_row_exists "dim_user_activity" "user_id = '${user_id}'" \
    "dim_user_activity: user activity cho ${user_id}"

  # dim_seller_activity
  assert_row_exists "dim_seller_activity" "seller_id = '${seller_id}'" \
    "dim_seller_activity: seller activity cho ${seller_id}"

  # dim_product_activity
  assert_row_exists "dim_product_activity" "product_id = '${product_id}'" \
    "dim_product_activity: product activity cho ${product_id}"

  echo ""
  info "--- Kiểm tra giá trị dữ liệu ---"
  echo ""

  # Verify order amount
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  local order_amount
  order_amount=$(ch_query "SELECT total_amount FROM ${CLICKHOUSE_DB}.fact_order WHERE order_id='${order_id}' LIMIT 1" | tr -d '[:space:]')
  if [ "$order_amount" = "450" ] || [ "$order_amount" = "450.00" ]; then
    ok "fact_order.total_amount = ${order_amount} (expected 450.00)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    fail "fact_order.total_amount = ${order_amount} (expected 450.00)"
  fi

  # Verify payment method
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  local pay_method
  pay_method=$(ch_query "SELECT payment_method FROM ${CLICKHOUSE_DB}.fact_payment WHERE payment_id='${payment_id}' LIMIT 1" | tr -d '[:space:]')
  if [ "$pay_method" = "CREDIT_CARD" ]; then
    ok "fact_payment.payment_method = ${pay_method} (expected CREDIT_CARD)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    fail "fact_payment.payment_method = ${pay_method} (expected CREDIT_CARD)"
  fi

  # Verify settlement commission
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  local commission
  commission=$(ch_query "SELECT commission FROM ${CLICKHOUSE_DB}.fact_settlement WHERE settlement_id='${TEST_PREFIX}_settle_001' LIMIT 1" | tr -d '[:space:]')
  if [ "$commission" = "45" ] || [ "$commission" = "45.00" ]; then
    ok "fact_settlement.commission = ${commission} (expected 45.00)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    fail "fact_settlement.commission = ${commission} (expected 45.00)"
  fi

  # Verify loyalty points
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  local points
  points=$(ch_query "SELECT points_earned FROM ${CLICKHOUSE_DB}.fact_loyalty WHERE transaction_id='${TEST_PREFIX}_loyalty_001' LIMIT 1" | tr -d '[:space:]')
  if [ "$points" = "450" ]; then
    ok "fact_loyalty.points_earned = ${points} (expected 450)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    fail "fact_loyalty.points_earned = ${points} (expected 450)"
  fi

  # Verify user email in dim_user
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  local user_email
  user_email=$(ch_query "SELECT email FROM ${CLICKHOUSE_DB}.dim_user WHERE user_id='${user_id}' ORDER BY updated_at DESC LIMIT 1" | tr -d '[:space:]')
  if [ "$user_email" = "${user_id}@test.com" ]; then
    ok "dim_user.email = ${user_email}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    fail "dim_user.email = '${user_email}' (expected '${user_id}@test.com')"
  fi

  # Verify product name in dim_product
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  local prod_name
  prod_name=$(ch_query "SELECT name FROM ${CLICKHOUSE_DB}.dim_product WHERE product_id='${product_id}' ORDER BY updated_at DESC LIMIT 1" | tr -d '\n')
  if echo "$prod_name" | grep -q "Test Product Alpha"; then
    ok "dim_product.name = '${prod_name}'"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    fail "dim_product.name = '${prod_name}' (expected 'Test Product Alpha')"
  fi
}

# ─────────────────────────────────────────
# SHOW DETAILED DATA
# ─────────────────────────────────────────
show_details() {
  header "CHI TIẾT DỮ LIỆU TEST TRONG CLICKHOUSE"

  info "fact_order (test records):"
  ch_query "SELECT order_id, user_id, seller_id, product_id, total_amount, status, order_datetime FROM ${CLICKHOUSE_DB}.fact_order WHERE order_id LIKE '${TEST_PREFIX}%' ORDER BY order_datetime" "PrettyCompact"
  echo ""

  info "fact_payment (test records):"
  ch_query "SELECT payment_id, order_id, amount, payment_method, provider, status, payment_datetime FROM ${CLICKHOUSE_DB}.fact_payment WHERE payment_id LIKE '${TEST_PREFIX}%' ORDER BY payment_datetime" "PrettyCompact"
  echo ""

  info "fact_settlement (test records):"
  ch_query "SELECT settlement_id, seller_id, net_revenue, commission, payout_amount, payout_status FROM ${CLICKHOUSE_DB}.fact_settlement WHERE settlement_id LIKE '${TEST_PREFIX}%'" "PrettyCompact"
  echo ""

  info "fact_loyalty (test records):"
  ch_query "SELECT transaction_id, user_id, points_earned, balance_after, event_type FROM ${CLICKHOUSE_DB}.fact_loyalty WHERE transaction_id LIKE '${TEST_PREFIX}%'" "PrettyCompact"
  echo ""

  info "dim_user (test records):"
  ch_query "SELECT user_id, email, role, created_at FROM ${CLICKHOUSE_DB}.dim_user WHERE user_id LIKE '${TEST_PREFIX}%'" "PrettyCompact"
  echo ""

  info "dim_product (test records):"
  ch_query "SELECT product_id, name, category, brand, seller_id, price FROM ${CLICKHOUSE_DB}.dim_product WHERE product_id LIKE '${TEST_PREFIX}%'" "PrettyCompact"
  echo ""

  info "dim_user_activity (test records):"
  ch_query "SELECT user_id, total_orders, total_order_amount, total_paid_amount, loyalty_points FROM ${CLICKHOUSE_DB}.dim_user_activity WHERE user_id LIKE '${TEST_PREFIX}%'" "PrettyCompact"
  echo ""

  info "dim_seller_activity (test records):"
  ch_query "SELECT seller_id, total_orders, total_order_amount, total_net_revenue, total_commission FROM ${CLICKHOUSE_DB}.dim_seller_activity WHERE seller_id LIKE '${TEST_PREFIX}%'" "PrettyCompact"
  echo ""

  info "dim_product_activity (test records):"
  ch_query "SELECT product_id, name, total_sold, total_revenue, total_orders FROM ${CLICKHOUSE_DB}.dim_product_activity WHERE product_id LIKE '${TEST_PREFIX}%'" "PrettyCompact"
}

# ─────────────────────────────────────────
# CLEAN TEST DATA
# ─────────────────────────────────────────
clean_test_data() {
  header "DỌN DẸP DỮ LIỆU TEST"

  local prefix="${1:-test_}"

  local tables_and_cols=(
    "fact_order:order_id"
    "fact_payment:payment_id"
    "fact_settlement:settlement_id"
    "fact_loyalty:transaction_id"
    "dim_user:user_id"
    "dim_product:product_id"
    "dim_user_activity:user_id"
    "dim_seller_activity:seller_id"
    "dim_product_activity:product_id"
  )

  for entry in "${tables_and_cols[@]}"; do
    local table="${entry%%:*}"
    local col="${entry##*:}"

    local count
    count=$(ch_query "SELECT count(*) FROM ${CLICKHOUSE_DB}.${table} WHERE ${col} LIKE '${prefix}%'" | tr -d '[:space:]')

    if [ "${count:-0}" -gt 0 ]; then
      ch_exec "ALTER TABLE ${CLICKHOUSE_DB}.${table} DELETE WHERE ${col} LIKE '${prefix}%'"
      ok "Xóa ${count} rows từ ${table} (prefix: ${prefix})"
    else
      info "${table}: không có test data cần xóa"
    fi
  done

  ok "Đã dọn dẹp xong!"
}

# ─────────────────────────────────────────
# FULL TEST
# ─────────────────────────────────────────
full_test() {
  header "TEST KAFKA EVENTS → CLICKHOUSE (FULL)"

  check_services
  count_records
  send_events

  echo ""
  info "Chờ ${WAIT_SECONDS}s để warehouse-service consume và insert vào ClickHouse..."
  for i in $(seq 1 "$WAIT_SECONDS"); do
    printf "\r  %d/%d giây..." "$i" "$WAIT_SECONDS"
    sleep 1
  done
  echo ""

  verify_data
  show_details

  header "KẾT QUẢ"
  echo ""
  if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    ok "ALL PASSED: ${PASSED_TESTS}/${TOTAL_TESTS} tests"
  else
    local failed=$((TOTAL_TESTS - PASSED_TESTS))
    fail "FAILED: ${failed}/${TOTAL_TESTS} tests"
    warn "Một số tests thất bại. Kiểm tra:"
    echo "  1. warehouse-service đang chạy và kết nối đến Kafka + ClickHouse"
    echo "  2. ClickHouse migration đã được chạy"
    echo "  3. Tăng WAIT_SECONDS nếu warehouse-service cần thêm thời gian"
    echo ""
    echo "  Logs: docker compose -f deploy/docker-compose.yml logs -f warehouse-service"
  fi

  echo ""
  info "Test prefix: ${TEST_PREFIX}"
  info "Dọn dẹp test data: $0 clean ${TEST_PREFIX}"
}

# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────
ACTION="${1:-full-test}"

case "$ACTION" in
  "full-test"|"test"|"all")
    full_test
    ;;
  "send-events"|"send")
    check_services
    send_events
    ;;
  "verify")
    if [ -z "${2:-}" ]; then
      fail "Cần truyền test prefix. Ví dụ: $0 verify test_1740500000"
      exit 1
    fi
    TEST_PREFIX="$2"
    check_services
    verify_data
    show_details
    ;;
  "count")
    check_services
    count_records
    ;;
  "details")
    if [ -z "${2:-}" ]; then
      fail "Cần truyền test prefix. Ví dụ: $0 details test_1740500000"
      exit 1
    fi
    TEST_PREFIX="$2"
    check_services
    show_details
    ;;
  "clean")
    check_services
    clean_test_data "${2:-test_}"
    ;;
  *)
    echo "Usage: $0 [action] [args]"
    echo ""
    echo "Actions:"
    echo "  full-test (default) - Gửi events + chờ + verify toàn bộ luồng"
    echo "  send-events         - Chỉ gửi test events vào Kafka"
    echo "  verify <prefix>     - Verify dữ liệu với test prefix"
    echo "  details <prefix>    - Hiển thị chi tiết dữ liệu test"
    echo "  count               - Đếm records hiện tại trong ClickHouse"
    echo "  clean [prefix]      - Xóa test data (default prefix: test_)"
    echo ""
    echo "Environment variables:"
    echo "  KAFKA_CONTAINER     - Tên Kafka container (default: kafka)"
    echo "  CLICKHOUSE_HOST     - Host ClickHouse (default: localhost)"
    echo "  CLICKHOUSE_PORT     - Port ClickHouse (default: 8123)"
    echo "  CLICKHOUSE_USER     - User ClickHouse (default: warehouse_user)"
    echo "  CLICKHOUSE_PASSWORD - Password ClickHouse (default: warehouse_password)"
    echo "  CLICKHOUSE_DB       - Database ClickHouse (default: warehouse_db)"
    echo "  WAIT_SECONDS        - Thời gian chờ consumer xử lý (default: 15)"
    echo ""
    echo "Ví dụ:"
    echo "  $0                           # Chạy full test"
    echo "  WAIT_SECONDS=30 $0           # Full test, chờ 30s"
    echo "  $0 send-events               # Chỉ gửi events"
    echo "  $0 verify test_1740500000    # Verify với prefix cụ thể"
    echo "  $0 clean test_               # Xóa tất cả test data"
    exit 1
    ;;
esac
