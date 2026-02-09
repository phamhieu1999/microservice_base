# Phân Tích Design Patterns trong Hệ Thống Microservices E-commerce

## Mục Lục
1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Architectural Patterns](#2-architectural-patterns)
3. [Creational Patterns](#3-creational-patterns)
4. [Structural Patterns](#4-structural-patterns)
5. [Behavioral Patterns](#5-behavioral-patterns)
6. [Microservices Patterns](#6-microservices-patterns)
7. [Tổng Kết và Đề Xuất](#7-tổng-kết-và-đề-xuất)

---

## 1. Tổng Quan Hệ Thống

### 1.1. Kiến Trúc Tổng Thể

Hệ thống được xây dựng theo kiến trúc **Microservices** với **19 services** chính:

- **API Gateway** (Port 3000) - Entry point
- **Core Services**: Auth, Product, Order, Payment, Cart, Review, Seller
- **Supporting Services**: Promotion, Shipping, Chat, Search, Notification
- **Analytics Services**: Analytics, Warehouse, Loyalty, Settlement, Dispute, DLQ

### 1.2. Công Nghệ Sử Dụng

- **Framework**: NestJS (TypeScript)
- **Databases**: PostgreSQL, MongoDB, ClickHouse, Redis, Elasticsearch
- **Message Broker**: Apache Kafka
- **Monitoring**: Prometheus, Grafana, Jaeger

---

## 2. Architectural Patterns

### 2.1. API Gateway Pattern

**Mục đích**: Tập trung entry point, xử lý routing, authentication, rate limiting

**Triển khai**:
- Service: `api-gateway` (Port 3000)
- Tất cả requests từ client đi qua API Gateway
- Xử lý authentication, authorization
- Rate limiting và throttling
- Response caching

**Load Balancing**:
- ✅ **Nginx Load Balancer**: Được cấu hình để phân phối requests đến multiple API Gateway instances
- ✅ **Algorithm**: Least connections (least_conn)
- ✅ **Health Checks**: max_fails=3, fail_timeout=30s
- ✅ **Scaling**: Có thể scale API Gateway với docker-compose: `docker compose up --scale api-gateway=3`
- ✅ **Kubernetes HPA**: Auto-scaling từ 2-10 replicas dựa trên CPU (70%) và Memory (80%)

**Cấu hình Nginx**:
```nginx
# deploy/nginx/nginx.conf
upstream api_gateway {
    least_conn;
    server api-gateway:3000 max_fails=3 fail_timeout=30s;
    # Có thể thêm nhiều instances khi scale
    keepalive 32;
}
```

**Lợi ích**:
- ✅ Single entry point
- ✅ Centralized authentication
- ✅ Request routing và load balancing
- ✅ API versioning
- ✅ High availability với multiple instances
- ✅ Automatic failover

**Ví dụ**:
```typescript
// services/api-gateway/src/modules/product-proxy/product-proxy.controller.ts
@Controller('products')
export class ProductProxyController {
  @Get()
  async getProducts(@Query() query: any) {
    return this.httpService.get(`${this.productServiceUrl}/products`, { params: query });
  }
}
```

**Lưu ý**: 
- Nginx Load Balancer hiện chưa được thêm vào `docker-compose.yml` nhưng đã có sẵn cấu hình trong `deploy/nginx/`
- Để sử dụng, cần build và chạy Nginx container riêng hoặc thêm vào docker-compose

### 2.2. Event-Driven Architecture (EDA)

**Mục đích**: Giao tiếp bất đồng bộ giữa các services thông qua events

**Triển khai**:
- Sử dụng Apache Kafka làm message broker
- Services publish/subscribe events
- Topics: `order.created`, `payment.success`, `product.created`, etc.

**Lợi ích**:
- ✅ Loose coupling giữa services
- ✅ Scalability cao
- ✅ Eventual consistency
- ✅ Resilience tốt hơn

**Ví dụ Event Flow**:
```
order-service (publish order.created)
  ↓
Kafka Topic: order.created
  ↓
Multiple Consumers:
  ├─→ product-service: Reserve stock
  ├─→ notification-service: Send notification
  ├─→ warehouse-service: Log order fact
  └─→ analytics-service: Aggregate metrics
```

**Code Example**:
```typescript
// services/order-service/src/modules/order/order.service.ts
async createOrder(userId: string, dto: CreateOrderDto) {
  const order = await this.repo.createOrder(userId, dto);
  const event: OrderCreatedEvent = {
    id: order.id,
    userId: order.userId,
    totalAmount: Number(order.totalAmount),
  };
  await this.kafka.emit(ORDER_CREATED_TOPIC, event);
  return order;
}
```

### 2.3. Database per Service Pattern

**Mục đích**: Mỗi service có database riêng, đảm bảo độc lập và scalability

**Triển khai**:
- **PostgreSQL Services**: Auth, Order, Payment, Seller, Promotion, Loyalty, Dispute, Settlement
- **MongoDB Services**: Product, Cart, Review, Chat, Notification, Search, Analytics, DLQ, Shipping
- **ClickHouse**: Warehouse Service (OLAP analytics)

**Lợi ích**:
- ✅ Service independence
- ✅ Technology diversity
- ✅ Scalability riêng biệt
- ✅ Data isolation

### 2.4. CQRS (Command Query Responsibility Segregation)

**Mục đích**: Tách biệt read và write operations để tối ưu performance

**Triển khai**:
- **Warehouse Service**: 
  - Write: Batch insert vào ClickHouse (OLAP)
  - Read: Query analytics data
  - Sử dụng batch buffering để tối ưu insert performance

**Code Example**:
```typescript
// services/warehouse-service/src/modules/warehouse/warehouse.service.ts
async insertOrderFact(data: OrderFactData) {
  // Add to buffer
  this.orderFactBuffer.push(data);
  
  // Flush nếu đủ batch size
  if (this.orderFactBuffer.length >= this.BATCH_SIZE) {
    await this.flushOrderFacts();
  }
}
```

**Lợi ích**:
- ✅ Tối ưu write performance với batch operations
- ✅ Read models có thể được optimize riêng
- ✅ Scale read và write độc lập

---

## 3. Creational Patterns

### 3.1. Factory Pattern

**Mục đích**: Tạo objects mà không cần chỉ định class cụ thể

**Triển khai**:
- **Payment Provider Factory**: Tạo payment provider dựa trên type (VNPAY, MOCK)

**Code Example**:
```typescript
// services/payment-service/src/modules/payment/providers/payment-provider.factory.ts
@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly mockProvider: MockProvider,
    private readonly vnpayProvider: VNPayProvider,
  ) {}

  getProvider(provider: PaymentProvider): IPaymentProvider {
    switch (provider) {
      case 'VNPAY':
        return this.vnpayProvider;
      case 'MOCK':
      default:
        return this.mockProvider;
    }
  }
}
```

**Sử dụng**:
```typescript
// services/payment-service/src/modules/payment/payment.service.ts
const paymentProvider = this.providerFactory.getProvider(provider as PaymentProvider);
const response = await paymentProvider.createPayment({...});
```

**Lợi ích**:
- ✅ Dễ dàng thêm payment provider mới
- ✅ Encapsulation của object creation logic
- ✅ Single Responsibility Principle

### 3.2. Dependency Injection (DI)

**Mục đích**: Inversion of Control, giảm coupling giữa components

**Triển khai**:
- NestJS built-in DI container
- Sử dụng `@Injectable()`, `@Inject()`, `@InjectRepository()`

**Code Example**:
```typescript
@Injectable()
export class ProductService {
  constructor(
    private readonly repo: ProductRepository,
    private readonly kafka: KafkaService,
  ) {}
}
```

**Lợi ích**:
- ✅ Loose coupling
- ✅ Testability cao
- ✅ Dễ dàng thay đổi implementation

---

## 4. Structural Patterns

### 4.1. Repository Pattern

**Mục đích**: Abstraction layer giữa business logic và data access

**Triển khai**:
- Mỗi service có Repository class riêng
- Interface-based design (một số services)

**Code Example**:
```typescript
// services/product-service/src/modules/product/product.repository.ts
@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly model: Model<Product>,
  ) {}

  create(data: CreateProductDto): Promise<Product> {
    return this.model.create(data);
  }

  findById(id: string): Promise<Product | null> {
    return this.model.findById(id).exec();
  }
}
```

**Interface-based Repository**:
```typescript
// services/product-service/src/domain/product/product.repository.ts
export interface IProductRepository {
  create(product: Omit<Product, 'id'>): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findAll(options?: FindAllOptions): Promise<PaginatedResult<Product>>;
}
```

**Lợi ích**:
- ✅ Separation of concerns
- ✅ Testability (mock repository)
- ✅ Dễ dàng thay đổi data source

### 4.2. Adapter Pattern

**Mục đích**: Cho phép các interface không tương thích làm việc cùng nhau

**Triển khai**:
- **Promotion Client**: HTTP client adapter cho Promotion Service
- **Elasticsearch Service**: Adapter cho Elasticsearch operations

**Code Example**:
```typescript
// services/loyalty-service/src/promotion/promotion.client.ts
@Injectable()
export class PromotionClient {
  constructor(private readonly httpService: HttpService) {}

  async validateVoucher(voucherId: string): Promise<VoucherInfo> {
    const response = await this.httpService.get(
      `${this.promotionServiceUrl}/vouchers/${voucherId}/validate`
    ).toPromise();
    return response.data;
  }
}
```

**Lợi ích**:
- ✅ Integration với external services
- ✅ Encapsulation của external API details

### 4.3. Facade Pattern

**Mục đích**: Cung cấp interface đơn giản cho complex subsystem

**Triển khai**:
- **Search Service**: Facade cho MongoDB, Elasticsearch, Redis
- **Cache Service**: Facade cho cache operations

**Code Example**:
```typescript
// services/search-service/src/modules/search/search.service.ts
@Injectable()
export class SearchService {
  constructor(
    @InjectModel(ProductIndex.name)
    private readonly productIndexModel: Model<ProductIndexDocument>,
    @Optional() private readonly cache?: CacheService,
    @Optional() private readonly elasticsearch?: ElasticsearchService,
  ) {}

  async search(query: string) {
    // Check cache first
    const cached = await this.cache?.get(`search:${query}`);
    if (cached) return cached;

    // Search in Elasticsearch or MongoDB
    const results = this.useElasticsearch
      ? await this.elasticsearch.search(query)
      : await this.productIndexModel.find({...});

    // Cache results
    await this.cache?.set(`search:${query}`, results, 3600);
    return results;
  }
}
```

**Lợi ích**:
- ✅ Simplified interface
- ✅ Hide complexity của multiple subsystems

---

## 5. Behavioral Patterns

### 5.1. Observer Pattern (Event-Driven)

**Mục đích**: Notify multiple objects về state changes

**Triển khai**:
- Kafka Consumers subscribe to topics
- Multiple consumers cho mỗi event

**Code Example**:
```typescript
// services/notification-service/src/kafka/notification.consumer.ts
@Injectable()
export class NotificationConsumer implements OnModuleInit {
  async onModuleInit() {
    await this.consumer.subscribe({ topic: 'order.created', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'payment.success', fromBeginning: true });
    
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const payload = JSON.parse(message.value.toString());
        await this.handleEvent(topic, payload);
      },
    });
  }
}
```

**Lợi ích**:
- ✅ Loose coupling giữa publisher và subscribers
- ✅ Dễ dàng thêm subscribers mới
- ✅ Eventual consistency

### 5.2. Strategy Pattern

**Mục đích**: Định nghĩa family of algorithms và làm chúng interchangeable

**Triển khai**:
- **Payment Providers**: Different payment strategies (VNPAY, MOCK)
- **Shipping Methods**: Different shipping calculation strategies

**Code Example**:
```typescript
// Payment Provider Strategy
interface IPaymentProvider {
  createPayment(data: PaymentData): Promise<PaymentResponse>;
  processWebhook(payload: WebhookPayload): Promise<PaymentStatus>;
}

class VNPayProvider implements IPaymentProvider { ... }
class MockProvider implements IPaymentProvider { ... }
```

**Lợi ích**:
- ✅ Runtime algorithm selection
- ✅ Open/Closed Principle
- ✅ Dễ dàng thêm strategies mới

### 5.3. Chain of Responsibility

**Mục đích**: Pass request qua chain of handlers

**Triển khai**:
- **NestJS Interceptors**: Request processing chain
- **Circuit Breaker Interceptor**: Circuit breaker protection

**Code Example**:
```typescript
// services/api-gateway/src/common/circuit-breaker/http-circuit-breaker.interceptor.ts
@Injectable()
export class HttpCircuitBreakerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return this.circuitBreaker.execute(
      'http-request',
      () => next.handle().toPromise(),
      () => throw new ServiceUnavailableException('Service temporarily unavailable')
    );
  }
}
```

---

## 6. Microservices Patterns

### 6.1. Saga Pattern

**Mục đích**: Quản lý distributed transactions across multiple services

**Triển khai**:
- **Order → Payment → Settlement Flow**
- Choreography-based Saga (event-driven)

**Flow**:
```
1. Order Service: Create order (status: PENDING)
   → Publish: order.created
   
2. Payment Service: Process payment
   → Publish: payment.success hoặc payment.failed
   
3. Order Service: Update status to PAID (consume payment.success)
   
4. Settlement Service: Calculate commission (consume payment.success)
   → Publish: settlement.balance.updated
```

**Code Example**:
```typescript
// services/order-service/src/kafka/payment-events.consumer.ts
@Injectable()
export class PaymentEventsConsumer {
  async handlePaymentSuccess(event: PaymentSuccessEvent) {
    await this.markPaidUseCase.execute(event.orderId);
  }
}
```

**Lợi ích**:
- ✅ Distributed transaction management
- ✅ Eventual consistency
- ✅ No single point of failure

### 6.2. Circuit Breaker Pattern

**Mục đích**: Ngăn chặn cascade failures, cung cấp fallback mechanism

**Triển khai**:
- **API Gateway**: Circuit breaker cho backend services
- **Payment Service**: Circuit breaker cho payment providers

**Code Example**:
```typescript
// services/payment-service/src/common/circuit-breaker/circuit-breaker.service.ts
@Injectable()
export class CircuitBreakerService {
  async execute<T>(
    circuitName: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    const circuit = this.getCircuitBreaker(circuitName);
    
    if (circuit.state === CircuitState.OPEN) {
      if (fallback) return fallback();
      throw new Error(`Circuit breaker ${circuitName} is OPEN`);
    }
    
    try {
      const result = await fn();
      circuit.onSuccess();
      return result;
    } catch (error) {
      circuit.onFailure();
      if (fallback) return fallback();
      throw error;
    }
  }
}
```

**States**:
- **CLOSED**: Normal operation
- **OPEN**: Failing, reject requests
- **HALF_OPEN**: Testing recovery

**Lợi ích**:
- ✅ Prevent cascade failures
- ✅ Fast failure detection
- ✅ Automatic recovery

### 6.3. Dead Letter Queue (DLQ) Pattern

**Mục đích**: Xử lý failed messages, không để mất dữ liệu

**Triển khai**:
- **DLQ Service**: Consume failed messages từ Kafka
- Retry mechanism với exponential backoff

**Code Example**:
```typescript
// services/product-service/src/kafka/order-events.consumer.ts
try {
  await this.handleOrderCreated(payload);
} catch (error) {
  this.logger.error(`Error processing order.created event`, error);
  await this.retryWithBackoff(topic, partition, offset, key, payload, error);
}
```

**Lợi ích**:
- ✅ Không mất messages
- ✅ Debugging failed messages
- ✅ Manual retry capability

### 6.4. Bulkhead Pattern

**Mục đích**: Isolate resources để prevent cascading failures

**Triển khai**:
- **Database per Service**: Isolation của data
- **Connection Pooling**: Separate pools cho mỗi service
- **Kafka Consumer Groups**: Separate groups cho mỗi service

**Lợi ích**:
- ✅ Fault isolation
- ✅ Resource protection
- ✅ Better availability

### 6.5. Service Discovery Pattern

**Mục đích**: Tự động discover và register services

**Triển khai**:
- **Docker Compose**: Service names làm service discovery
- **API Gateway**: Hardcoded service URLs (có thể cải thiện với Consul/Eureka)

**Current Implementation**:
```yaml
# deploy/docker-compose.yml
environment:
  AUTH_SERVICE_URL: http://auth-service:3001
  PRODUCT_SERVICE_URL: http://product-service:3002
```

**Đề xuất cải thiện**:
- Sử dụng Consul hoặc Eureka cho service discovery
- Health checks và automatic service registration

### 6.6. API Gateway Pattern (đã đề cập ở 2.1)

### 6.7. Database per Service Pattern (đã đề cập ở 2.3)

---

## 7. Application Patterns

### 7.1. Use Case Pattern (Application Service)

**Mục đích**: Encapsulate business logic trong use cases

**Triển khai**:
- Một số services sử dụng Use Case pattern (Order, Product, Loyalty)

**Code Example**:
```typescript
// services/order-service/src/application/order/use-cases/get-order.usecase.ts
@Injectable()
export class GetOrderUseCase {
  constructor(@Inject('IOrderRepository') private readonly repo: IOrderRepository) {}

  async execute(id: string): Promise<Order> {
    const order = await this.repo.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
```

**Lợi ích**:
- ✅ Single Responsibility
- ✅ Testability
- ✅ Reusability

### 7.2. Domain-Driven Design (DDD) Elements

**Triển khai**:
- **Domain Entities**: Order, Product, Payment
- **Repositories**: Data access abstraction
- **Use Cases**: Application layer
- **Events**: Domain events

**Structure**:
```
services/order-service/
  ├── domain/
  │   ├── order/
  │   │   ├── order.entity.ts
  │   │   └── order.repository.ts
  ├── application/
  │   └── order/
  │       └── use-cases/
  └── infrastructure/
      └── persistence/
```

---

## 8. Tổng Kết và Đề Xuất

### 8.1. Patterns Đã Triển Khai Tốt

✅ **API Gateway Pattern**: Centralized entry point
✅ **Event-Driven Architecture**: Loose coupling với Kafka
✅ **Repository Pattern**: Clean data access layer
✅ **Factory Pattern**: Payment provider creation
✅ **Circuit Breaker**: Fault tolerance
✅ **Dependency Injection**: NestJS built-in DI
✅ **CQRS**: Warehouse service với batch operations
✅ **Saga Pattern**: Distributed transactions

### 8.2. Patterns Có Thể Cải Thiện

#### 8.2.1. Service Discovery
**Hiện tại**: Hardcoded service URLs
**Đề xuất**: 
- Sử dụng Consul hoặc Eureka
- Health checks và automatic registration

#### 8.2.2. API Gateway Caching
**Hiện tại**: Có CacheService nhưng chưa triển khai đầy đủ
**Đề xuất**:
- Response caching cho GET requests
- Cache invalidation strategy

#### 8.2.3. Retry Pattern
**Hiện tại**: Có retry logic trong một số consumers
**Đề xuất**:
- Standardized retry mechanism
- Exponential backoff với jitter
- Max retry limits

#### 8.2.4. Bulkhead Pattern
**Hiện tại**: Database per service (good)
**Đề xuất**:
- Thread pool isolation
- Connection pool limits per service

#### 8.2.5. Outbox Pattern
**Hiện tại**: Direct Kafka publish (có thể mất events nếu service crash)
**Đề xuất**:
- Transactional outbox pattern
- Guarantee event delivery

### 8.3. Patterns Có Thể Thêm

#### 8.3.1. API Composition Pattern
**Mục đích**: Aggregate data từ multiple services
**Triển khai**: API Gateway có thể compose responses từ multiple services

#### 8.3.2. Backend for Frontend (BFF) Pattern
**Mục đích**: Separate API Gateway cho mobile và web clients
**Triển khai**: Tạo mobile-api-gateway và web-api-gateway

#### 8.3.3. Strangler Fig Pattern
**Mục đích**: Migrate từ monolith sang microservices
**Triển khai**: Nếu có legacy system, có thể áp dụng pattern này

#### 8.3.4. Sidecar Pattern
**Mục đích**: Cross-cutting concerns (logging, monitoring)
**Triển khai**: Sử dụng với Kubernetes và service mesh

### 8.4. Best Practices Đang Áp Dụng

✅ **Separation of Concerns**: Mỗi service có responsibility riêng
✅ **Loose Coupling**: Giao tiếp qua events và HTTP
✅ **High Cohesion**: Services được tổ chức tốt
✅ **Stateless Services**: Tất cả services đều stateless
✅ **Health Checks**: Mỗi service có `/health` endpoint
✅ **Structured Logging**: Correlation IDs cho tracing
✅ **Input Validation**: DTOs với class-validator
✅ **Error Handling**: Consistent error responses

### 8.5. Metrics và Monitoring

✅ **Prometheus**: Metrics collection
✅ **Grafana**: Visualization
✅ **Jaeger**: Distributed tracing
✅ **Health Checks**: Service health monitoring

---

## 9. Kết Luận

Hệ thống đã triển khai **nhiều design patterns** một cách hiệu quả:

1. **Architectural Patterns**: API Gateway, Event-Driven, Database per Service, CQRS
2. **Creational Patterns**: Factory, Dependency Injection
3. **Structural Patterns**: Repository, Adapter, Facade
4. **Behavioral Patterns**: Observer (Event-Driven), Strategy, Chain of Responsibility
5. **Microservices Patterns**: Saga, Circuit Breaker, DLQ, Bulkhead

Hệ thống được thiết kế với:
- ✅ **Scalability**: Horizontal scaling support
- ✅ **Resilience**: Circuit breaker, retry, DLQ
- ✅ **Maintainability**: Clean architecture, separation of concerns
- ✅ **Observability**: Metrics, tracing, logging

**Đề xuất tiếp theo**:
- Cải thiện Service Discovery
- Triển khai Outbox Pattern
- Standardize Retry Pattern
- Thêm API Composition trong API Gateway

---

**Tài liệu được tạo**: 2024
**Phiên bản**: 1.0
**Tác giả**: System Analysis

