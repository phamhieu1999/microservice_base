# Hướng Dẫn Setup Kafka

## 🚀 Quick Start

### Cách 1: Sử Dụng Script từ Bất Kỳ Đâu (Khuyến Nghị)

```bash
# Từ root của dự án
./scripts/start-kafka.sh

# Hoặc từ bất kỳ đâu
cd services/analytics-service
../../scripts/start-kafka.sh

# Hoặc từ thư mục deploy
cd deploy
./kafka-setup.sh
```

Script này sẽ:
- ✅ Kiểm tra Docker đang chạy
- ✅ Khởi động Zookeeper và Kafka
- ✅ Đợi Kafka sẵn sàng
- ✅ Hiển thị thông tin kết nối

### Cách 2: Sử Dụng Docker Compose

```bash
cd deploy
docker-compose up -d zookeeper kafka
```

### Cách 3: Chạy Tất Cả Infrastructure

```bash
cd deploy
docker-compose up -d
```

---

## ✅ Kiểm Tra Kafka Đã Chạy

### Kiểm tra bằng netcat:
```bash
nc -zv localhost 9092
```

### Kiểm tra bằng Docker:
```bash
docker ps | grep kafka
```

### Kiểm tra logs:
```bash
cd deploy
docker-compose logs kafka
```

### Test kết nối:
```bash
# Kiểm tra Kafka broker API
docker exec $(docker ps -q -f name=kafka) \
  kafka-broker-api-versions --bootstrap-server localhost:9092
```

---

## 🔧 Các Scripts Kafka Có Sẵn

### 1. `kafka-setup.sh` - Setup Kafka Đơn Giản
```bash
cd deploy
./kafka-setup.sh
```
**Mục đích:** Khởi động Kafka và Zookeeper cơ bản

### 2. `kafka-cluster-setup.sh` - Setup Kafka Cluster
```bash
cd deploy
./kafka-cluster-setup.sh
```
**Mục đích:** Setup Kafka cluster với replication và tạo topics

### 3. `kafka-setup-sasl.sh` - Setup Kafka với Security
```bash
cd deploy
./kafka-setup-sasl.sh
```
**Mục đích:** Setup Kafka với SASL authentication

---

## 📋 Cấu Hình Kafka

### Thông Tin Kết Nối Mặc Định:
- **Kafka Broker:** `localhost:9092`
- **Zookeeper:** `localhost:2181`
- **Docker Network:** `deploy_default` (nếu dùng docker-compose)

### Cấu Hình Trong Services:
```env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=your-service-name
KAFKA_GROUP_ID=your-service-group
```

---

## 🐛 Troubleshooting

### Lỗi: "Docker không đang chạy"
```bash
# Kiểm tra Docker
docker info

# Khởi động Docker (nếu cần)
sudo systemctl start docker
```

### Lỗi: "Port 9092 đã được sử dụng"
```bash
# Tìm process đang dùng port
lsof -i :9092

# Hoặc
netstat -tulpn | grep 9092

# Kill process nếu cần
kill -9 <PID>
```

### Lỗi: "Kafka không khởi động được"
```bash
# Xem logs chi tiết
cd deploy
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka

# Hoặc xóa và tạo lại
docker-compose down kafka zookeeper
docker-compose up -d zookeeper kafka
```

### Lỗi: "Không thể kết nối đến Kafka"
```bash
# Kiểm tra Kafka đang chạy
docker ps | grep kafka

# Kiểm tra network
docker network ls
docker network inspect deploy_default

# Test kết nối từ container
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-broker-api-versions --bootstrap-server localhost:9092
```

---

## 📚 Tài Liệu Liên Quan

- `deploy/README-KAFKA-SECURITY.md` - Hướng dẫn bảo mật Kafka
- `deploy/SCALING.md` - Hướng dẫn scale Kafka
- `docs/GETTING_STARTED.md` - Hướng dẫn bắt đầu tổng quát

---

## 💡 Tips

1. **Development:** Dùng `kafka-setup.sh` cho môi trường dev
2. **Production:** Dùng `kafka-cluster-setup.sh` cho production với replication
3. **Security:** Dùng `kafka-setup-sasl.sh` nếu cần authentication
4. **Logs:** Luôn kiểm tra logs khi gặp vấn đề: `docker-compose logs -f kafka`

---

## ✅ Checklist

- [ ] Docker đang chạy
- [ ] Port 9092 và 2181 chưa được sử dụng
- [ ] Đã chạy `./kafka-setup.sh` hoặc `docker-compose up -d zookeeper kafka`
- [ ] Kafka đã sẵn sàng (kiểm tra bằng `nc -zv localhost 9092`)
- [ ] Services đã được cấu hình với `KAFKA_BROKERS=localhost:9092`

---

Chúc bạn thành công! 🚀

