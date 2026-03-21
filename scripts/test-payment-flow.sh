#!/bin/bash
# Test luồng thanh toán end-to-end cho cả 4 phương thức: CARD, EWALLET, BANK_TRANSFER, COD

API_BASE="${API_BASE:-http://localhost:3000}"
ORDER_SERVICE="${ORDER_SERVICE:-http://localhost:3003}"
PAYMENT_SERVICE="${PAYMENT_SERVICE:-http://localhost:3004}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0

ok()   { echo -e "${GREEN}✅ $1${NC}"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}❌ $1${NC}"; FAIL=$((FAIL+1)); }
info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
header() {
  echo ""
  echo -e "${CYAN}${BOLD}════════════════════════════════════════${NC}"
  echo -e "${CYAN}${BOLD}  $1${NC}"
  echo -e "${CYAN}${BOLD}════════════════════════════════════════${NC}"
}

json_field() {
  python3 -c "import sys,json; print(json.load(sys.stdin)$1)" 2>/dev/null
}

wait_for_status() {
  local url="$1"
  local field="$2"
  local expected="$3"
  local max_wait="${4:-20}"
  local interval=3
  local elapsed=0
  local val=""

  while [ $elapsed -lt $max_wait ]; do
    val=$(curl -s --connect-timeout 3 "$url" 2>/dev/null | json_field "$field")
    if [ "$val" = "$expected" ]; then
      echo "$val"
      return 0
    fi
    sleep $interval
    elapsed=$((elapsed + interval))
  done
  echo "$val"
  return 1
}

create_order() {
  local method="$1"
  local body="{
    \"items\": [
      { \"productId\": \"prod-test-001\", \"quantity\": 2, \"unitPrice\": 150000, \"sellerId\": \"seller-test-001\" },
      { \"productId\": \"prod-test-002\", \"quantity\": 1, \"unitPrice\": 200000, \"sellerId\": \"seller-test-001\" }
    ],
    \"shippingFee\": 30000,
    \"paymentMethod\": \"$method\"
  }"

  curl -s -X POST "$ORDER_SERVICE/orders" \
    -H "Content-Type: application/json" \
    -H "x-user-id: test-user-$method" \
    --connect-timeout 5 \
    -d "$body" 2>&1
}

create_payment() {
  local order_id="$1"
  local method="$2"
  local body="{
    \"orderId\": \"$order_id\",
    \"amount\": 530000,
    \"method\": \"$method\",
    \"provider\": \"MOCK\"
  }"

  curl -s -X POST "$PAYMENT_SERVICE/payments" \
    -H "Content-Type: application/json" \
    -H "x-user-id: test-user-$method" \
    --connect-timeout 5 \
    -d "$body" 2>&1
}

simulate_webhook() {
  local order_id="$1"
  local body="{
    \"status\": \"SUCCESS\",
    \"transactionId\": \"mock-webhook-$(date +%s)\",
    \"metadata\": { \"orderId\": \"$order_id\", \"userId\": \"test-user\" }
  }"

  curl -s -X POST "$PAYMENT_SERVICE/payments/webhook/MOCK" \
    -H "Content-Type: application/json" \
    --connect-timeout 5 \
    -d "$body" 2>&1
}

# ── 0. Health check ──────────────────────────────────────────────
header "0. Health Check"

MAX_RETRIES="${HEALTH_RETRIES:-12}"
RETRY_INTERVAL=5

check_all_healthy() {
  for svc in "$API_BASE/health" "$ORDER_SERVICE/health" "$PAYMENT_SERVICE/health"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$svc" 2>/dev/null)
    if [ "$STATUS" != "200" ]; then return 1; fi
  done
  return 0
}

