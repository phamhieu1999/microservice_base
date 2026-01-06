# Hướng Dẫn Chạy Services Sau Khi Pull Images

## 📋 Giải Thích

Khi bạn chạy `docker compose up -d`, Docker sẽ:
1. **Pull images** (nếu chưa có) - Bước này đã hoàn thành ✅
2. **Build images** (cho services có Dockerfile) - Đang chạy...
3. **Tạo và khởi động containers** - Tự động sau khi build xong

## 🚀 Các Cách Chạy Services

### Cách 1: Chạy Tất Cả Services (Khuyến Nghị)

```bash
cd deploy
docker compose up -d
```

Lệnh này sẽ:
- Pull images đã thiếu
- Build các services có Dockerfile
- Khởi động tất cả containers

### Cách 2: Chạy Từng Nhóm Services

#### Chỉ Infrastructure (Databases, Message Brokers)
```bash
docker compose up -d \
  zookeeper kafka \
  mongo redis \
  postgres-auth postgres-order postgres-payment \
  postgres-seller postgres-promo postgres-loyalty \
  postgres-dispute postgres-settlement \
  elasticsearch clickhouse
```

#### Core Services
```bash
docker compose up -d \
  auth-service product-service order-service \
  payment-service api-gateway
```

#### Tất Cả Services
```bash
docker compose up -d
```

### Cách 3: Chạy Và Xem Logs

```bash
# Chạy và xem logs real-time
docker compose up

# Hoặc chạy background và xem logs sau
docker compose up -d
docker compose logs -f
```

## 🔍 Kiểm Tra Trạng Thái

### Xem Tất Cả Services
```bash
docker compose ps
```

### Xem Services Đang Chạy
```bash
docker compose ps | grep "Up"
```

### Xem Services Đã Dừng
```bash
docker compose ps | grep "Exit"
```

### Xem Chi Tiết Một Service
```bash
docker compose ps service-name
```

## 🛠️ Quản Lý Services

### Khởi Động Lại Services
```bash
# Restart một service
docker compose restart service-name

# Restart tất cả
docker compose restart
```

### Dừng Services
```bash
# Dừng một service
docker compose stop service-name

# Dừng tất cả
docker compose stop
```

### Xóa Containers
```bash
# Dừng và xóa containers
docker compose down

# Xóa cả volumes (xóa dữ liệu)
docker compose down -v
```

### Rebuild Services
```bash
# Rebuild một service
docker compose build service-name
docker compose up -d service-name

# Rebuild tất cả
docker compose build
docker compose up -d
```

## 📊 Kiểm Tra Logs

### Xem Logs Của Tất Cả Services
```bash
docker compose logs -f
```

### Xem Logs Của Một Service
```bash
docker compose logs -f api-gateway
docker compose logs -f auth-service
```

### Xem Logs Với Giới Hạn
```bash
# 100 dòng cuối
docker compose logs --tail=100 api-gateway

# Logs từ 10 phút trước
docker compose logs --since 10m api-gateway
```

## ⚡ Quick Commands

```bash
# 1. Chạy tất cả services
cd deploy && docker compose up -d

# 2. Kiểm tra trạng thái
docker compose ps

# 3. Xem logs
docker compose logs -f

# 4. Kiểm tra health
curl http://localhost:3000/health
```

## 🐛 Troubleshooting

### Service Không Khởi Động

```bash
# Xem logs để biết lỗi
docker compose logs service-name

# Rebuild service
docker compose build service-name
docker compose up -d service-name
```

### Port Đã Được Sử Dụng

```bash
# Kiểm tra port
lsof -i :3000

# Thay đổi port trong docker-compose.yml
# Hoặc dừng service đang dùng port
```

### Image Không Tìm Thấy

```bash
# Pull lại image
docker compose pull

# Hoặc build lại
docker compose build
```

## 📝 Lưu Ý

1. **Lần đầu chạy**: Có thể mất 5-10 phút để build tất cả services
2. **Dependencies**: Services sẽ tự động chờ dependencies sẵn sàng
3. **Health Checks**: Một số services có health checks, cần đợi vài giây
4. **Memory**: Đảm bảo có đủ RAM (khuyến nghị 8GB+)

## ✅ Checklist

Sau khi chạy `docker compose up -d`:

- [ ] Tất cả images đã được pull
- [ ] Tất cả services đã được build
- [ ] Tất cả containers đang chạy (Status: Up)
- [ ] Không có lỗi trong logs
- [ ] Health endpoints trả về OK

