# 🔄 Phân tích Cơ chế Realtime với Kafka và ClickHouse

Tài liệu phân tích chi tiết về cơ chế realtime data pipeline sử dụng Kafka và ClickHouse trong hệ thống e-commerce microservice.

---

## 📊 1. Tổng quan Kiến trúc Realtime

### 1.1 Data Flow Pipeline

```
┌─────────────────┐
│  Event Source   │  (Order Service, Payment Service, etc.)
│   Services      │
└────────┬────────┘
         │
         │ Emit Events
         ▼
┌─────────────────┐
│   Kafka Broker  │  (Message Queue - Event Streaming)
│   (Port 9092)   │
└────────┬────────┘
         │
         │ Subscribe & Consume
         ▼
┌─────────────────┐
│ Warehouse       │  (Kafka Consumer)
│ Consumer        │
└────────┬────────┘
         │
         │ Insert/Update
         ▼
┌─────────────────┐
│   ClickHouse    │  (OLAP Data Warehouse)
│   (Port 8123)   │
└─────────────────┘
         │
         │ Query
         ▼
┌─────────────────┐
│  API Gateway    │  (REST API - Real-time Analytics)
│  (Port 3000)    │
└─────────────────┘
```

### 1.2 Đặc điểm Realtime

- **Latency**: Từ event đến query được: **< 1 giây** (thường 100-500ms)
- **Throughput**: Hỗ trợ hàng nghìn events/giây
- **Durability**: Kafka đảm bảo message không mất
- **Scalability**: Horizontal scaling với Kafka partitions và ClickHouse sharding

---

## 🔄 2. Cơ chế Event-Driven Architecture

### 2.1 Event Producers (Event Sources)

Các service trong hệ thống emit events khi có business events xảy ra:

#### Order Service
```typescript
// services/order-service/src/application/order/use-cases/create-order.usecase.ts
await this.kafka.emit(ORDER_CREATED_TOPIC, {
  orderId: order.id,
  userId: order.userId,
  items: order.items,
  totalAmount: order.totalAmount,
  status: order.status,
  createdAt: order.createdAt,
});
```

**Topic**: `order.created`

#### Payment Service
```typescript
// services/payment-service/src/modules/payment/payment.service.ts
await this.kafka.emit(PAYMENT_SUCCESS_TOPIC, {
  paymentId: payment.id,
  orderId: payment.orderId,
  userId: payment.userId,
  amount: payment.amount,
  method: payment.method,
  provider: payment.provider,
  status: 'SUCCESS',
  createdAt: payment.createdAt,
});
```

**Topic**: `payment.success`

#### Settlement Service
```typescript
// services/settlement-service/src/modules/settlement/settlement.service.ts
await this.kafka.emit('settlement.balance.updated', {
  settlementId: settlement.id,
  sellerId: settlement.sellerId,
  orderId: settlement.orderId,
  netRevenue: settlement.netRevenue,
  commission: settlement.commission,
  payoutAmount: settlement.payoutAmount,
  payoutStatus: settlement.payoutStatus,
  createdAt: settlement.createdAt,
});
```

**Topic**: `settlement.balance.updated`

#### Loyalty Service
```typescript
// services/loyalty-service/src/application/loyalty/use-cases/earn-points.usecase.ts
await this.kafka.emit('points.earned', {
  transactionId: transaction.id,
  userId: transaction.userId,
  orderId: transaction.orderId,
  pointsEarned: transaction.points,
  balanceAfter: transaction.balanceAfter,
  createdAt: transaction.createdAt,
});
```

**Topic**: `loyalty.points.earned` (hoặc `points.earned`)

#### Auth Service
```typescript
// services/auth-service/src/modules/auth/auth.service.ts
await this.kafka.emit(USER_CREATED_TOPIC, {
  userId: user.id,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});
```

**Topic**: `user.created`

#### Product Service
```typescript
// services/product-service/src/application/product/use-cases/create-product.usecase.ts
await this.kafka.emit(PRODUCT_CREATED_TOPIC, {
  productId: product.id,
  name: product.name,
  category: product.category,
  brand: product.brand,
  sellerId: product.sellerId,
  price: product.price,
  createdAt: product.createdAt,
});
```

**Topic**: `product.created`

