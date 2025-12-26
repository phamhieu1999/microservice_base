# 🚀 Gợi ý Hiệu năng & Mở rộng (Performance & Scalability)

Tài liệu này tổng hợp các gợi ý tối ưu hiệu năng và chiến lược mở rộng cho hệ thống microservice e-commerce.

---

## 📊 1. Database Optimization

### 1.1 Connection Pooling

**Vấn đề hiện tại**: Chưa có cấu hình connection pool cho PostgreSQL và MongoDB.

**Giải pháp**:

#### PostgreSQL (TypeORM)
```typescript
// services/*/src/database/database.module.ts
TypeOrmModule.forRoot({
  // ... existing config
  extra: {
    max: 20, // Maximum pool size
    min: 5,  // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  poolSize: 20,
})
```

#### MongoDB (Mongoose)
```typescript
// services/*/src/database/database.module.ts
MongooseModule.forRoot(mongoUri, {
  maxPoolSize: 20,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
})
```

**Lợi ích**: Giảm overhead tạo/kết nối DB, tăng throughput.

---

### 1.2 Indexing Strategy

**Các index cần bổ sung**:

#### PostgreSQL
```sql
-- Order Service
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_seller_id ON order_items(seller_id);

-- Payment Service
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_idempotency_key ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Auth Service
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_jti ON refresh_tokens(jti);

-- Settlement Service
CREATE INDEX idx_seller_balances_seller_id ON seller_balances(seller_id);
CREATE INDEX idx_payout_requests_seller_id_status ON payout_requests(seller_id, status);
```

#### MongoDB
```javascript
// Product Service
db.products.createIndex({ name: "text", description: "text" });
db.products.createIndex({ category: 1, brand: 1 });
db.products.createIndex({ sellerId: 1, status: 1 });
db.products.createIndex({ createdAt: -1 });

// Cart Service
db.carts.createIndex({ userId: 1 }, { unique: true });

// Review Service
db.reviews.createIndex({ productId: 1, rating: -1 });
db.reviews.createIndex({ userId: 1, createdAt: -1 });

// Chat Service
db.conversations.createIndex({ buyerId: 1, sellerId: 1 });
db.messages.createIndex({ conversationId: 1, createdAt: -1 });

// Notification Service
db.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, type: 1 });
```

**Lợi ích**: Tăng tốc query 10-100x cho các truy vấn thường dùng.

---

### 1.3 Query Optimization

**Best Practices**:

1. **Select only needed fields**:
```typescript
// ❌ Bad
const orders = await orderRepository.find();

// ✅ Good
const orders = await orderRepository.find({
  select: ['id', 'status', 'totalAmount', 'createdAt'],
  where: { userId },
  take: 20,
  skip: (page - 1) * 20,
});
```

2. **Use pagination**:
```typescript
// Always paginate large result sets
const products = await productRepository.find({
  take: limit,
  skip: (page - 1) * limit,
});
```

3. **Avoid N+1 queries**:
```typescript
// ❌ Bad - N+1 query
const orders = await orderRepository.find();
for (const order of orders) {
  order.items = await orderItemRepository.find({ orderId: order.id });
}

// ✅ Good - Use relations
const orders = await orderRepository.find({
  relations: ['items'],
});
```

4. **Use aggregation pipelines** (MongoDB):
```typescript
// For analytics queries
const topProducts = await productModel.aggregate([
  { $match: { status: 'ACTIVE' } },
  { $group: { _id: '$category', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);
```

---

## 🗄️ 2. Caching Strategy

### 2.1 Redis Caching Layers

**Hiện tại**: Đã có Redis cache cho `product-service` và `search-service`.

**Mở rộng**:

#### A. API Gateway Response Cache
```typescript
// services/api-gateway/src/common/cache/cache.interceptor.ts
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cache: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const cacheKey = `gateway:${request.method}:${request.url}`;

    // Cache GET requests only
    if (request.method === 'GET') {
      const cached = await this.cache.get(cacheKey);
      if (cached) return of(cached);
    }

    return next.handle().pipe(
      tap((data) => {
        if (request.method === 'GET') {
          this.cache.set(cacheKey, data, 60); // 1 minute TTL
        }
      }),
    );
  }
}
```

#### B. User Session Cache
```typescript
// services/auth-service/src/common/cache/session.cache.ts
@Injectable()
export class SessionCacheService {
  async cacheUserSession(userId: string, userData: any, ttl = 3600) {
    await this.cache.set(`session:${userId}`, userData, ttl);
  }

  async getUserSession(userId: string) {
    return this.cache.get(`session:${userId}`);
  }
}
```

#### C. Cart Cache
```typescript
// services/cart-service/src/modules/cart/cart.service.ts
async getCart(userId: string) {
  const cacheKey = `cart:${userId}`;
  return this.cache.getOrSet(cacheKey, async () => {
    return this.cartRepository.findByUserId(userId);
  }, 300); // 5 minutes
}
```

