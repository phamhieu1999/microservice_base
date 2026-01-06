# Tổng Quan và Chi Tiết Các Lệnh Chạy Từng Service

## ⚡ Quick Reference (Tham Khảo Nhanh)

| Lệnh | Mô Tả |
|------|-------|
| `./scripts/start-service.sh <service> [dev\|prod]` | Chạy một service cụ thể |
| `./scripts/list-services.sh` | Liệt kê tất cả services |
| `./scripts/build-all.sh` | Build tất cả services |
| `cd services/<service> && npm run start:dev` | Chạy service ở dev mode |
| `cd services/<service> && npm run build && npm run start` | Build và chạy production |
| `cd services/<service> && npm run test` | Chạy tests |
| `cd services/<service> && npm run lint` | Kiểm tra code style |
| `./scripts/install-dependencies.sh` | Cài đặt dependencies (lần đầu) |

---

## 📋 Tổng Quan

Dự án này sử dụng **NestJS** framework và được tổ chức theo mô hình **monorepo** với workspace. Tất cả các services đều có cấu trúc scripts tương tự nhau.

### Cấu Trúc Dự Án

```
microservice_base/
├── services/          # Tất cả các microservices
├── scripts/           # Scripts tiện ích
├── docs/              # Tài liệu
└── package.json       # Root package.json với workspaces
```

## 🚀 Danh Sách Các Services

Dự án bao gồm **19 services**:

1. **api-gateway** - API Gateway (entry point)
2. **auth-service** - Xác thực và phân quyền
3. **product-service** - Quản lý sản phẩm
4. **cart-service** - Quản lý giỏ hàng
5. **order-service** - Quản lý đơn hàng
6. **payment-service** - Xử lý thanh toán
7. **shipping-service** - Quản lý vận chuyển
8. **warehouse-service** - Quản lý kho
9. **seller-service** - Quản lý người bán
10. **review-service** - Quản lý đánh giá
11. **promotion-service** - Quản lý khuyến mãi
12. **loyalty-service** - Quản lý điểm thưởng
13. **notification-service** - Thông báo
14. **analytics-service** - Phân tích dữ liệu
15. **search-service** - Tìm kiếm
16. **chat-service** - Chat
17. **dispute-service** - Xử lý tranh chấp
18. **settlement-service** - Thanh toán bù trừ
19. **dlq-service** - Dead Letter Queue

---

## 🛠️ Scripts Helper (Tiện Ích)

Dự án có sẵn các scripts helper trong thư mục `scripts/` để quản lý services dễ dàng hơn:

### 1. Chạy Một Service Cụ Thể
```bash
./scripts/start-service.sh <service-name> [dev|prod]
```

**Ví dụ:**
```bash
# Chạy auth-service ở chế độ development
./scripts/start-service.sh auth-service dev

# Chạy product-service ở chế độ production
./scripts/start-service.sh product-service prod

# Mặc định là dev mode
./scripts/start-service.sh api-gateway
```

**Tính năng:**
- Tự động kiểm tra service name hợp lệ
- Tự động cài đặt dependencies nếu chưa có
- Tự động build trước khi chạy production mode
- Hiển thị thông tin chi tiết về service đang chạy

### 2. Liệt Kê Tất Cả Services
```bash
./scripts/list-services.sh
```

**Tính năng:**
- Hiển thị danh sách tất cả services
- Hiển thị port từ file .env (nếu có)
- Hiển thị trạng thái build
- Đếm tổng số services

### 3. Build Tất Cả Services
```bash
./scripts/build-all.sh
```

**Tính năng:**
- Build tất cả services một lúc
- Tự động cài đặt dependencies từ root (cho npm workspaces) nếu chưa có
- Hiển thị kết quả build cho từng service
- Báo cáo tổng kết: thành công/thất bại

**Lưu ý:** Với npm workspaces, script sẽ tự động cài đặt dependencies từ root trước khi build.

### 4. Cài Đặt Dependencies
```bash
./scripts/install-dependencies.sh
```

**Tính năng:**
- Tự động phát hiện npm workspaces
- Cài đặt dependencies từ root (workspaces) hoặc từng service (non-workspaces)
- Báo cáo kết quả chi tiết

**Lưu ý:** Nên chạy script này trước khi build hoặc chạy services lần đầu.

**Ví dụ output:**
```
🏗️  Đang build tất cả các services...
======================================

📦 Đang build: api-gateway
   ✅ Build thành công: api-gateway

📦 Đang build: auth-service
   ✅ Build thành công: auth-service

...

======================================
📊 Kết quả:
   ✅ Thành công: 19/19
   ❌ Thất bại: 0

✅ Tất cả services đã được build thành công!
```

---

## 📝 Các Lệnh Chung Cho Tất Cả Services

Tất cả các services đều có các lệnh sau (trừ một số lệnh đặc biệt):

### 1. Build Service
```bash
cd services/<service-name>
npm run build
```
**Mô tả**: Biên dịch TypeScript sang JavaScript vào thư mục `dist/`