ATTEMPT=1
while [ $ATTEMPT -le $MAX_RETRIES ]; do
  if check_all_healthy; then
    for svc in "$API_BASE/health" "$ORDER_SERVICE/health" "$PAYMENT_SERVICE/health"; do
      ok "$svc → 200"
    done
    break
  fi
  if [ $ATTEMPT -eq $MAX_RETRIES ]; then
    for svc in "$API_BASE/health" "$ORDER_SERVICE/health" "$PAYMENT_SERVICE/health"; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$svc" 2>/dev/null)
      if [ "$STATUS" = "200" ]; then ok "$svc → 200"; else fail "$svc → $STATUS"; fi
    done
    warn "Services chưa sẵn sàng sau $((MAX_RETRIES * RETRY_INTERVAL))s"
    exit 1
  fi
  warn "Lần $ATTEMPT/$MAX_RETRIES — chờ ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
  ATTEMPT=$((ATTEMPT + 1))
done

# ═══════════════════════════════════════════════════════════════════
#  TEST 1: CARD — Thẻ tín dụng/ghi nợ
# ═══════════════════════════════════════════════════════════════════
header "1. CARD — Thẻ tín dụng / ghi nợ"

info "Tạo order với paymentMethod=CARD..."
CARD_ORDER=$(create_order "CARD")
CARD_ORDER_ID=$(echo "$CARD_ORDER" | json_field "['id']")

if [ -z "$CARD_ORDER_ID" ] || [ "$CARD_ORDER_ID" = "None" ]; then
  fail "CARD: Không tạo được order"
else
  ok "CARD: Order tạo thành công: $CARD_ORDER_ID"

  info "Tạo payment CARD..."
  CARD_PAY=$(create_payment "$CARD_ORDER_ID" "CARD")
  CARD_PAY_ID=$(echo "$CARD_PAY" | json_field "['payment']['id']")
  CARD_PAY_URL=$(echo "$CARD_PAY" | json_field ".get('paymentUrl','N/A')")
  CARD_PAY_STATUS=$(echo "$CARD_PAY" | json_field ".get('payment',{}).get('status','?')")

  if [ -n "$CARD_PAY_ID" ] && [ "$CARD_PAY_ID" != "None" ]; then
    ok "CARD: Payment tạo thành công: $CARD_PAY_ID (status=$CARD_PAY_STATUS)"
    info "CARD: Payment URL (redirect user): $CARD_PAY_URL"

    info "CARD: Simulate webhook confirm..."
    CARD_WH=$(simulate_webhook "$CARD_ORDER_ID")
    CARD_WH_OK=$(echo "$CARD_WH" | json_field ".get('success', False)")
    if [ "$CARD_WH_OK" = "True" ]; then
      ok "CARD: Webhook confirm thành công"
    else
      warn "CARD: Webhook — $(echo "$CARD_WH" | head -c 150)"
    fi

    sleep 1
    CARD_FINAL=$(curl -s "$PAYMENT_SERVICE/payments/$CARD_PAY_ID" --connect-timeout 5 | json_field "['status']")
    info "CARD: Payment status sau webhook: $CARD_FINAL"
    if [ "$CARD_FINAL" = "SUCCESS" ]; then ok "CARD: Payment → SUCCESS"; else warn "CARD: Payment → $CARD_FINAL"; fi
  else
    fail "CARD: Tạo payment thất bại (mock random 20% fail)"
    echo "   $(echo "$CARD_PAY" | head -c 150)"
  fi
fi

# ═══════════════════════════════════════════════════════════════════
#  TEST 2: EWALLET — Ví điện tử (QR Code)
# ═══════════════════════════════════════════════════════════════════
header "2. EWALLET — Ví điện tử (QR Code)"

info "Tạo order với paymentMethod=EWALLET..."
EW_ORDER=$(create_order "EWALLET")
EW_ORDER_ID=$(echo "$EW_ORDER" | json_field "['id']")

if [ -z "$EW_ORDER_ID" ] || [ "$EW_ORDER_ID" = "None" ]; then
  fail "EWALLET: Không tạo được order"
