# Hướng Dẫn Bắt Đầu - Chạy Services

## ✅ Bước 1: Cài Đặt Dependencies (Đã Hoàn Thành)

Dependencies đã được cài đặt thành công:
```
✅ Đã cài đặt dependencies thành công!
📦 966 packages đã được cài đặt
```

---

## 🔧 Bước 2: Cấu Hình Môi Trường (.env)

Mỗi service cần file `.env` để cấu hình. Kiểm tra và tạo file `.env` cho từng service.

### Kiểm tra service có cần .env không:

```bash
# Xem các biến môi trường được sử dụng trong code
cd services/analytics-service
grep -r "process.env" src/ | head -10
```

### Tạo file .env mẫu:

**Ví dụ cho `analytics-service/.env`:**
```env
# Server Configuration
PORT=3013
NODE_ENV=development

# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/analytics_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=analytics-service
KAFKA_GROUP_ID=analytics-group

# JWT (nếu cần)
JWT_SECRET=your-secret-key-here
```

**Tạo .env cho tất cả services:**
```bash
# Tạo .env cho analytics-service
cat > services/analytics-service/.env << 'EOF'
PORT=3013
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/analytics_db
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
EOF
```

---

## 🗄️ Bước 3: Kiểm Tra Dependencies Bên Ngoài

Các services cần các services bên ngoài sau:

### 3.1. MongoDB (cho một số services)
```bash
# Kiểm tra MongoDB đang chạy
mongosh --eval "db.version()" 2>/dev/null || echo "MongoDB chưa chạy"

# Hoặc
docker ps | grep mongo || echo "MongoDB container chưa chạy"
```

**Nếu chưa có MongoDB:**
```bash
# Chạy MongoDB bằng Docker
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Hoặc cài đặt local
# Ubuntu/Debian:
sudo apt-get install mongodb
```

### 3.2. PostgreSQL (cho một số services)
```bash
# Kiểm tra PostgreSQL đang chạy
psql --version 2>/dev/null || echo "PostgreSQL chưa cài đặt"

# Kiểm tra service đang chạy
sudo systemctl status postgresql 2>/dev/null || echo "PostgreSQL service chưa chạy"
```

**Nếu chưa có PostgreSQL:**
```bash
# Chạy PostgreSQL bằng Docker
docker run -d --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ecommerce \
  -p 5432:5432 \
  postgres:latest
```

### 3.3. Redis
```bash
# Kiểm tra Redis đang chạy
redis-cli ping 2>/dev/null || echo "Redis chưa chạy"

# Hoặc
docker ps | grep redis || echo "Redis container chưa chạy"
```

**Nếu chưa có Redis:**
```bash
# Chạy Redis bằng Docker
docker run -d --name redis -p 6379:6379 redis:latest
```

### 3.4. Kafka
```bash
# Kiểm tra Kafka đang chạy
# Thường chạy trên port 9092
nc -zv localhost 9092 2>/dev/null || echo "Kafka chưa chạy"
```

**Nếu chưa có Kafka:**
```bash
# Chạy Kafka bằng Docker Compose (nếu có file docker-compose.yml)
cd deploy
docker-compose up -d kafka

# Hoặc chạy thủ công
# Xem deploy/kafka-setup.sh hoặc deploy/kafka-cluster-setup.sh
```

---

## 🏗️ Bước 4: Build Services (Tùy Chọn)

### Option A: Chạy Development Mode (Không Cần Build)
Development mode tự động compile TypeScript, không cần build trước:
```bash
./scripts/start-service.sh analytics-service dev
```

### Option B: Build Trước Khi Chạy Production
Nếu muốn chạy production mode:
```bash
# Build tất cả services
./scripts/build-all.sh

# Hoặc build từng service
cd services/analytics-service
npm run build
```

---

## 🚀 Bước 5: Chạy Services

### Cách 1: Chạy Một Service (Khuyến Nghị)

**Development Mode (Hot Reload):**
```bash
# Chạy analytics-service
./scripts/start-service.sh analytics-service dev

# Hoặc thủ công
cd services/analytics-service
npm run start:dev
```

**Production Mode:**
```bash
# Build và chạy
./scripts/start-service.sh analytics-service prod
```

### Cách 2: Chạy Nhiều Services Cùng Lúc

Mở nhiều terminal windows:

**Terminal 1:**
```bash
./scripts/start-service.sh api-gateway dev
```

**Terminal 2:**
```bash
./scripts/start-service.sh auth-service dev
```

**Terminal 3:**
```bash
./scripts/start-service.sh product-service dev
```

