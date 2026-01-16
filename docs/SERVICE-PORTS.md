# Service Ports và Swagger URLs

## 📋 Danh Sách Ports Của Tất Cả Services

### Core Services

| Service | Port | Swagger URL | Health Check |
|---------|------|------------|--------------|
| **api-gateway** | 3000 | http://localhost:3000/api-docs | http://localhost:3000/health |
| **auth-service** | 3001 | http://localhost:3001/api-docs | http://localhost:3001/health |
| **product-service** | 3002 | http://localhost:3002/api-docs | http://localhost:3002/health |
| **order-service** | 3003 | http://localhost:3003/api-docs | http://localhost:3003/health |
| **payment-service** | 3004 | http://localhost:3004/api-docs | http://localhost:3004/health |
| **notification-service** | 3005 | http://localhost:3005/api-docs | http://localhost:3005/health |
| **cart-service** | 3006 | http://localhost:3006/api-docs | http://localhost:3006/health |
| **review-service** | 3007 | http://localhost:3007/api-docs | http://localhost:3007/health |
| **seller-service** | 3008 | http://localhost:3008/api-docs | http://localhost:3008/health |
| **promotion-service** | 3009 | http://localhost:3009/api-docs | http://localhost:3009/health |
| **shipping-service** | 3010 | http://localhost:3010/api-docs | http://localhost:3010/health |
| **chat-service** | 3011 | http://localhost:3011/api-docs | http://localhost:3011/health |
| **search-service** | 3012 | http://localhost:3012/api-docs | http://localhost:3012/health |
| **dlq-service** | 3013 | http://localhost:3013/api-docs | http://localhost:3013/health |
| **analytics-service** | 3014 | http://localhost:3014/api-docs | http://localhost:3014/health |
| **loyalty-service** | 3015 | http://localhost:3015/api-docs | http://localhost:3015/health |
| **dispute-service** | 3016 | http://localhost:3016/api-docs | http://localhost:3016/health |
| **settlement-service** | 3017 | http://localhost:3017/api-docs | http://localhost:3017/health |
| **warehouse-service** | 3018 | http://localhost:3018/api-docs | http://localhost:3018/health |

### Infrastructure Services

| Service | Port | Mô Tả |
|---------|------|-------|
| **Zookeeper** | 2181 | Kafka coordination |
| **Kafka** | 9092 | Message broker |
| **MongoDB** | 27017 | Document database |
| **Redis** | 6380 | Cache (mapped from 6379) |
| **PostgreSQL (auth)** | 5433 | Auth database |
| **PostgreSQL (order)** | 5434 | Order database |
| **PostgreSQL (payment)** | 5435 | Payment database |
| **PostgreSQL (seller)** | 5436 | Seller database |
| **PostgreSQL (promo)** | 5437 | Promotion database |
| **PostgreSQL (loyalty)** | 5438 | Loyalty database |
| **PostgreSQL (dispute)** | 5439 | Dispute database |
| **PostgreSQL (settlement)** | 5440 | Settlement database |
| **PostgreSQL (shipping)** | 5441 | Shipping database |
| **Elasticsearch** | 9200 | Search engine |
| **ClickHouse** | 8123, 9000 | Analytics database |

### Monitoring Services

| Service | Port | URL |
|---------|------|-----|
| **Prometheus** | 9090 | http://localhost:9090 |
| **Grafana** | 3030 | http://localhost:3030 |
| **Alertmanager** | 9093 | http://localhost:9093 |
| **Jaeger** | 16686 | http://localhost:16686 |

## 🔍 Kiểm Tra Service

### Kiểm tra tất cả services đang chạy:

```bash
cd deploy
docker compose ps
```

### Kiểm tra port mapping:

```bash
docker compose ps --format "table {{.Name}}\t{{.Ports}}"
```

### Kiểm tra health của một service:

```bash
curl http://localhost:3001/health  # auth-service
curl http://localhost:3002/health  # product-service
# ... tương tự cho các service khác
```

## 📚 Swagger Endpoints

Tất cả services có Swagger được cấu hình tại:
- **Swagger UI**: `http://localhost:<PORT>/api-docs`
- **Swagger JSON**: `http://localhost:<PORT>/api-docs-json`

### Ví dụ:

```bash
# Notification Service
curl http://localhost:3005/api-docs-json

# Auth Service
curl http://localhost:3001/api-docs-json

# Product Service
curl http://localhost:3002/api-docs-json
```

## 🚀 Quick Access

### Mở tất cả Swagger UIs trong browser:

```bash
# Linux/Mac
for port in {3000..3018}; do
  xdg-open "http://localhost:$port/api-docs" 2>/dev/null || open "http://localhost:$port/api-docs" 2>/dev/null
done
```

### Hoặc tạo bookmark:

1. **API Gateway**: http://localhost:3000/api-docs
2. **Auth Service**: http://localhost:3001/api-docs
3. **Product Service**: http://localhost:3002/api-docs
4. **Order Service**: http://localhost:3003/api-docs
5. **Payment Service**: http://localhost:3004/api-docs
6. **Notification Service**: http://localhost:3005/api-docs
7. ... và các service khác

## 📝 Lưu Ý

1. **Port mapping**: Tất cả services đã được cấu hình port mapping trong `docker-compose.yml`
2. **Swagger**: Không phải tất cả services đều có Swagger, tùy thuộc vào cấu hình
3. **Health check**: Tất cả services nên có endpoint `/health`
4. **Restart**: Sau khi thêm port mapping, cần restart service:
   ```bash
   docker compose up -d <service-name>
   ```

