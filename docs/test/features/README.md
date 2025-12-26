# Feature Testing Scripts

## 📋 Overview

Scripts để test các features mới đã được implement.

## 🚀 Usage

### 1. Test Swagger Documentation
```bash
./test/features/test-swagger.sh
```

**Requirements:**
- Tất cả services phải đang chạy
- Services accessible tại ports mặc định

**Expected Output:**
- ✅ All services accessible
- Swagger UI URLs

---

### 2. Test Monitoring Stack
```bash
./test/features/test-monitoring.sh
```

**Requirements:**
- Prometheus, Grafana, Jaeger đang chạy
- Services đang emit metrics

**Expected Output:**
- ✅ Prometheus accessible
- ✅ Grafana accessible
- ✅ Jaeger accessible

---

### 3. Test Features
```bash
./test/features/test-features.sh
```

**Tests:**
- Search Service Caching
- Low Stock Alerts
- DLQ Service

**Requirements:**
- All services running
- API Gateway accessible

---

## 📝 Manual Testing

### Swagger Documentation
1. Access Swagger UIs:
   - http://localhost:3000/api-docs (Gateway)
   - http://localhost:3001/api-docs (Auth)
   - http://localhost:3002/api-docs (Product)
   - http://localhost:3003/api-docs (Order)
   - http://localhost:3004/api-docs (Payment)
   - http://localhost:3013/api-docs (DLQ)

2. Test endpoints trong Swagger UI
3. Verify authentication (JWT Bearer)

### Monitoring Stack
1. **Prometheus:**
   - http://localhost:9090
   - Check targets: http://localhost:9090/targets
   - Check metrics: http://localhost:9090/graph

2. **Grafana:**
   - http://localhost:3030 (admin/admin)
   - Create dashboards
   - Add Prometheus datasource

3. **Jaeger:**
   - http://localhost:16686
   - Search traces
   - View service map

### Features
1. **Search Caching:**
   - Search products
   - Search again (should be faster from cache)
   - Check Redis: `redis-cli KEYS "search:*"`

2. **Low Stock Alerts:**
   - Create order với product có stock thấp
   - Check notifications cho seller
   - Verify `product.low-stock` event

3. **DLQ:**
   - Trigger failed message (simulate error)
   - Check DLQ: http://localhost:3013/dlq
   - Retry failed message
   - Verify republish

---

## 🔧 Troubleshooting

### Services Not Accessible
```bash
# Check if services are running
docker-compose ps

# Check logs
docker-compose logs <service-name>
```

### Metrics Not Collected
- Verify services expose `/metrics` endpoint
- Check Prometheus targets
- Verify scrape configs

### Cache Not Working
- Check Redis connection
- Verify Redis keys
- Check cache TTL

---

**Last Updated:** 2024

