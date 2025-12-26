# 🗄️ ClickHouse Integration Guide - Tổng quan và Chi tiết

Tài liệu tổng hợp chi tiết về cách ClickHouse đã được tích hợp vào hệ thống e-commerce microservice.

---

## 📊 1. Tổng quan Kiến trúc

### 1.1 Vị trí ClickHouse trong Hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 3000)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Warehouse Proxy (RBAC: Admin/Seller)                │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         Warehouse Service (Port 3018)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • ClickHouse Client                                 │  │
│  │  • Kafka Consumer (Real-time Ingestion)              │  │
│  │  • REST API (Query Warehouse Data)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌───────────────┐
│   ClickHouse  │              │     Kafka     │
│   (Port 8123) │              │  (Port 9092)   │
│               │              │               │
│ • fact_order  │              │ order.created │
│ • fact_payment│              │ payment.success│
│ • fact_settlement│           │ settlement.*  │
│ • fact_loyalty│              │ loyalty.*      │
│ • dim_*       │              │ user.created  │
│ • mv_*        │              │ product.created│
└───────────────┘              └───────────────┘
```

### 1.2 Data Flow

**Real-time Ingestion Flow**:
```
Event Source → Kafka Topic → Warehouse Consumer → ClickHouse
```

**Query Flow**:
```
Client → API Gateway → Warehouse Proxy → Warehouse Service → ClickHouse → Response
```

---

## 🏗️ 2. Chi tiết Implementation

### 2.1 Warehouse Service Structure

```
services/warehouse-service/
├── src/
│   ├── database/
│   │   └── clickhouse.service.ts      # ClickHouse client & schema init
│   ├── kafka/
│   │   ├── kafka.module.ts
│   │   ├── kafka.service.ts            # Kafka producer
│   │   └── warehouse.consumer.ts      # Kafka consumer (ingestion)
│   ├── modules/
│   │   └── warehouse/
│   │       ├── warehouse.module.ts
│   │       ├── warehouse.service.ts   # Business logic
│   │       ├── warehouse.controller.ts # REST API
│   │       └── dto/
│   │           └── query-revenue.dto.ts
│   ├── common/
│   │   ├── health.controller.ts
│   │   └── json-logger.service.ts
│   ├── modules/
│   │   └── app.module.ts
│   ├── swagger.ts
│   └── main.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

### 2.2 ClickHouse Service (`clickhouse.service.ts`)

**Chức năng chính**:
- Kết nối ClickHouse client
- Initialize schema (fact + dimension tables)
- Provide client instance cho các service khác

**Key Methods**:
```typescript
class ClickHouseService {
  onModuleInit()           // Connect & init schema
  onModuleDestroy()        // Close connection
  getClient()              // Get ClickHouse client
  initializeSchema()       // Create tables & materialized views
}
```

**Schema Initialization**:
- Tạo database `warehouse_db` nếu chưa có
- Tạo tất cả fact tables với partitioning
- Tạo dimension tables với ReplacingMergeTree
- Tạo materialized views cho pre-aggregation

### 2.3 Kafka Consumer (`warehouse.consumer.ts`)

**Topics Consumed**:
- `order.created` → Insert `fact_order`
- `payment.success` → Insert `fact_payment`
- `settlement.balance.updated` → Insert `fact_settlement`
- `loyalty.points.earned` → Insert `fact_loyalty`
- `user.created` → Upsert `dim_user`
- `product.created` → Upsert `dim_product`

**Consumer Group**: `warehouse-service-group`

**Event Handlers**:
- `handleOrderCreated()` - Parse order items, insert multiple fact records
- `handlePaymentSuccess()` - Insert payment fact
- `handleSettlementUpdated()` - Insert settlement fact
- `handleLoyaltyPointsEarned()` - Insert loyalty fact
- `handleUserCreated()` - Upsert user dimension
- `handleProductCreated()` - Upsert product dimension

---

## 📐 3. Schema Design (Star Schema)

### 3.1 Fact Tables

#### `fact_order`
```sql
CREATE TABLE fact_order (
  order_id String,
  user_id String,
  seller_id String,
  product_id String,
  order_group_id String,
  voucher_id String,
  total_amount Decimal(10, 2),
  discount_amount Decimal(10, 2),
  shipping_fee Decimal(10, 2),
  status String,
  order_date Date,
  order_datetime DateTime,
  created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (order_date, order_id)
PARTITION BY toYYYYMM(order_date)
```