### 2.2 Event Consumer (Warehouse Service)

Warehouse Service đóng vai trò là **event consumer** để ingest data vào ClickHouse:

```typescript
// services/warehouse-service/src/kafka/warehouse.consumer.ts
@Injectable()
export class WarehouseConsumer implements OnModuleInit {
  async onModuleInit() {
    this.consumer = this.kafkaService.getConsumer('warehouse-service-group');
    await this.consumer.connect();

    // Subscribe to multiple topics
    await this.consumer.subscribe({ topic: 'order.created', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'payment.success', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'settlement.balance.updated', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'loyalty.points.earned', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'user.created', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'product.created', fromBeginning: false });

    // Start consuming
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = JSON.parse(message.value?.toString() || '{}');
        
        switch (topic) {
          case 'order.created':
            await this.handleOrderCreated(value);
            break;
          case 'payment.success':
            await this.handlePaymentSuccess(value);
            break;
          // ... other handlers
        }
      },
    });
  }
}
```

**Consumer Group**: `warehouse-service-group`
- Đảm bảo mỗi message chỉ được consume 1 lần
- Hỗ trợ horizontal scaling (nhiều consumer instances)

---

## ⚡ 3. Cơ chế Realtime Ingestion

### 3.1 Event Processing Flow

#### Bước 1: Event được emit
```
Order Service → Kafka Topic (order.created)
```

#### Bước 2: Consumer nhận event
```
Kafka Topic → Warehouse Consumer (eachMessage handler)
```

#### Bước 3: Transform & Insert vào ClickHouse
```
Consumer Handler → Warehouse Service → ClickHouse Insert
```

**Ví dụ: Order Created Event**

```typescript
// services/warehouse-service/src/kafka/warehouse.consumer.ts
private async handleOrderCreated(event: any) {
  const orderDate = event.createdAt ? new Date(event.createdAt) : new Date();
  
  // Insert order fact for each item
  if (event.items && Array.isArray(event.items)) {
    for (const item of event.items) {
      await this.warehouseService.insertOrderFact({
        orderId: event.orderId,
        userId: event.userId,
        sellerId: item.sellerId,
        productId: item.productId,
        totalAmount: item.price * item.quantity,
        status: event.status,
        orderDate,
      });
    }
  }
}
```

**ClickHouse Insert**:
```typescript
// services/warehouse-service/src/modules/warehouse/warehouse.service.ts
async insertOrderFact(data: {...}) {
  const client = this.clickhouse.getClient();
  
  await client.insert({
    table: 'fact_order',
    values: [{
      order_id: data.orderId,
      user_id: data.userId,
      seller_id: data.sellerId,
      product_id: data.productId,
      total_amount: data.totalAmount,
      status: data.status,
      order_date: data.orderDate,
      order_datetime: data.orderDate,
    }],
    format: 'JSONEachRow',
  });
}
```

### 3.2 Latency Breakdown

**Tổng latency từ event đến query được**:

1. **Event Emit**: ~1-5ms (Kafka producer send)
2. **Kafka Broker**: ~1-2ms (message storage)
3. **Consumer Poll**: ~10-50ms (consumer poll interval)
4. **Event Processing**: ~5-20ms (transform & validation)
5. **ClickHouse Insert**: ~10-50ms (insert operation)
6. **ClickHouse Merge**: ~0ms (async background merge)

**Tổng**: **~27-127ms** (thường < 100ms)

**Note**: ClickHouse insert là **append-only**, rất nhanh. Merge operations chạy background.

### 3.3 Throughput

**Kafka Consumer Configuration**:
- **Batch Size**: Default (có thể tune)
- **Max Poll Records**: Default
- **Consumer Instances**: Có thể scale horizontal

**ClickHouse Insert Performance**:
- **Single Insert**: ~10-50ms
- **Batch Insert**: ~50-200ms cho 1000 records
- **Throughput**: Hỗ trợ **10,000-100,000 inserts/second** (tùy hardware)

**Best Practice**: 
- Insert từng record (real-time) cho low latency
- Có thể batch insert nếu cần high throughput

---

## 🗄️ 4. ClickHouse Storage Engine & Realtime

### 4.1 MergeTree Engine (Fact Tables)

ClickHouse sử dụng **MergeTree** engine cho fact tables:

