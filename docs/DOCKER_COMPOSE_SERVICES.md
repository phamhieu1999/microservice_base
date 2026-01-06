# Danh Sách Services và Thư Viện trong Docker Compose

## 📋 Tổng Quan

File `deploy/docker-compose.yml` chứa **tất cả các services** của hệ thống microservices, bao gồm:
- Infrastructure services (databases, message brokers)
- Application services (các microservices)
- Monitoring và observability tools

---

## 🗄️ Infrastructure Services (Databases & Storage)

### 1. **MongoDB**
- **Service:** `mongo`
- **Image:** `mongo:7`
- **Port:** `27017:27017`
- **Mô tả:** NoSQL database cho các services sử dụng MongoDB
- **Sử dụng bởi:** product-service, cart-service, review-service, chat-service, search-service, notification-service, dlq-service, analytics-service

### 2. **PostgreSQL Instances**
Có nhiều PostgreSQL instances cho các services khác nhau:

#### `postgres-auth`
- **Port:** `5433:5432`
- **Database:** `auth_db`
- **User:** `auth_user`
- **Sử dụng bởi:** auth-service

#### `postgres-order`
- **Port:** `5434:5432`
- **Database:** `order_db`
- **User:** `order_user`
- **Sử dụng bởi:** order-service

#### `postgres-payment`
- **Port:** `5435:5432`
- **Database:** `payment_db`
- **User:** `payment_user`
- **Sử dụng bởi:** payment-service

#### `postgres-seller`
- **Port:** `5436:5432`
- **Database:** `seller_db`
- **User:** `seller_user`
- **Sử dụng bởi:** seller-service

#### `postgres-promo`
- **Port:** `5437:5432`
- **Database:** `promo_db`
- **User:** `promo_user`
- **Sử dụng bởi:** promotion-service

#### `postgres-loyalty`
- **Port:** `5438:5432`
- **Database:** `loyalty_db`
- **User:** `loyalty_user`
- **Sử dụng bởi:** loyalty-service

#### `postgres-dispute`
- **Port:** `5439:5432`
- **Database:** `dispute_db`
- **User:** `dispute_user`
- **Sử dụng bởi:** dispute-service

#### `postgres-settlement`
- **Port:** `5440:5432`
- **Database:** `settlement_db`
- **User:** `settlement_user`
- **Sử dụng bởi:** settlement-service

### 3. **Redis**
- **Service:** `redis`
- **Image:** `redis:7-alpine`
- **Port:** `6379:6379`
- **Mô tả:** In-memory data store cho caching
- **Volume:** `redis-data`
- **Sử dụng bởi:** search-service, và các services khác cần caching

### 4. **ClickHouse**
- **Service:** `clickhouse`
- **Image:** `clickhouse/clickhouse-server:latest`
- **Ports:** 
  - `8123:8123` (HTTP interface)
  - `9000:9000` (Native protocol)
- **Mô tả:** Column-oriented database cho analytics và data warehousing
- **Volumes:** `clickhouse-data`, `clickhouse-logs`
- **Sử dụng bởi:** warehouse-service

### 5. **Elasticsearch**
- **Service:** `elasticsearch`
- **Image:** `docker.elastic.co/elasticsearch/elasticsearch:8.11.0`
- **Port:** `9200:9200`
- **Mô tả:** Search engine và analytics
- **Volume:** `elasticsearch-data`
- **Sử dụng bởi:** search-service

---

## 📨 Message Brokers

### 6. **Zookeeper**
- **Service:** `zookeeper`
- **Image:** `confluentinc/cp-zookeeper:7.5.0`
- **Port:** `2181:2181`
- **Mô tả:** Coordination service cho Kafka

### 7. **Kafka**
- **Service:** `kafka`
- **Image:** `confluentinc/cp-kafka:7.5.0`
- **Port:** `9092:9092`
- **Mô tả:** Distributed event streaming platform
- **Depends on:** zookeeper
- **Sử dụng bởi:** Tất cả services cần messaging (auth, product, order, payment, chat, search, notification, dlq, analytics, loyalty, dispute, settlement, warehouse)

---

## 🚀 Application Services (Microservices)

### 8. **API Gateway**
- **Service:** `api-gateway`
- **Port:** `3000:3000` (exposed)
- **Mô tả:** Entry point cho tất cả requests
- **Routes đến:** Tất cả các services

### 9. **Auth Service**
- **Service:** `auth-service`
- **Port:** `3001`
- **Database:** PostgreSQL (postgres-auth)
- **Kafka:** ✅
- **Mô tả:** Xác thực và phân quyền

### 10. **Product Service**
- **Service:** `product-service`
- **Port:** `3002`
- **Database:** MongoDB
- **Kafka:** ✅
- **Mô tả:** Quản lý sản phẩm

### 11. **Order Service**
- **Service:** `order-service`
- **Port:** `3003`
- **Database:** PostgreSQL (postgres-order)
- **Kafka:** ✅
- **Mô tả:** Quản lý đơn hàng

### 12. **Payment Service**
- **Service:** `payment-service`
- **Port:** `3004`
- **Database:** PostgreSQL (postgres-payment)
- **Kafka:** ✅
- **Mô tả:** Xử lý thanh toán

### 13. **Notification Service**
- **Service:** `notification-service`
- **Port:** `3005`
- **Database:** MongoDB
- **Kafka:** ✅
- **Mô tả:** Gửi thông báo

### 14. **Cart Service**
- **Service:** `cart-service`
- **Port:** `3006`
- **Database:** MongoDB
- **Kafka:** ❌
- **Mô tả:** Quản lý giỏ hàng

