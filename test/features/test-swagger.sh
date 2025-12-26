#!/bin/bash

# Test Swagger Documentation cho tất cả services
# Usage: ./test-swagger.sh

echo "🧪 Testing Swagger Documentation..."

SERVICES=(
  "http://localhost:3000/api-docs:API Gateway"
  "http://localhost:3001/api-docs:Auth Service"
  "http://localhost:3002/api-docs:Product Service"
  "http://localhost:3003/api-docs:Order Service"
  "http://localhost:3004/api-docs:Payment Service"
  "http://localhost:3013/api-docs:DLQ Service"
)

SUCCESS=0
FAILED=0

for service in "${SERVICES[@]}"; do
  IFS=':' read -r url name <<< "$service"
  echo ""
  echo "Testing $name..."
  
  if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
    echo "✅ $name: Swagger UI accessible"
    ((SUCCESS++))
  else
    echo "❌ $name: Swagger UI not accessible"
    ((FAILED++))
  fi
done

echo ""
echo "📊 Results:"
echo "✅ Success: $SUCCESS"
echo "❌ Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
  echo "🎉 All Swagger documentation accessible!"
  exit 0
else
  echo "⚠️  Some services are not accessible. Make sure all services are running."
  exit 1
fi

