# Phân Tích Chi Tiết Docker Objects trong Hệ Thống

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Docker Images](#2-docker-images)
3. [Docker Containers](#3-docker-containers)
4. [Docker Volumes](#4-docker-volumes)
5. [Docker Networks](#5-docker-networks)
6. [Docker Compose Configuration](#6-docker-compose-configuration)
7. [Health Checks](#7-health-checks)
8. [Dependencies & Startup Order](#8-dependencies--startup-order)
9. [Environment Variables](#9-environment-variables)
10. [Port Mappings](#10-port-mappings)
11. [Build Contexts & Dockerfiles](#11-build-contexts--dockerfiles)
12. [Resource Management](#12-resource-management)

---

## 1. Tổng Quan

Hệ thống sử dụng **Docker Compose** để quản lý **35+ containers** bao gồm:
- **19 Microservices** (NestJS applications)
- **9 PostgreSQL instances** (database per service)
- **1 MongoDB** (shared cho nhiều services)
- **1 Kafka + 1 Zookeeper** (message broker)
- **1 Redis** (caching)
- **1 Elasticsearch** (search engine)
- **1 ClickHouse** (data warehouse)
- **4 Monitoring services** (Prometheus, Grafana, Alertmanager, Jaeger)

---

## 2. Docker Images

### 2.1. Base Images (Public Images)

#### Infrastructure Images

| Image | Version | Size (approx) | Mục đích |
|-------|---------|---------------|----------|
| `confluentinc/cp-zookeeper` | 7.5.0 | ~500MB | Coordination cho Kafka |
| `confluentinc/cp-kafka` | 7.5.0 | ~600MB | Message broker |
| `postgres` | 15 | ~200MB | Relational database (9 instances) |
| `mongo` | 7 | ~700MB | Document database (shared) |
| `redis` | 7-alpine | ~30MB | Cache & session store |
| `docker.elastic.co/elasticsearch/elasticsearch` | 8.11.0 | ~1GB | Full-text search |
| `clickhouse/clickhouse-server` | latest | ~500MB | OLAP database |

#### Monitoring Images

| Image | Version | Size (approx) | Mục đích |
|-------|---------|---------------|----------|
| `prom/prometheus` | latest | ~200MB | Metrics collection |
| `prom/alertmanager` | latest | ~50MB | Alert management |
| `grafana/grafana` | latest | ~200MB | Visualization |
| `jaegertracing/all-in-one` | latest | ~100MB | Distributed tracing |

### 2.2. Custom Images (Built from Dockerfile)

Tất cả **19 microservices** được build từ Dockerfile với pattern chung:

**Base Image**: `node:20-alpine` (~150MB base)

**Build Process**:
```dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install && npm run build
RUN npm prune --production  # Remove dev dependencies
EXPOSE <PORT>
CMD ["node", "dist/main.js"]
```

**Services được build**:
- `api-gateway` (Port 3000)
- `auth-service` (Port 3001)
- `product-service` (Port 3002)
- `order-service` (Port 3003)
- `payment-service` (Port 3004)
- `notification-service` (Port 3005)
- `cart-service` (Port 3006)
- `review-service` (Port 3007)
- `seller-service` (Port 3008)
- `promotion-service` (Port 3009)
- `shipping-service` (Port 3010)
- `chat-service` (Port 3011)
- `search-service` (Port 3012)
- `dlq-service` (Port 3013)
- `analytics-service` (Port 3014)
- `loyalty-service` (Port 3015)
- `dispute-service` (Port 3016)
- `settlement-service` (Port 3017)
- `warehouse-service` (Port 3018)

**Estimated Image Size**: ~200-300MB per service (sau khi prune dev dependencies)

---

## 3. Docker Containers

### 3.1. Container Naming

**Explicit Container Names**:
- `zookeeper` - Zookeeper container
- `kafka` - Kafka container

**Implicit Container Names** (Docker Compose tự generate):
- Format: `<project-name>_<service-name>_<instance-number>`
- Ví dụ: `microservice_base_auth-service_1`

### 3.2. Container Configuration

#### Infrastructure Containers

**Zookeeper**:
```yaml
container_name: zookeeper
image: confluentinc/cp-zookeeper:7.5.0
ports: ["2181:2181"]
volumes:
  - zookeeper-data:/var/lib/zookeeper/data
  - zookeeper-logs:/var/lib/zookeeper/log
healthcheck:
  test: ["CMD-SHELL", "nc -z localhost 2181 || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
restart: unless-stopped
```

**Kafka**:
```yaml
container_name: kafka
image: confluentinc/cp-kafka:7.5.0
depends_on:
  zookeeper:
    condition: service_healthy
ports: ["9092:9092"]
volumes:
  - kafka-data:/var/lib/kafka/data
healthcheck:
  test: ["CMD-SHELL", "kafka-broker-api-versions --bootstrap-server localhost:9092 || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
restart: unless-stopped
```

**MongoDB**:
```yaml
image: mongo:7
ports: ["27017:27017"]
# No volumes - data ephemeral (có thể thêm volume cho persistence)
```

**Redis**:
```yaml
image: redis:7-alpine
ports: ["6380:6379"]  # Mapped to 6380 to avoid host conflict
command: redis-server --appendonly yes
volumes:
  - redis-data:/data
```

**Elasticsearch**:
```yaml
image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
environment:
  - discovery.type=single-node
  - xpack.security.enabled=false
  - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
ports: ["9200:9200"]
volumes:
  - elasticsearch-data:/usr/share/elasticsearch/data
```

**ClickHouse**:
```yaml
image: clickhouse/clickhouse-server:latest
ports:
  - "${CLICKHOUSE_PORT_HTTP:-8123}:8123"
  - "${CLICKHOUSE_PORT_NATIVE:-9000}:9000"
volumes:
  - clickhouse-data:/var/lib/clickhouse
  - clickhouse-logs:/var/log/clickhouse-server
ulimits:
  nofile:
    soft: 262144
    hard: 262144
```

#### PostgreSQL Containers (9 instances)

Tất cả sử dụng `postgres:15` với cấu hình tương tự:

| Container | Port Mapping | Database | User | Password |
|-----------|--------------|----------|------|----------|
| `postgres-auth` | 5433:5432 | auth_db | auth_user | auth_password |
| `postgres-order` | 5434:5432 | order_db | order_user | order_password |
| `postgres-payment` | 5435:5432 | payment_db | payment_user | payment_password |
| `postgres-seller` | 5436:5432 | seller_db | seller_user | seller_password |
| `postgres-promo` | 5437:5432 | promo_db | promo_user | promo_password |
| `postgres-loyalty` | 5438:5432 | loyalty_db | loyalty_user | loyalty_password |
| `postgres-dispute` | 5439:5432 | dispute_db | dispute_user | dispute_password |
| `postgres-settlement` | 5440:5432 | settlement_db | settlement_user | settlement_password |
| `postgres-shipping` | 5441:5432 | shipping_db | shipping_user | shipping_password |

**Health Check Pattern** (một số có):
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U <user> -d <db>"]
  interval: 10s
  timeout: 5s
  retries: 5
```

#### Microservice Containers

**Pattern chung**:
```yaml
<service-name>:
  build:
    context: ../services/<service-name>
    dockerfile: Dockerfile
  environment:
    PORT: <port>
    # Service-specific env vars
  ports:
    - "<port>:<port>"
  depends_on:
    - <dependency-service>
```

**Ví dụ: auth-service**:
```yaml
auth-service:
  build:
    context: ../services/auth-service
    dockerfile: Dockerfile
  environment:
    PORT: 3001
    AUTH_DB_HOST: postgres-auth
    AUTH_DB_PORT: 5432
    AUTH_DB_USER: auth_user
    AUTH_DB_PASSWORD: auth_password
    AUTH_DB_NAME: auth_db
    KAFKA_BROKERS: kafka:9092
    JWT_ACCESS_SECRET: access-secret
    JWT_REFRESH_SECRET: refresh-secret
    DB_POOL_CONNECTION_TIMEOUT: 30000
  ports:
    - "3001:3001"
  depends_on:
    postgres-auth:
      condition: service_healthy
    kafka:
      condition: service_started
```

#### Monitoring Containers

**Prometheus**:
```yaml
prometheus:
  image: prom/prometheus:latest
  ports: ["9090:9090"]
  volumes:
    - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml
    - prometheus-data:/prometheus
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
  depends_on:
    - auth-service
    - product-service
    - order-service
    - payment-service
```

**Grafana**:
```yaml
grafana:
  image: grafana/grafana:latest
  ports: ["3030:3000"]  # Map host 3030 to container 3000
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
    - GF_USERS_ALLOW_SIGN_UP=false
  volumes:
    - grafana-data:/var/lib/grafana
    - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    - ./grafana/datasources:/etc/grafana/provisioning/datasources
  depends_on:
    - prometheus
```

**Alertmanager**:
```yaml
alertmanager:
  image: prom/alertmanager:latest
  ports: ["9093:9093"]
  volumes:
    - ./prometheus/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    - alertmanager-data:/alertmanager
  command:
    - '--config.file=/etc/alertmanager/alertmanager.yml'
    - '--storage.path=/alertmanager'
  depends_on:
    - prometheus
```

**Jaeger**:
```yaml
jaeger:
  image: jaegertracing/all-in-one:latest
  ports:
    - "16686:16686"  # UI
    - "14268:14268"  # HTTP collector
  environment:
    - COLLECTOR_ZIPKIN_HTTP_PORT=9411
```

---

## 4. Docker Volumes

### 4.1. Named Volumes

Hệ thống sử dụng **12 named volumes** để persist data:

| Volume Name | Container(s) | Mount Point | Mục đích |
|-------------|--------------|-------------|----------|
| `zookeeper-data` | zookeeper | `/var/lib/zookeeper/data` | Zookeeper data |
| `zookeeper-logs` | zookeeper | `/var/lib/zookeeper/log` | Zookeeper logs |
| `kafka-data` | kafka | `/var/lib/kafka/data` | Kafka logs & data |
| `redis-data` | redis | `/data` | Redis AOF persistence |
| `elasticsearch-data` | elasticsearch | `/usr/share/elasticsearch/data` | ES indices |
| `clickhouse-data` | clickhouse | `/var/lib/clickhouse` | ClickHouse data |
| `clickhouse-logs` | clickhouse | `/var/log/clickhouse-server` | ClickHouse logs |
| `postgres-promo-data` | postgres-promo | `/var/lib/postgresql/data` | Promotion DB |
| `postgres-shipping-data` | postgres-shipping | `/var/lib/postgresql/data` | Shipping DB |
| `prometheus-data` | prometheus | `/prometheus` | Prometheus TSDB |
| `grafana-data` | grafana | `/var/lib/grafana` | Grafana dashboards & config |
| `alertmanager-data` | alertmanager | `/alertmanager` | Alertmanager state |

### 4.2. Bind Mounts (Host Paths)

**Prometheus Config**:
```yaml
volumes:
  - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
  - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml
```

**Grafana Config**:
```yaml
volumes:
  - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
  - ./grafana/datasources:/etc/grafana/provisioning/datasources
```

**Alertmanager Config**:
```yaml
volumes:
  - ./prometheus/alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

### 4.3. Volume Management

**List volumes**:
```bash
docker volume ls | grep microservice_base
```

**Inspect volume**:
```bash
docker volume inspect microservice_base_kafka-data
```

**Backup volume**:
```bash
docker run --rm -v microservice_base_kafka-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/kafka-data-backup.tar.gz /data
```

**Remove unused volumes**:
```bash
docker volume prune
```

---

## 5. Docker Networks

### 5.1. Default Network

Docker Compose tự động tạo một **default bridge network** cho tất cả services:
- **Network Name**: `<project-name>_default` (ví dụ: `microservice_base_default`)
- **Driver**: `bridge`
- **Subnet**: Tự động assign bởi Docker

### 5.2. Service Discovery

Tất cả containers trong cùng network có thể giao tiếp qua **service name**:

**Ví dụ**:
- `auth-service` có thể connect đến `postgres-auth:5432`
- `product-service` có thể connect đến `mongo:27017`
- Tất cả services có thể connect đến `kafka:9092`

**Internal DNS**: Docker tự động resolve service names thành IP addresses

### 5.3. Network Isolation

- Tất cả services trong cùng network
- External access chỉ qua exposed ports
- Internal communication qua service names

### 5.4. Custom Networks (Không có)

Hiện tại không có custom networks. Có thể tạo để:
- Isolate services theo nhóm
- Tăng security
- Better network management

**Ví dụ cải thiện**:
```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
  monitoring:
    driver: bridge
```

---

## 6. Docker Compose Configuration

### 6.1. Compose File Structure

**File**: `deploy/docker-compose.yml`

**Version**: Không có version (Docker Compose v2 format)

**Sections**:
1. `services:` - Định nghĩa tất cả containers
2. `volumes:` - Định nghĩa named volumes

### 6.2. Build Configuration

**Pattern cho microservices**:
```yaml
<service-name>:
  build:
    context: ../services/<service-name>
    dockerfile: Dockerfile
```

**Build từ local source code**, không dùng pre-built images

### 6.3. Environment Variables

**Two types**:
1. **Hardcoded** trong docker-compose.yml
2. **From .env file** (sử dụng `${VAR:-default}` syntax)

**Ví dụ**:
```yaml
environment:
  CLICKHOUSE_PORT_HTTP: ${CLICKHOUSE_PORT_HTTP:-8123}
  CLICKHOUSE_DB: ${CLICKHOUSE_DB:-warehouse_db}
```

### 6.4. Restart Policies

**Policies được sử dụng**:
- `unless-stopped`: Zookeeper, Kafka
- **Default (no restart)**: Hầu hết services khác

**Đề xuất**: Thêm restart policy cho tất cả services:
```yaml
restart: unless-stopped  # hoặc always
```

---

## 7. Health Checks

### 7.1. Services với Health Checks

| Service | Health Check Command | Interval | Timeout | Retries |
|---------|---------------------|----------|---------|---------|
| `zookeeper` | `nc -z localhost 2181` | 10s | 5s | 5 |
| `kafka` | `kafka-broker-api-versions --bootstrap-server localhost:9092` | 30s | 10s | 5 |
| `postgres-auth` | `pg_isready -U auth_user -d auth_db` | 10s | 5s | 5 |
| `postgres-promo` | `pg_isready -U promo_user -d promo_db` | 10s | 5s | 5 |
| `postgres-shipping` | `pg_isready -U shipping_user -d shipping_db` | 10s | 5s | 5 |

### 7.2. Services KHÔNG có Health Checks

- Tất cả microservices (19 services)
- MongoDB
- Redis
- Elasticsearch
- ClickHouse
- Monitoring services

**Đề xuất**: Thêm health checks cho tất cả services:
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 7.3. Health Check Dependencies

**Condition-based dependencies**:
```yaml
depends_on:
  postgres-auth:
    condition: service_healthy  # Chờ health check pass
  kafka:
    condition: service_started   # Chỉ chờ container start
```

---

## 8. Dependencies & Startup Order

### 8.1. Dependency Graph

```
Level 0 (Infrastructure):
  - zookeeper (no dependencies)
  - mongo (no dependencies)
  - redis (no dependencies)
  - elasticsearch (no dependencies)
  - clickhouse (no dependencies)
  - postgres-* (no dependencies)

Level 1:
  - kafka (depends: zookeeper)

Level 2 (Services):
  - auth-service (depends: postgres-auth, kafka)
  - product-service (depends: mongo, kafka)
  - cart-service (depends: mongo)
  - review-service (depends: mongo)
  - seller-service (depends: postgres-seller)
  - order-service (depends: postgres-order, kafka)
  - payment-service (depends: postgres-payment, kafka)
  - notification-service (depends: kafka, mongo)
  - promotion-service (depends: postgres-promo)
  - shipping-service (depends: postgres-shipping, kafka)
  - chat-service (depends: mongo, kafka)
  - search-service (depends: mongo, kafka, redis, elasticsearch)
  - dlq-service (depends: mongo, kafka)
  - analytics-service (depends: mongo, kafka, redis)
  - loyalty-service (depends: postgres-loyalty, kafka)
  - dispute-service (depends: postgres-dispute, kafka)
  - settlement-service (depends: postgres-settlement, kafka)
  - warehouse-service (depends: clickhouse, kafka)

Level 3:
  - api-gateway (depends: auth-service, product-service, dispute-service, dlq-service)
  - prometheus (depends: auth-service, product-service, order-service, payment-service)
  - alertmanager (depends: prometheus)
  - grafana (depends: prometheus)
```

### 8.2. Startup Sequence

**Recommended startup order** (manual hoặc script):
1. Infrastructure: zookeeper, mongo, redis, elasticsearch, clickhouse, postgres-*
2. Kafka (sau zookeeper healthy)
3. Microservices (sau dependencies ready)
4. API Gateway (sau core services ready)
5. Monitoring (sau services ready)

**Script**: `start-order-services.sh` có thể được sử dụng

---

## 9. Environment Variables

### 9.1. Database Connection Variables

**PostgreSQL Services**:
```yaml
<DB>_DB_HOST: postgres-<service>
<DB>_DB_PORT: 5432
<DB>_DB_USER: <service>_user
<DB>_DB_PASSWORD: <service>_password
<DB>_DB_NAME: <service>_db
```

**MongoDB Services**:
```yaml
<SERVICE>_MONGO_URI: mongodb://mongo:27017/<service>_db
```

**ClickHouse**:
```yaml
CLICKHOUSE_HOST: clickhouse
CLICKHOUSE_PORT: 8123
CLICKHOUSE_USER: warehouse_user
CLICKHOUSE_PASSWORD: warehouse_password
CLICKHOUSE_DB: warehouse_db
```

### 9.2. Kafka Configuration

**Common pattern**:
```yaml
KAFKA_BROKERS: kafka:9092
```

### 9.3. Service URLs (API Gateway)

API Gateway cần biết tất cả service URLs:
```yaml
AUTH_SERVICE_URL: http://auth-service:3001
PRODUCT_SERVICE_URL: http://product-service:3002
ORDER_SERVICE_URL: http://order-service:3003
# ... 16 services khác
```

### 9.4. Security Variables

**JWT Secrets**:
```yaml
JWT_ACCESS_SECRET: access-secret
JWT_REFRESH_SECRET: refresh-secret
```

**⚠️ Lưu ý**: Secrets nên được quản lý qua Docker Secrets hoặc external secret management

### 9.5. Feature Flags

**Elasticsearch**:
```yaml
USE_ELASTICSEARCH: "true"
ELASTICSEARCH_URL: http://elasticsearch:9200
```

### 9.6. Resource Configuration

**Kafka**:
```yaml
KAFKA_HEAP_OPTS: "-Xmx512M -Xms512M"
```

**Elasticsearch**:
```yaml
ES_JAVA_OPTS: "-Xms512m -Xmx512m"
```

**ClickHouse**:
```yaml
ulimits:
  nofile:
    soft: 262144
    hard: 262144
```

---

## 10. Port Mappings

### 10.1. Port Mapping Table

| Service | Container Port | Host Port | Protocol | Access |
|---------|---------------|-----------|----------|--------|
| **API Gateway** | 3000 | 3000 | HTTP | External |
| **Auth Service** | 3001 | 3001 | HTTP | External |
| **Product Service** | 3002 | 3002 | HTTP | External |
| **Order Service** | 3003 | 3003 | HTTP | External |
| **Payment Service** | 3004 | 3004 | HTTP | External |
| **Notification Service** | 3005 | 3005 | HTTP | External |
| **Cart Service** | 3006 | 3006 | HTTP | External |
| **Review Service** | 3007 | 3007 | HTTP | External |
| **Seller Service** | 3008 | 3008 | HTTP | External |
| **Promotion Service** | 3009 | 3009 | HTTP | External |
| **Shipping Service** | 3010 | 3010 | HTTP | External |
| **Chat Service** | 3011 | 3011 | HTTP | External |
| **Search Service** | 3012 | 3012 | HTTP | External |
| **DLQ Service** | 3013 | 3013 | HTTP | External |
| **Analytics Service** | 3014 | 3014 | HTTP | External |
| **Loyalty Service** | 3015 | 3015 | HTTP | External |
| **Dispute Service** | 3016 | 3016 | HTTP | External |
| **Settlement Service** | 3017 | 3017 | HTTP | External |
| **Warehouse Service** | 3018 | 3018 | HTTP | External |
| **Zookeeper** | 2181 | 2181 | TCP | Internal/External |
| **Kafka** | 9092 | 9092 | TCP | Internal/External |
| **MongoDB** | 27017 | 27017 | TCP | Internal/External |
| **Redis** | 6379 | 6380 | TCP | Internal/External |
| **Elasticsearch** | 9200 | 9200 | HTTP | Internal/External |
| **ClickHouse HTTP** | 8123 | 8123 | HTTP | Internal/External |
| **ClickHouse Native** | 9000 | 9000 | TCP | Internal/External |
| **Postgres Auth** | 5432 | 5433 | TCP | Internal/External |
| **Postgres Order** | 5432 | 5434 | TCP | Internal/External |
| **Postgres Payment** | 5432 | 5435 | TCP | Internal/External |
| **Postgres Seller** | 5432 | 5436 | TCP | Internal/External |
| **Postgres Promo** | 5432 | 5437 | TCP | Internal/External |
| **Postgres Loyalty** | 5432 | 5438 | TCP | Internal/External |
| **Postgres Dispute** | 5432 | 5439 | TCP | Internal/External |
| **Postgres Settlement** | 5432 | 5440 | TCP | Internal/External |
| **Postgres Shipping** | 5432 | 5441 | TCP | Internal/External |
| **Prometheus** | 9090 | 9090 | HTTP | External |
| **Alertmanager** | 9093 | 9093 | HTTP | External |
| **Grafana** | 3000 | 3030 | HTTP | External |
| **Jaeger UI** | 16686 | 16686 | HTTP | External |
| **Jaeger Collector** | 14268 | 14268 | HTTP | External |

### 10.2. Port Conflicts

**Redis**: Mapped từ 6379 → 6380 để tránh conflict với host Redis

**Grafana**: Mapped từ 3000 → 3030 để tránh conflict với API Gateway

### 10.3. Internal vs External Access

**Internal Access**: Services giao tiếp qua service names (không cần port mapping)
- Ví dụ: `auth-service` → `postgres-auth:5432` (internal)

**External Access**: Client access qua host ports
- Ví dụ: `http://localhost:3000` → API Gateway

---

## 11. Build Contexts & Dockerfiles

### 11.1. Build Context Structure

**Pattern**:
```yaml
build:
  context: ../services/<service-name>
  dockerfile: Dockerfile
```

**Context Path**: Relative từ `deploy/docker-compose.yml`

### 11.2. Dockerfile Pattern

**Standard Dockerfile** (tất cả services):
```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy dependency files
COPY package.json tsconfig.json ./

# Copy source code
COPY src ./src

# Install dependencies and build
RUN npm install && npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE <PORT>

# Start application
CMD ["node", "dist/main.js"]
```

**Build Optimization**:
- ✅ Multi-stage build có thể cải thiện (chưa sử dụng)
- ✅ Layer caching với package.json trước
- ✅ Prune dev dependencies sau build

**Đề xuất Multi-stage Build**:
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
EXPOSE <PORT>
CMD ["node", "dist/main.js"]
```

### 11.3. Build Cache Strategy

**Current**: Docker tự động cache layers

**Optimization**:
1. Copy `package.json` trước `src/` để cache dependencies
2. Build layer được cache nếu dependencies không đổi
3. Source code changes chỉ rebuild từ COPY src step

---

## 12. Resource Management

### 12.1. Memory Limits (Không có)

**Hiện tại**: Không có memory limits

**Đề xuất**: Thêm memory limits cho từng service:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### 12.2. CPU Limits (Không có)

**Hiện tại**: Không có CPU limits

**Đề xuất**: Thêm CPU limits:
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
    reservations:
      cpus: '0.25'
```

### 12.3. Ulimits

**ClickHouse** có ulimits:
```yaml
ulimits:
  nofile:
    soft: 262144
    hard: 262144
```

**Lý do**: ClickHouse cần nhiều file descriptors cho high-performance queries

### 12.4. Java Heap Settings

**Kafka**:
```yaml
KAFKA_HEAP_OPTS: "-Xmx512M -Xms512M"
```

**Elasticsearch**:
```yaml
ES_JAVA_OPTS: "-Xms512m -Xmx512m"
```

---

## 13. Best Practices & Recommendations

### 13.1. Security

**Current Issues**:
- ❌ Hardcoded passwords trong docker-compose.yml
- ❌ No secrets management
- ❌ All ports exposed to host

**Recommendations**:
1. Sử dụng Docker Secrets hoặc external secret management
2. Chỉ expose ports cần thiết
3. Sử dụng internal networks cho service-to-service communication
4. Enable TLS cho database connections

### 13.2. Performance

**Current**:
- ✅ Named volumes cho persistence
- ✅ Health checks cho critical services
- ✅ Dependency conditions

**Improvements**:
1. Add health checks cho tất cả services
2. Add resource limits
3. Use multi-stage builds
4. Optimize image sizes

### 13.3. Monitoring

**Current**:
- ✅ Prometheus, Grafana, Alertmanager
- ✅ Jaeger tracing

**Improvements**:
1. Add health check endpoints cho tất cả services
2. Standardize metrics format
3. Add container resource monitoring

### 13.4. Scalability

**Current**:
- ✅ Stateless services (có thể scale)
- ✅ Database per service
- ✅ Kafka consumer groups

**Improvements**:
1. Add restart policies
2. Add resource limits
3. Use Docker Swarm hoặc Kubernetes cho production
4. Implement auto-scaling

---

## 14. Tổng Kết

### 14.1. Statistics

- **Total Containers**: 35+
- **Total Images**: 19 custom + 16 public
- **Total Volumes**: 12 named volumes
- **Total Networks**: 1 default bridge
- **Total Port Mappings**: 35+

### 14.2. Key Strengths

✅ **Database per Service**: Isolation tốt
✅ **Health Checks**: Critical services có health checks
✅ **Dependency Management**: Proper startup order
✅ **Volume Persistence**: Data được persist
✅ **Service Discovery**: Internal DNS resolution

### 14.3. Areas for Improvement

⚠️ **Security**: Secrets management
⚠️ **Resource Limits**: Chưa có limits
⚠️ **Health Checks**: Thiếu cho nhiều services
⚠️ **Restart Policies**: Chưa đầy đủ
⚠️ **Multi-stage Builds**: Chưa sử dụng
⚠️ **Custom Networks**: Chưa có network isolation

---

**Tài liệu được tạo**: 2024
**Phiên bản**: 1.0
**Tác giả**: System Analysis