#### D. Analytics Cache
```typescript
// services/analytics-service/src/modules/analytics/analytics.service.ts
async getTopProducts(limit: number) {
  const cacheKey = `analytics:top-products:${limit}`;
  return this.cache.getOrSet(cacheKey, async () => {
    // Expensive aggregation query
    return this.productMetricModel.aggregate([...]);
  }, 300); // 5 minutes
}
```

---

### 2.2 Cache Invalidation Strategy

**Pattern**: Write-through + TTL + Event-driven invalidation

```typescript
// Example: Invalidate product cache on update
async updateProduct(id: string, data: UpdateProductDto) {
  const product = await this.productRepository.update(id, data);
  
  // Invalidate cache
  await this.cache.del(`product:${id}`);
  await this.cache.invalidatePattern(`search:category:${product.category}:`);
  await this.cache.invalidatePattern(`search:brand:${product.brand}:`);
  
  // Emit event for other services
  await this.kafkaService.emit('product.updated', { id, ...data });
  
  return product;
}
```

---

### 2.3 CDN for Static Assets

**Recommendation**: Sử dụng CDN (CloudFront, Cloudflare) cho:
- Product images
- User avatars
- Static API responses (có thể cache)

```typescript
// services/product-service/src/modules/product/product.controller.ts
@Get(':id/image')
@Header('Cache-Control', 'public, max-age=31536000') // 1 year
async getProductImage(@Param('id') id: string) {
  // Return CDN URL
  return { url: `https://cdn.example.com/products/${id}.jpg` };
}
```

---

## 🌐 3. API Gateway Optimization

### 3.1 Rate Limiting Enhancement

**Hiện tại**: Global rate limit 100 req/60s.

**Cải thiện**:

```typescript
// services/api-gateway/src/modules/app.module.ts
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 100,
  // Per-endpoint limits
  throttlers: [
    { name: 'auth', ttl: 60, limit: 5 }, // 5 req/min for auth
    { name: 'search', ttl: 60, limit: 30 }, // 30 req/min for search
    { name: 'order', ttl: 60, limit: 10 }, // 10 req/min for order
  ],
}),
```

**User-based rate limiting**:
```typescript
// services/api-gateway/src/modules/auth/rate-limit.guard.ts
@Injectable()
export class UserRateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    
    if (!userId) return true;
    
    const key = `ratelimit:user:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 60);
    
    return count <= 100; // 100 req/min per user
  }
}
```

---

### 3.2 Response Compression

```typescript
// services/api-gateway/src/main.ts
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression()); // Enable gzip compression
  // ...
}
```

**Lợi ích**: Giảm 60-80% response size.

---

### 3.3 Request Batching

```typescript
// services/api-gateway/src/modules/product-proxy/product-proxy.controller.ts
@Post('products/batch')
async getProductsBatch(@Body() body: { ids: string[] }) {
  // Fetch multiple products in parallel
  const products = await Promise.all(
    body.ids.map(id => this.productService.getProduct(id))
  );
  return products;
}
```

---

### 3.4 Circuit Breaker for Downstream Services

**Hiện tại**: Đã có Circuit Breaker trong `payment-service`.

**Mở rộng**: Áp dụng cho tất cả service-to-service calls.

```typescript
// services/api-gateway/src/common/circuit-breaker/http-circuit-breaker.interceptor.ts
@Injectable()
export class HttpCircuitBreakerInterceptor implements NestInterceptor {
  constructor(private circuitBreaker: CircuitBreakerService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return this.circuitBreaker.execute(() => next.handle());
  }
}
```

---

## 📨 4. Kafka Optimization

### 4.1 Topic Partitioning

**Best Practice**: Số partition = số consumer instances (hoặc bội số).

```yaml
# deploy/kafka/topics.yml
topics:
  - name: order.created
    partitions: 6  # Support 6 parallel consumers
    replication-factor: 2
  
  - name: payment.success
    partitions: 4
  
  - name: product.updated
    partitions: 3
```

**Lợi ích**: Tăng throughput xử lý event.

---

### 4.2 Consumer Group Strategy

```typescript
// services/notification-service/src/kafka/notification.consumer.ts
@KafkaListener({
  topics: ['order.created', 'payment.success'],
  groupId: 'notification-service-group',
  // Process in batches
  consumer: {
    maxPollRecords: 100,
    fetchMinBytes: 1024,
    fetchMaxWaitMs: 500,
  },
})
```

---

### 4.3 Event Batching

