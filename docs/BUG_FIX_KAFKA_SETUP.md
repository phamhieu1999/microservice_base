# Bug Fix: Kafka Setup Script

## 🐛 Mô Tả Bug

Khi chạy lệnh:
```bash
cd deploy && ./kafka-setup.sh
```

Gặp lỗi:
```
bash: ./kafka-setup.sh: No such file or directory
```

## 🔍 Nguyên Nhân

1. **File không tồn tại:** Script `kafka-setup.sh` chưa được tạo trong thư mục `deploy/`
2. **Chỉ có các script phức tạp:** Chỉ có `kafka-cluster-setup.sh` và `kafka-setup-sasl.sh`, không có script đơn giản
3. **Docker Compose command:** Có thể dùng `docker compose` (không có dấu gạch ngang) hoặc `docker-compose`

## ✅ Giải Pháp Đã Áp Dụng

### 1. Tạo Script `kafka-setup.sh` Mới

**Location:** `deploy/kafka-setup.sh`

**Tính năng:**
- ✅ Kiểm tra Docker đang chạy
- ✅ Tự động phát hiện `docker compose` hoặc `docker-compose`
- ✅ Khởi động Zookeeper và Kafka
- ✅ Đợi Kafka sẵn sàng
- ✅ Hiển thị thông tin kết nối

### 2. Hỗ Trợ Cả Hai Loại Docker Compose

Script tự động phát hiện:
- `docker-compose` (cũ)
- `docker compose` (mới, plugin)

### 3. Tạo Tài Liệu Hướng Dẫn

- `docs/KAFKA_SETUP.md` - Hướng dẫn chi tiết setup Kafka

## 📋 Cách Sử Dụng

### Chạy Script:
```bash
cd deploy
./kafka-setup.sh
```

### Kiểm Tra Kafka Đã Chạy:
```bash
# Kiểm tra port
nc -zv localhost 9092

# Kiểm tra Docker containers
docker ps | grep kafka

# Xem logs
cd deploy
docker compose logs kafka
# hoặc
docker-compose logs kafka
```

## 🔧 Troubleshooting

### Lỗi: "docker-compose command not found"

**Giải pháp:**
```bash
# Kiểm tra docker compose (plugin mới)
docker compose version

# Nếu không có, cài đặt docker-compose
sudo apt-get install docker-compose
# hoặc
pip install docker-compose
```

### Lỗi: "Docker không đang chạy"

**Giải pháp:**
```bash
# Kiểm tra Docker
docker info

# Khởi động Docker
sudo systemctl start docker
# hoặc trên WSL2: khởi động Docker Desktop
```

### Lỗi: "Port 9092 đã được sử dụng"

**Giải pháp:**
```bash
# Tìm process đang dùng port
lsof -i :9092
# hoặc
netstat -tulpn | grep 9092

# Kill process nếu cần
kill -9 <PID>
```

## ✅ Test

Script đã được test:
- ✅ File tồn tại và có quyền thực thi
- ✅ Kiểm tra docker-compose.yml có Kafka service
- ✅ Hỗ trợ cả `docker compose` và `docker-compose`

## 📚 Tài Liệu Liên Quan

- `docs/KAFKA_SETUP.md` - Hướng dẫn setup Kafka chi tiết
- `docs/GETTING_STARTED.md` - Hướng dẫn bắt đầu tổng quát
- `deploy/README-KAFKA-SECURITY.md` - Hướng dẫn bảo mật Kafka

---

## ✅ Kết Luận

Bug đã được fix:
- ✅ Script `kafka-setup.sh` đã được tạo
- ✅ Hỗ trợ cả `docker compose` và `docker-compose`
- ✅ Tài liệu đã được cập nhật
- ✅ Script đã được test

Bây giờ bạn có thể chạy `cd deploy && ./kafka-setup.sh` để khởi động Kafka! 🚀