else
  ok "EWALLET: Order tạo thành công: $EW_ORDER_ID"

  info "Tạo payment EWALLET..."
  EW_PAY=$(create_payment "$EW_ORDER_ID" "EWALLET")
  EW_PAY_ID=$(echo "$EW_PAY" | json_field "['payment']['id']")
  EW_QR=$(echo "$EW_PAY" | json_field ".get('qrCode','N/A')")
  EW_PAY_URL=$(echo "$EW_PAY" | json_field ".get('paymentUrl','N/A')")

  if [ -n "$EW_PAY_ID" ] && [ "$EW_PAY_ID" != "None" ]; then
    ok "EWALLET: Payment tạo thành công: $EW_PAY_ID"
    if [ "$EW_QR" != "N/A" ] && [ "$EW_QR" != "None" ]; then
      ok "EWALLET: QR Code được tạo (${#EW_QR} chars)"
    else
      warn "EWALLET: Không có QR Code"
    fi
    info "EWALLET: Payment URL: $EW_PAY_URL"

    info "EWALLET: Simulate webhook confirm..."
    EW_WH=$(simulate_webhook "$EW_ORDER_ID")
    EW_WH_OK=$(echo "$EW_WH" | json_field ".get('success', False)")
    if [ "$EW_WH_OK" = "True" ]; then ok "EWALLET: Webhook confirm thành công"; fi

    sleep 1
    EW_FINAL=$(curl -s "$PAYMENT_SERVICE/payments/$EW_PAY_ID" --connect-timeout 5 | json_field "['status']")
    if [ "$EW_FINAL" = "SUCCESS" ]; then ok "EWALLET: Payment → SUCCESS"; else warn "EWALLET: Payment → $EW_FINAL"; fi
  else
    fail "EWALLET: Tạo payment thất bại (mock random 10% fail)"
    echo "   $(echo "$EW_PAY" | head -c 150)"
  fi
fi

# ═══════════════════════════════════════════════════════════════════
#  TEST 3: BANK_TRANSFER — Chuyển khoản ngân hàng
# ═══════════════════════════════════════════════════════════════════
header "3. BANK_TRANSFER — Chuyển khoản ngân hàng"

info "Tạo order với paymentMethod=BANK_TRANSFER..."
BT_ORDER=$(create_order "BANK_TRANSFER")
BT_ORDER_ID=$(echo "$BT_ORDER" | json_field "['id']")

if [ -z "$BT_ORDER_ID" ] || [ "$BT_ORDER_ID" = "None" ]; then
  fail "BANK_TRANSFER: Không tạo được order"
else
  ok "BANK_TRANSFER: Order tạo thành công: $BT_ORDER_ID"

  info "Tạo payment BANK_TRANSFER..."
  BT_PAY=$(create_payment "$BT_ORDER_ID" "BANK_TRANSFER")
  BT_PAY_ID=$(echo "$BT_PAY" | json_field "['payment']['id']")
  BT_PAY_URL=$(echo "$BT_PAY" | json_field ".get('paymentUrl','N/A')")

  if [ -n "$BT_PAY_ID" ] && [ "$BT_PAY_ID" != "None" ]; then
    ok "BANK_TRANSFER: Payment tạo thành công: $BT_PAY_ID"
    info "BANK_TRANSFER: Info URL (chứa thông tin CK): $BT_PAY_URL"

    info "BANK_TRANSFER: Simulate webhook confirm (ngân hàng xác nhận)..."
    BT_WH=$(simulate_webhook "$BT_ORDER_ID")
    BT_WH_OK=$(echo "$BT_WH" | json_field ".get('success', False)")
    if [ "$BT_WH_OK" = "True" ]; then ok "BANK_TRANSFER: Webhook confirm thành công"; fi

    sleep 1
    BT_FINAL=$(curl -s "$PAYMENT_SERVICE/payments/$BT_PAY_ID" --connect-timeout 5 | json_field "['status']")
    if [ "$BT_FINAL" = "SUCCESS" ]; then ok "BANK_TRANSFER: Payment → SUCCESS"; else warn "BANK_TRANSFER: Payment → $BT_FINAL"; fi
  else
    fail "BANK_TRANSFER: Tạo payment thất bại"
    echo "   $(echo "$BT_PAY" | head -c 150)"
  fi
fi

# ═══════════════════════════════════════════════════════════════════
#  TEST 4: COD — Thanh toán khi nhận hàng
# ═══════════════════════════════════════════════════════════════════
header "4. COD — Thanh toán khi nhận hàng"

info "Tạo order với paymentMethod=COD..."
COD_ORDER=$(create_order "COD")
COD_ORDER_ID=$(echo "$COD_ORDER" | json_field "['id']")