**Đặc điểm**:
- Partition theo tháng (`toYYYYMM(order_date)`)
- Order by `(order_date, order_id)` để query nhanh
- Lưu cả `order_date` (Date) và `order_datetime` (DateTime)

#### `fact_payment`
```sql
CREATE TABLE fact_payment (
  payment_id String,
  order_id String,
  user_id String,
  amount Decimal(10, 2),
  fee Decimal(10, 2),
  payment_method String,
  provider String,
  status String,
  payment_date Date,
  payment_datetime DateTime,
  created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (payment_date, payment_id)
PARTITION BY toYYYYMM(payment_date)
```

#### `fact_settlement`
```sql
CREATE TABLE fact_settlement (
  settlement_id String,
  seller_id String,
  order_id String,
  net_revenue Decimal(10, 2),
  commission Decimal(10, 2),
  payout_amount Decimal(10, 2),
  payout_status String,
  settlement_date Date,
  settlement_datetime DateTime,
  created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (settlement_date, seller_id)
PARTITION BY toYYYYMM(settlement_date)
```

#### `fact_loyalty`
```sql
CREATE TABLE fact_loyalty (
  transaction_id String,
  user_id String,
  order_id String,
  points_earned Int32,
  points_redeemed Int32,
  balance_after Int32,
  event_type String,
  transaction_date Date,
  transaction_datetime DateTime,
  created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (transaction_date, user_id)
PARTITION BY toYYYYMM(transaction_date)
```

### 3.2 Dimension Tables

#### `dim_user`
```sql
CREATE TABLE dim_user (
  user_id String,
  email String,
  role String,
  created_at DateTime,
  updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY user_id
```

**Đặc điểm**:
- `ReplacingMergeTree` tự động merge duplicates dựa trên `updated_at`
- Chỉ giữ record mới nhất cho mỗi `user_id`

#### `dim_product`
```sql
CREATE TABLE dim_product (
  product_id String,
  name String,
  category String,
  brand String,
  seller_id String,
  price Decimal(10, 2),
  created_at DateTime,
  updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY product_id
```

#### `dim_seller`
```sql
CREATE TABLE dim_seller (
  seller_id String,
  shop_name String,
  created_at DateTime,
  updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY seller_id
```

#### `dim_date`
```sql
CREATE TABLE dim_date (
  date Date,
  year UInt16,
  month UInt8,
  day UInt8,
  quarter UInt8,
  week UInt8,
  day_of_week UInt8,
  is_weekend UInt8,
  is_holiday UInt8,
  created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY date
```

### 3.3 Materialized Views

#### `mv_daily_revenue`
```sql
CREATE MATERIALIZED VIEW mv_daily_revenue
ENGINE = SummingMergeTree()
ORDER BY (revenue_date, seller_id)
AS SELECT
  toDate(payment_datetime) AS revenue_date,
  seller_id,
  sum(amount) AS total_revenue,
  count() AS order_count
FROM fact_payment
WHERE status = 'SUCCESS'
GROUP BY revenue_date, seller_id
```

**Đặc điểm**:
- Tự động aggregate từ `fact_payment`
- Engine `SummingMergeTree` tự động sum các metrics
- Query nhanh hơn nhiều so với aggregate trực tiếp từ fact table

---

## 🔄 4. Data Ingestion Flow

