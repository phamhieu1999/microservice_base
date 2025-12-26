# 🗃️ Database Sharding / Partitioning

Tài liệu hướng dẫn thực thi mục **6. Database Sharding / Partitioning** trong `PERFORMANCE_SCALABILITY.md`.

---

## 6.1 PostgreSQL Partitioning (Order Service)

**Mục tiêu**: Partition bảng `orders` theo thời gian (`createdAt`) để:
- Query nhanh hơn trên dữ liệu mới
- Dễ archive / xoá dữ liệu cũ theo từng partition

### Script

File: `deploy/postgres/order-partitioning.sql`

Nội dung chính:
- Tạo bảng `orders_partitioned` với `PARTITION BY RANGE ("createdAt")`
- Tạo các partition ví dụ: `orders_2024_01`, `orders_2024_02`
- (Tuỳ chọn) Di chuyển dữ liệu từ bảng `orders` cũ sang `orders_partitioned`
- (Tuỳ chọn) Đổi tên `orders_partitioned` thành `orders`

### Cách chạy (manual, bởi DBA)

1. Kết nối vào Postgres của **Order Service**:

```bash
psql -h localhost -p 5434 -U order_user -d order_db
```

2. Chạy script:

```sql
\i deploy/postgres/order-partitioning.sql
```

> Lưu ý: Nếu DB đang chạy production, cần:
> - Khoá ghi tạm thời hoặc chuyển ứng dụng sang chế độ read-only
> - Test trước trên staging

---

## 6.2 MongoDB Sharding (Product Service)

**Mục tiêu**: Shard collection `product_db.products` theo `sellerId` để phân tán dữ liệu giữa các shard, phù hợp hệ thống multi-seller (như Shopee).

### Script

File: `deploy/mongo/product-sharding.js`

Nội dung chính:
- `sh.enableSharding('product_db')`
- `sh.shardCollection('product_db.products', { sellerId: 1 })`

### Cách chạy (trên MongoDB sharded cluster)

1. Kết nối vào `mongos` bằng mongo shell:

```bash
mongo --host mongos:27017
```

2. Chạy script:

```javascript
load('deploy/mongo/product-sharding.js');
```

> Lưu ý:
> - docker-compose hiện tại dùng **single-node Mongo**, nên script này là **hướng dẫn cho môi trường production** khi triển khai cluster sharded thực sự.
> - Cần tạo index phù hợp trên `sellerId` trước khi shard (Mongo sẽ yêu cầu).

---

## Kết luận

- **6.1 PostgreSQL Partitioning**: Đã có script thực thi partition cho `orders` trong Order Service.
- **6.2 MongoDB Sharding**: Đã có script sharding cho `products` trong Product Service.

Hai phần này kết hợp với các tối ưu trước đó (indexing, caching, Kafka optimization) giúp hệ thống scale tốt hơn khi dữ liệu và traffic tăng mạnh.
