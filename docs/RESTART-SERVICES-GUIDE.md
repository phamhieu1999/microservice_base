# Hướng Dẫn Restart Services Khi Bị Exited

## 🔍 Vấn Đề

Khi service ở trạng thái **Exited**, có nghĩa là container đã dừng. Có nhiều nguyên nhân:
- Lỗi kết nối database
- Lỗi kết nối Kafka
- Lỗi trong code
- Dependencies chưa sẵn sàng

## ✅ Giải Pháp

### Cách 1: Sử Dụng Script Tự Động (Khuyến Nghị)

```bash
# Restart một service
./scripts/restart-service.sh auth-service

# Restart nhiều services
./scripts/restart-service.sh auth-service order-service

# Restart tất cả services
./scripts/restart-service.sh all
```

### Cách 2: Restart Thủ Công

#### Bước 1: Kiểm tra dependencies

```bash
cd deploy

# Kiểm tra Kafka
docker compose ps kafka

# Kiểm tra databases
docker compose ps postgres-auth postgres-order
```

#### Bước 2: Khởi động dependencies nếu cần

```bash
# Khởi động Kafka
docker compose up -d zookeeper kafka

# Khởi động databases
docker compose up -d postgres-auth postgres-order

# Đợi vài giây
sleep 5
```

#### Bước 3: Restart services

```bash
# Cách 1: Stop và start lại
docker compose stop auth-service order-service
docker compose start auth-service order-service

# Cách 2: Restart trực tiếp
docker compose restart auth-service order-service

# Cách 3: Recreate (xóa và tạo lại)
docker compose up -d auth-service order-service
```

### Cách 3: Xem Logs Và Fix Lỗi

#### Xem logs để biết lỗi:

```bash
# Xem logs của service
docker compose logs auth-service
docker compose logs order-service

# Xem logs real-time
docker compose logs -f auth-service
```

#### Các lỗi thường gặp:

1. **ECONNREFUSED - Database**
   ```bash
   # Kiểm tra database đang chạy
   docker compose ps postgres-auth
   
   # Khởi động database
   docker compose up -d postgres-auth
   ```

2. **ECONNREFUSED - Kafka**
   ```bash
   # Kiểm tra Kafka đang chạy
   docker compose ps kafka
   
   # Khởi động Kafka
   docker compose up -d zookeeper kafka
   sleep 10  # Đợi Kafka sẵn sàng
   ```

3. **Lỗi trong code**
   ```bash
   # Rebuild service
   docker compose build auth-service
   docker compose up -d auth-service
   ```

## 🔄 Quy Trình Restart Đầy Đủ

```bash
cd deploy

# 1. Kiểm tra dependencies
docker compose ps kafka postgres-auth postgres-order

# 2. Khởi động dependencies nếu cần
docker compose up -d zookeeper kafka postgres-auth postgres-order

# 3. Đợi dependencies sẵn sàng
sleep 10

# 4. Restart services
docker compose up -d auth-service order-service

# 5. Kiểm tra trạng thái
docker compose ps auth-service order-service

# 6. Xem logs
docker compose logs -f auth-service order-service
```

## 📋 Các Lệnh Hữu Ích

### Kiểm tra trạng thái
```bash
docker compose ps
docker compose ps auth-service order-service
```

### Xem logs
```bash
# Logs của một service
docker compose logs auth-service

# Logs real-time
docker compose logs -f auth-service

# Logs 20 dòng cuối
docker compose logs --tail=20 auth-service
```

### Restart
```bash
# Restart một service
docker compose restart auth-service

# Restart nhiều services
docker compose restart auth-service order-service

# Recreate (xóa và tạo lại)
docker compose up -d auth-service
```

### Rebuild và restart
```bash
# Rebuild image
docker compose build auth-service

# Restart với image mới
docker compose up -d auth-service
```

## 🛠️ Troubleshooting

### Service vẫn Exited sau khi restart

1. **Xem logs chi tiết:**
   ```bash
   docker compose logs --tail=50 auth-service
   ```

2. **Kiểm tra dependencies:**
   ```bash
   docker compose ps kafka postgres-auth
   ```

3. **Kiểm tra health của dependencies:**
   ```bash
   # Kafka
   docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092
   
   # PostgreSQL
   docker exec deploy-postgres-auth-1 pg_isready -U auth_user
   ```

4. **Rebuild service:**
   ```bash
   docker compose build auth-service
   docker compose up -d auth-service
   ```

### Service không kết nối được database

```bash
# Kiểm tra database đang chạy
docker compose ps postgres-auth

# Kiểm tra có thể kết nối
docker exec deploy-postgres-auth-1 psql -U auth_user -d auth_db -c "SELECT 1"

# Restart database
docker compose restart postgres-auth
```

### Service không kết nối được Kafka

```bash
# Kiểm tra Kafka đang chạy
docker compose ps kafka

# Kiểm tra Kafka sẵn sàng
docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Restart Kafka
docker compose restart zookeeper kafka
sleep 10
```

## 📝 Quick Reference

```bash
# Restart nhanh
cd deploy && docker compose restart auth-service order-service

# Restart với script
./scripts/restart-service.sh auth-service order-service

# Xem logs
docker compose logs -f auth-service order-service

# Kiểm tra status
docker compose ps auth-service order-service
```