if [ -z "$COD_ORDER_ID" ] || [ "$COD_ORDER_ID" = "None" ]; then
  fail "COD: Không tạo được order"
else
  ok "COD: Order tạo thành công: $COD_ORDER_ID"

  info "Tạo payment COD (phải auto SUCCESS, không cần webhook)..."
  COD_PAY=$(create_payment "$COD_ORDER_ID" "COD")
  COD_PAY_ID=$(echo "$COD_PAY" | json_field "['payment']['id']")
  COD_PAY_STATUS=$(echo "$COD_PAY" | json_field ".get('payment',{}).get('status','?')")
  COD_PAY_URL=$(echo "$COD_PAY" | json_field ".get('paymentUrl','N/A')")
  COD_QR=$(echo "$COD_PAY" | json_field ".get('qrCode','N/A')")

  if [ -n "$COD_PAY_ID" ] && [ "$COD_PAY_ID" != "None" ]; then
    ok "COD: Payment tạo thành công: $COD_PAY_ID"

    if [ "$COD_PAY_STATUS" = "SUCCESS" ]; then
      ok "COD: Payment auto-SUCCESS (không cần webhook)"
    else
      warn "COD: Payment status = $COD_PAY_STATUS (expected SUCCESS)"
    fi

    if [ "$COD_PAY_URL" = "N/A" ] || [ "$COD_PAY_URL" = "None" ]; then
      ok "COD: Không có paymentUrl (đúng — COD không cần redirect)"
    else
      warn "COD: Có paymentUrl bất ngờ: $COD_PAY_URL"
    fi

    if [ "$COD_QR" = "N/A" ] || [ "$COD_QR" = "None" ]; then
      ok "COD: Không có QR Code (đúng — COD không cần QR)"
    fi

    info "COD: Đợi Kafka cập nhật order → PAID (10s)..."
    COD_ORDER_STATUS=$(wait_for_status "$ORDER_SERVICE/orders/$COD_ORDER_ID" "['status']" "PAID" 15)
    if [ "$COD_ORDER_STATUS" = "PAID" ]; then
      ok "COD: Order → PAID (Kafka flow hoàn chỉnh)"
    else
      warn "COD: Order status = $COD_ORDER_STATUS"
    fi
  else
    fail "COD: Tạo payment thất bại"
    echo "   $(echo "$COD_PAY" | head -c 150)"
  fi
fi

# ═══════════════════════════════════════════════════════════════════
#  TEST 5: Kafka auto-flow (order.created → payment auto-process)
# ═══════════════════════════════════════════════════════════════════
header "5. Kafka auto-flow (order.created → auto payment)"

info "Tạo order CARD và đợi Kafka tự xử lý..."
AUTO_ORDER=$(create_order "CARD")
AUTO_ORDER_ID=$(echo "$AUTO_ORDER" | json_field "['id']")

if [ -z "$AUTO_ORDER_ID" ] || [ "$AUTO_ORDER_ID" = "None" ]; then
  fail "Auto-flow: Không tạo được order"
else
  ok "Auto-flow: Order tạo thành công: $AUTO_ORDER_ID"

  info "Đợi Kafka auto-process (2 outbox hops, tối đa 20s)..."
  AUTO_STATUS=$(wait_for_status "$ORDER_SERVICE/orders/$AUTO_ORDER_ID" "['status']" "PAID" 20)

  if [ "$AUTO_STATUS" = "PAID" ]; then
    ok "Auto-flow: PENDING → PAID (Kafka end-to-end thành công)"
  elif [ "$AUTO_STATUS" = "CANCELLED" ]; then
    warn "Auto-flow: PENDING → CANCELLED (mock random fail 20%)"
  elif [ "$AUTO_STATUS" = "PENDING" ]; then
    warn "Auto-flow: Vẫn PENDING sau 20s"
    info "  Kiểm tra: docker compose -f deploy/docker-compose.yml logs --tail=20 payment-service"
  else
    info "Auto-flow: Order status = $AUTO_STATUS"
  fi
fi