**Terminal 4:**
```bash
./scripts/start-service.sh analytics-service dev
```

### Cách 3: Sử Dụng Docker Compose (Nếu Có)

```bash
cd deploy
docker-compose up
```

---

## ✅ Bước 6: Kiểm Tra Services Đang Chạy

### Kiểm tra port đang được sử dụng:
```bash
# Kiểm tra port 3013 (analytics-service)
lsof -i :3013 || netstat -tulpn | grep 3013

# Hoặc
ss -tulpn | grep 3013
```

### Kiểm tra health endpoint (nếu có):
```bash
# Test API
curl http://localhost:3013/health

# Hoặc
curl http://localhost:3013/
```

### Kiểm tra logs:
```bash
# Xem logs trong console của terminal đang chạy service
# Hoặc kiểm tra thư mục logs/
ls -la logs/
```

---

## 📋 Thứ Tự Khuyến Nghị Khi Chạy Services

### 1. Infrastructure Services (Chạy Trước)
```bash
# 1. Database
docker run -d --name mongodb -p 27017:27017 mongo:latest
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:latest
docker run -d --name redis -p 6379:6379 redis:latest

# 2. Kafka (nếu có)
cd deploy && docker-compose up -d kafka
```

### 2. Core Services (Chạy Tiếp Theo)
```bash
# Terminal 1
./scripts/start-service.sh auth-service dev

# Terminal 2
./scripts/start-service.sh product-service dev

# Terminal 3
./scripts/start-service.sh cart-service dev
```

### 3. Business Services
```bash
# Terminal 4
./scripts/start-service.sh order-service dev

# Terminal 5
./scripts/start-service.sh payment-service dev

# Terminal 6
./scripts/start-service.sh analytics-service dev
```

### 4. API Gateway (Chạy Cuối Cùng)
```bash
# Terminal 7
./scripts/start-service.sh api-gateway dev
```

---

## 🐛 Troubleshooting

### Service không khởi động được:

1. **Kiểm tra port đã được sử dụng:**
```bash
lsof -i :<PORT>
# Nếu port đã được sử dụng, đổi PORT trong .env
```

2. **Kiểm tra database connection:**
```bash
# MongoDB
mongosh mongodb://localhost:27017

# PostgreSQL
psql -h localhost -U postgres -d ecommerce

# Redis
redis-cli ping
```

3. **Kiểm tra .env file:**
```bash
cd services/<service-name>
cat .env
# Đảm bảo tất cả biến môi trường cần thiết đã được set
```

4. **Kiểm tra dependencies:**
```bash
cd services/<service-name>
npm list --depth=0
# Đảm bảo tất cả packages đã được cài đặt
```

5. **Xem logs chi tiết:**
```bash
# Chạy service và xem output trong console
# Hoặc kiểm tra logs/
tail -f logs/<service-name>.log
```

### Build lỗi:

```bash
# Xóa dist và build lại
cd services/<service-name>
rm -rf dist
npm run build
```

### Port conflicts:

```bash
# Tìm process đang dùng port
lsof -i :<PORT>
# Kill process nếu cần
kill -9 <PID>
```

---

## 📚 Tài Liệu Tham Khảo

- `docs/SERVICE_COMMANDS.md` - Chi tiết các lệnh chạy services
- `docs/BUG_FIX_SUMMARY.md` - Tổng hợp các bugs đã fix
- `scripts/README.md` - Hướng dẫn sử dụng scripts

---

## 🎯 Quick Start Checklist

- [ ] ✅ Dependencies đã được cài đặt
- [ ] ⬜ Tạo file .env cho services cần thiết
- [ ] ⬜ Kiểm tra MongoDB/PostgreSQL đang chạy
- [ ] ⬜ Kiểm tra Redis đang chạy
- [ ] ⬜ Kiểm tra Kafka đang chạy (nếu cần)
- [ ] ⬜ Chạy service đầu tiên để test
- [ ] ⬜ Kiểm tra service đang chạy (health check)
- [ ] ⬜ Chạy các services khác theo thứ tự

---

## 💡 Tips

1. **Development Mode:** Luôn dùng `dev` mode khi phát triển (hot reload)
2. **Production Mode:** Chỉ dùng `prod` mode khi deploy
3. **Logs:** Giữ terminal windows mở để xem logs real-time
4. **Ports:** Ghi nhớ port của từng service để test API
5. **Health Checks:** Tạo endpoint `/health` để kiểm tra service status

---

Chúc bạn thành công! 🚀