### 2. Chạy Production
```bash
cd services/<service-name>
npm run start
```
**Mô tả**: Chạy service ở chế độ production (sử dụng file đã build trong `dist/`)

**Lưu ý**: Phải build trước khi chạy production:
```bash
npm run build && npm run start
```

### 3. Chạy Development Mode
```bash
cd services/<service-name>
npm run start:dev
```
**Mô tả**: Chạy service ở chế độ development với hot-reload (tự động restart khi có thay đổi code)

### 4. Chạy Tests
```bash
cd services/<service-name>
npm run test
```
**Mô tả**: Chạy unit tests và integration tests

### 5. Lint Code
```bash
cd services/<service-name>
npm run lint
```
**Mô tả**: Kiểm tra code style và tìm lỗi syntax

---

## 🔧 Các Lệnh Đặc Biệt

### Services Có Database Migrations (TypeORM)

Các services sau sử dụng **TypeORM** và có thêm các lệnh migration:
- `auth-service`
- `order-service`
- `payment-service`
- (và các services khác sử dụng PostgreSQL với TypeORM)

#### Migration Commands:

```bash
cd services/<service-name>

# Tạo migration mới
npm run migration:generate -- -n MigrationName

# Chạy migrations
npm run migration:run

# Revert migration cuối cùng
npm run migration:revert
```

**Ví dụ với auth-service:**
```bash
cd services/auth-service
npm run migration:generate -- -n AddUserTable
npm run migration:run
npm run migration:revert
```

---

## 📖 Chi Tiết Từng Service

### 1. API Gateway
**Port mặc định**: Thường là `3000` hoặc `8080` (kiểm tra trong `.env`)

```bash
cd services/api-gateway

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**: 
- Entry point cho tất cả requests
- Routing đến các services
- Authentication/Authorization
- Rate limiting
- Caching

---

### 2. Auth Service
**Port mặc định**: Thường là `3001` (kiểm tra trong `.env`)

```bash
cd services/auth-service

# Development
npm run start:dev

# Production
npm run build
npm run start

# Migrations
npm run migration:run
```

**Chức năng**:
- Đăng ký/Đăng nhập
- JWT tokens
- OAuth (Google, Facebook)
- 2FA (Two-Factor Authentication)
- Password reset

**Database**: PostgreSQL (TypeORM)

---

### 3. Product Service
**Port mặc định**: Thường là `3002` (kiểm tra trong `.env`)

```bash
cd services/product-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- CRUD sản phẩm
- Quản lý danh mục
- Quản lý inventory
- Tìm kiếm sản phẩm

**Database**: MongoDB (Mongoose)

---

### 4. Cart Service
**Port mặc định**: Thường là `3003` (kiểm tra trong `.env`)

```bash
cd services/cart-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Thêm/Xóa sản phẩm vào giỏ hàng
- Cập nhật số lượng
- Lưu trữ giỏ hàng

**Database**: MongoDB (Mongoose) hoặc Redis

---

### 5. Order Service
**Port mặc định**: Thường là `3004` (kiểm tra trong `.env`)

```bash
cd services/order-service

# Development
npm run start:dev

# Production
npm run build
npm run start

# Migrations
npm run migration:run
```

**Chức năng**:
- Tạo đơn hàng
- Quản lý trạng thái đơn hàng
- Order history
- Order tracking

**Database**: PostgreSQL (TypeORM)

---

### 6. Payment Service
**Port mặc định**: Thường là `3005` (kiểm tra trong `.env`)

```bash
cd services/payment-service

# Development
npm run start:dev

# Production
npm run build
npm run start

# Migrations
npm run migration:run
```

**Chức năng**:
- Xử lý thanh toán
- Tích hợp payment gateways
- Refund
- Payment history

**Database**: PostgreSQL (TypeORM)

---

### 7. Shipping Service
**Port mặc định**: Thường là `3006` (kiểm tra trong `.env`)

```bash
cd services/shipping-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Tính toán phí vận chuyển
- Tracking đơn hàng
- Tích hợp shipping providers

---

### 8. Warehouse Service
**Port mặc định**: Thường là `3007` (kiểm tra trong `.env`)

```bash
cd services/warehouse-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Quản lý kho
- Inventory management
- Stock tracking

---

### 9. Seller Service
**Port mặc định**: Thường là `3008` (kiểm tra trong `.env`)

```bash
cd services/seller-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Quản lý thông tin seller
- Seller registration
- Seller dashboard

---

### 10. Review Service
**Port mặc định**: Thường là `3009` (kiểm tra trong `.env`)

```bash
cd services/review-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Quản lý đánh giá sản phẩm
- Rating system
- Review moderation

---

### 11. Promotion Service
**Port mặc định**: Thường là `3010` (kiểm tra trong `.env`)

```bash
cd services/promotion-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Quản lý mã giảm giá
- Khuyến mãi
- Discount rules

---

### 12. Loyalty Service
**Port mặc định**: Thường là `3011` (kiểm tra trong `.env`)