# ═══════════════════════════════════════════════════════════════════
#  TEST 6: Refund
# ═══════════════════════════════════════════════════════════════════
header "6. Test Refund"

if [ -n "$CARD_PAY_ID" ] && [ "$CARD_PAY_ID" != "None" ]; then
  REFUND_CHECK=$(curl -s "$PAYMENT_SERVICE/payments/$CARD_PAY_ID" --connect-timeout 5 | json_field "['status']")
  if [ "$REFUND_CHECK" = "SUCCESS" ]; then
    info "Refund CARD payment $CARD_PAY_ID (150,000 VND)..."
    REFUND_RESP=$(curl -s -X POST "$PAYMENT_SERVICE/payments/$CARD_PAY_ID/refund" \
      -H "Content-Type: application/json" \
      --connect-timeout 5 \
      -d '{ "amount": 150000, "reason": "Khach hang yeu cau hoan tien" }' 2>&1)

    REFUND_OK=$(echo "$REFUND_RESP" | json_field ".get('success', False)")
    if [ "$REFUND_OK" = "True" ]; then
      ok "Refund thành công!"

      sleep 1
      REFUND_PAY_STATUS=$(curl -s "$PAYMENT_SERVICE/payments/$CARD_PAY_ID" --connect-timeout 5 | json_field "['status']")
      info "Payment status sau refund: $REFUND_PAY_STATUS"
      if [ "$REFUND_PAY_STATUS" = "PARTIALLY_REFUNDED" ] || [ "$REFUND_PAY_STATUS" = "REFUNDED" ]; then
        ok "Payment status cập nhật đúng: $REFUND_PAY_STATUS"
      fi

      info "Đợi Kafka cập nhật order (10s)..."
      REFUND_ORDER_STATUS=$(wait_for_status "$ORDER_SERVICE/orders/$CARD_ORDER_ID" "['status']" "PARTIALLY_REFUNDED" 15)
      if [ "$REFUND_ORDER_STATUS" = "PARTIALLY_REFUNDED" ] || [ "$REFUND_ORDER_STATUS" = "REFUNDED" ] || [ "$REFUND_ORDER_STATUS" = "REFUND_PENDING" ]; then
        ok "Refund Kafka flow hoàn chỉnh! Order → $REFUND_ORDER_STATUS"
      else
        warn "Order status sau refund: $REFUND_ORDER_STATUS"
      fi
    else
      fail "Refund thất bại"
      echo "   $(echo "$REFUND_RESP" | head -c 150)"
    fi
  else
    warn "Bỏ qua refund — CARD payment chưa SUCCESS (status=$REFUND_CHECK)"
  fi
else
  warn "Bỏ qua refund — không có CARD payment ID"
fi

# ═══════════════════════════════════════════════════════════════════
#  TỔNG KẾT
# ═══════════════════════════════════════════════════════════════════
header "TỔNG KẾT"
echo ""

echo -e "${BOLD}Kết quả: ${GREEN}$PASS passed${NC} / ${RED}$FAIL failed${NC}"
echo ""

echo -e "${CYAN}${BOLD}Các phương thức đã test:${NC}"
echo ""
echo "  CARD            Thẻ tín dụng / ghi nợ"
echo "    → Tạo payment → nhận paymentUrl → redirect user"
echo "    → Webhook confirm → SUCCESS"
echo ""
echo "  EWALLET         Ví điện tử"
echo "    → Tạo payment → nhận QR Code + paymentUrl"
echo "    → User quét QR → Webhook confirm → SUCCESS"
echo ""
echo "  BANK_TRANSFER   Chuyển khoản ngân hàng"
echo "    → Tạo payment → nhận thông tin CK (STK, nội dung)"
echo "    → Ngân hàng xác nhận → Webhook confirm → SUCCESS"
echo ""
echo "  COD             Thanh toán khi nhận hàng"
echo "    → Tạo payment → auto SUCCESS (không cần webhook)"
echo "    → Không có paymentUrl / QR Code"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${YELLOW}Một số test fail có thể do mock random (20% CARD fail, 10% EWALLET fail).${NC}"
  echo -e "${YELLOW}Chạy lại script để verify.${NC}"
fi
echo ""
