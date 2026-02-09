# Hướng Dẫn Chạy Service Với Hot Reload Trong Docker

## 📋 Tổng Quan

Khi chạy service trong Docker ở **production mode** (docker-compose.yml mặc định):
- Code được build vào image
- **Phải rebuild container** khi sửa code
- Command: `docker compose build <service>` và `docker compose up -d <service>`

Khi chạy service trong Docker ở **development mode** (docker-compose.dev.yml):
- Source code được mount từ host vào container
- **Tự động hot reload** khi sửa code (không cần restart)
- Sử dụng `npm run start:dev` với watch mode

## 🚀 Cách Sử Dụng

### Option 1: Chạy Service Với Hot Reload Trong Docker

#### Bước 1: Tạo Dockerfile.dev cho service (nếu chưa có)

Tạo file `services/<service-name>/Dockerfile.dev`:

```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm install

# Expose port
EXPOSE <PORT>

# Run in development mode
CMD ["npm", "run", "start:dev"]
```

#### Bước 2: Thêm service vào docker-compose.dev.yml

Thêm service với volume mounts:

```yaml
notification-service:
  build:
    context: ../services/notification-service
    dockerfile: Dockerfile.dev
  environment:
    PORT: 3005
    NODE_ENV: development
    NOTIFICATION_MONGO_URI: mongodb://mongo:27017/notification_db
    KAFKA_BROKERS: kafka:9092
  volumes:
    # Mount source code để hot reload
    - ../services/notification-service/src:/usr/src/app/src:ro
    - ../services/notification-service/package.json:/usr/src/app/package.json:ro
    - ../services/notification-service/tsconfig.json:/usr/src/app/tsconfig.json:ro
    # Mount node_modules để không bị ghi đè
    - notification-service-node-modules:/usr/src/app/node_modules
  ports:
    - "3005:3005"
  depends_on:
    - mongo
    - kafka
  command: npm run start:dev
```

#### Bước 3: Chạy service

```bash
cd deploy
docker compose -f docker-compose.dev.yml up -d notification-service
```

#### Bước 4: Xem logs để kiểm tra hot reload

```bash
docker compose -f docker-compose.dev.yml logs -f notification-service
```

Khi bạn sửa code trong `services/notification-service/src/`, service sẽ tự động reload!

### Option 2: Chạy Service Ở Local (Không Dùng Docker)

Chạy service trực tiếp trên máy local, kết nối đến infrastructure trên Docker:

```bash
# Chạy infrastructure trên Docker
cd deploy
docker compose up -d mongo kafka redis postgres-auth

# Chạy service ở local
cd ..
./scripts/run-service-local.sh notification-service
```

Service sẽ tự động hot reload khi sửa code.

### Option 3: Chạy Song Song Local và Docker

Bạn có thể:
- Chạy một số services trên Docker (production mode)
- Chạy một số services ở local (development mode)
- Tất cả đều kết nối đến cùng infrastructure (DB, Kafka, Redis) trên Docker

**Ví dụ:**
```bash
# Chạy infrastructure và một số services trên Docker
cd deploy
docker compose up -d mongo kafka redis postgres-auth
docker compose up -d auth-service product-service

# Chạy notification-service ở local để develop
cd ..
./scripts/run-service-local.sh notification-service
```

## 🔄 So Sánh Các Cách Chạy

| Cách Chạy | Hot Reload | Cần Rebuild | Phù Hợp |
|-----------|------------|-------------|---------|
| **Docker Production** | ❌ Không | ✅ Có | Production, Testing |
| **Docker Development** | ✅ Có | ❌ Không | Development với Docker |
| **Local Development** | ✅ Có | ❌ Không | Development nhanh |

## 📝 Lưu Ý Quan Trọng

### 1. Volume Mounts

Khi mount source code vào container:
- Sử dụng `:ro` (read-only) cho source code để tránh conflict
- Tạo named volume riêng cho `node_modules` để không bị ghi đè

```yaml
volumes:
  - ../services/notification-service/src:/usr/src/app/src:ro
  - notification-service-node-modules:/usr/src/app/node_modules
```

### 2. Port Conflicts

Đảm bảo port không bị conflict:
- Service trên Docker: port từ docker-compose
- Service ở local: cùng port (kết nối đến localhost)

### 3. Environment Variables

Service ở local cần kết nối đến:
- **MongoDB**: `localhost:27017` (thay vì `mongo:27017`)
- **Kafka**: `localhost:9092` (thay vì `kafka:9092`)
- **PostgreSQL**: `localhost:5433` (thay vì `postgres-auth:5432`)
- **Redis**: `localhost:6380` (thay vì `redis:6379`)

### 4. Hot Reload Performance

- **Docker trên Linux**: Hot reload hoạt động tốt
- **Docker trên Mac/Windows**: Có thể chậm hơn do file system sync
- **Local**: Hot reload nhanh nhất

## 🛠️ Troubleshooting

### Hot Reload Không Hoạt Động

1. **Kiểm tra volume mounts:**
   ```bash
   docker compose -f docker-compose.dev.yml exec notification-service ls -la /usr/src/app/src
   ```

2. **Kiểm tra file permissions:**
   ```bash
   docker compose -f docker-compose.dev.yml exec notification-service ls -la /usr/src/app
   ```

3. **Kiểm tra logs:**
   ```bash
   docker compose -f docker-compose.dev.yml logs -f notification-service
   ```

### Node Modules Bị Mất

Nếu `node_modules` bị ghi đè bởi volume mount:

```bash
# Rebuild với node_modules volume
docker compose -f docker-compose.dev.yml up -d --build notification-service
```

### Port Đã Được Sử Dụng

```bash
# Kiểm tra port
lsof -i :3005

# Hoặc thay đổi port trong docker-compose.dev.yml
ports:
  - "3006:3005"  # Map port khác
```

## 📚 Tài Liệu Liên Quan

- `scripts/run-service-local.sh` - Script chạy service ở local
- `deploy/docker-compose.dev.yml` - Docker Compose cho development
- `services/*/Dockerfile.dev` - Dockerfile cho development mode

## ✅ Best Practices

1. **Development**: Dùng local hoặc docker-compose.dev.yml với hot reload
2. **Testing**: Dùng docker-compose.yml (production mode)
3. **Production**: Dùng docker-compose.yml với build image

