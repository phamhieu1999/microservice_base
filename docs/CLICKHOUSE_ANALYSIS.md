# Phân Tích Hoạt Động ClickHouse trong Hệ Thống

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Vai Trò và Chức Năng](#2-vai-trò-và-chức-năng)
3. [Cấu Hình và Kết Nối](#3-cấu-hình-và-kết-nối)
4. [Schema Design (Star Schema)](#4-schema-design-star-schema)
5. [Data Flow và ETL Process](#5-data-flow-và-etl-process)
6. [Batch Processing và Optimization](#6-batch-processing-và-optimization)
7. [Query Patterns và Analytics](#7-query-patterns-và-analytics)
8. [Performance Optimizations](#8-performance-optimizations)
9. [Monitoring và Health Checks](#9-monitoring-và-health-checks)

---

## 1. Tổng Quan

**ClickHouse** được sử dụng như **Data Warehouse (OLAP)** trong hệ thống để:
- ✅ Lưu trữ dữ liệu analytics từ tất cả business events
- ✅ Hỗ trợ queries phức tạp với performance cao
- ✅ Tối ưu cho read-heavy workloads
- ✅ Columnar storage format cho compression tốt

**Service**: `warehouse-service` (Port 3018)
**Database**: `warehouse_db`
**Image**: `clickhouse/clickhouse-server:latest`

---

## 2. Vai Trò và Chức Năng

### 2.1. Data Warehouse Pattern

ClickHouse đóng vai trò **Data Warehouse** theo mô hình **Star Schema**:
- **Fact Tables**: Lưu business events (orders, payments, settlements, loyalty)
- **Dimension Tables**: Lưu reference data (users, products, sellers, dates)

### 2.2. Chức Năng Chính

1. **ETL (Extract, Transform, Load)**:
   - Extract: Consume events từ Kafka
   - Transform: Chuyển đổi sang fact/dimension format
   - Load: Batch insert vào ClickHouse

2. **Analytics Queries**:
   - Daily revenue reports
   - Top sellers/products
   - Revenue trends
   - Performance metrics

3. **Historical Data Storage**:
   - Lưu trữ lịch sử transactions
   - Partitioning theo tháng để tối ưu queries
   - Long-term data retention

---

## 3. Cấu Hình và Kết Nối

### 3.1. Docker Configuration

```yaml
clickhouse:
  image: clickhouse/clickhouse-server:latest
  ports:
    - "${CLICKHOUSE_PORT_HTTP:-8123}:8123"  # HTTP interface
    - "${CLICKHOUSE_PORT_NATIVE:-9000}:9000" # Native protocol
  environment:
    CLICKHOUSE_DB: ${CLICKHOUSE_DB:-warehouse_db}
    CLICKHOUSE_USER: ${CLICKHOUSE_USER:-warehouse_user}
    CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD:-warehouse_password}
  volumes:
    - clickhouse-data:/var/lib/clickhouse
    - clickhouse-logs:/var/log/clickhouse-server
  ulimits:
    nofile:
      soft: 262144
      hard: 262144
```

### 3.2. Connection Configuration

**ClickHouseService** (`clickhouse.service.ts`):

```typescript
const clientConfig = {
  host: 'http://clickhouse:8123',
  username: 'warehouse_user',
  password: 'warehouse_password',
  database: 'warehouse_db',
  max_open_connections: 10,        // Connection pooling
  request_timeout: 30000,          // 30 seconds
  compression: {
    request: true,                  // Compress requests
    response: true,                 // Compress responses
  },
};
```

**Features**:
- ✅ Connection pooling (10 connections)
- ✅ Request/Response compression
- ✅ Retry logic với exponential backoff
- ✅ Auto schema initialization

### 3.3. Connection Flow

```
warehouse-service (onModuleInit)
    ↓
ClickHouseService.initialize()
    ↓
Retry connection (max 5 attempts)
    ↓
Test ping()
    ↓
Initialize schema (migration)
    ↓
Ready to accept queries
```

---

## 4. Schema Design (Star Schema)

### 4.1. Database Structure

**Database**: `warehouse_db`

**Tables**:
- **4 Dimension Tables**: `dim_date`, `dim_user`, `dim_product`, `dim_seller`
- **4 Fact Tables**: `fact_order`, `fact_payment`, `fact_settlement`, `fact_loyalty`
- **1 Materialized View**: `mv_daily_revenue`

### 4.2. Dimension Tables

#### dim_date
```sql
CREATE TABLE dim_date
(
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

**Chức năng**: Date dimension cho time-based analytics

#### dim_user
```sql
CREATE TABLE dim_user
(
  user_id String,
  email String,
  role String,
  created_at DateTime,
  updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY user_id
```

**Chức năng**: User dimension, tự động merge duplicates với `ReplacingMergeTree`

#### dim_product
```sql
CREATE TABLE dim_product
(
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

**Chức năng**: Product dimension, hỗ trợ product analytics

#### dim_seller
```sql
CREATE TABLE dim_seller
(
  seller_id String,
  shop_name String,
  created_at DateTime,
  updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY seller_id
```

**Chức năng**: Seller dimension, hỗ trợ seller analytics

### 4.3. Fact Tables

#### fact_order
```sql
CREATE TABLE fact_order
(
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
PARTITION BY toYYYYMM(order_date)  ← Monthly partitioning
```

**Chức năng**: Lưu order events, partitioned theo tháng

**Data Source**: `order.created` Kafka event

#### fact_payment
```sql
CREATE TABLE fact_payment
(
  payment_id String,
  order_id String,
  user_id String,
  seller_id String,
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
PARTITION BY toYYYYMM(payment_date)  ← Monthly partitioning
```

**Chức năng**: Lưu payment events, partitioned theo tháng

**Data Source**: `payment.success` Kafka event

#### fact_settlement
```sql
CREATE TABLE fact_settlement
(
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
PARTITION BY toYYYYMM(settlement_date)  ← Monthly partitioning
```

**Chức năng**: Lưu settlement events

**Data Source**: `settlement.balance.updated` Kafka event

#### fact_loyalty
```sql
CREATE TABLE fact_loyalty
(
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
PARTITION BY toYYYYMM(transaction_date)  ← Monthly partitioning
```

**Chức năng**: Lưu loyalty points transactions

**Data Source**: `loyalty.points.earned` Kafka event

### 4.4. Materialized View

#### mv_daily_revenue
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

**Chức năng**: Pre-aggregated daily revenue để tối ưu queries

**Lợi ích**:
- ✅ Queries nhanh hơn (không cần aggregate mỗi lần)
- ✅ Tự động update khi có data mới
- ✅ Giảm load trên fact table

---

## 5. Data Flow và ETL Process

### 5.1. Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    KAFKA TOPICS                              │
│                                                              │
│  order.created                                               │
│  payment.success                                             │
│  settlement.balance.updated                                 │
│  loyalty.points.earned                                       │
│  user.created                                                │
│  product.created                                             │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Consume Events
               ▼
┌─────────────────────────────────────────────────────────────┐
│              WAREHOUSE CONSUMER                              │
│  (warehouse.consumer.ts)                                     │
│                                                              │
│  - Batch processing (eachBatch)                              │
│  - Retry logic (max 3 retries)                              │
│  - Group events by topic                                    │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Transform & Buffer
               ▼
┌─────────────────────────────────────────────────────────────┐
│              WAREHOUSE SERVICE                               │
│  (warehouse.service.ts)                                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Batch Buffers:                                     │    │
│  │  - orderFactBuffer (max 100)                       │    │
│  │  - paymentFactBuffer (max 100)                     │    │
│  │  - Auto-flush: 5 seconds timeout                  │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Batch Insert
               ▼
┌─────────────────────────────────────────────────────────────┐
│              CLICKHOUSE DATABASE                             │
│                                                              │
│  Fact Tables:                                                │
│  - fact_order (partitioned by month)                        │
│  - fact_payment (partitioned by month)                      │
│  - fact_settlement (partitioned by month)                    │
│  - fact_loyalty (partitioned by month)                      │
│                                                              │
│  Dimension Tables:                                           │
│  - dim_user (ReplacingMergeTree)                            │
│  - dim_product (ReplacingMergeTree)                         │
│  - dim_seller (ReplacingMergeTree)                          │
│  - dim_date                                                  │
│                                                              │
│  Materialized View:                                          │
│  - mv_daily_revenue (auto-updated)                          │
└─────────────────────────────────────────────────────────────┘
```

### 5.2. ETL Process Chi Tiết

#### Extract (Kafka Consumer)

**Topics Subscribed**:
- `order.created` → Order facts
- `payment.success` → Payment facts
- `settlement.balance.updated` → Settlement facts
- `loyalty.points.earned` → Loyalty facts
- `user.created` → User dimensions
- `product.created` → Product dimensions

**Consumer Group**: `warehouse-service-group`

**Processing Mode**: `eachBatch` (batch processing)

#### Transform

**Order Event → Order Fact**:
```typescript
// Input: order.created event
{
  id: "order-123",
  userId: "user-456",
  items: [
    { productId: "prod-1", sellerId: "seller-1", price: 100, quantity: 2 }
  ],
  totalAmount: 200,
  status: "PENDING"
}

// Output: fact_order records (one per item)
{
  order_id: "order-123",
  user_id: "user-456",
  seller_id: "seller-1",
  product_id: "prod-1",
  total_amount: 200,
  status: "PENDING",
  order_date: "2024-01-01",
  order_datetime: "2024-01-01 10:00:00"
}
```

**Payment Event → Payment Fact**:
```typescript
// Input: payment.success event
{
  paymentId: "pay-123",
  orderId: "order-123",
  userId: "user-456",
  sellerId: "seller-1",
  amount: 200,
  method: "CREDIT_CARD",
  provider: "VNPAY"
}

// Output: fact_payment record
{
  payment_id: "pay-123",
  order_id: "order-123",
  user_id: "user-456",
  seller_id: "seller-1",
  amount: 200,
  payment_method: "CREDIT_CARD",
  provider: "VNPAY",
  status: "SUCCESS",
  payment_date: "2024-01-01",
  payment_datetime: "2024-01-01 10:05:00"
}
```

#### Load

**Batch Insert Strategy**:
1. **Buffer**: Add events vào in-memory buffer
2. **Flush Condition**: 
   - Buffer đầy (100 records) → Immediate flush
   - Timeout (5 seconds) → Scheduled flush
3. **Batch Insert**: Insert tất cả records trong buffer cùng lúc
4. **Error Handling**: Re-add to buffer nếu insert failed

---

## 6. Batch Processing và Optimization

### 6.1. Batch Buffering Strategy

**Implementation** (`warehouse.service.ts`):

```typescript
// Buffers
private orderFactBuffer: any[] = [];
private paymentFactBuffer: any[] = [];

// Configuration
private readonly BATCH_SIZE = 100;        // Flush khi đủ 100 records
private readonly BATCH_TIMEOUT = 5000;    // Flush sau 5 giây
```

**Flush Logic**:
```typescript
// 1. Check buffer size
if (buffer.length >= BATCH_SIZE) {
  await flush();  // Immediate flush
} else {
  scheduleFlush();  // Timeout flush
}

// 2. Auto-flush interval
setInterval(() => {
  flushAllBuffers();  // Every 5 seconds
}, BATCH_TIMEOUT);
```

### 6.2. Batch Processing Benefits

**Performance**:
- ✅ Giảm số lượng insert operations
- ✅ Tận dụng ClickHouse batch insert performance
- ✅ Giảm network round-trips
- ✅ Better compression ratio

**Example**:
```
Without batching: 1000 inserts = 1000 network calls
With batching: 1000 records = 10 batch inserts (100 records/batch)
→ 100x reduction in network calls
```

### 6.3. Kafka Batch Processing

**Consumer Configuration**:
```typescript
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
    // Process entire batch at once
    const events = batch.messages.map(msg => JSON.parse(msg.value.toString()));
    
    // Group by topic
    const eventsByTopic = new Map();
    events.forEach(event => {
      eventsByTopic.get(topic).push(event);
    });
    
    // Batch insert
    await warehouseService.batchInsertOrderFacts(events);
  }
});
```

**Benefits**:
- ✅ Process multiple events cùng lúc
- ✅ Better throughput
- ✅ Atomic batch processing

---

## 7. Query Patterns và Analytics

### 7.1. Daily Revenue Query

**Endpoint**: `GET /warehouse/revenue/daily`

**Implementation**:
```typescript
async getDailyRevenue(startDate: Date, endDate: Date, sellerId?: string) {
  // Use materialized view if no seller filter (faster)
  if (!sellerId) {
    query = `
      SELECT revenue_date, total_revenue, order_count
      FROM mv_daily_revenue
      WHERE revenue_date >= {startDate:Date}
        AND revenue_date <= {endDate:Date}
    `;
  } else {
    // Query fact table with seller filter
    query = `
      SELECT toDate(payment_datetime) AS revenue_date,
             sum(amount) AS total_revenue,
             count() AS order_count
      FROM fact_payment
      WHERE status = 'SUCCESS'
        AND payment_date >= {startDate:Date}
        AND payment_date <= {endDate:Date}
        AND seller_id = {sellerId:String}
      GROUP BY revenue_date
    `;
  }
}
```

**Optimization**:
- ✅ Materialized view cho queries không có filter
- ✅ Partition pruning với date filter
- ✅ Index trên `payment_date` và `seller_id`

### 7.2. Top Sellers Query

**Endpoint**: `GET /warehouse/sellers/top?limit=10&startDate=2024-01-01&endDate=2024-12-31`

**Implementation**:
```typescript
async getTopSellers(limit: number, startDate?: Date, endDate?: Date) {
  query = `
    SELECT
      seller_id,
      sum(amount) AS total_revenue,
      count() AS order_count,
      avg(amount) AS avg_order_value
    FROM fact_payment
    WHERE status = 'SUCCESS'
      AND payment_date >= {startDate:Date}
      AND payment_date <= {endDate:Date}
    GROUP BY seller_id
    ORDER BY total_revenue DESC
    LIMIT {limit:UInt32}
  `;
}
```

**Optimization**:
- ✅ Partition pruning với date filter
- ✅ Aggregation trên columnar storage (nhanh)
- ✅ ORDER BY với LIMIT (top-k query)

### 7.3. Top Products Query

**Endpoint**: `GET /warehouse/products/top?limit=10`

**Implementation**:
```typescript
async getTopProducts(limit: number, startDate?: Date, endDate?: Date) {
  query = `
    SELECT
      product_id,
      sum(total_amount) AS total_revenue,
      count() AS order_count
    FROM fact_order
    WHERE status != 'CANCELLED'
      AND order_date >= {startDate:Date}
      AND order_date <= {endDate:Date}
    GROUP BY product_id
    ORDER BY total_revenue DESC
    LIMIT {limit:UInt32}
  `;
}
```

---

## 8. Performance Optimizations

### 8.1. Partitioning

**Monthly Partitioning**:
```sql
PARTITION BY toYYYYMM(order_date)
```

**Benefits**:
- ✅ Partition pruning: Chỉ scan partitions cần thiết
- ✅ Faster queries với date filters
- ✅ Easy data retention (drop old partitions)

**Example**:
```
Query: WHERE order_date >= '2024-01-01' AND order_date <= '2024-03-31'
→ Chỉ scan partitions: 202401, 202402, 202403
→ Skip: 202404, 202405, ...
```

### 8.2. Engine Selection

**MergeTree** (Fact Tables):
- ✅ Columnar storage
- ✅ High compression
- ✅ Fast aggregations
- ✅ Partition support

**ReplacingMergeTree** (Dimension Tables):
- ✅ Auto-deduplicate
- ✅ Keep latest version (based on `updated_at`)
- ✅ Perfect for slowly changing dimensions

**SummingMergeTree** (Materialized View):
- ✅ Auto-aggregate on insert
- ✅ Pre-computed sums
- ✅ Fast queries

### 8.3. Ordering Keys

**Fact Tables**:
```sql
ORDER BY (order_date, order_id)
```

**Benefits**:
- ✅ Fast range queries trên date
- ✅ Efficient GROUP BY date
- ✅ Index support

### 8.4. Compression

**Configuration**:
```typescript
compression: {
  request: true,   // Compress requests
  response: true,  // Compress responses
}
```

**Benefits**:
- ✅ Giảm bandwidth
- ✅ Faster network transfer
- ✅ ClickHouse native compression

### 8.5. Connection Pooling

**Configuration**:
```typescript
max_open_connections: 10
```

**Benefits**:
- ✅ Reuse connections
- ✅ Reduce connection overhead
- ✅ Better concurrency

---

## 9. Monitoring và Health Checks

### 9.1. Health Check

**Endpoint**: `/health`

**Checks**:
- ClickHouse connection status
- Schema initialization status
- Buffer status

### 9.2. Monitoring Service

**WarehouseMonitorService** cung cấp:

**Table Sizes**:
```typescript
async getTableSizes() {
  query = `
    SELECT
      table,
      formatReadableSize(sum(bytes)) AS size,
      sum(rows) AS rows,
      count() AS parts
    FROM system.parts
    WHERE database = 'warehouse_db'
      AND active = 1
    GROUP BY table
  `;
}
```

**Query Stats**:
```typescript
async getQueryStats(hours: number = 1) {
  query = `
    SELECT
      query_duration_ms,
      read_rows,
      read_bytes,
      result_rows
    FROM system.query_log
    WHERE event_time >= now() - INTERVAL {hours} HOUR
    ORDER BY event_time DESC
  `;
}
```

**Partition Info**:
```typescript
async getPartitionInfo(table: string) {
  query = `
    SELECT
      partition,
      rows,
      bytes_on_disk,
      modification_time
    FROM system.parts
    WHERE database = 'warehouse_db'
      AND table = {table:String}
      AND active = 1
  `;
}
```

---

## 10. Data Flow Examples

### 10.1. Order Created Flow

```
1. order-service publishes: order.created
   ↓
2. warehouse-consumer receives event
   ↓
3. Transform: Extract order data
   ↓
4. Add to orderFactBuffer
   ↓
5. Buffer full (100) or timeout (5s)
   ↓
6. Batch insert to fact_order
   ↓
7. ClickHouse stores in partition (YYYYMM)
```

### 10.2. Payment Success Flow

```
1. payment-service publishes: payment.success
   ↓
2. warehouse-consumer receives event
   ↓
3. Transform: Extract payment data
   ↓
4. Add to paymentFactBuffer
   ↓
5. Batch insert to fact_payment
   ↓
6. Materialized view mv_daily_revenue auto-updates
```

### 10.3. User Created Flow

```
1. auth-service publishes: user.created
   ↓
2. warehouse-consumer receives event
   ↓
3. Transform: Extract user data
   ↓
4. Upsert to dim_user (ReplacingMergeTree)
   ↓
5. ClickHouse auto-deduplicates
```

---

## 11. Best Practices

### 11.1. Batch Size Tuning

**Current**: 100 records per batch

**Tuning**:
- ✅ Tăng nếu high throughput
- ✅ Giảm nếu low latency requirement
- ✅ Monitor buffer flush frequency

### 11.2. Partition Management

**Monthly Partitions**:
- ✅ Easy to drop old data
- ✅ Fast queries với date filters
- ✅ Consider retention policy

**Drop Old Partitions**:
```sql
ALTER TABLE fact_order DROP PARTITION '202301';
```

### 11.3. Materialized Views

**Current**: `mv_daily_revenue`

**Benefits**:
- ✅ Pre-aggregated data
- ✅ Fast queries
- ✅ Auto-update

**Consider Adding**:
- `mv_monthly_revenue`
- `mv_top_sellers_daily`
- `mv_product_sales_daily`

### 11.4. Query Optimization

**Always use date filters**:
```sql
-- ✅ Good: Partition pruning
WHERE payment_date >= '2024-01-01' AND payment_date <= '2024-12-31'

-- ❌ Bad: Full table scan
WHERE payment_datetime >= '2024-01-01 00:00:00'
```

**Use materialized views**:
```sql
-- ✅ Good: Fast query
SELECT * FROM mv_daily_revenue WHERE revenue_date >= '2024-01-01'

-- ❌ Bad: Slow aggregation
SELECT sum(amount) FROM fact_payment WHERE payment_date >= '2024-01-01'
```

---

## 12. Troubleshooting

### 12.1. Connection Issues

**Error**: `Failed to connect to ClickHouse`

**Solutions**:
1. Check ClickHouse container running: `docker compose ps clickhouse`
2. Check network connectivity: `docker exec warehouse-service ping clickhouse`
3. Check credentials in environment variables
4. Check ClickHouse logs: `docker logs clickhouse`

### 12.2. Schema Issues

**Error**: `Table doesn't exist`

**Solutions**:
```bash
# Run migration
cd services/warehouse-service
npm run migration
```

### 12.3. Performance Issues

**Slow Queries**:
1. Check partition pruning (use date filters)
2. Check table sizes: `SELECT * FROM system.parts`
3. Consider adding materialized views
4. Check query logs: `SELECT * FROM system.query_log`

**High Memory Usage**:
1. Reduce batch size
2. Increase flush frequency
3. Monitor buffer sizes

---

## 13. Tổng Kết

### 13.1. Key Features

✅ **Star Schema**: Fact + Dimension tables
✅ **Batch Processing**: 100 records/batch, 5s timeout
✅ **Partitioning**: Monthly partitions cho fact tables
✅ **Materialized Views**: Pre-aggregated daily revenue
✅ **Connection Pooling**: 10 connections
✅ **Compression**: Request/Response compression
✅ **Retry Logic**: Exponential backoff
✅ **Monitoring**: Table sizes, query stats

### 13.2. Data Flow Summary

```
Kafka Events → Warehouse Consumer → Batch Buffer → ClickHouse
                                                      ↓
                                              Fact/Dimension Tables
                                                      ↓
                                              Materialized Views
                                                      ↓
                                              Analytics Queries
```

### 13.3. Performance Characteristics

- **Write**: Batch inserts (100 records/batch)
- **Read**: Columnar storage, partition pruning
- **Storage**: High compression ratio
- **Queries**: Optimized với materialized views

---

**Tài liệu được tạo**: 2024
**Phiên bản**: 1.0
**Tác giả**: System Analysis