```sql
CREATE TABLE fact_order (
  order_id String,
  user_id String,
  seller_id String,
  product_id String,
  total_amount Decimal(10, 2),
  order_date Date,
  order_datetime DateTime,
  created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (order_date, order_id)
PARTITION BY toYYYYMM(order_date)
```

**Đặc điểm Realtime**:

1. **Append-Only Writes**:
   - Insert operations rất nhanh (chỉ append vào part)
   - Không cần lock table
   - Không cần update indexes

2. **Background Merge**:
   - ClickHouse tự động merge các parts trong background
   - Không block reads/writes
   - Query vẫn trả về data mới nhất (đọc từ tất cả parts)

3. **Partitioning**:
   - Partition theo tháng (`toYYYYMM(order_date)`)
   - Query chỉ scan partitions liên quan
   - Insert tự động route vào partition đúng

### 4.2 ReplacingMergeTree Engine (Dimension Tables)

Dimension tables sử dụng **ReplacingMergeTree** để tự động merge duplicates:

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
- Tự động merge duplicates dựa trên `ORDER BY` key (`user_id`)
- Giữ record có `updated_at` mới nhất
- Merge chạy background (không block real-time inserts)

**Realtime Behavior**:
- Insert ngay lập tức (không cần check duplicate)
- Query có thể thấy duplicates tạm thời (trước khi merge)
- Sử dụng `FINAL` keyword nếu cần data đã merge:
  ```sql
  SELECT * FROM dim_user FINAL WHERE user_id = 'user_123'
  ```

### 4.3 Materialized Views (Pre-aggregation)

Materialized Views tự động aggregate data khi có insert mới:

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

**Realtime Behavior**:
- Khi insert vào `fact_payment`, MV tự động aggregate
- Query `mv_daily_revenue` nhanh hơn aggregate trực tiếp từ `fact_payment`
- Latency: **~0ms** (aggregate ngay khi insert)

**Ví dụ Flow**:
```
1. Insert vào fact_payment (payment.success event)
   ↓
2. Materialized View tự động trigger
   ↓
3. Aggregate vào mv_daily_revenue
   ↓
4. Query mv_daily_revenue → Instant result (< 10ms)
```

---

## 🔍 5. Realtime Query Capabilities

### 5.1 Query Latency

**ClickHouse Query Performance**:

| Query Type | PostgreSQL (OLTP) | ClickHouse (OLAP) | Improvement |
|------------|-------------------|-------------------|-------------|
| Daily Revenue (1 year) | 2-5 seconds | 50-200ms | **10-25x faster** |
| Top Sellers (1M orders) | 3-8 seconds | 100-300ms | **30-80x faster** |
| Top Products (1M orders) | 3-8 seconds | 100-300ms | **30-80x faster** |

**Lý do nhanh**:
1. **Columnar Storage**: Chỉ đọc cột cần thiết
2. **Partition Pruning**: Chỉ scan partitions liên quan
3. **Materialized Views**: Pre-aggregated data
4. **Vectorized Processing**: Xử lý nhiều rows cùng lúc

### 5.2 Realtime Data Availability

**Data Freshness**:
- **Event → ClickHouse**: ~27-127ms (như đã phân tích ở trên)
- **ClickHouse → Query**: Data có sẵn ngay sau insert
- **Total Latency**: **< 200ms** từ event đến query được

**Ví dụ Timeline**:
```
T+0ms:    User tạo order (Order Service)
T+5ms:    Event "order.created" emit vào Kafka
T+7ms:    Kafka broker lưu message
T+50ms:   Warehouse Consumer nhận message
T+70ms:   Insert vào ClickHouse fact_order
T+70ms:   Data có sẵn để query ✅
T+100ms:  User query revenue → Instant result
```

### 5.3 Query Examples

#### Daily Revenue Query
```sql
SELECT
  toDate(payment_datetime) AS revenue_date,
  sum(amount) AS total_revenue,
  count() AS order_count,
  avg(amount) AS avg_order_value
FROM fact_payment
WHERE status = 'SUCCESS'
  AND payment_date >= '2024-01-01'
  AND payment_date <= '2024-12-31'
GROUP BY revenue_date
ORDER BY revenue_date
```

