# Bug Fix: Kafka Listener Configuration Error

## 🐛 Mô Tả Bug

Khi chạy `./scripts/start-kafka.sh`, Kafka không thể khởi động và gặp lỗi:

```
java.lang.IllegalArgumentException: requirement failed: Each listener must have a different port, listeners: PLAINTEXT://0.0.0.0:9092,PLAINTEXT_HOST://0.0.0.0:9092
```

**Triệu chứng:**
- Kafka container không khởi động được
- Script báo lỗi "Không thể kết nối đến Kafka sau 10 lần thử"
- Logs hiển thị "Exiting Kafka due to fatal exception"

## 🔍 Nguyên Nhân

Trong file `docker-compose.kafka-only.yml`, cấu hình Kafka có vấn đề:

**Cấu hình cũ (SAI):**
```yaml
KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9092
KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
```

**Vấn đề:**
- Kafka tự động tạo listeners dựa trên `KAFKA_ADVERTISED_LISTENERS`
- Cả hai listeners `PLAINTEXT` và `PLAINTEXT_HOST` đều được bind vào cùng port 9092
- Kafka yêu cầu mỗi listener phải có port khác nhau

## ✅ Giải Pháp

### Cấu hình mới (ĐÚNG):

```yaml
KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT
KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
```

**Thay đổi:**
1. ✅ Chỉ dùng một listener `PLAINTEXT` thay vì hai listeners
2. ✅ Thêm `KAFKA_LISTENERS` để chỉ định rõ ràng listener bind address
3. ✅ Đơn giản hóa cấu hình cho môi trường development

### File đã sửa:
- `deploy/docker-compose.kafka-only.yml`

## 🧪 Test Sau Khi Fix

### 1. Kiểm tra Container:
```bash
docker ps --filter "name=kafka"
# Kết quả: kafka container đang chạy (Up X seconds)
```

### 2. Kiểm tra Port:
```bash
nc -zv localhost 9092
# Kết quả: Connection succeeded!
```

### 3. Kiểm tra Kafka API:
```bash
docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092
# Kết quả: Hiển thị danh sách API versions
```

### 4. Kiểm tra Logs:
```bash
docker compose -f docker-compose.kafka-only.yml logs kafka | grep "started"
# Kết quả: [KafkaServer id=1] started
```

## 📋 Kết Quả

Sau khi fix:
- ✅ Kafka container khởi động thành công
- ✅ Port 9092 đã mở và có thể kết nối
- ✅ Kafka Server đã started
- ✅ Controller đã kết nối
- ✅ Script `./scripts/start-kafka.sh` hoạt động bình thường

## 🔧 Cấu Hình Chi Tiết

### Cho Development (Đơn giản):
```yaml
KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
```

### Cho Production (Nếu cần nhiều listeners):
```yaml
# Internal listener (trong Docker network)
KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9093
KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,PLAINTEXT_HOST://0.0.0.0:9093
KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
```

**Lưu ý:** Phải map ports khác nhau trong docker-compose:
```yaml
ports:
  - "9092:9092"  # Internal
  - "9093:9093"  # External
```

## 📚 Tài Liệu Liên Quan

- [Kafka Configuration](https://kafka.apache.org/documentation/#brokerconfigs)
- `docs/KAFKA_SETUP.md` - Hướng dẫn setup Kafka
- `deploy/docker-compose.kafka-only.yml` - File đã được sửa

---

## ✅ Kết Luận

Bug đã được fix:
- ✅ Sửa cấu hình listener trong docker-compose.kafka-only.yml
- ✅ Kafka đã khởi động thành công
- ✅ Port 9092 đã sẵn sàng
- ✅ Script có thể chạy bình thường

Kafka hiện đã hoạt động đúng! 🚀

