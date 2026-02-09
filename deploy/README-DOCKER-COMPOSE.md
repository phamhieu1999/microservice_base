# Hướng Dẫn Chạy Hệ Thống Microservices bằng Docker Compose

## 📋 Tổng Quan

Hệ thống này bao gồm nhiều microservices và các infrastructure services. Tài liệu này hướng dẫn cách chạy toàn bộ hệ thống bằng Docker Compose.

## 🏗️ Kiến Trúc Hệ Thống

### Infrastructure Services (Thư Viện Nền Tảng)

| Service | Port | Mô Tả |
|---------|------|-------|
| **Zookeeper** | 2181 | Quản lý Kafka |
| **Kafka** | 9092 | Message broker |
| **MongoDB** | 27017 | NoSQL database |
| **Redis** | 6379 | Cache & Session store |
| **PostgreSQL** | 5433-5440 | SQL databases (nhiều instances) |
| **Elasticsearch** | 9200 | Search engine |
| **ClickHouse** | 8123, 9000 | Analytics database |

### Application Services (Microservices)

| Service | Port | Database | Dependencies |
|---------|------|----------|--------------|
| **api-gateway** | 3000 | - | Tất cả services |
| **auth-service** | 3001 | PostgreSQL | Kafka |
| **product-service** | 3002 | MongoDB | Kafka |
| **order-service** | 3003 | PostgreSQL | Kafka |
| **payment-service** | 3004 | PostgreSQL | Kafka |
| **notification-service** | 3005 | MongoDB | Kafka |
| **cart-service** | 3006 | MongoDB | - |
| **review-service** | 3007 | MongoDB | - |
| **seller-service** | 3008 | PostgreSQL | - |
| **promotion-service** | 3009 | PostgreSQL | - |
| **shipping-service** | 3010 | MongoDB | - |
| **chat-service** | 3011 | MongoDB | Kafka |
| **search-service** | 3012 | MongoDB | Kafka, Redis, Elasticsearch |
| **dlq-service** | 3013 | MongoDB | Kafka |
| **analytics-service** | 3014 | MongoDB | Kafka, Redis |
| **loyalty-service** | 3015 | PostgreSQL | Kafka |
| **dispute-service** | 3016 | PostgreSQL | Kafka |
| **settlement-service** | 3017 | PostgreSQL | Kafka |
| **warehouse-service** | 3018 | ClickHouse | Kafka |

### Monitoring Services

| Service | Port | Mô Tả |
|---------|------|-------|
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3030 | Visualization |
| **Alertmanager** | 9093 | Alert management |
| **Jaeger** | 16686 | Distributed tracing |

## 🚀 Cách Chạy

### 1. Chạy Tất Cả Services (Full Stack)

```bash
cd deploy
docker compose up -d
```

Lệnh này sẽ:
- Build tất cả application services
- Khởi động tất cả infrastructure services
- Khởi động tất cả microservices
- Khởi động monitoring services

**Lưu ý:** Lần đầu chạy có thể mất 5-10 phút để build images.

### 2. Chạy Chỉ Infrastructure Services

Nếu bạn chỉ cần chạy các thư viện nền tảng (databases, message brokers):

```bash
cd deploy
docker compose up -d zookeeper kafka mongo redis postgres-auth postgres-order postgres-payment postgres-seller postgres-promo postgres-loyalty postgres-dispute postgres-settlement elasticsearch clickhouse
```

Hoặc sử dụng script:

```bash
cd deploy
./kafka-setup.sh  # Chỉ chạy Kafka + Zookeeper
```

### 3. Chạy Từng Nhóm Services

#### Nhóm Core Services (Bắt buộc)

```bash
docker compose up -d \
  zookeeper kafka \
  mongo redis \
  postgres-auth postgres-order postgres-payment \
  auth-service product-service order-service payment-service \
  api-gateway
```

#### Nhóm E-commerce Services

```bash
docker compose up -d \
  cart-service review-service seller-service promotion-service \
  shipping-service
```

#### Nhóm Analytics & Search

```bash
docker compose up -d \
  elasticsearch clickhouse \
  search-service analytics-service warehouse-service
```

#### Nhóm Business Services

```bash
docker compose up -d \
  loyalty-service dispute-service settlement-service
```

#### Nhóm Communication Services

```bash
docker compose up -d \
  chat-service notification-service
```

### 4. Chạy Monitoring Stack

```bash
docker compose up -d prometheus grafana alertmanager jaeger
```

## 📊 Kiểm Tra Trạng Thái

### Xem Trạng Thái Tất Cả Services

```bash
docker compose ps
```

### Xem Logs

```bash
# Logs của một service
docker compose logs -f api-gateway

# Logs của nhiều services
docker compose logs -f api-gateway auth-service product-service

# Logs của tất cả services
docker compose logs -f

# Logs với giới hạn dòng
docker compose logs --tail=100 api-gateway

# Logs từ thời điểm cụ thể
docker compose logs --since 10m api-gateway
```