```bash
cd services/loyalty-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Quản lý điểm thưởng
- Loyalty programs
- Points redemption

---

### 13. Notification Service
**Port mặc định**: Thường là `3012` (kiểm tra trong `.env`)

```bash
cd services/notification-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Gửi email notifications
- Push notifications
- SMS notifications
- In-app notifications

---

### 14. Analytics Service
**Port mặc định**: Thường là `3013` (kiểm tra trong `.env`)

```bash
cd services/analytics-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Thu thập và phân tích dữ liệu
- Business intelligence
- Reporting
- Dashboards

**Database**: MongoDB (Mongoose)

---

### 15. Search Service
**Port mặc định**: Thường là `3014` (kiểm tra trong `.env`)

```bash
cd services/search-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Full-text search
- Search indexing
- Search suggestions

---

### 16. Chat Service
**Port mặc định**: Thường là `3015` (kiểm tra trong `.env`)

```bash
cd services/chat-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Real-time messaging
- Chat rooms
- Message history

---

### 17. Dispute Service
**Port mặc định**: Thường là `3016` (kiểm tra trong `.env`)

```bash
cd services/dispute-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Xử lý tranh chấp
- Dispute resolution
- Case management

---

### 18. Settlement Service
**Port mặc định**: Thường là `3017` (kiểm tra trong `.env`)

```bash
cd services/settlement-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Thanh toán bù trừ
- Settlement processing
- Financial reconciliation

---

### 19. DLQ Service (Dead Letter Queue)
**Port mặc định**: Thường là `3018` (kiểm tra trong `.env`)

```bash
cd services/dlq-service

# Development
npm run start:dev

# Production
npm run build
npm run start
```

**Chức năng**:
- Xử lý messages thất bại từ Kafka
- Retry logic
- Error tracking

---

## 🎯 Cách Chạy Tất Cả Services

### Option 1: Chạy Từng Service Thủ Công

Mở nhiều terminal windows và chạy từng service:

```bash
# Terminal 1
cd services/api-gateway && npm run start:dev

# Terminal 2
cd services/auth-service && npm run start:dev

# Terminal 3
cd services/product-service && npm run start:dev

# ... và tiếp tục với các services khác
```

### Option 2: Sử Dụng Script (Nếu có)

Kiểm tra thư mục `scripts/` để xem có script nào để chạy tất cả services không.

### Option 3: Sử Dụng Docker Compose (Nếu có)

Kiểm tra thư mục `deploy/` để xem có file `docker-compose.yml` không:

```bash
cd deploy
docker-compose up
```

---

## ⚙️ Cấu Hình Môi Trường

Mỗi service cần file `.env` trong thư mục của nó. Các biến môi trường thường bao gồm:

- `PORT` - Port để chạy service
- `DATABASE_URL` - Connection string cho database
- `REDIS_URL` - Connection string cho Redis
- `KAFKA_BROKERS` - Kafka brokers
- `JWT_SECRET` - Secret key cho JWT
- `NODE_ENV` - Environment (development/production)

**Ví dụ `.env` file:**
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=your-secret-key
NODE_ENV=development
```

---

## 🔍 Kiểm Tra Service Đang Chạy

### Kiểm tra port đang được sử dụng:
```bash
# Linux/Mac
lsof -i :3000
netstat -tulpn | grep :3000

# Hoặc sử dụng
ss -tulpn | grep :3000
```

### Kiểm tra health endpoint (nếu có):
```bash
curl http://localhost:3000/health
```

---

## 📚 Lưu Ý Quan Trọng

1. **Thứ tự khởi động**: Nên khởi động theo thứ tự:
   - Database services (PostgreSQL, MongoDB, Redis)
   - Kafka
   - Core services (auth, product, etc.)
   - API Gateway (cuối cùng)

2. **Dependencies**: Đảm bảo các dependencies đã được cài đặt:
   ```bash
   # Từ root directory
   npm install
   
   # Hoặc từ từng service
   cd services/<service-name>
   npm install
   ```

3. **Build trước khi chạy production**: Luôn build trước khi chạy production mode:
   ```bash
   npm run build && npm run start
   ```

4. **Logs**: Kiểm tra logs trong thư mục `logs/` hoặc console output để debug

5. **Port conflicts**: Đảm bảo không có port nào bị conflict giữa các services

---

## 🐛 Troubleshooting

### Service không khởi động được:
1. Kiểm tra port có đang được sử dụng không
2. Kiểm tra file `.env` có đúng không
3. Kiểm tra database connection
4. Kiểm tra dependencies đã cài đặt chưa

### Build lỗi:
1. Kiểm tra TypeScript version
2. Kiểm tra các dependencies
3. Xóa `node_modules` và `dist` rồi cài lại:
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

### Migration lỗi:
1. Kiểm tra database connection
2. Kiểm tra file `ormconfig.ts` hoặc `.env`
3. Đảm bảo database đã được tạo

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
- Logs trong thư mục `logs/`
- Console output của service
- Documentation trong thư mục `docs/`

