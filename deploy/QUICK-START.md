# Quick Start Guide - Sau Khi Chạy Docker Compose

## ✅ Bước 1: Kiểm Tra Trạng Thái Services

```bash
cd deploy
docker compose ps
```

Kiểm tra tất cả services đã chạy thành công (Status: Up).

## 🗄️ Bước 2: Chạy Migrations và Seed Data

### PostgreSQL Services

#### Auth Service
```bash
cd ../services/auth-service
npm install
npm run migrate
npm run seed
```

#### Order Service
```bash
cd ../services/order-service
npm install
npm run migrate
npm run seed
```

#### Payment Service
```bash
cd ../services/payment-service
npm install
npm run migrate
npm run seed
```

#### Seller Service
```bash
cd ../services/seller-service
npm install
npm run migrate
npm run seed
```

#### Promotion Service
```bash
cd ../services/promotion-service
npm install
npm run migrate
npm run seed
```

#### Loyalty Service
```bash
cd ../services/loyalty-service
npm install
npm run migrate
npm run seed
```

#### Dispute Service
```bash
cd ../services/dispute-service
npm install
npm run migrate
npm run seed
```

#### Settlement Service
```bash
cd ../services/settlement-service
npm install
npm run migrate
npm run seed
```

### MongoDB Services

#### Analytics Service
```bash
cd ../services/analytics-service
npm install
npm run migrate
npm run seed
```

#### Product Service
```bash
cd ../services/product-service
npm install
npm run migrate
npm run seed
```

#### Cart Service
```bash
cd ../services/cart-service
npm install
npm run migrate
npm run seed
```

#### Review Service
```bash
cd ../services/review-service
npm install
npm run migrate
npm run seed
```

#### Chat Service
```bash
cd ../services/chat-service
npm install
npm run migrate
npm run seed
```

#### Search Service
```bash
cd ../services/search-service
npm install
npm run migrate
npm run seed
```

#### Notification Service
```bash
cd ../services/notification-service
npm install
npm run migrate
npm run seed
```

#### DLQ Service
```bash
cd ../services/dlq-service
npm install
npm run migrate
npm run seed
```

#### Shipping Service
```bash
cd ../services/shipping-service
npm install
npm run migrate
npm run seed
```

### ClickHouse Service

#### Warehouse Service
```bash
cd ../services/warehouse-service
npm install
npm run migrate
npm run seed
```

## 🔍 Bước 3: Kiểm Tra Health Endpoints

```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Product Service
curl http://localhost:3002/health

# Order Service
curl http://localhost:3003/health

# Payment Service
curl http://localhost:3004/health

# Analytics Service
curl http://localhost:3014/health
```

## 📊 Bước 4: Kiểm Tra Infrastructure

### MongoDB
```bash
docker compose exec mongo mongosh
# Hoặc
mongosh mongodb://localhost:27017
```

### PostgreSQL
```bash
# Auth DB
docker compose exec postgres-auth psql -U auth_user -d auth_db

# Order DB
docker compose exec postgres-order psql -U order_user -d order_db
```

### Kafka
```bash
# Xem danh sách topics
docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Xem consumer groups
docker compose exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list
```

### Redis
```bash
docker compose exec redis redis-cli ping
# Kết quả mong đợi: PONG
```

## 🧪 Bước 5: Test API

### 1. Đăng ký User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Lưu token từ response để dùng cho các request tiếp theo.

### 3. Lấy danh sách sản phẩm
```bash
curl http://localhost:3000/api/products
```

### 4. Xem Analytics
```bash
curl http://localhost:3000/api/analytics/revenue?startDate=2024-01-01&endDate=2024-12-31
```

## 📝 Bước 6: Xem Logs

```bash
# Logs của API Gateway
docker compose logs -f api-gateway

# Logs của tất cả services
docker compose logs -f

# Logs của một service cụ thể
docker compose logs -f auth-service
```

## 🎯 Bước 7: Truy Cập Monitoring

- **Grafana**: http://localhost:3030 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686

## 🚨 Troubleshooting

### Service không khởi động

```bash
# Xem logs
docker compose logs service-name

# Restart service
docker compose restart service-name

# Rebuild service
docker compose up -d --build service-name
```

### Database connection issues

```bash
# Kiểm tra database đã chạy chưa
docker compose ps | grep postgres
docker compose ps | grep mongo

# Kiểm tra network
docker network inspect deploy_default
```

### Port đã được sử dụng

```bash
# Kiểm tra port
lsof -i :3000
netstat -tulpn | grep :3000

# Thay đổi port trong docker-compose.yml hoặc dừng service đang dùng port
```

## 📚 Scripts Hữu Ích

### Chạy tất cả migrations (nếu có script)
```bash
# Tạo script run-all-migrations.sh nếu cần
```

### Kiểm tra tất cả health endpoints
```bash
for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 3012 3013 3014 3015 3016 3017 3018; do
  echo "Checking port $port..."
  curl -s http://localhost:$port/health || echo "Port $port not responding"
done
```

## ✅ Checklist Hoàn Thành

- [ ] Tất cả services đã chạy (docker compose ps)
- [ ] Migrations đã chạy cho tất cả databases
- [ ] Seed data đã được thêm
- [ ] Health endpoints trả về OK
- [ ] API Gateway có thể truy cập
- [ ] Có thể đăng ký/đăng nhập user
- [ ] Có thể lấy danh sách sản phẩm
- [ ] Kafka topics đã được tạo
- [ ] Monitoring services đang chạy

## 🎉 Hoàn Thành!

Sau khi hoàn thành tất cả các bước trên, hệ thống đã sẵn sàng để sử dụng!

