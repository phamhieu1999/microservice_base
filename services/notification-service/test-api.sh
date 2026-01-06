#!/bin/bash

echo "🧪 Testing Notification Service API"
echo "===================================="
echo ""

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "✅ Service is ready!"
    break
  fi
  sleep 1
done

echo ""
echo "📋 Health Check:"
curl -s http://localhost:3005/health | jq . || curl -s http://localhost:3005/health
echo ""
echo ""

echo "📚 Swagger JSON:"
curl -s http://localhost:3005/api-docs-json | jq '.info' || echo "Swagger chưa sẵn sàng"
echo ""

echo "🌐 Swagger UI available at: http://localhost:3005/api-docs"
echo ""
echo "📝 Test endpoints:"
echo "  - GET  http://localhost:3005/health"
echo "  - GET  http://localhost:3005/api-docs (Swagger UI)"
echo "  - GET  http://localhost:3005/api-docs-json (Swagger JSON)"
echo ""
echo "🔐 Protected endpoints (require JWT token):"
echo "  - GET  http://localhost:3005/notifications?page=1&limit=20"
echo "  - GET  http://localhost:3005/notifications/unread-count"
echo "  - POST http://localhost:3005/notifications/:id/read"
echo ""