```typescript
// Batch multiple events before processing
@KafkaListener({
  topics: ['analytics.*'],
  groupId: 'analytics-service-group',
})
async handleAnalyticsEvents(messages: Message[]) {
  // Process batch
  const events = messages.map(m => JSON.parse(m.value.toString()));
  await this.analyticsService.batchProcess(events);
}
```

---

### 4.4 Dead Letter Queue (DLQ) Enhancement

**Hiện tại**: Đã có DLQ service.

**Cải thiện**: Auto-retry với exponential backoff.

```typescript
// services/dlq-service/src/modules/dlq/dlq.service.ts
async retryFailedMessage(messageId: string) {
  const message = await this.failedMessageRepository.findById(messageId);
  
  // Exponential backoff: 1s, 5s, 15s, 60s
  const delays = [1000, 5000, 15000, 60000];
  const attempt = message.retryCount || 0;
  
  if (attempt >= delays.length) {
    // Move to permanent DLQ
    await this.moveToPermanentDLQ(message);
    return;
  }
  
  // Schedule retry
  setTimeout(async () => {
    await this.republishMessage(message);
    await this.failedMessageRepository.incrementRetryCount(messageId);
  }, delays[attempt]);
}
```

---

## 🔄 5. Horizontal Scaling

### 5.1 Stateless Services

**Đảm bảo**: Tất cả services đều stateless (không lưu state trong memory).

```typescript
// ✅ Good - Stateless
@Injectable()
export class OrderService {
  constructor(
    private orderRepository: IOrderRepository, // DB state
    private kafkaService: KafkaService, // External state
  ) {}
}

// ❌ Bad - Stateful
@Injectable()
export class OrderService {
  private cache = new Map(); // In-memory state - breaks scaling
}
```

---

### 5.2 Load Balancer Configuration

```yaml
# deploy/nginx/nginx.conf (hoặc dùng AWS ALB/Cloud Load Balancer)
upstream api_gateway {
  least_conn; # Use least connections algorithm
  server api-gateway-1:3000;
  server api-gateway-2:3000;
  server api-gateway-3:3000;
}

server {
  listen 80;
  location / {
    proxy_pass http://api_gateway;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

### 5.3 Auto-scaling Strategy

**Kubernetes HPA** (nếu deploy trên K8s):

```yaml
# deploy/k8s/hpa/api-gateway-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Docker Compose scaling**:
```bash
docker-compose up --scale api-gateway=3 --scale product-service=2
```

---

## 🗃️ 6. Database Sharding / Partitioning

### 6.1 PostgreSQL Partitioning

**Order Service** - Partition by date:

```sql
-- Partition orders table by month
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP NOT NULL
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024_01 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE orders_2024_02 PARTITION OF orders
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

**Lợi ích**: Query nhanh hơn, dễ archive data cũ.

---

### 6.2 MongoDB Sharding

**Product Service** - Shard by `sellerId`:

```javascript
// Enable sharding
sh.enableSharding("product_db");
sh.shardCollection("product_db.products", { sellerId: 1 });
```

**Lợi ích**: Phân tán data theo seller, scale tốt hơn.

---

## 📈 7. Monitoring & Alerting

### 7.1 Performance Metrics

**Bổ sung metrics**:

```typescript
// services/*/src/common/metrics/metrics.service.ts
export class MetricsService {
  // Request latency histogram
  recordHttpRequestDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration
      .labels(method, route)
      .observe(duration);
  }

  // Database query duration
  recordDbQueryDuration(table: string, operation: string, duration: number) {
    this.dbQueryDuration
      .labels(table, operation)
      .observe(duration);
  }

  // Cache hit/miss ratio
  recordCacheHit(cacheKey: string) {
    this.cacheHits.inc();
  }

  recordCacheMiss(cacheKey: string) {
    this.cacheMisses.inc();
  }
}
```

---

### 7.2 Alerting Rules

**Prometheus Alertmanager**:

```yaml
# deploy/prometheus/alerts.yml
groups:
  - name: performance_alerts
    rules:
      - alert: HighResponseTime
        expr: http_request_duration_seconds{quantile="0.95"} > 1
        for: 5m
        annotations:
          summary: "95th percentile response time > 1s"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "Error rate > 5%"

      - alert: DatabaseConnectionPoolExhausted
        expr: db_connections_active / db_connections_max > 0.9
        for: 2m
        annotations:
          summary: "DB connection pool > 90%"
```

---

## 🧪 8. Load Testing & Capacity Planning

### 8.1 Load Testing Scripts

**k6 script mẫu**:

```javascript
// test/load/k6-api-gateway-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  const BASE_URL = 'http://localhost:3000';
  
  // Test product search
  const searchRes = http.get(`${BASE_URL}/products?q=laptop&limit=20`);
  check(searchRes, { 'search status 200': (r) => r.status === 200 });
  
  sleep(1);
  
  // Test order creation
  const orderRes = http.post(`${BASE_URL}/orders`, JSON.stringify({
    userId: 'test-user',
    items: [{ productId: 'prod-1', quantity: 1 }],
  }), { headers: { 'Content-Type': 'application/json' } });
  check(orderRes, { 'order status 201': (r) => r.status === 201 });
  
  sleep(2);
}
```

---

### 8.2 Capacity Planning

**Công thức tính**:

```
Required Instances = (Peak RPS × Avg Response Time) / (Target Utilization × Instance Capacity)

