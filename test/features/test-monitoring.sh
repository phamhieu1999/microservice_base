#!/bin/bash

# Test Monitoring Stack
# Usage: ./test-monitoring.sh

echo "🧪 Testing Monitoring Stack..."

# Test Prometheus
echo ""
echo "Testing Prometheus..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:9090/api/v1/status/config" | grep -q "200"; then
  echo "✅ Prometheus: Accessible"
  
  # Test metrics endpoint
  if curl -s "http://localhost:9090/api/v1/targets" | grep -q "activeTargets"; then
    echo "✅ Prometheus: Metrics collection working"
  else
    echo "⚠️  Prometheus: No active targets found"
  fi
else
  echo "❌ Prometheus: Not accessible"
fi

# Test Grafana
echo ""
echo "Testing Grafana..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3030/api/health" | grep -q "200"; then
  echo "✅ Grafana: Accessible"
else
  echo "❌ Grafana: Not accessible"
fi

# Test Jaeger
echo ""
echo "Testing Jaeger..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:16686/api/services" | grep -q "200"; then
  echo "✅ Jaeger: Accessible"
else
  echo "❌ Jaeger: Not accessible"
fi

echo ""
echo "📊 Monitoring Stack Test Complete"
echo "Access URLs:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3030 (admin/admin)"
echo "  - Jaeger: http://localhost:16686"

