# Cơ Chế Load Balancing của Nginx trong Hệ Thống

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Kiến Trúc Load Balancing](#2-kiến-trúc-load-balancing)
3. [Thuật Toán Load Balancing](#3-thuật-toán-load-balancing)
4. [Health Checks và Failover](#4-health-checks-và-failover)
5. [Request Flow Chi Tiết](#5-request-flow-chi-tiết)
6. [Connection Management](#6-connection-management)
7. [Scaling Behavior](#7-scaling-behavior)
8. [Monitoring và Debugging](#8-monitoring-và-debugging)
9. [Tối Ưu Hóa](#9-tối-ưu-hóa)

---

## 1. Tổng Quan

### 1.1. Vai Trò của Nginx Load Balancer

Nginx đóng vai trò là **reverse proxy và load balancer** cho API Gateway, phân phối requests đến nhiều instances của API Gateway để:

- ✅ **Tăng throughput**: Xử lý nhiều requests đồng thời
- ✅ **High Availability**: Tự động failover khi một instance down
- ✅ **Load Distribution**: Phân phối tải đều giữa các instances
- ✅ **Single Entry Point**: Client chỉ cần biết một địa chỉ (port 80)

### 1.2. Cấu Hình Hiện Tại

**File**: `deploy/nginx/nginx.conf`

```nginx
upstream api_gateway {
    least_conn;  # Thuật toán: Least Connections
    server api-gateway:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;  # Giữ 32 connections mở
}
```

---

## 2. Kiến Trúc Load Balancing

### 2.1. Luồng Request

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTP Request
       │ GET /api/products
       ↓
┌─────────────────────────────────┐
│   Nginx Load Balancer           │
│   Port: 80                      │
│   - Nhận request                │
│   - Chọn API Gateway instance   │
│   - Forward request              │
└──────┬──────────────────────────┘
       │
       │ Chọn instance có ít connections nhất
       ↓
┌─────────────────────────────────┐
│   API Gateway Instances         │
│   (Port 3000 - Internal)        │
│                                 │
│   ┌──────────────┐             │
│   │ Instance 1   │ ← Selected  │
│   │ Connections: 5│             │
│   └──────────────┘             │
│   ┌──────────────┐             │
│   │ Instance 2   │             │
│   │ Connections: 8│             │
│   └──────────────┘             │
│   ┌──────────────┐             │
│   │ Instance 3   │             │
│   │ Connections: 6│             │
│   └──────────────┘             │
└──────┬──────────────────────────┘
       │
       │ Forward to microservice
       ↓
┌─────────────────────────────────┐
│   Microservices                 │
│   (Product, Order, Payment...) │
└─────────────────────────────────┘
```

### 2.2. Docker Network Topology

```
┌─────────────────────────────────────────┐
│      Docker Network (default)           │
│                                         │
│  ┌──────────────┐                      │
│  │   nginx-lb    │                      │
│  │   Port 80     │                      │
│  └──────┬───────┘                      │
│         │                               │
│         │ Service name: api-gateway     │
│         │ (Docker DNS resolution)      │
│         ↓                               │
│  ┌─────────────────────────────┐       │
│  │   api-gateway (service)     │       │
│  │                             │       │
│  │  ┌──────────────┐           │       │
│  │  │ Container 1 │           │       │
│  │  │ :3000       │           │       │
│  │  └──────────────┘           │       │
│  │  ┌──────────────┐           │       │
│  │  │ Container 2 │           │       │
│  │  │ :3000       │           │       │
│  │  └──────────────┘           │       │
│  │  ┌──────────────┐           │       │
│  │  │ Container 3 │           │       │
│  │  │ :3000       │           │       │
│  │  └──────────────┘           │       │
│  └─────────────────────────────┘       │
└─────────────────────────────────────────┘
```

**Lưu ý**: Khi scale với `docker compose up --scale api-gateway=3`, Docker Compose tự động tạo 3 containers. Service name `api-gateway` sẽ resolve đến tất cả containers thông qua Docker's built-in load balancing (round-robin DNS).

---

## 3. Thuật Toán Load Balancing

### 3.1. Least Connections (`least_conn`)

**Cấu hình hiện tại**:
```nginx
upstream api_gateway {
    least_conn;  # Chọn server có ít connections nhất
    server api-gateway:3000 max_fails=3 fail_timeout=30s;
}
```

**Cách hoạt động**:
1. Nginx theo dõi số lượng **active connections** đến mỗi server
2. Khi có request mới, Nginx chọn server có **ít connections nhất**
3. Đảm bảo phân phối tải đều, đặc biệt khi các requests có thời gian xử lý khác nhau

**Ví dụ**:
```
Request 1 đến → Instance 1 (connections: 0) ← Chọn
Request 2 đến → Instance 2 (connections: 0) ← Chọn
Request 3 đến → Instance 3 (connections: 0) ← Chọn
Request 4 đến → Instance 1 (connections: 1) ← Chọn (ít nhất)
Request 5 đến → Instance 2 (connections: 1) ← Chọn (ít nhất)
```

### 3.2. Các Thuật Toán Khác (Có Thể Dùng)

#### Round Robin (Mặc định)
```nginx
upstream api_gateway {
    # Không chỉ định = round robin
    server api-gateway:3000;
}
```
- **Ưu điểm**: Đơn giản, phân phối đều
- **Nhược điểm**: Không tính đến tải thực tế của server

#### IP Hash
```nginx
upstream api_gateway {
    ip_hash;  # Sticky session dựa trên IP
    server api-gateway:3000;
}
```
- **Ưu điểm**: Session persistence (cùng IP → cùng server)
- **Nhược điểm**: Không cân bằng tốt nếu có proxy/CDN

#### Weighted Round Robin
```nginx
upstream api_gateway {
    server api-gateway-1:3000 weight=3;  # Nhận 3x requests
    server api-gateway-2:3000 weight=2;  # Nhận 2x requests
    server api-gateway-3:3000 weight=1;  # Nhận 1x requests
}
```
- **Ưu điểm**: Phân phối theo capacity của server
- **Use case**: Server có cấu hình khác nhau

#### Hash (Custom Key)
```nginx
upstream api_gateway {
    hash $request_uri consistent;  # Hash theo URI
    server api-gateway:3000;
}
```
- **Ưu điểm**: Cache-friendly (cùng URI → cùng server)
- **Use case**: Cần cache per-server

### 3.3. So Sánh Thuật Toán

| Thuật Toán | Use Case | Ưu Điểm | Nhược Điểm |
|------------|----------|---------|------------|
| **least_conn** (hiện tại) | Requests có thời gian xử lý khác nhau | Cân bằng tốt nhất | Phức tạp hơn |
| **round_robin** | Requests đồng đều | Đơn giản | Không tính tải |
| **ip_hash** | Cần session persistence | Sticky session | Không cân bằng tốt |
| **weighted** | Server có capacity khác nhau | Linh hoạt | Cần cấu hình |

---

## 4. Health Checks và Failover

### 4.1. Passive Health Checks

Nginx sử dụng **passive health checks** (không có active health checks tích hợp sẵn):

```nginx
server api-gateway:3000 max_fails=3 fail_timeout=30s;
```

**Cách hoạt động**:
1. **max_fails=3**: Sau 3 lần fail liên tiếp, server được đánh dấu là "down"
2. **fail_timeout=30s**: Sau 30 giây, Nginx thử lại server
3. **Fail được tính khi**:
   - Connection timeout
   - Server trả về 5xx error
   - Server không phản hồi

**Ví dụ Flow**:
```
Request 1 → Instance 1 → 500 Error (fail 1)
Request 2 → Instance 1 → 500 Error (fail 2)
Request 3 → Instance 1 → 500 Error (fail 3) → Marked DOWN
Request 4 → Instance 2 (Instance 1 bị skip)
...
Sau 30s → Instance 1 được thử lại
```

### 4.2. Failover Mechanism

```
┌─────────────────────────────────────────┐
│   Nginx Load Balancer                   │
│                                         │
│   Upstream Pool:                        │
│   ┌──────────────┐                      │
│   │ Instance 1  │ ← UP (active)        │
│   │ Connections: 5│                      │
│   └──────────────┘                      │
│   ┌──────────────┐                      │
│   │ Instance 2  │ ← DOWN (failed)      │
│   │ Status: DOWN │                      │
│   │ Fail Count: 3│                      │
│   └──────────────┘                      │
│   ┌──────────────┐                      │
│   │ Instance 3  │ ← UP (active)        │
│   │ Connections: 3│                      │
│   └──────────────┘                      │
└─────────────────────────────────────────┘
```

**Khi một instance DOWN**:
1. Nginx tự động loại bỏ instance khỏi pool
2. Requests được chuyển đến instances còn lại
3. Sau `fail_timeout`, Nginx thử lại instance
4. Nếu instance phản hồi OK, nó được thêm lại vào pool

### 4.3. Health Check Endpoint

**Cấu hình riêng cho `/health`**:
```nginx
upstream api_gateway_health {
    server api-gateway:3000;
}

location /health {
    proxy_pass http://api_gateway_health;
    access_log off;  # Không log health checks
}
```

**Lý do tách riêng**:
- Health checks không cần load balancing phức tạp
- Giảm log noise
- Nhanh hơn (không qua upstream pool)

---

## 5. Request Flow Chi Tiết

### 5.1. Request Processing Steps

```
1. Client gửi request
   ↓
2. Nginx nhận request (Port 80)
   ↓
3. Nginx parse request headers
   ↓
4. Nginx match location block (/)
   ↓
5. Nginx chọn upstream server (least_conn)
   ↓
6. Nginx tạo connection đến API Gateway
   ↓
7. Nginx forward request với headers:
   - Host: original host
   - X-Real-IP: client IP
   - X-Forwarded-For: client IP chain
   - X-Forwarded-Proto: http/https
   ↓
8. API Gateway xử lý request
   ↓
9. API Gateway forward đến microservice
   ↓
10. Microservice trả response
    ↓
11. API Gateway trả response về Nginx
    ↓
12. Nginx trả response về Client
```

### 5.2. Headers Được Forward

**Cấu hình hiện tại**:
```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port $server_port;
```

**Ý nghĩa**:
- **Host**: Giữ nguyên host header từ client
- **X-Real-IP**: IP thực của client (quan trọng cho logging, rate limiting)
- **X-Forwarded-For**: Chain của proxies (nếu có nhiều layer)
- **X-Forwarded-Proto**: Protocol (http/https) - quan trọng cho redirects
- **X-Forwarded-Host**: Host name - quan trọng cho virtual hosting
- **X-Forwarded-Port**: Port - quan trọng cho URL generation

### 5.3. Timeout Configuration

```nginx
proxy_connect_timeout 60s;  # Timeout khi connect đến upstream
proxy_send_timeout 60s;     # Timeout khi gửi request
proxy_read_timeout 60s;     # Timeout khi đợi response
```

**Ý nghĩa**:
- **connect_timeout**: Thời gian chờ kết nối đến API Gateway (default: 60s)
- **send_timeout**: Thời gian gửi request body (default: 60s)
- **read_timeout**: Thời gian đợi response từ API Gateway (default: 60s)

**Khi timeout xảy ra**:
- Nginx trả về **504 Gateway Timeout**
- Nếu có `max_fails`, đếm là một fail
- Request có thể được retry (nếu client hỗ trợ)

---

## 6. Connection Management

### 6.1. Keepalive Connections

**Cấu hình**:
```nginx
upstream api_gateway {
    keepalive 32;  # Giữ 32 connections mở đến mỗi server
}
```

**Cách hoạt động**:
1. Nginx giữ **32 connections** mở đến mỗi API Gateway instance
2. Khi có request mới, Nginx **tái sử dụng** connection thay vì tạo mới
3. Giảm overhead của TCP handshake

**Lợi ích**:
- ✅ **Giảm latency**: Không cần TCP handshake cho mỗi request
- ✅ **Tăng throughput**: Tận dụng connections sẵn có
- ✅ **Giảm CPU**: Ít overhead hơn

**Ví dụ**:
```
Request 1 → Tạo connection mới → Giữ connection
Request 2 → Tái sử dụng connection (nhanh hơn)
Request 3 → Tái sử dụng connection (nhanh hơn)
...
Request 33 → Tạo connection mới (vì đã dùng hết 32)
```

### 6.2. Connection Pooling

```
┌─────────────────────────────────────────┐
│   Nginx                                 │
│                                         │
│   Connection Pool to API Gateway:       │
│   ┌──────────────┐                      │
│   │ Connection 1│ ← Active              │
│   │ Connection 2│ ← Idle (keepalive)    │
│   │ Connection 3│ ← Idle (keepalive)    │
│   │ ...          │                      │
│   │ Connection 32│ ← Idle (keepalive)   │
│   └──────────────┘                      │
└─────────────────────────────────────────┘
```

### 6.3. HTTP/1.1 và HTTP/2

**Cấu hình hiện tại**:
```nginx
proxy_http_version 1.1;  # Sử dụng HTTP/1.1
```

**HTTP/1.1**:
- Hỗ trợ keepalive (giữ connection mở)
- Một connection = một request tại một thời điểm (pipelining ít dùng)

**HTTP/2** (nếu upgrade):
- Multiplexing: Nhiều requests trên một connection
- Header compression
- Server push

**WebSocket Support**:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```
- Cho phép upgrade HTTP connection lên WebSocket
- Quan trọng cho real-time features

---

## 7. Scaling Behavior

### 7.1. Docker Compose Scaling

**Command**:
```bash
docker compose up -d --scale api-gateway=3
```

**Kết quả**:
- Docker Compose tạo 3 containers: `api-gateway-1`, `api-gateway-2`, `api-gateway-3`
- Service name `api-gateway` resolve đến tất cả containers qua Docker DNS
- Docker's built-in load balancing (round-robin DNS) phân phối requests

### 7.2. Nginx với Multiple Instances

**Vấn đề**: Với cấu hình hiện tại:
```nginx
server api-gateway:3000 max_fails=3 fail_timeout=30s;
```

Nginx chỉ thấy **một upstream server** (`api-gateway:3000`), nhưng Docker DNS tự động load balance đến 3 containers.

**Giải pháp 1: Dựa vào Docker DNS (Hiện tại)**
- ✅ Đơn giản, không cần cấu hình
- ✅ Docker tự động load balance
- ❌ Không kiểm soát được thuật toán (luôn round-robin)
- ❌ Khó monitor từng instance

**Giải pháp 2: Explicit Server Names**
```nginx
upstream api_gateway {
    least_conn;
    server api-gateway-1:3000 max_fails=3 fail_timeout=30s;
    server api-gateway-2:3000 max_fails=3 fail_timeout=30s;
    server api-gateway-3:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```
- ✅ Kiểm soát được thuật toán (least_conn)
- ✅ Monitor từng instance riêng
- ❌ Cần cập nhật config khi scale
- ❌ Cần service discovery hoặc manual config

### 7.3. Dynamic Scaling

**Với Docker Compose**:
- Scale up: `docker compose up -d --scale api-gateway=5`
- Scale down: `docker compose up -d --scale api-gateway=2`
- Nginx tự động phát hiện instances mới (qua Docker DNS)

**Với Kubernetes**:
- Sử dụng Service với multiple Pods
- Nginx upstream trỏ đến Service name
- Kubernetes tự động load balance

---

## 8. Monitoring và Debugging

### 8.1. Access Logs

**Cấu hình**:
```nginx
access_log /var/log/nginx/api_gateway_access.log;
error_log /var/log/nginx/api_gateway_error.log;
```

**Xem logs**:
```bash
# Access logs
docker compose exec nginx tail -f /var/log/nginx/api_gateway_access.log

# Error logs
docker compose exec nginx tail -f /var/log/nginx/api_gateway_error.log
```

**Log format mặc định**:
```
192.168.1.1 - - [25/Dec/2024:10:00:00 +0000] "GET /api/products HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
```

### 8.2. Upstream Status

**Kiểm tra upstream status** (cần module `nginx-mod-http-upstream-fair` hoặc custom):
```bash
# Test từng instance
curl http://api-gateway:3000/health

# Test qua Nginx
curl http://localhost/health
```

### 8.3. Connection Monitoring

**Kiểm tra connections**:
```bash
# Trong Nginx container
docker compose exec nginx netstat -an | grep :3000

# Check active connections
docker compose exec nginx ss -tn | grep :3000
```

### 8.4. Debugging Tips

**1. Kiểm tra upstream resolution**:
```bash
docker compose exec nginx nslookup api-gateway
```

**2. Test từ Nginx container**:
```bash
docker compose exec nginx wget -O- http://api-gateway:3000/health
```

**3. Kiểm tra config syntax**:
```bash
docker compose exec nginx nginx -t
```

**4. Reload config (không downtime)**:
```bash
docker compose exec nginx nginx -s reload
```

---

## 9. Tối Ưu Hóa

### 9.1. Tăng Keepalive Connections

**Nếu có nhiều traffic**:
```nginx
upstream api_gateway {
    least_conn;
    server api-gateway:3000 max_fails=3 fail_timeout=30s;
    keepalive 64;  # Tăng từ 32 lên 64
}
```

### 9.2. Tối Ưu Buffer Sizes

**Cấu hình hiện tại**:
```nginx
client_max_body_size 10M;
client_body_buffer_size 128k;
```

**Tối ưu cho large requests**:
```nginx
client_max_body_size 50M;
client_body_buffer_size 256k;
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
```

### 9.3. Caching (Nếu Cần)

**Cache static responses**:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g;

location /api/products {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_pass http://api_gateway;
}
```

### 9.4. Rate Limiting

**Giới hạn requests từ một IP**:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location / {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://api_gateway;
}
```

### 9.5. Gzip Compression

**Nén responses**:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

---

## 10. Tổng Kết

### 10.1. Cơ Chế Hoạt Động

1. **Thuật toán**: Least Connections - chọn server có ít connections nhất
2. **Health checks**: Passive - dựa vào response codes và timeouts
3. **Failover**: Tự động loại bỏ unhealthy servers, retry sau `fail_timeout`
4. **Connection management**: Keepalive 32 connections để tái sử dụng
5. **Scaling**: Docker DNS tự động load balance khi scale

### 10.2. Ưu Điểm

- ✅ **High Availability**: Tự động failover
- ✅ **Load Distribution**: Phân phối tải đều
- ✅ **Performance**: Keepalive connections giảm latency
- ✅ **Scalability**: Dễ dàng scale API Gateway instances

### 10.3. Hạn Chế

- ❌ **Passive health checks**: Không có active health checks tích hợp
- ❌ **Session persistence**: Không có sticky sessions (cần dùng `ip_hash`)
- ❌ **Statistics**: Không có dashboard tích hợp (cần module bên ngoài)

### 10.4. Best Practices

1. **Monitor logs**: Theo dõi access/error logs để phát hiện vấn đề
2. **Tune timeouts**: Điều chỉnh timeouts phù hợp với application
3. **Keepalive**: Tăng keepalive connections nếu có nhiều traffic
4. **Health checks**: Đảm bảo API Gateway có `/health` endpoint
5. **Scaling**: Scale API Gateway dựa trên metrics (CPU, memory, connections)

---

## Tài Liệu Tham Khảo

- [Nginx Load Balancing Documentation](https://nginx.org/en/docs/http/load_balancing.html)
- [Nginx Upstream Module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [NGINX_HAPROXY_ANALYSIS.md](./NGINX_HAPROXY_ANALYSIS.md) - So sánh Nginx vs HAProxy
- [NGINX_INTEGRATION.md](../deploy/NGINX_INTEGRATION.md) - Hướng dẫn tích hợp