### 4.1 Real-time Ingestion (Kafka → ClickHouse)

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐      ┌─────────────┐
│   Service   │      │    Kafka     │      │   Warehouse  │      │  ClickHouse │
│  (Order/    │─────▶│    Topic     │─────▶│   Consumer   │─────▶│   Tables    │
│  Payment)   │      │              │      │              │      │             │
└─────────────┘      └──────────────┘      └──────────────┘      └─────────────┘
```

**Ví dụ: Order Created Event**
```json
{
  "orderId": "order_123",
  "userId": "user_456",
  "items": [
    { "productId": "prod_1", "sellerId": "seller_1", "price": 100, "quantity": 2 },
    { "productId": "prod_2", "sellerId": "seller_2", "price": 50, "quantity": 1 }
  ],
  "totalAmount": 250,
  "discountAmount": 10,
  "shippingFee": 5,
  "status": "PENDING",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Processing**:
1. Consumer nhận event từ `order.created`
2. Parse JSON payload
3. Insert vào `fact_order` cho mỗi item (2 records trong ví dụ này)
4. ClickHouse tự động partition theo `order_date`

### 4.2 Batch Ingestion (Future)

Có thể thêm batch job để:
- Backfill dữ liệu lịch sử từ PostgreSQL/MongoDB
- Sync dimension tables từ source systems
- Populate `dim_date` table

---

## 📡 5. API Endpoints

### 5.1 Warehouse Service (Internal - Port 3018)

#### `GET /api/warehouse/revenue/daily`
**Query Parameters**:
- `startDate` (optional): `2024-01-01`
- `endDate` (optional): `2024-12-31`
- `sellerId` (optional): Filter by seller

**Response**:
```json
[
  {
    "revenue_date": "2024-01-15",
    "total_revenue": "125000.00",
    "order_count": "150",
    "avg_order_value": "833.33"
  }
]
```

**ClickHouse Query**:
```sql
SELECT
  toDate(payment_datetime) AS revenue_date,
  sum(amount) AS total_revenue,
  count() AS order_count,
  avg(amount) AS avg_order_value
FROM fact_payment
WHERE status = 'SUCCESS'
  AND payment_date >= {startDate:Date}
  AND payment_date <= {endDate:Date}
GROUP BY revenue_date
ORDER BY revenue_date
```

#### `GET /api/warehouse/sellers/top`
**Query Parameters**:
- `limit` (optional, default: 10)
- `startDate` (optional)
- `endDate` (optional)

**Response**:
```json
[
  {
    "seller_id": "seller_1",
    "total_revenue": "500000.00",
    "order_count": "500",
    "avg_order_value": "1000.00"
  }
]
```

#### `GET /api/warehouse/products/top`
**Query Parameters**:
- `limit` (optional, default: 10)
- `startDate` (optional)
- `endDate` (optional)

**Response**:
```json
[
  {
    "product_id": "prod_1",
    "total_revenue": "100000.00",
    "order_count": "200"
  }
]
```

### 5.2 API Gateway (Public - Port 3000)

Tất cả endpoints yêu cầu:
- **Authentication**: JWT token
- **Authorization**: `@Roles('ADMIN', 'SELLER')` hoặc `@Roles('ADMIN')`

#### `GET /warehouse/revenue/daily`
- **Roles**: `ADMIN`, `SELLER`
- Proxy đến `warehouse-service`

#### `GET /warehouse/sellers/top`
- **Roles**: `ADMIN` only
- Proxy đến `warehouse-service`

#### `GET /warehouse/products/top`
- **Roles**: `ADMIN` only
- Proxy đến `warehouse-service`

---

## ⚙️ 6. Configuration

### 6.1 Environment Variables

**Warehouse Service**:
```env
PORT=3018
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=warehouse_user
CLICKHOUSE_PASSWORD=warehouse_password
CLICKHOUSE_DB=warehouse_db
KAFKA_BROKERS=kafka:9092
```

**API Gateway**:
```env
WAREHOUSE_SERVICE_URL=http://warehouse-service:3018
```

### 6.2 Docker Compose

```yaml
clickhouse:
  image: clickhouse/clickhouse-server:latest
  ports:
    - "8123:8123"  # HTTP interface
    - "9000:9000"  # Native protocol
  environment:
    CLICKHOUSE_DB: warehouse_db
    CLICKHOUSE_USER: warehouse_user
    CLICKHOUSE_PASSWORD: warehouse_password
  volumes:
    - clickhouse-data:/var/lib/clickhouse
    - clickhouse-logs:/var/log/clickhouse-server

warehouse-service:
  build:
    context: ../services/warehouse-service
  environment:
    PORT: 3018
    CLICKHOUSE_HOST: clickhouse
    CLICKHOUSE_PORT: 8123
    CLICKHOUSE_USER: warehouse_user
    CLICKHOUSE_PASSWORD: warehouse_password
    CLICKHOUSE_DB: warehouse_db
    KAFKA_BROKERS: kafka:9092
  depends_on:
    - clickhouse
    - kafka
```

---

## 🚀 7. Performance Benefits

### 7.1 ClickHouse Advantages

**1. Columnar Storage**:
- Chỉ đọc cột cần thiết (không đọc toàn bộ row)
- Compression tốt hơn (giảm 5-10x disk usage)
- Query aggregation nhanh hơn 10-100x so với Postgres

**2. Partitioning**:
- Partition theo tháng (`toYYYYMM(order_date)`)
- Query với date range chỉ scan partitions liên quan
- Dễ archive/delete data cũ (drop partition)

**3. Materialized Views**:
- Pre-aggregate metrics tự động
- Query `mv_daily_revenue` nhanh hơn aggregate trực tiếp từ `fact_payment`
- Tự động update khi có data mới

**4. MergeTree Engine**:
- Insert nhanh (append-only)
- Merge tự động trong background
- Tối ưu cho write-heavy workloads

### 7.2 Query Performance Examples

**Scenario**: Query daily revenue cho 1 năm (365 days)

**PostgreSQL** (OLTP):
- Scan toàn bộ `payments` table
- Aggregate 1M+ rows
- **Time**: ~2-5 seconds

**ClickHouse** (OLAP):
- Scan partitions liên quan (12 partitions)
- Columnar scan chỉ cột `payment_date`, `amount`, `status`
- **Time**: ~50-200ms

**Improvement**: **10-100x faster** 🚀

---

## 📊 8. Monitoring & Maintenance

### 8.1 Health Check

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "service": "warehouse-service",
  "database": "clickhouse"
}
```

### 8.2 ClickHouse Monitoring

**Queries để monitor**:
```sql
-- Check table sizes
SELECT
  table,
  formatReadableSize(sum(bytes)) AS size,
  sum(rows) AS rows