**Performance**:
- Scan partitions: 12 partitions (12 tháng)
- Columnar scan: Chỉ đọc `payment_date`, `amount`, `status`
- Latency: **50-200ms** cho 1 năm data

#### Top Sellers Query
```sql
SELECT
  seller_id,
  sum(amount) AS total_revenue,
  count() AS order_count,
  avg(amount) AS avg_order_value
FROM fact_payment
WHERE status = 'SUCCESS'
GROUP BY seller_id
ORDER BY total_revenue DESC
LIMIT 10
```

**Performance**:
- Scan tất cả partitions (hoặc date range nếu có filter)
- Aggregation rất nhanh với columnar storage
- Latency: **100-300ms** cho 1M+ records

---

## 🚀 6. Scalability & Performance

### 6.1 Kafka Scalability

**Horizontal Scaling**:
- **Partitions**: Tăng số partitions để scale throughput
- **Consumer Instances**: Nhiều consumer instances trong cùng consumer group
- **Throughput**: Hỗ trợ **hàng triệu messages/second**

**Current Setup**:
- Single Kafka broker (có thể scale thành cluster)
- Single consumer instance (có thể scale thành multiple instances)

### 6.2 ClickHouse Scalability

**Horizontal Scaling**:
- **Sharding**: Chia data across multiple ClickHouse nodes
- **Replication**: Replicate data cho high availability
- **Throughput**: Hỗ trợ **100,000+ inserts/second** per node

**Current Setup**:
- Single ClickHouse node
- Partitioning theo tháng (tự động scale theo thời gian)

### 6.3 Performance Tuning

**Kafka Consumer Tuning**:
```typescript
// Có thể tune các parameters:
- maxPollRecords: Số records mỗi poll
- sessionTimeout: Consumer session timeout
- heartbeatInterval: Heartbeat interval
```

**ClickHouse Insert Tuning**:
```typescript
// Batch insert cho high throughput:
await client.insert({
  table: 'fact_order',
  values: [record1, record2, ..., recordN], // Batch nhiều records
  format: 'JSONEachRow',
});
```

**Trade-off**:
- **Single Insert**: Low latency (~10-50ms), lower throughput
- **Batch Insert**: Higher latency (~50-200ms), higher throughput

---

## 🔒 7. Reliability & Fault Tolerance

### 7.1 Kafka Reliability

**Message Durability**:
- Kafka lưu messages trên disk
- Replication factor > 1 (nếu cluster)
- Consumer commit offset sau khi process thành công

**Current Setup**:
- Single broker (có thể mất data nếu disk fail)
- Consumer commit offset sau mỗi message

### 7.2 ClickHouse Reliability

**Data Durability**:
- ClickHouse lưu data trên disk
- MergeTree engine đảm bảo data consistency
- Background merge không mất data

**Fault Tolerance**:
- Nếu consumer crash: Kafka giữ messages, consumer có thể resume từ offset
- Nếu ClickHouse crash: Data đã insert không mất (đã flush vào disk)

### 7.3 Error Handling

**Consumer Error Handling**:
```typescript
// services/warehouse-service/src/kafka/warehouse.consumer.ts
eachMessage: async ({ topic, partition, message }) => {
  try {
    const value = JSON.parse(message.value?.toString() || '{}');
    // Process message
  } catch (error) {
    this.logger.error(`Error processing message from ${topic}`, error);
    // Message sẽ không được commit, sẽ retry sau
  }
}
```

**ClickHouse Insert Error Handling**:
```typescript
// services/warehouse-service/src/modules/warehouse/warehouse.service.ts
async insertOrderFact(data: {...}) {
  try {
    await client.insert({...});
  } catch (error) {
    this.logger.error(`Failed to insert order fact: ${data.orderId}`, error);
    throw error; // Throw để consumer retry
  }
}
```

**Retry Strategy**:
- Kafka consumer tự động retry nếu không commit offset
- Có thể implement DLQ (Dead Letter Queue) cho messages fail nhiều lần

---

## 📊 8. Monitoring & Observability

### 8.1 Kafka Metrics

**Key Metrics**:
- **Consumer Lag**: Số messages chưa được consume
- **Throughput**: Messages/second
- **Error Rate**: Số errors/second

**Monitoring**:
```bash
# Check consumer lag
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group warehouse-service-group --describe
```

