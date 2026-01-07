#!/bin/bash

echo "🚀 Starting services for /orders API..."

# Start API Gateway
echo "📦 Starting API Gateway (port 3000)..."
cd services/api-gateway && npm run start:dev > /tmp/api-gateway.log 2>&1 &
API_GATEWAY_PID=$!
sleep 5

# Start Auth Service
echo "🔐 Starting Auth Service (port 3001)..."
cd ../auth-service && npm run start:dev > /tmp/auth-service.log 2>&1 &
AUTH_SERVICE_PID=$!
sleep 5

# Start Order Service
echo "📋 Starting Order Service (port 3003)..."
cd ../order-service && npm run start:dev > /tmp/order-service.log 2>&1 &
ORDER_SERVICE_PID=$!
sleep 5

echo ""
echo "✅ Required services started!"
echo ""
echo "📊 Service Status:"
echo "  - API Gateway (PID: $API_GATEWAY_PID): http://localhost:3000/health"
echo "  - Auth Service (PID: $AUTH_SERVICE_PID): http://localhost:3001/health"
echo "  - Order Service (PID: $ORDER_SERVICE_PID): http://localhost:3003/health"
echo ""
echo "📝 Logs:"
echo "  - API Gateway: tail -f /tmp/api-gateway.log"
echo "  - Auth Service: tail -f /tmp/auth-service.log"
echo "  - Order Service: tail -f /tmp/order-service.log"
echo ""
echo "🛑 To stop all services: kill $API_GATEWAY_PID $AUTH_SERVICE_PID $ORDER_SERVICE_PID"