FROM system.parts
WHERE database = 'warehouse_db'
GROUP BY table
ORDER BY sum(bytes) DESC;

-- Check query performance
SELECT
  query,
  query_duration_ms,
  read_rows,
  read_bytes
FROM system.query_log
WHERE type = 'QueryFinish'
ORDER BY query_duration_ms DESC
LIMIT 10;

-- Check partitions
SELECT
  table,
  partition,
  rows,
  formatReadableSize(bytes_on_disk) AS size
FROM system.parts
WHERE database = 'warehouse_db'
  AND active = 1
ORDER BY table, partition;
```

### 8.3 Maintenance Tasks

**1. Data Retention**:
```sql
-- Delete old partitions (older than 2 years)
ALTER TABLE fact_order DROP PARTITION '202201';
ALTER TABLE fact_payment DROP PARTITION '202201';
```

**2. Optimize Tables**:
```sql
-- Optimize table (merge parts)
OPTIMIZE TABLE fact_order FINAL;
```

**3. Backup**:
```bash
# Export data
clickhouse-client --query "SELECT * FROM fact_order" > backup.csv

# Or use clickhouse-backup tool
clickhouse-backup create
```

---

## 🔧 9. Troubleshooting

### 9.1 Common Issues

**Issue**: Consumer không nhận được events
- **Check**: Kafka connection, consumer group offset
- **Solution**: Restart consumer, check Kafka logs

**Issue**: ClickHouse query chậm
- **Check**: Partition pruning, indexes, materialized views
- **Solution**: Add date filter, use materialized views

**Issue**: Schema initialization failed
- **Check**: ClickHouse connection, permissions
- **Solution**: Check credentials, ensure database exists

### 9.2 Debug Queries

```sql
-- Check recent inserts
SELECT count(), max(created_at)
FROM fact_order
WHERE order_date >= today() - 7;

-- Check consumer lag (if using Kafka engine)
SELECT * FROM system.kafka_consumers;
```

---

## 📈 10. Future Enhancements

### 10.1 Planned Features

1. **More Materialized Views**:
   - Weekly revenue
   - Monthly revenue
   - Top products by category

2. **Data Retention Policy**:
   - Auto-archive data older than 2 years
   - Move to cold storage

3. **Real-time Dashboards**:
   - Grafana integration
   - Real-time revenue charts

4. **Advanced Analytics**:
   - Cohort analysis
   - Funnel analysis
   - User segmentation

5. **Batch Backfill**:
   - Sync historical data from PostgreSQL/MongoDB
   - Populate `dim_date` table

---

## 🎯 11. Kết luận

ClickHouse đã được tích hợp đầy đủ vào hệ thống với:

✅ **Schema Design**: Star Schema với fact + dimension tables  
✅ **Real-time Ingestion**: Kafka consumer tự động ingest data  
✅ **REST API**: Query warehouse data qua API Gateway  
✅ **Performance**: Query nhanh hơn 10-100x so với Postgres  
✅ **Scalability**: Partitioning và materialized views  
✅ **Monitoring**: Health checks và query monitoring  

Hệ thống giờ có thể xử lý analytics queries trên data lớn với performance cao, phù hợp cho production e-commerce platform.

---

## 📚 References

- [ClickHouse Documentation](https://clickhouse.com/docs)
- [ClickHouse Client for Node.js](https://github.com/ClickHouse/clickhouse-js)
- [Star Schema Design](https://en.wikipedia.org/wiki/Star_schema)
- [Materialized Views in ClickHouse](https://clickhouse.com/docs/en/sql-reference/statements/create/view#materialized-view)