### Kiểm Tra Health

```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Product Service
curl http://localhost:3002/health
```

## 🔧 Quản Lý Services

### Dừng Services

```bash
# Dừng tất cả services
docker compose down

# Dừng một service cụ thể
docker compose stop api-gateway

# Dừng nhiều services
docker compose stop api-gateway auth-service product-service
```

### Restart Services

```bash
# Restart một service
docker compose restart api-gateway

# Restart tất cả services
docker compose restart

# Restart và rebuild
docker compose up -d --build api-gateway
```

### Rebuild Services

```bash
# Rebuild một service
docker compose build api-gateway
docker compose up -d api-gateway

# Rebuild tất cả services
docker compose build
docker compose up -d
```

### Scale Services

```bash
# Scale API Gateway lên 3 instances
docker compose up -d --scale api-gateway=3

# Scale nhiều services
docker compose up -d --scale api-gateway=3 --scale product-service=2
```

## 🗄️ Database Setup

Sau khi các databases đã chạy, bạn cần chạy migrations và seed data:

### PostgreSQL Services

```bash
# Auth Service
cd services/auth-service
npm run migrate
npm run seed

# Order Service
cd services/order-service
npm run migrate
npm run seed

# Payment Service
cd services/payment-service
npm run migrate
npm run seed
```

### MongoDB Services

```bash
# Analytics Service
cd services/analytics-service
npm run migrate
npm run seed

# Product Service
cd services/product-service
npm run migrate
npm run seed
```

## 🔍 Kiểm Tra Kết Nối

### MongoDB

```bash
# Kết nối vào MongoDB
docker compose exec mongo mongosh

# Hoặc từ host
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

# Tạo topic mới
docker compose exec kafka kafka-topics --create --topic test-topic --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```

### Redis

```bash
# Kết nối vào Redis
docker compose exec redis redis-cli

# Test ping
docker compose exec redis redis-cli ping
```

## 🧹 Cleanup

### Xóa Containers

```bash
# Dừng và xóa containers
docker compose down

# Dừng, xóa containers và volumes (xóa dữ liệu)
docker compose down -v
```

### Xóa Images

```bash
# Xóa images không sử dụng
docker image prune

# Xóa tất cả images của project
docker compose down --rmi all
```

### Xóa Volumes

```bash
# Xóa volumes
docker volume prune

# Xóa volumes cụ thể
docker volume rm deploy_redis-data deploy_elasticsearch-data
```

## 🐛 Troubleshooting

### Service không khởi động được

```bash
# Kiểm tra logs
docker compose logs service-name

# Kiểm tra trạng thái
docker compose ps service-name

# Kiểm tra dependencies
docker compose ps | grep -E "mongo|kafka|redis|postgres"
```

### Port đã được sử dụng

```bash
# Kiểm tra port nào đang được sử dụng
lsof -i :3000
netstat -tulpn | grep :3000

# Thay đổi port trong docker-compose.yml
# Hoặc dừng service đang dùng port đó
```

### Database connection issues

```bash
# Kiểm tra database đã chạy chưa
docker compose ps postgres-auth

# Kiểm tra connection string
docker compose exec auth-service env | grep DB

# Kiểm tra network
docker network ls
docker network inspect deploy_default
```

### Kafka connection issues

```bash
# Kiểm tra Kafka đã sẵn sàng chưa
docker compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Kiểm tra topics
docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Kiểm tra consumer groups
docker compose exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list
```

### Memory Issues

```bash
# Kiểm tra memory usage
docker stats

# Giảm số lượng services chạy cùng lúc
# Hoặc tăng Docker memory limit trong Docker Desktop
```

## 📚 Các File Docker Compose

| File | Mô Tả |
|------|-------|
| `docker-compose.yml` | File chính, chứa tất cả services |
| `docker-compose.kafka-only.yml` | Chỉ Kafka và Zookeeper |
| `docker-compose.kafka-secure.yml` | Kafka với SASL authentication |
| `docker-compose.kafka-cluster.yml` | Kafka cluster setup |
| `docker-compose.scale.yml` | Scaling configuration |

## 🎯 Quick Start Commands

```bash
# 1. Chạy infrastructure
cd deploy
docker compose up -d zookeeper kafka mongo redis

# 2. Chạy core services
docker compose up -d postgres-auth postgres-order postgres-payment
docker compose up -d auth-service product-service order-service payment-service api-gateway

# 3. Kiểm tra
docker compose ps
curl http://localhost:3000/health

# 4. Xem logs
docker compose logs -f api-gateway
```

## 📖 Xem Thêm

- [README-ANALYTICS-SERVICE.md](./README-ANALYTICS-SERVICE.md) - Hướng dẫn Analytics Service
- [README-KAFKA-SECURITY.md](./README-KAFKA-SECURITY.md) - Kafka Security Setup
- [SCALING.md](./SCALING.md) - Scaling Guide
- [Docker Compose Documentation](https://docs.docker.com/compose/)