Example:
- Peak RPS: 1000 requests/second
- Avg Response Time: 200ms
- Target Utilization: 70%
- Instance Capacity: 100 RPS

Required Instances = (1000 × 0.2) / (0.7 × 100) = 2.86 ≈ 3 instances
```

---

## 💻 9. Code-Level Optimizations

### 9.1 Async/Await Best Practices

```typescript
// ❌ Bad - Sequential
const user = await this.userService.getUser(userId);
const orders = await this.orderService.getOrders(userId);
const cart = await this.cartService.getCart(userId);

// ✅ Good - Parallel
const [user, orders, cart] = await Promise.all([
  this.userService.getUser(userId),
  this.orderService.getOrders(userId),
  this.cartService.getCart(userId),
]);
```

---

### 9.2 Lazy Loading

```typescript
// Use lazy loading for heavy dependencies
@Injectable()
export class OrderService {
  private heavyService: HeavyService;

  async processOrder(orderId: string) {
    // Load only when needed
    if (!this.heavyService) {
      this.heavyService = await import('./heavy.service').then(m => m.HeavyService);
    }
    return this.heavyService.process(orderId);
  }
}
```

---

### 9.3 Stream Processing for Large Datasets

```typescript
// For large result sets, use streams
import { Readable } from 'stream';

async *streamOrders(userId: string) {
  const batchSize = 100;
  let skip = 0;
  
  while (true) {
    const orders = await this.orderRepository.find({
      where: { userId },
      take: batchSize,
      skip,
    });
    
    if (orders.length === 0) break;
    
    for (const order of orders) {
      yield order;
    }
    
    skip += batchSize;
  }
}
```

---

## 🏗️ 10. Infrastructure Recommendations

### 10.1 Database Read Replicas

**PostgreSQL**:
```yaml
# deploy/docker-compose.yml
postgres-auth:
  image: postgres:15
  # Primary

postgres-auth-replica:
  image: postgres:15
  environment:
    POSTGRES_MASTER_SERVICE_HOST: postgres-auth
  # Read replica
```

**Sử dụng**:
```typescript
// Read from replica, write to primary
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order, 'primary') private writeRepo: Repository<Order>,
    @InjectRepository(Order, 'replica') private readRepo: Repository<Order>,
  ) {}

  async getOrders(userId: string) {
    return this.readRepo.find({ where: { userId } }); // Read from replica
  }

  async createOrder(data: CreateOrderDto) {
    return this.writeRepo.save(data); // Write to primary
  }
}
```

---

### 10.2 Message Queue Optimization

**Kafka**:
- Tăng `batch.size` và `linger.ms` để giảm số request
- Sử dụng compression (`compression.type: snappy`)
- Tối ưu `fetch.min.bytes` và `fetch.max.wait.ms`

```yaml
# deploy/kafka/server.properties
batch.size=16384
linger.ms=10
compression.type=snappy
```

---

### 10.3 Container Resource Limits

```yaml
# deploy/docker-compose.yml
services:
  api-gateway:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 📋 11. Priority Implementation Roadmap

### Phase 1: Quick Wins (1-2 tuần)
1. ✅ Connection pooling cho PostgreSQL & MongoDB
2. ✅ Bổ sung indexes cho các query thường dùng
3. ✅ Response compression ở API Gateway
4. ✅ Cache cho Cart, User Session

### Phase 2: Medium-term (1 tháng)
1. ✅ Circuit Breaker cho tất cả service calls
2. ✅ Kafka topic partitioning
3. ✅ Database read replicas
4. ✅ Enhanced metrics & alerting

### Phase 3: Long-term (2-3 tháng)
1. ✅ Database sharding/partitioning
2. ✅ Auto-scaling (K8s HPA)
3. ✅ CDN integration
4. ✅ Advanced caching strategies

---

## 📚 Tài liệu tham khảo

- [NestJS Performance Best Practices](https://docs.nestjs.com/performance)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [MongoDB Performance Best Practices](https://www.mongodb.com/docs/manual/administration/performance/)
- [Kafka Performance Tuning](https://kafka.apache.org/documentation/#performance)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

---

**Lưu ý**: Các tối ưu này nên được triển khai dần dần, đo lường hiệu quả trước khi áp dụng tiếp. Luôn monitor metrics trước và sau khi optimize.

