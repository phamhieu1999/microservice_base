# Phân Tích Luồng Docker Volume và Chức Năng

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Phân Loại Volumes](#2-phân-loại-volumes)
3. [Luồng Dữ Liệu Qua Volumes](#3-luồng-dữ-liệu-qua-volumes)
4. [Chi Tiết Từng Volume](#4-chi-tiết-từng-volume)
5. [Volume Lifecycle](#5-volume-lifecycle)
6. [Data Persistence Flow](#6-data-persistence-flow)
7. [Backup và Restore](#7-backup-và-restore)
8. [Best Practices](#8-best-practices)

---

## 1. Tổng Quan

Hệ thống sử dụng **12 named volumes** và **5 bind mounts** để:
- ✅ **Persist data** khi containers restart
- ✅ **Share configuration** giữa host và containers
- ✅ **Backup và restore** dữ liệu
- ✅ **Isolate data** giữa các services

### 1.1. Thống Kê

- **Named Volumes**: 12 volumes
- **Bind Mounts**: 5 mounts (config files)
- **Services sử dụng volumes**: 10 services
- **Services KHÔNG có volumes**: 9 PostgreSQL instances (chỉ 2 có), MongoDB (không có)

---

## 2. Phân Loại Volumes

### 2.1. Named Volumes (12 volumes)

**Định nghĩa**: Volumes được quản lý bởi Docker, lưu trong Docker storage area

**Đặc điểm**:
- ✅ Tự động tạo khi container start
- ✅ Persist khi container bị xóa
- ✅ Có thể share giữa containers
- ✅ Location: `/var/lib/docker/volumes/` (Linux)

**Danh sách**:
```yaml
volumes:
  redis-data:              # Redis persistence
  prometheus-data:         # Prometheus TSDB
  grafana-data:            # Grafana dashboards & config
  alertmanager-data:       # Alertmanager state
  postgres-promo-data:     # Promotion database
  postgres-shipping-data:  # Shipping database
  elasticsearch-data:      # Elasticsearch indices
  clickhouse-data:         # ClickHouse data
  clickhouse-logs:         # ClickHouse logs
  zookeeper-data:          # Zookeeper data
  zookeeper-logs:          # Zookeeper logs
  kafka-data:              # Kafka logs & data
```

### 2.2. Bind Mounts (5 mounts)

**Định nghĩa**: Mount trực tiếp từ host filesystem vào container

**Đặc điểm**:
- ✅ Trỏ đến file/folder cụ thể trên host
- ✅ Thay đổi trên host ngay lập tức reflect trong container
- ✅ Dùng cho config files, không dùng cho data persistence

**Danh sách**:

**Prometheus** (2 mounts):
```yaml
volumes:
  - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
  - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml
```

**Alertmanager** (1 mount):
```yaml
volumes:
  - ./prometheus/alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

**Grafana** (2 mounts):
```yaml
volumes:
  - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
  - ./grafana/datasources:/etc/grafana/provisioning/datasources
```

---

## 3. Luồng Dữ Liệu Qua Volumes

### 3.1. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                          │
│  (Microservices: auth, product, order, payment, ...)         │
└──────────────┬───────────────────────────────────────────────┘
               │
               │ Write/Read Data
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │   MongoDB    │  │  ClickHouse  │     │
│  │  (9 instances)│  │  (1 shared)  │  │  (1 OLAP)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         │                  │                  │              │
│    ┌────▼────┐        ┌────▼────┐       ┌────▼────┐        │
│    │ Volume  │        │  NO     │       │ Volume  │        │
│    │ (2 only)│        │ Volume  │       │ (2 vols)│        │
│    └─────────┘        └─────────┘       └─────────┘        │
└─────────────────────────────────────────────────────────────┘
               │
               │ Persist to Docker Volume
               ▼
┌─────────────────────────────────────────────────────────────┐
│              DOCKER VOLUME STORAGE                           │
│  /var/lib/docker/volumes/<project>_<volume-name>/_data/     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2. Message Broker Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    KAFKA PRODUCERS                           │
│  (order-service, product-service, payment-service, ...)     │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Publish Events
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    KAFKA BROKER                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Kafka Container                                    │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  /var/lib/kafka/data  ← kafka-data volume    │  │    │
│  │  │  - Topic partitions                          │  │    │
│  │  │  - Log segments                             │  │    │
│  │  │  - Offset metadata                          │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Consume Events
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    KAFKA CONSUMERS                           │
│  (notification-service, analytics-service, warehouse, ...)   │
└─────────────────────────────────────────────────────────────┘
```

### 3.3. Monitoring Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MICROSERVICES                             │
│  (Expose metrics via /metrics endpoint)                      │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Scrape Metrics
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    PROMETHEUS                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Prometheus Container                               │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  /prometheus  ← prometheus-data volume       │  │    │
│  │  │  - Time Series Database (TSDB)                │  │    │
│  │  │  - Metrics storage                            │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  /etc/prometheus/prometheus.yml  ← bind mount│  │    │
│  │  │  - Scrape config                              │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Query Metrics
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    GRAFANA                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Grafana Container                                 │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  /var/lib/grafana  ← grafana-data volume    │  │    │
│  │  │  - Dashboards                                 │  │    │
│  │  │  - Users & permissions                       │  │    │
│  │  │  - Data sources config                       │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  /etc/grafana/provisioning/  ← bind mounts  │  │    │
│  │  │  - Dashboards provisioning                   │  │    │
│  │  │  - Data sources provisioning                │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Chi Tiết Từng Volume

### 4.1. Kafka & Zookeeper Volumes

#### zookeeper-data
```yaml
Container: zookeeper
Mount Point: /var/lib/zookeeper/data
Volume: zookeeper-data
```

**Chức năng**:
- Lưu trữ Zookeeper data (znodes, metadata)
- Persist cluster state
- Quan trọng cho Kafka coordination

**Data Flow**:
```
Kafka → Zookeeper (coordination) → zookeeper-data volume
```

**Kích thước**: ~10-50MB (tùy số lượng znodes)

#### zookeeper-logs
```yaml
Container: zookeeper
Mount Point: /var/lib/zookeeper/log
Volume: zookeeper-logs
```

**Chức năng**:
- Lưu transaction logs
- Dùng cho recovery
- Audit trail

**Kích thước**: ~10-100MB (tùy activity)

#### kafka-data
```yaml
Container: kafka
Mount Point: /var/lib/kafka/data
Volume: kafka-data
```

**Chức năng**:
- Lưu Kafka topic partitions
- Log segments cho mỗi topic
- Offset metadata
- Transaction logs

**Data Flow**:
```
Producer → Kafka → kafka-data volume
                              ↓
Consumer ← Kafka ← kafka-data volume
```

**Topics được lưu**:
- `order.created`
- `payment.success`, `payment.failed`
- `product.created`, `product.updated`
- `user.created`
- `settlement.balance.updated`
- ... (nhiều topics khác)

**Kích thước**: Có thể rất lớn (GB+) tùy retention policy (168 hours = 7 days)

**Retention Config**:
```yaml
KAFKA_LOG_RETENTION_HOURS: 168  # 7 days
KAFKA_LOG_SEGMENT_BYTES: 1073741824  # 1GB per segment
```

### 4.2. Database Volumes

#### postgres-promo-data
```yaml
Container: postgres-promo
Mount Point: /var/lib/postgresql/data
Volume: postgres-promo-data
```

**Chức năng**:
- Lưu Promotion database data
- Tables: vouchers, promotions, usage history
- Transaction logs (WAL)

**Data Flow**:
```
promotion-service → postgres-promo → postgres-promo-data volume
```

**Kích thước**: ~100MB - 1GB (tùy số lượng vouchers)

#### postgres-shipping-data
```yaml
Container: postgres-shipping
Mount Point: /var/lib/postgresql/data
Volume: postgres-shipping-data
```

**Chức năng**:
- Lưu Shipping database data
- Tables: shipping methods, quotes, tracking
- Transaction logs

**Data Flow**:
```
shipping-service → postgres-shipping → postgres-shipping-data volume
```

**Kích thước**: ~50MB - 500MB

**⚠️ Lưu ý**: 7 PostgreSQL instances khác KHÔNG có volumes:
- `postgres-auth` - Data sẽ mất khi container xóa
- `postgres-order` - Data sẽ mất khi container xóa
- `postgres-payment` - Data sẽ mất khi container xóa
- `postgres-seller` - Data sẽ mất khi container xóa
- `postgres-loyalty` - Data sẽ mất khi container xóa
- `postgres-dispute` - Data sẽ mất khi container xóa
- `postgres-settlement` - Data sẽ mất khi container xóa

**Đề xuất**: Thêm volumes cho tất cả PostgreSQL instances

### 4.3. MongoDB (Không có Volume)

```yaml
Container: mongo
Volumes: NONE
```

**⚠️ Vấn đề**: MongoDB KHÔNG có volume → Data sẽ mất khi container restart/xóa

**Services sử dụng MongoDB**:
- `product-service` → `product_db`
- `cart-service` → `cart_db`
- `review-service` → `review_db`
- `chat-service` → `chat_db`
- `notification-service` → `notification_db`
- `search-service` → `search_db`
- `analytics-service` → `analytics_db`
- `dlq-service` → `dlq_db`
- `shipping-service` → `shipping_db`

**Đề xuất**: Thêm volume cho MongoDB:
```yaml
mongo:
  image: mongo:7
  volumes:
    - mongo-data:/data/db
  ports:
    - "27017:27017"
```

### 4.4. Cache & Search Volumes

#### redis-data
```yaml
Container: redis
Mount Point: /data
Volume: redis-data
```

**Chức năng**:
- Lưu Redis AOF (Append Only File) persistence
- Cache data: search results, analytics metrics
- Session data (nếu có)

**Data Flow**:
```
search-service → Redis → redis-data volume
analytics-service → Redis → redis-data volume
api-gateway → Redis → redis-data volume
```

**Persistence Mode**:
```yaml
command: redis-server --appendonly yes
```

**Kích thước**: ~10-100MB (tùy cache size)

#### elasticsearch-data
```yaml
Container: elasticsearch
Mount Point: /usr/share/elasticsearch/data
Volume: elasticsearch-data
```

**Chức năng**:
- Lưu Elasticsearch indices
- Product search index
- Full-text search data
- Index metadata

**Data Flow**:
```
product-service → Kafka → search-service → Elasticsearch → elasticsearch-data volume
```

**Index Structure**:
- Index: `products`
- Fields: name, description, category, brand, price

**Kích thước**: ~100MB - 5GB (tùy số lượng products)

### 4.5. Data Warehouse Volumes

#### clickhouse-data
```yaml
Container: clickhouse
Mount Point: /var/lib/clickhouse
Volume: clickhouse-data
```

**Chức năng**:
- Lưu ClickHouse data warehouse
- OLAP tables: order_facts, payment_facts
- Columnar storage format
- Analytics data

**Data Flow**:
```
Kafka Events → warehouse-service → ClickHouse → clickhouse-data volume
```

**Tables**:
- `order_facts` - Order data warehouse
- `payment_facts` - Payment data warehouse
- `product_facts` - Product analytics

**Kích thước**: Có thể rất lớn (GB - TB) tùy data retention

#### clickhouse-logs
```yaml
Container: clickhouse
Mount Point: /var/log/clickhouse-server
Volume: clickhouse-logs
```

**Chức năng**:
- Lưu ClickHouse server logs
- Query logs
- Error logs
- Performance logs

**Kích thước**: ~10-100MB (rotate logs)

### 4.6. Monitoring Volumes

#### prometheus-data
```yaml
Container: prometheus
Mount Point: /prometheus
Volume: prometheus-data
```

**Chức năng**:
- Lưu Prometheus Time Series Database (TSDB)
- Metrics từ tất cả services
- Retention: 15 days (default)
- Query history

**Data Flow**:
```
Services (/metrics) → Prometheus (scrape) → prometheus-data volume
```

**Metrics được lưu**:
- HTTP request metrics
- Database connection metrics
- Kafka consumer/producer metrics
- System metrics (CPU, memory)

**Kích thước**: ~100MB - 10GB (tùy retention và số lượng metrics)

#### grafana-data
```yaml
Container: grafana
Mount Point: /var/lib/grafana
Volume: grafana-data
```

**Chức năng**:
- Lưu Grafana dashboards
- User accounts & permissions
- Data source configurations
- Alert rules
- Dashboard preferences

**Data Flow**:
```
Grafana UI → Create/Edit Dashboards → grafana-data volume
```

**Kích thước**: ~10-100MB (chủ yếu là config, không phải data)

#### alertmanager-data
```yaml
Container: alertmanager
Mount Point: /alertmanager
Volume: alertmanager-data
```

**Chức năng**:
- Lưu Alertmanager state
- Silences (suppressed alerts)
- Notification history
- Grouping state

**Data Flow**:
```
Prometheus → Alertmanager (alerts) → alertmanager-data volume
```

**Kích thước**: ~1-10MB

### 4.7. Bind Mounts (Config Files)

#### Prometheus Config
```yaml
./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
./prometheus/alerts.yml:/etc/prometheus/alerts.yml
```

**Chức năng**:
- Prometheus scrape configuration
- Alert rules
- Service discovery config

**Data Flow**:
```
Host file (prometheus.yml) → Container (/etc/prometheus/prometheus.yml)
```

**Thay đổi trên host** → **Ngay lập tức reflect trong container** (sau reload)

#### Alertmanager Config
```yaml
./prometheus/alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

**Chức năng**:
- Alert routing rules
- Notification channels (email, Slack, etc.)
- Grouping & inhibition rules

#### Grafana Provisioning
```yaml
./grafana/dashboards:/etc/grafana/provisioning/dashboards
./grafana/datasources:/etc/grafana/provisioning/datasources
```

**Chức năng**:
- Auto-provision dashboards
- Auto-configure data sources
- Infrastructure as Code

---

## 5. Volume Lifecycle

### 5.1. Volume Creation

**Khi nào volumes được tạo**:
1. **Named volumes**: Tự động tạo khi container start lần đầu
2. **Bind mounts**: Không cần tạo, chỉ cần path tồn tại

**Command**:
```bash
docker compose up -d
```

**Process**:
```
docker-compose.yml
    ↓
Read volumes: section
    ↓
Create named volumes (nếu chưa tồn tại)
    ↓
Start containers
    ↓
Mount volumes vào containers
```

### 5.2. Volume Usage

**Trong container**:
- Application write data → Volume mount point
- Docker tự động sync → Named volume storage
- Data persist ngay lập tức

**Example**:
```bash
# Kafka writes to /var/lib/kafka/data
# Docker syncs to /var/lib/docker/volumes/microservice_base_kafka-data/_data
```

### 5.3. Volume Persistence

**Named volumes**:
- ✅ Persist khi container stop
- ✅ Persist khi container remove
- ✅ Persist khi docker-compose down
- ❌ Mất khi `docker volume rm <volume>`

**Bind mounts**:
- ✅ Persist (vì là host files)
- ✅ Không bị ảnh hưởng bởi container lifecycle

### 5.4. Volume Cleanup

**Remove volumes**:
```bash
# Remove specific volume
docker volume rm microservice_base_kafka-data

# Remove all unused volumes
docker volume prune

# Remove volumes khi down
docker compose down -v  # -v = remove volumes
```

**⚠️ Cảnh báo**: `docker compose down -v` sẽ **XÓA TẤT CẢ DATA**

---

## 6. Data Persistence Flow

### 6.1. Write Flow

```
Application (Container)
    ↓
Write to mount point (/var/lib/kafka/data)
    ↓
Docker Volume Driver
    ↓
Named Volume Storage (/var/lib/docker/volumes/...)
    ↓
Host Filesystem
```

### 6.2. Read Flow

```
Application (Container)
    ↓
Read from mount point (/var/lib/kafka/data)
    ↓
Docker Volume Driver
    ↓
Named Volume Storage (/var/lib/docker/volumes/...)
    ↓
Return data to container
```

### 6.3. Container Restart Flow

```
Container Stop
    ↓
Volume vẫn tồn tại (data persist)
    ↓
Container Start
    ↓
Mount same volume
    ↓
Data available ngay lập tức
```

### 6.4. Container Recreate Flow

```
Container Remove
    ↓
Volume vẫn tồn tại (data persist)
    ↓
Container Create (new)
    ↓
Mount same volume
    ↓
Data available (không mất)
```

---

## 7. Backup và Restore

### 7.1. Backup Named Volume

**Backup Kafka data**:
```bash
docker run --rm \
  -v microservice_base_kafka-data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/kafka-data-$(date +%Y%m%d).tar.gz -C /data .
```

**Backup PostgreSQL**:
```bash
docker exec postgres-promo pg_dump -U promo_user promo_db > backup-promo-$(date +%Y%m%d).sql
```

**Backup MongoDB** (nếu có volume):
```bash
docker exec mongo mongodump --out /backup
docker cp mongo:/backup ./backups/mongo-$(date +%Y%m%d)
```

### 7.2. Restore Named Volume

**Restore Kafka data**:
```bash
# Stop Kafka container
docker compose stop kafka

# Restore
docker run --rm \
  -v microservice_base_kafka-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/kafka-data-20240101.tar.gz -C /data

# Start Kafka
docker compose start kafka
```

**Restore PostgreSQL**:
```bash
docker exec -i postgres-promo psql -U promo_user promo_db < backup-promo-20240101.sql
```

### 7.3. Backup Strategy

**Recommended**:
1. **Daily backups** cho critical data (Kafka, databases)
2. **Weekly backups** cho monitoring data (Prometheus, Grafana)
3. **Retention**: 30 days
4. **Offsite backup**: Copy to S3, NFS, etc.

**Script Example**:
```bash
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup Kafka
docker run --rm \
  -v microservice_base_kafka-data:/data:ro \
  -v $(pwd)/$BACKUP_DIR:/backup \
  alpine tar czf /backup/kafka-data.tar.gz -C /data .

# Backup PostgreSQL
docker exec postgres-promo pg_dump -U promo_user promo_db > $BACKUP_DIR/promo.sql

# Backup Prometheus
docker run --rm \
  -v microservice_base_prometheus-data:/data:ro \
  -v $(pwd)/$BACKUP_DIR:/backup \
  alpine tar czf /backup/prometheus-data.tar.gz -C /data .
```

---

## 8. Best Practices

### 8.1. Volume Naming

**✅ Good**: Descriptive names
```yaml
volumes:
  kafka-data:
  postgres-promo-data:
```

**❌ Bad**: Generic names
```yaml
volumes:
  data:
  logs:
```

### 8.2. Volume Placement

**✅ Good**: Separate volumes cho data và logs
```yaml
volumes:
  - clickhouse-data:/var/lib/clickhouse
  - clickhouse-logs:/var/log/clickhouse-server
```

**❌ Bad**: Mix data và logs
```yaml
volumes:
  - clickhouse-all:/clickhouse  # Không tách biệt
```

### 8.3. Data Persistence

**✅ Good**: Tất cả databases có volumes
```yaml
postgres-auth:
  volumes:
    - postgres-auth-data:/var/lib/postgresql/data
```

**❌ Bad**: Không có volumes (data mất khi container xóa)
```yaml
postgres-auth:
  # No volumes - data will be lost!
```

### 8.4. Volume Size Management

**Monitor volume sizes**:
```bash
docker system df -v
```

**Cleanup old data**:
- Kafka: Retention policy (7 days)
- Prometheus: Retention config
- Logs: Rotation

### 8.5. Security

**✅ Good**: Use named volumes (isolated)
**❌ Bad**: Expose sensitive data via bind mounts

**Permissions**:
- Named volumes: Docker manages permissions
- Bind mounts: Host permissions apply

---

## 9. Issues và Recommendations

### 9.1. Current Issues

**❌ MongoDB không có volume**:
- Data sẽ mất khi container restart
- **Fix**: Thêm `mongo-data:/data/db`

**❌ 7 PostgreSQL instances không có volumes**:
- `postgres-auth`, `postgres-order`, `postgres-payment`, etc.
- **Fix**: Thêm volumes cho tất cả

**❌ Không có backup strategy**:
- **Fix**: Implement automated backups

### 9.2. Recommendations

1. **Thêm volumes cho tất cả databases**
2. **Implement backup automation**
3. **Monitor volume sizes**
4. **Set retention policies**
5. **Use volume drivers** cho production (NFS, cloud storage)

---

## 10. Tổng Kết

### 10.1. Volume Summary

| Volume Type | Count | Purpose |
|-------------|-------|---------|
| **Named Volumes** | 12 | Data persistence |
| **Bind Mounts** | 5 | Configuration files |
| **Total** | 17 | - |

### 10.2. Data Flow Summary

```
Applications → Databases/Cache → Named Volumes → Docker Storage → Host Filesystem
Config Files → Bind Mounts → Containers
```

### 10.3. Key Takeaways

✅ **Named volumes**: Persist data, managed by Docker
✅ **Bind mounts**: Share config, immediate sync
✅ **12 named volumes**: Critical data persistence
✅ **5 bind mounts**: Configuration management
⚠️ **Missing volumes**: MongoDB + 7 PostgreSQL instances
⚠️ **Backup needed**: Implement automated backup strategy

---

**Tài liệu được tạo**: 2024
**Phiên bản**: 1.0
**Tác giả**: System Analysis




