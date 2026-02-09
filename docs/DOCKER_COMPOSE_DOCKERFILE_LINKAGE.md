# Mối Liên Kết Giữa Docker Compose và Dockerfile

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Cấu Trúc Thư Mục](#2-cấu-trúc-thư-mục)
3. [Build Configuration trong docker-compose.yml](#3-build-configuration-trong-docker-composeyml)
4. [Dockerfile Pattern](#4-dockerfile-pattern)
5. [Build Context và Path Resolution](#5-build-context-và-path-resolution)
6. [Quá Trình Build](#6-quá-trình-build)
7. [Ví Dụ Cụ Thể](#7-ví-dụ-cụ-thể)
8. [Best Practices](#8-best-practices)

---

## 1. Tổng Quan

Hệ thống sử dụng **Docker Compose** để quản lý build và chạy **19 microservices**. Mỗi service có:
- **Dockerfile** riêng trong thư mục service
- **Build configuration** trong `docker-compose.yml`
- **Build context** trỏ đến thư mục service

### Mối Quan Hệ

```
docker-compose.yml (deploy/)
    ↓
    build:
      context: ../services/<service-name>  ← Trỏ đến thư mục service
      dockerfile: Dockerfile                ← Tên file Dockerfile
    ↓
services/<service-name>/Dockerfile         ← File Dockerfile thực tế
    ↓
services/<service-name>/                   ← Build context (source code)
    ├── package.json
    ├── tsconfig.json
    └── src/
```

---

## 2. Cấu Trúc Thư Mục

### 2.1. Cấu Trúc Tổng Thể

```
microservice_base/
├── deploy/
│   └── docker-compose.yml          ← File compose chính
│
└── services/
    ├── api-gateway/
    │   ├── Dockerfile              ← Dockerfile của service
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │
    ├── auth-service/
    │   ├── Dockerfile
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │
    ├── product-service/
    │   ├── Dockerfile
    │   └── ...
    │
    └── ... (16 services khác)
```

### 2.2. Relative Path

**Từ `deploy/docker-compose.yml`**:
- `../services/` = `microservice_base/services/`
- Mỗi service có thư mục riêng: `services/<service-name>/`

---

## 3. Build Configuration trong docker-compose.yml

### 3.1. Cú Pháp Build

**Pattern chung cho tất cả microservices**:

```yaml
<service-name>:
  build:
    context: ../services/<service-name>    # Build context path
    dockerfile: Dockerfile                 # Dockerfile name
  environment:
    PORT: <port>
    # ... other env vars
  ports:
    - "<port>:<port>"
  depends_on:
    - <dependency>
```

### 3.2. Ví Dụ Cụ Thể

#### Ví dụ 1: auth-service

**Trong docker-compose.yml**:
```yaml
auth-service:
  build:
    context: ../services/auth-service      # ← Trỏ đến services/auth-service/
    dockerfile: Dockerfile                 # ← Tìm file Dockerfile trong context
  environment:
    PORT: 3001
    AUTH_DB_HOST: postgres-auth
    # ...
  ports:
    - "3001:3001"
  depends_on:
    postgres-auth:
      condition: service_healthy
    kafka:
      condition: service_started
```

**File Dockerfile**: `services/auth-service/Dockerfile`

#### Ví dụ 2: api-gateway

**Trong docker-compose.yml**:
```yaml
api-gateway:
  build:
    context: ../services/api-gateway        # ← Trỏ đến services/api-gateway/
    dockerfile: Dockerfile                 # ← Tìm file Dockerfile trong context
  environment:
    PORT: 3000
    AUTH_SERVICE_URL: http://auth-service:3001
    # ... 16 service URLs khác
  ports:
    - "3000:3000"
  depends_on:
    - auth-service
    - product-service
    - dispute-service
    - dlq-service
```

**File Dockerfile**: `services/api-gateway/Dockerfile`

### 3.3. Tất Cả Services với Build Config

| Service | Context Path | Dockerfile | Port |
|---------|--------------|------------|------|
| `api-gateway` | `../services/api-gateway` | `Dockerfile` | 3000 |
| `auth-service` | `../services/auth-service` | `Dockerfile` | 3001 |
| `product-service` | `../services/product-service` | `Dockerfile` | 3002 |
| `order-service` | `../services/order-service` | `Dockerfile` | 3003 |
| `payment-service` | `../services/payment-service` | `Dockerfile` | 3004 |
| `notification-service` | `../services/notification-service` | `Dockerfile` | 3005 |
| `cart-service` | `../services/cart-service` | `Dockerfile` | 3006 |
| `review-service` | `../services/review-service` | `Dockerfile` | 3007 |
| `seller-service` | `../services/seller-service` | `Dockerfile` | 3008 |
| `promotion-service` | `../services/promotion-service` | `Dockerfile` | 3009 |
| `shipping-service` | `../services/shipping-service` | `Dockerfile` | 3010 |
| `chat-service` | `../services/chat-service` | `Dockerfile` | 3011 |
| `search-service` | `../services/search-service` | `Dockerfile` | 3012 |
| `dlq-service` | `../services/dlq-service` | `Dockerfile` | 3013 |
| `analytics-service` | `../services/analytics-service` | `Dockerfile` | 3014 |
| `loyalty-service` | `../services/loyalty-service` | `Dockerfile` | 3015 |
| `dispute-service` | `../services/dispute-service` | `Dockerfile` | 3016 |
| `settlement-service` | `../services/settlement-service` | `Dockerfile` | 3017 |
| `warehouse-service` | `../services/warehouse-service` | `Dockerfile` | 3018 |

---

## 4. Dockerfile Pattern

### 4.1. Standard Dockerfile (Tất Cả Services)

Tất cả 19 services sử dụng **cùng một pattern**:

```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy dependency files first (for better caching)
COPY package.json tsconfig.json ./

# Copy source code
COPY src ./src

# Install dependencies and build
RUN npm install && npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port (khác nhau cho mỗi service)
EXPOSE <PORT>

# Start application
CMD ["node", "dist/main.js"]
```

### 4.2. Sự Khác Biệt Giữa Các Services

**Chỉ khác nhau ở PORT**:

| Service | EXPOSE Port |
|---------|-------------|
| `api-gateway` | `EXPOSE 3000` |
| `auth-service` | `EXPOSE 3001` |
| `product-service` | `EXPOSE 3002` |
| `order-service` | `EXPOSE 3003` |
| `payment-service` | `EXPOSE 3004` |
| ... | ... |

**Tất cả khác đều giống nhau**:
- ✅ Base image: `node:20-alpine`
- ✅ Workdir: `/usr/src/app`
- ✅ Build process: `npm install && npm run build`
- ✅ Production cleanup: `npm prune --production`
- ✅ Start command: `node dist/main.js`

### 4.3. Ví Dụ Dockerfile Cụ Thể

#### api-gateway/Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json tsconfig.json ./
COPY src ./src

RUN npm install && npm run build
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

#### auth-service/Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json tsconfig.json ./
COPY src ./src

RUN npm install && npm run build
RUN npm prune --production

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

#### order-service/Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json tsconfig.json ./
COPY src ./src

RUN npm install && npm run build
RUN npm prune --production

EXPOSE 3003

CMD ["node", "dist/main.js"]
```

---

## 5. Build Context và Path Resolution

### 5.1. Build Context

**Build context** là thư mục được Docker sử dụng làm root cho các lệnh `COPY` và `ADD` trong Dockerfile.

**Trong docker-compose.yml**:
```yaml
build:
  context: ../services/auth-service
```

**Nghĩa là**:
- Build context = `microservice_base/services/auth-service/`
- Tất cả paths trong Dockerfile là **relative** từ context này

### 5.2. Path Resolution trong Dockerfile

**Trong Dockerfile**:
```dockerfile
COPY package.json tsconfig.json ./     # ← Copy từ context root
COPY src ./src                         # ← Copy từ context/src/
```

**Thực tế**:
- `COPY package.json` = Copy từ `services/auth-service/package.json`
- `COPY src ./src` = Copy từ `services/auth-service/src/` → `/usr/src/app/src/`

### 5.3. Relative Path từ docker-compose.yml

**File location**: `deploy/docker-compose.yml`

**Context path**: `../services/auth-service`

**Resolution**:
```
deploy/docker-compose.yml
  ↓ (go up one level)
microservice_base/
  ↓ (go into services/)
microservice_base/services/
  ↓ (go into auth-service/)
microservice_base/services/auth-service/  ← Build context
```

### 5.4. Dockerfile Path

**Trong docker-compose.yml**:
```yaml
build:
  context: ../services/auth-service
  dockerfile: Dockerfile
```

**Docker sẽ tìm**:
- `services/auth-service/Dockerfile` (relative từ context)

**Nếu Dockerfile ở vị trí khác**:
```yaml
build:
  context: ../services/auth-service
  dockerfile: Dockerfile.prod  # Custom Dockerfile name
```

---

## 6. Quá Trình Build

### 6.1. Build Command

**Build một service**:
```bash
cd deploy/
docker compose build auth-service
```

**Build tất cả services**:
```bash
cd deploy/
docker compose build
```

### 6.2. Build Process Chi Tiết

**Khi chạy `docker compose build auth-service`**:

1. **Docker Compose đọc** `deploy/docker-compose.yml`
2. **Tìm service** `auth-service`
3. **Resolve build context**: `../services/auth-service` → `microservice_base/services/auth-service/`
4. **Tìm Dockerfile**: `services/auth-service/Dockerfile`
5. **Send build context** đến Docker daemon
6. **Docker build** theo các bước trong Dockerfile:
   ```
   Step 1: FROM node:20-alpine
   Step 2: WORKDIR /usr/src/app
   Step 3: COPY package.json tsconfig.json ./
   Step 4: COPY src ./src
   Step 5: RUN npm install && npm run build
   Step 6: RUN npm prune --production
   Step 7: EXPOSE 3001
   Step 8: CMD ["node", "dist/main.js"]
   ```
7. **Tag image**: `microservice_base-auth-service:latest`

### 6.3. Build Context Contents

**Build context** bao gồm tất cả files trong `services/auth-service/`:

```
services/auth-service/          ← Build context root
├── Dockerfile                 ← Được reference bởi dockerfile: Dockerfile
├── package.json               ← Được COPY trong Dockerfile
├── tsconfig.json              ← Được COPY trong Dockerfile
├── src/                       ← Được COPY trong Dockerfile
│   ├── main.ts
│   ├── modules/
│   └── ...
├── dist/                      ← Được tạo bởi npm run build
├── node_modules/              ← Được tạo bởi npm install
└── .env                       ← Không được COPY (không có trong Dockerfile)
```

**Lưu ý**: Chỉ files được `COPY` trong Dockerfile mới được gửi đến Docker daemon (trừ khi dùng `.dockerignore`)

### 6.4. Build Cache

**Layer caching** dựa trên:
1. **Base image**: `node:20-alpine` (cache nếu đã pull)
2. **COPY package.json**: Cache nếu package.json không đổi
3. **RUN npm install**: Cache nếu package.json không đổi
4. **COPY src**: Cache nếu src không đổi
5. **RUN npm run build**: Cache nếu dependencies và src không đổi

**Optimization**: Copy `package.json` trước `src/` để tận dụng cache khi chỉ source code thay đổi.

---

## 7. Ví Dụ Cụ Thể

### 7.1. Ví Dụ 1: Build auth-service

**Command**:
```bash
cd deploy/
docker compose build auth-service
```

**Process**:
1. Docker Compose đọc `deploy/docker-compose.yml`
2. Tìm `auth-service` section:
   ```yaml
   auth-service:
     build:
       context: ../services/auth-service
       dockerfile: Dockerfile
   ```
3. Resolve paths:
   - Context: `deploy/../services/auth-service` = `services/auth-service/`
   - Dockerfile: `services/auth-service/Dockerfile`
4. Build với context `services/auth-service/`
5. Dockerfile thực thi:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /usr/src/app
   COPY package.json tsconfig.json ./     # Copy từ services/auth-service/
   COPY src ./src                          # Copy từ services/auth-service/src/
   RUN npm install && npm run build        # Build trong container
   RUN npm prune --production              # Remove dev deps
   EXPOSE 3001
   CMD ["node", "dist/main.js"]
   ```
6. Image được tạo: `microservice_base-auth-service:latest`

### 7.2. Ví Dụ 2: Build và Run api-gateway

**Command**:
```bash
cd deploy/
docker compose up --build api-gateway
```

**Process**:
1. **Build phase** (giống như trên):
   - Context: `services/api-gateway/`
   - Dockerfile: `services/api-gateway/Dockerfile`
   - Build image: `microservice_base-api-gateway:latest`

2. **Run phase**:
   - Create container từ image
   - Set environment variables từ `docker-compose.yml`
   - Map port `3000:3000`
   - Wait for dependencies (`auth-service`, `product-service`, etc.)

### 7.3. Ví Dụ 3: Custom Dockerfile Path

**Nếu muốn dùng Dockerfile khác** (ví dụ: `Dockerfile.prod`):

**Trong docker-compose.yml**:
```yaml
auth-service:
  build:
    context: ../services/auth-service
    dockerfile: Dockerfile.prod  # ← Custom Dockerfile
```

**File structure**:
```
services/auth-service/
├── Dockerfile          # Development
├── Dockerfile.prod     # Production
└── ...
```

---

## 8. Best Practices

### 8.1. Build Context Optimization

**✅ Good**: Copy dependency files trước source code
```dockerfile
COPY package.json tsconfig.json ./  # Layer 1: Dependencies
COPY src ./src                      # Layer 2: Source code
```

**❌ Bad**: Copy tất cả cùng lúc
```dockerfile
COPY . .  # Không tận dụng cache tốt
```

### 8.2. .dockerignore

**Tạo `.dockerignore`** trong mỗi service để exclude files không cần:

```dockerignore
# services/auth-service/.dockerignore
node_modules
dist
.env
*.log
.git
.gitignore
README.md
```

**Lợi ích**:
- Giảm build context size
- Tăng build speed
- Bảo mật (không copy sensitive files)

### 8.3. Multi-stage Builds (Đề Xuất)

**Current** (single-stage):
```dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install && npm run build
RUN npm prune --production
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**Improved** (multi-stage):
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install && npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --production
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**Lợi ích**:
- ✅ Smaller final image (không có dev dependencies và source code)
- ✅ Better security (không expose source code)
- ✅ Faster builds (có thể cache builder stage)

### 8.4. Build Arguments

**Có thể thêm build args**:

**Dockerfile**:
```dockerfile
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
```

**docker-compose.yml**:
```yaml
build:
  context: ../services/auth-service
  dockerfile: Dockerfile
  args:
    NODE_ENV: production
```

### 8.5. Image Tagging

**Current**: Docker Compose tự động tag: `<project>_<service>:latest`

**Custom tagging**:
```yaml
auth-service:
  build:
    context: ../services/auth-service
    dockerfile: Dockerfile
  image: my-registry/auth-service:v1.0.0  # Custom tag
```

---

## 9. Troubleshooting

### 9.1. Build Context Not Found

**Error**: `unable to prepare context: path "../services/auth-service" not found`

**Nguyên nhân**: 
- Đang chạy từ sai directory
- Path không đúng

**Giải pháp**:
```bash
# Đảm bảo chạy từ deploy/
cd deploy/
docker compose build auth-service
```

### 9.2. Dockerfile Not Found

**Error**: `dockerfile: open Dockerfile: file does not exist`

**Nguyên nhân**:
- Dockerfile không tồn tại trong context
- Tên file sai

**Giải pháp**:
```bash
# Kiểm tra file tồn tại
ls services/auth-service/Dockerfile

# Hoặc chỉ định đúng tên
dockerfile: Dockerfile.prod
```

### 9.3. COPY Failed

**Error**: `COPY failed: file not found in build context`

**Nguyên nhân**:
- File không tồn tại trong build context
- Path sai trong Dockerfile

**Giải pháp**:
- Kiểm tra file tồn tại trong `services/<service>/`
- Đảm bảo path trong Dockerfile đúng relative từ context

---

## 10. Tổng Kết

### 10.1. Mối Liên Kết

```
docker-compose.yml
    ↓
    build:
      context: ../services/<service>     ← Path đến service directory
      dockerfile: Dockerfile             ← Tên Dockerfile
    ↓
services/<service>/Dockerfile            ← File Dockerfile thực tế
    ↓
services/<service>/                      ← Build context (source code)
    ├── package.json
    ├── tsconfig.json
    └── src/
```

### 10.2. Key Points

✅ **Build context**: Relative path từ `deploy/docker-compose.yml` đến `services/<service>/`
✅ **Dockerfile**: Luôn tên `Dockerfile` trong context root
✅ **Pattern**: Tất cả services dùng cùng Dockerfile pattern (chỉ khác PORT)
✅ **Build process**: Docker Compose tự động resolve paths và build
✅ **Image naming**: `<project>_<service>:latest`

### 10.3. Workflow

1. **Developer** thay đổi code trong `services/<service>/src/`
2. **Docker Compose** build với context `services/<service>/`
3. **Dockerfile** copy files và build application
4. **Image** được tạo và tag
5. **Container** chạy từ image với env vars từ docker-compose.yml

---

**Tài liệu được tạo**: 2024
**Phiên bản**: 1.0
**Tác giả**: System Analysis




