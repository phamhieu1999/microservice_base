# Hướng Dẫn Chạy Analytics Service với Docker Compose

## 📋 Tổng Quan

Analytics Service cần các services sau để hoạt động:
- **MongoDB**: Lưu trữ analytics data
- **Kafka + Zookeeper**: Nhận events từ các services khác
- **Redis**: Cache cho analytics queries

## 🚀 Cách Chạy

### 1. Chạy Tất Cả Services (Bao Gồm Analytics Service)

```bash
cd deploy
docker compose up -d
```

Lệnh này sẽ khởi động tất cả services bao gồm:
- MongoDB
- Kafka + Zookeeper
- Redis
- Analytics Service
- Các services khác

### 2. Chỉ Chạy Infrastructure Services (MongoDB, Kafka, Redis)

Nếu bạn chỉ muốn chạy các services cần thiết cho analytics-service:

```bash
cd deploy
docker compose up -d zookeeper kafka mongo redis
```

### 3. Chạy Analytics Service Sau Khi Infrastructure Đã Sẵn Sàng

```bash
cd deploy
docker compose up -d analytics-service
```

### 4. Kiểm Tra Trạng Thái Services

```bash
# Xem tất cả services
docker compose ps

# Xem logs của analytics-service
docker compose logs -f analytics-service

# Xem logs của MongoDB
docker compose logs -f mongo

# Xem logs của Kafka
docker compose logs -f kafka

# Xem logs của Redis
docker compose logs -f redis
```

## 🔧 Cấu Hình Environment Variables

Analytics Service sử dụng các environment variables sau (đã được cấu hình trong docker compose.yml):

```yaml
PORT: 3014
ANALYTICS_MONGO_URI: mongodb://mongo:27017/analytics_db
KAFKA_BROKERS: kafka:9092
REDIS_HOST: redis
REDIS_PORT: 6379
```

## 📊 Ports Được Sử Dụng

| Service | Port | Mô Tả |
|---------|------|-------|
| Analytics Service | 3014 | API endpoint |
| MongoDB | 27017 | Database connection |
| Kafka | 9092 | Message broker |
| Zookeeper | 2181 | Kafka coordination |
| Redis | 6379 | Cache |

## 🗄️ Database Setup

Sau khi MongoDB đã chạy, bạn cần chạy migration và seed data:

```bash
# Vào thư mục analytics-service
cd ../services/analytics-service

# Chạy migration để tạo indexes
npm run migrate

# Chạy seed để thêm dữ liệu mẫu
npm run seed
```

**Lưu ý:** Đảm bảo MongoDB đã chạy và có thể kết nối được trước khi chạy migration/seed.

## 🔍 Kiểm Tra Kết Nối

### Kiểm Tra MongoDB

```bash
# Kết nối vào MongoDB container
docker compose exec mongo mongosh

# Hoặc từ host
mongosh mongodb://localhost:27017/analytics_db
```

### Kiểm Tra Kafka

```bash
# Xem danh sách topics
docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Xem consumer groups
docker compose exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list
```

### Kiểm Tra Redis

```bash
# Kết nối vào Redis
docker compose exec redis redis-cli

# Test ping
docker compose exec redis redis-cli ping
# Kết quả mong đợi: PONG
```

## 🛑 Dừng Services

```bash
# Dừng tất cả services
docker compose down

# Dừng và xóa volumes (xóa dữ liệu)
docker compose down -v

# Dừng chỉ analytics-service
docker compose stop analytics-service

# Dừng infrastructure services
docker compose stop mongo kafka redis zookeeper
```

## 🔄 Restart Services

```bash
# Restart analytics-service
docker compose restart analytics-service

# Restart tất cả services
docker compose restart
```

## 📝 Logs và Debugging

### Xem Logs Real-time

```bash
# Logs của analytics-service
docker compose logs -f analytics-service

# Logs của tất cả services
docker compose logs -f

# Logs của nhiều services cùng lúc
docker compose logs -f analytics-service mongo kafka redis
```

### Xem Logs với Giới Hạn Dòng

```bash
# 100 dòng cuối cùng
docker compose logs --tail=100 analytics-service

# Logs từ thời điểm cụ thể
docker compose logs --since 10m analytics-service
```

## 🧹 Cleanup

```bash
# Dừng và xóa containers
docker compose down

# Dừng, xóa containers và volumes
docker compose down -v

# Xóa images không sử dụng
docker image prune

# Xóa tất cả (cẩn thận!)
docker compose down -v --rmi all
```

## 🐛 Troubleshooting

### Analytics Service không kết nối được MongoDB

```bash
# Kiểm tra MongoDB đã chạy chưa
docker compose ps mongo

# Kiểm tra logs MongoDB
docker compose logs mongo

# Kiểm tra connection string
docker compose exec analytics-service env | grep MONGO
```

### Analytics Service không nhận được Kafka messages

```bash
# Kiểm tra Kafka đã chạy chưa
docker compose ps kafka

# Kiểm tra topics có tồn tại không
docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Kiểm tra consumer group
docker compose exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group analytics-service-group
```

### Redis Connection Issues

```bash
# Kiểm tra Redis đã chạy chưa
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli ping

# Kiểm tra environment variables
docker compose exec analytics-service env | grep REDIS
```

## 📚 Xem Thêm

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Redis Documentation](https://redis.io/documentation)