### 8.2 ClickHouse Metrics

**Key Metrics**:
- **Insert Rate**: Inserts/second
- **Query Latency**: Average query time
- **Table Sizes**: Disk usage per table
- **Partition Count**: Số partitions per table

**Monitoring Queries**:
```sql
-- Check recent inserts
SELECT count(), max(created_at)
FROM fact_order
WHERE order_date >= today() - 7;

-- Check table sizes
SELECT
  table,
  formatReadableSize(sum(bytes)) AS size,
  sum(rows) AS rows
FROM system.parts
WHERE database = 'warehouse_db'
GROUP BY table;

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
```

### 8.3 Application Metrics

**Warehouse Service Logs**:
- Insert success/failure logs
- Consumer message processing logs
- Query execution logs

---

## 🎯 9. Best Practices

### 9.1 Event Design

✅ **DO**:
- Emit events ngay sau khi business logic hoàn thành
- Include đầy đủ thông tin cần thiết trong event payload
- Sử dụng consistent event schema

❌ **DON'T**:
- Emit events trước khi transaction commit (có thể rollback)
- Emit quá nhiều events không cần thiết
- Thay đổi event schema thường xuyên

### 9.2 Consumer Design

✅ **DO**:
- Idempotent processing (có thể retry an toàn)
- Error handling và logging
- Commit offset sau khi process thành công

❌ **DON'T**:
- Long-running operations trong consumer (block other messages)
- Ignore errors (sẽ mất data)
- Commit offset trước khi process xong

### 9.3 ClickHouse Design

✅ **DO**:
- Sử dụng partitioning cho fact tables
- Sử dụng materialized views cho metrics thường query
- Insert batch nếu cần high throughput

❌ **DON'T**:
- Query không có date filter (scan tất cả partitions)
- Update/Delete thường xuyên (ClickHouse không tối ưu cho operations này)
- Insert quá nhiều small batches (nên batch insert)

---

## 🔮 10. Future Enhancements

### 10.1 Real-time Dashboards

- **Grafana Integration**: Real-time revenue charts
- **WebSocket API**: Push updates to frontend
- **Streaming Queries**: Continuous query results

### 10.2 Advanced Features

- **Change Data Capture (CDC)**: Sync từ PostgreSQL/MongoDB
- **Stream Processing**: Kafka Streams hoặc Flink
- **Time-series Analytics**: ClickHouse time-series functions

### 10.3 High Availability

- **Kafka Cluster**: Multi-broker với replication
- **ClickHouse Cluster**: Sharding + Replication
- **Consumer High Availability**: Multiple consumer instances

---

## 📝 11. Kết luận

### 11.1 Tóm tắt Cơ chế Realtime

**Kafka + ClickHouse** tạo thành một **real-time data pipeline** mạnh mẽ:

1. **Event-Driven**: Services emit events khi có business events
2. **Message Queue**: Kafka đảm bảo message delivery và durability
3. **Real-time Ingestion**: Consumer ingest data vào ClickHouse với latency thấp
4. **OLAP Storage**: ClickHouse lưu trữ và query analytics với performance cao
5. **Real-time Queries**: Data có sẵn ngay sau khi insert (< 200ms)

### 11.2 Performance Summary

| Metric | Value |
|--------|-------|
| **Event → ClickHouse Latency** | ~27-127ms |
| **ClickHouse Insert Latency** | ~10-50ms |
| **Query Latency** | 50-300ms (tùy query) |
| **Total Latency (Event → Query)** | **< 200ms** |
| **Throughput** | 10,000-100,000 events/second |
| **Query Performance** | 10-100x nhanh hơn PostgreSQL |

### 11.3 Ưu điểm

✅ **Low Latency**: Data có sẵn gần như real-time  
✅ **High Throughput**: Hỗ trợ hàng nghìn events/second  
✅ **Scalable**: Horizontal scaling với Kafka partitions và ClickHouse sharding  
✅ **Reliable**: Kafka đảm bảo message delivery, ClickHouse đảm bảo data durability  
✅ **High Performance**: Query analytics nhanh hơn 10-100x so với OLTP databases  

---

## 📚 References

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [ClickHouse Documentation](https://clickhouse.com/docs)
- [ClickHouse MergeTree Engine](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

