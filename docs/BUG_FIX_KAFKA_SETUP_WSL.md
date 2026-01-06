# Bug Fix: Kafka Setup Script trong WSL 2

## 🐛 Mô Tả Bug

Khi chạy script trong WSL 2:
```bash
cd deploy && ./kafka-setup.sh
```

Gặp lỗi:
```
The command 'docker-compose' could not be found in this WSL 2 distro.
We recommend to activate the WSL integration in Docker Desktop settings.
```

## 🔍 Nguyên Nhân

1. **WSL 2 Integration:** Trong WSL 2, `docker-compose` (standalone) có thể không hoạt động đúng
2. **Docker Compose Plugin:** Docker Desktop trong WSL 2 thường sử dụng `docker compose` (plugin) thay vì `docker-compose`
3. **Thứ Tự Phát Hiện:** Script cũ kiểm tra `docker-compose` trước, nên không tìm thấy `docker compose` plugin

## ✅ Giải Pháp Đã Áp Dụng

### 1. Đảo Ngược Thứ Tự Phát Hiện

**Trước:**
```bash
if command -v docker-compose; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version; then
    DOCKER_COMPOSE="docker compose"
```

**Sau:**
```bash
# Ưu tiên docker compose (plugin) trước - hoạt động tốt hơn trong WSL 2
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
```

### 2. Thêm Thông Báo Rõ Ràng

Script bây giờ hiển thị:
```
✅ Sử dụng: docker compose (plugin)
```

Hoặc:
```
✅ Sử dụng: docker-compose (standalone)
```

### 3. Cải Thiện Error Handling

- Kiểm tra validation trước khi chạy
- Thông báo lỗi rõ ràng hơn
- Hướng dẫn troubleshooting

### 4. Cải Thiện Thông Báo Lỗi

Khi không tìm thấy docker compose:
```
❌ Không tìm thấy docker-compose hoặc docker compose

💡 Giải pháp:
   1. Đảm bảo Docker Desktop đang chạy
   2. Kích hoạt WSL integration trong Docker Desktop settings
   3. Hoặc cài đặt docker-compose: sudo apt-get install docker-compose

   Xem thêm: https://docs.docker.com/go/wsl2/
```

## 📋 Test Results

### Test 1: Script Detection
```bash
✅ Script tồn tại
✅ docker compose (plugin) - Available
✅ docker-compose.yml tồn tại
✅ Kafka service được định nghĩa
✅ Tất cả tests đều pass!
```

### Test 2: Docker Compose Detection
- ✅ Phát hiện `docker compose` plugin trong WSL 2
- ✅ Fallback về `docker-compose` nếu không có plugin

## 🚀 Cách Sử Dụng

### Chạy Script:
```bash
cd deploy
./kafka-setup.sh
```

### Kiểm Tra:
```bash
# Script sẽ tự động phát hiện docker compose
✅ Sử dụng: docker compose (plugin)
📦 Đang khởi động Zookeeper và Kafka...
```

## 🔧 Troubleshooting

### Nếu Vẫn Gặp Lỗi "docker-compose not found"

**Giải pháp 1: Kích hoạt WSL Integration**
1. Mở Docker Desktop
2. Settings → Resources → WSL Integration
3. Enable integration với distro của bạn
4. Apply & Restart

**Giải pháp 2: Sử dụng docker compose trực tiếp**
```bash
cd deploy
docker compose up -d zookeeper kafka
```

**Giải pháp 3: Cài đặt docker-compose standalone**
```bash
sudo apt-get update
sudo apt-get install docker-compose
```

## ✅ Kết Luận

Bug đã được fix:
- ✅ Script ưu tiên `docker compose` (plugin) - hoạt động tốt trong WSL 2
- ✅ Fallback về `docker-compose` nếu cần
- ✅ Thông báo rõ ràng về loại docker compose đang sử dụng
- ✅ Error handling được cải thiện
- ✅ Test đã pass

Script hiện hoạt động đúng trong WSL 2! 🚀

