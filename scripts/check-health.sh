#!/bin/bash

# Script để kiểm tra health của tất cả services

echo "🔍 Đang kiểm tra health của tất cả services..."
echo "======================================"
echo ""

# Danh sách services và ports
declare -A SERVICES=(
  ["API Gateway"]="3000"
  ["Auth Service"]="3001"
  ["Product Service"]="3002"
  ["Order Service"]="3003"
  ["Payment Service"]="3004"
  ["Notification Service"]="3005"
  ["Cart Service"]="3006"
  ["Review Service"]="3007"
  ["Seller Service"]="3008"
  ["Promotion Service"]="3009"
  ["Shipping Service"]="3010"
  ["Chat Service"]="3011"
  ["Search Service"]="3012"
  ["DLQ Service"]="3013"
  ["Analytics Service"]="3014"
  ["Loyalty Service"]="3015"
  ["Dispute Service"]="3016"
  ["Settlement Service"]="3017"
  ["Warehouse Service"]="3018"
)

SUCCESS=0
FAILED=0

for service in "${!SERVICES[@]}"; do
  port="${SERVICES[$service]}"
  url="http://localhost:$port/health"
  
  echo -n "Checking $service (port $port)... "
  
  if curl -s -f -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|OK"; then
    echo "✅ OK"
    ((SUCCESS++))
  else
    echo "❌ FAILED"
    ((FAILED++))
  fi
done

echo ""
echo "======================================"
echo "✅ Success: $SUCCESS"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
  echo "💡 Một số services chưa sẵn sàng. Kiểm tra:"
  echo "   - Services đã chạy: docker compose ps"
  echo "   - Logs: docker compose logs -f"
  exit 1
fi

