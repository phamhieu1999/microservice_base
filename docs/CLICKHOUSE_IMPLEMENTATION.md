# 🗄️ ClickHouse Data Warehouse Implementation

Tài liệu mô tả implementation ClickHouse Data Warehouse cho hệ thống e-commerce microservice.

---

## 📋 Tổng quan

**Warehouse Service** sử dụng **ClickHouse** để lưu trữ và query dữ liệu analytics với performance cao.

**Port**: `3018`

**Database**: ClickHouse (`warehouse_db`)

---

## 🏗️ Kiến trúc

### Schema Design (Star Schema)

#### Fact Tables (Số liệu chính)

1. **`fact_order`**
   - Lưu thông tin đơn hàng
   - Partition theo tháng (`toYYYYMM(order_date)`)
   - Columns: `order_id`, `user_id`, `seller_id`, `product_id`, `order_group_id`, `voucher_id`, `total_amount`, `discount_amount`, `shipping_fee`, `status`, `order_date`, `order_datetime`

2. **`fact_payment`**
   - Lưu thông tin thanh toán
   - Partition theo tháng
   - Columns: `payment_id`, `order_id`, `user_id`, `amount`, `fee`, `payment_method`, `provider`, `status`, `payment_date`, `payment_datetime`

3. **`fact_settlement`**
   - Lưu thông tin settlement cho seller
   - Partition theo tháng
   - Columns: `settlement_id`, `seller_id`, `order_id`, `net_revenue`, `commission`, `payout_amount`, `payout_status`, `settlement_date`, `settlement_datetime`

4. **`fact_loyalty`**
   - Lưu thông tin loyalty points
   - Partition theo tháng
   - Columns: `transaction_id`, `user_id`, `order_id`, `points_earned`, `points_redeemed`, `balance_after`, `event_type`, `transaction_date`, `transaction_datetime`

#### Dimension Tables (Bảng chiều)

1. **`dim_user`**
   - Thông tin user
   - Engine: `ReplacingMergeTree` (tự động merge duplicates)
   - Columns: `user_id`, `email`, `role`, `created_at`, `updated_at`

2. **`dim_product`**
   - Thông tin product
   - Engine: `ReplacingMergeTree`
   - Columns: `product_id`, `name`, `category`, `brand`, `seller_id`, `price`, `created_at`, `updated_at`

3. **`dim_seller`**
   - Thông tin seller
   - Engine: `ReplacingMergeTree`
   - Columns: `seller_id`, `shop_name`, `created_at`, `updated_at`

4. **`dim_date`**
   - Bảng date dimension (có thể populate sau)
   - Columns: `date`, `year`, `month`, `day`, `quarter`, `week`, `day_of_week`, `is_weekend`, `is_holiday`

#### Materialized Views

1. **`mv_daily_revenue`**
   - Pre-aggregated daily revenue by seller
   - Engine: `SummingMergeTree`
   - Tự động aggregate từ `fact_payment`

---

## 🔄 Data Ingestion

### Kafka Consumer

**Topics consumed**:
- `order.created` → Insert vào `fact_order`
- `payment.success` → Insert vào `fact_payment`
- `settlement.balance.updated` → Insert vào `fact_settlement`
- `loyalty.points.earned` → Insert vào `fact_loyalty`
- `user.created` → Upsert vào `dim_user`
- `product.created` → Upsert vào `dim_product`

**Consumer Group**: `warehouse-service-group`

---

## 📊 API Endpoints

### Warehouse Service (Internal)

- `GET /api/warehouse/revenue/daily?startDate=&endDate=&sellerId=`
- `GET /api/warehouse/sellers/top?limit=&startDate=&endDate=`
- `GET /api/warehouse/products/top?limit=&startDate=&endDate=`

### API Gateway (Public)

- `GET /warehouse/revenue/daily` (Admin/Seller only)
- `GET /warehouse/sellers/top` (Admin only)
- `GET /warehouse/products/top` (Admin only)

**Authentication**: JWT + RBAC (`@Roles('ADMIN', 'SELLER')`)

---

## 🚀 Deployment

### Docker Compose

ClickHouse và Warehouse Service đã được thêm vào `deploy/docker-compose.yml`:

```yaml
clickhouse:
  image: clickhouse/clickhouse-server:latest
  ports:
    - "8123:8123" # HTTP interface
    - "9000:9000" # Native protocol
  environment:
    CLICKHOUSE_DB: warehouse_db
    CLICKHOUSE_USER: warehouse_user
    CLICKHOUSE_PASSWORD: warehouse_password

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
```

### Start Services

```bash
cd deploy
docker-compose up -d clickhouse warehouse-service
```

---

## 🔍 Query Examples

### Daily Revenue

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

### Top Sellers

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

### Top Products

```sql
SELECT
  product_id,
  sum(total_amount) AS total_revenue,
  count() AS order_count
FROM fact_order
WHERE status != 'CANCELLED'
GROUP BY product_id
ORDER BY total_revenue DESC
LIMIT 10
```

---

## 📈 Performance

**ClickHouse advantages**:
- ✅ Columnar storage: Chỉ đọc cột cần thiết
- ✅ Compression tốt: Tiết kiệm disk
- ✅ Query aggregation rất nhanh: 10-100x nhanh hơn Postgres
- ✅ Partitioning tự động: Query theo tháng nhanh hơn
- ✅ Materialized views: Pre-aggregate metrics

**Best practices**:
- Insert batch data (đã implement qua Kafka consumer)
- Query với date range cụ thể (tận dụng partition)
- Dùng materialized views cho metrics thường query

---

## 🔧 Configuration

### Environment Variables

```env
PORT=3018
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=warehouse_user
CLICKHOUSE_PASSWORD=warehouse_password
CLICKHOUSE_DB=warehouse_db
KAFKA_BROKERS=kafka:9092
```

---

## 📝 Next Steps

1. **Populate dim_date**: Tạo script để populate date dimension
2. **More materialized views**: Thêm MV cho weekly/monthly revenue
3. **Data retention**: Implement policy để archive/delete data cũ
4. **Monitoring**: Thêm metrics cho ClickHouse performance
5. **Backup**: Setup backup strategy cho ClickHouse

---

## 🎯 Kết luận

ClickHouse Data Warehouse đã được tích hợp đầy đủ vào hệ thống:
- ✅ Schema design (fact + dimension tables)
- ✅ Kafka consumer để ingest real-time
- ✅ API để query warehouse data
- ✅ Tích hợp vào API Gateway với RBAC
- ✅ Docker Compose configuration

Hệ thống giờ có thể query analytics với performance cao, phù hợp cho data lớn và real-time reporting.

