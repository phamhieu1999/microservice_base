# 🔄 Horizontal Scaling Guide

Hướng dẫn scale horizontal cho hệ thống microservice e-commerce.

---

## 5.1 Stateless Services

**Đảm bảo**: Tất cả services đều stateless (không lưu business state trong memory).

### ✅ Services đã đảm bảo stateless:

- **Order Service**: Chỉ dùng `IOrderRepository` (DB state) và `KafkaService` (external state)
- **Product Service**: Chỉ dùng `IProductRepository` (DB state) và `KafkaService`
- **Payment Service**: Chỉ dùng `IPaymentRepository` (DB state) và `KafkaService`
- **Auth Service**: Chỉ dùng `AuthRepository` (DB state) và `KafkaService`
- **Tất cả services khác**: Đều tuân thủ pattern stateless

### ⚠️ Lưu ý về Operational State:

Một số services có **operational state** trong memory (Circuit Breaker, Metrics, Tracing):
- **Circuit Breaker**: State trong memory là acceptable vì mỗi instance có state riêng
- **Metrics**: Expose qua Prometheus, không cần shared state
- **Tracing**: Gửi đến Jaeger, không cần shared state

**Kết luận**: Tất cả services đều **stateless** và có thể scale horizontal.

---

## 5.2 Load Balancer Configuration

### Nginx Load Balancer

File: `deploy/nginx/nginx.conf`

**Features**:
- Least connections algorithm
- Health check endpoint
- Proper request forwarding headers
- WebSocket support
- Timeout configuration

**Deploy**:
```bash
# Build nginx image
cd deploy/nginx
docker build -t nginx-lb .

# Run nginx load balancer
docker run -d -p 80:80 --name nginx-lb nginx-lb
```

**Scale API Gateway**:
```bash
# Scale API Gateway to 3 instances
docker compose up --scale api-gateway=3

# Update nginx.conf to include all instances
# Then restart nginx
docker restart nginx-lb
```

### AWS ALB / Cloud Load Balancer

Nếu deploy trên AWS, có thể dùng Application Load Balancer thay vì Nginx.

---

## 5.3 Auto-scaling Strategy

### Docker Compose Scaling

**Scale services manually**:
```bash
# Scale API Gateway to 3 instances
docker compose up --scale api-gateway=3

# Scale Product Service to 2 instances
docker compose up --scale product-service=2

# Scale Order Service to 2 instances
docker compose up --scale order-service=2

# Scale multiple services
docker compose up --scale api-gateway=3 --scale product-service=2 --scale order-service=2
```

**Lưu ý**:
- Mỗi service instance cần unique port hoặc dùng load balancer
- Database connections sẽ được chia sẻ qua connection pool
- Kafka consumers sẽ tự động balance qua consumer groups

### Kubernetes HPA (Horizontal Pod Autoscaler)

File: `deploy/k8s/hpa/*.yaml`

**Deploy HPA**:
```bash
# Apply HPA configurations
kubectl apply -f deploy/k8s/hpa/api-gateway-hpa.yaml
kubectl apply -f deploy/k8s/hpa/product-service-hpa.yaml
kubectl apply -f deploy/k8s/hpa/order-service-hpa.yaml
kubectl apply -f deploy/k8s/hpa/payment-service-hpa.yaml

# Check HPA status
kubectl get hpa

# Watch scaling events
kubectl get hpa -w
```

**HPA Configuration**:
- **API Gateway**: 2-10 replicas, CPU 70%, Memory 80%
- **Product Service**: 2-5 replicas, CPU 70%, Memory 80%
- **Order Service**: 2-5 replicas, CPU 70%, Memory 80%
- **Payment Service**: 2-5 replicas, CPU 70%, Memory 80%

**Scaling Behavior**:
- **Scale Up**: Aggressive (100% increase, max 2 pods per minute)
- **Scale Down**: Conservative (50% decrease, 5 minute stabilization)

---

## Best Practices

1. **Health Checks**: Tất cả services đều có `/health` endpoint
2. **Graceful Shutdown**: Services xử lý SIGTERM để graceful shutdown
3. **Connection Pooling**: Database connections được pool để support multiple instances
4. **Kafka Consumer Groups**: Mỗi service có consumer group riêng để auto-balance
5. **Stateless Design**: Không có business state trong memory

---

## Monitoring Scaling

**Check service instances**:
```bash
# Docker Compose
docker compose ps

# Kubernetes
kubectl get pods -l app=api-gateway
kubectl get hpa
```

**Monitor metrics**:
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`
- Check CPU/Memory usage per service

---

## Troubleshooting

**Issue**: Services không scale đúng
- **Check**: Health checks đang pass
- **Check**: Resource limits trong K8s
- **Check**: Connection pool size đủ lớn

**Issue**: Load không được distribute đều
- **Check**: Nginx upstream configuration
- **Check**: Load balancer algorithm (least_conn vs round_robin)