### 15. **Review Service**
- **Service:** `review-service`
- **Port:** `3007`
- **Database:** MongoDB
- **Kafka:** ❌
- **Mô tả:** Quản lý đánh giá

### 16. **Seller Service**
- **Service:** `seller-service`
- **Port:** `3008`
- **Database:** PostgreSQL (postgres-seller)
- **Kafka:** ❌
- **Mô tả:** Quản lý người bán

### 17. **Promotion Service**
- **Service:** `promotion-service`
- **Port:** `3009`
- **Database:** PostgreSQL (postgres-promo)
- **Kafka:** ❌
- **Mô tả:** Quản lý khuyến mãi

### 18. **Shipping Service**
- **Service:** `shipping-service`
- **Port:** `3010`
- **Database:** MongoDB
- **Kafka:** ❌
- **Mô tả:** Quản lý vận chuyển

### 19. **Chat Service**
- **Service:** `chat-service`
- **Port:** `3011`
- **Database:** MongoDB
- **Kafka:** ✅
- **Mô tả:** Chat real-time

### 20. **Search Service**
- **Service:** `search-service`
- **Port:** `3012`
- **Database:** MongoDB
- **Kafka:** ✅
- **Redis:** ✅
- **Elasticsearch:** ✅
- **Mô tả:** Tìm kiếm sản phẩm

### 21. **DLQ Service**
- **Service:** `dlq-service`
- **Port:** `3013`
- **Database:** MongoDB
- **Kafka:** ✅
- **Mô tả:** Dead Letter Queue - xử lý messages thất bại

### 22. **Analytics Service**
- **Service:** `analytics-service`
- **Port:** `3014`
- **Database:** MongoDB
- **Kafka:** ✅
- **Mô tả:** Phân tích dữ liệu

### 23. **Loyalty Service**
- **Service:** `loyalty-service`
- **Port:** `3015`
- **Database:** PostgreSQL (postgres-loyalty)
- **Kafka:** ✅
- **Mô tả:** Quản lý điểm thưởng

### 24. **Dispute Service**
- **Service:** `dispute-service`
- **Port:** `3016`
- **Database:** PostgreSQL (postgres-dispute)
- **Kafka:** ✅
- **Mô tả:** Xử lý tranh chấp

### 25. **Settlement Service**
- **Service:** `settlement-service`
- **Port:** `3017`
- **Database:** PostgreSQL (postgres-settlement)
- **Kafka:** ✅
- **Mô tả:** Thanh toán bù trừ

### 26. **Warehouse Service**
- **Service:** `warehouse-service`
- **Port:** `3018`
- **Database:** ClickHouse
- **Kafka:** ✅
- **Mô tả:** Quản lý kho

---

## 📊 Monitoring & Observability

### 27. **Prometheus**
- **Service:** `prometheus`
- **Image:** `prom/prometheus:latest`
- **Port:** `9090:9090`
- **Mô tả:** Metrics collection và monitoring
- **Volumes:** `prometheus-data`
- **Config:** `./prometheus/prometheus.yml`

### 28. **Alertmanager**
- **Service:** `alertmanager`
- **Image:** `prom/alertmanager:latest`
- **Port:** `9093:9093`
- **Mô tả:** Alert management
- **Volumes:** `alertmanager-data`
- **Config:** `./prometheus/alertmanager.yml`

### 29. **Grafana**
- **Service:** `grafana`
- **Image:** `grafana/grafana:latest`
- **Port:** `3030:3000`
- **Mô tả:** Visualization và dashboards
- **Volumes:** `grafana-data`
- **Admin Password:** `admin`

### 30. **Jaeger**
- **Service:** `jaeger`
- **Image:** `jaegertracing/all-in-one:latest`
- **Ports:**
  - `16686:16686` (Jaeger UI)
  - `14268:14268` (HTTP collector)
- **Mô tả:** Distributed tracing

---

## 📦 Volumes

Các volumes được định nghĩa:
- `redis-data` - Redis persistence
- `prometheus-data` - Prometheus metrics storage
- `grafana-data` - Grafana dashboards và config
- `alertmanager-data` - Alertmanager storage
- `elasticsearch-data` - Elasticsearch indices
- `clickhouse-data` - ClickHouse data
- `clickhouse-logs` - ClickHouse logs

---

## 🔗 Dependencies Map

### Services sử dụng Kafka:
- auth-service
- product-service
- order-service
- payment-service
- chat-service
- search-service
- notification-service
- dlq-service
- analytics-service
- loyalty-service
- dispute-service
- settlement-service
- warehouse-service

### Services sử dụng MongoDB:
- product-service
- cart-service
- review-service
- chat-service
- search-service
- notification-service
- dlq-service
- analytics-service
- shipping-service

### Services sử dụng PostgreSQL:
- auth-service → postgres-auth
- order-service → postgres-order
- payment-service → postgres-payment
- seller-service → postgres-seller
- promotion-service → postgres-promo
- loyalty-service → postgres-loyalty
- dispute-service → postgres-dispute
- settlement-service → postgres-settlement

---

## 📝 Lưu Ý

⚠️ **Lỗi trong docker-compose.yml:**
- `postgres-loyalty` được đặt trong section `volumes` thay vì `services`
- Cần sửa để file có thể validate được

---

## 🚀 Quick Reference

### Chạy tất cả services:
```bash
cd deploy
docker compose up -d
```

### Chạy chỉ infrastructure:
```bash
docker compose up -d zookeeper kafka mongo redis postgres-auth
```

### Chạy một service cụ thể:
```bash
docker compose up -d analytics-service
```

### Xem logs:
```bash
docker compose logs -f analytics-service
```

### Dừng tất cả:
```bash
docker compose down
```

---

Tổng cộng: **30 services** trong docker-compose.yml

