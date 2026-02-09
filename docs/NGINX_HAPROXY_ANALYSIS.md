# Tổng Hợp Nginx và HAProxy trong Hệ Thống Microservices

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Nginx Load Balancer - Hiện Trạng](#2-nginx-load-balancer---hiện-trạng)
3. [HAProxy - Tổng Quan](#3-haproxy---tổng-quan)
4. [So Sánh Nginx vs HAProxy](#4-so-sánh-nginx-vs-haproxy)
5. [Khi Nào Dùng Nginx? Khi Nào Dùng HAProxy?](#5-khi-nào-dùng-nginx-khi-nào-dùng-haproxy)
6. [Cấu Hình Chi Tiết](#6-cấu-hình-chi-tiết)
7. [Tích Hợp vào Docker Compose](#7-tích-hợp-vào-docker-compose)
8. [Best Practices](#8-best-practices)

---

## 1. Tổng Quan

### 1.1. Vai Trò Load Balancer trong Microservices

Trong kiến trúc microservices, **Load Balancer** đóng vai trò quan trọng:

- ✅ **Phân phối traffic** đến nhiều instances của cùng một service
- ✅ **High Availability**: Tự động failover khi một instance down
- ✅ **Health Checks**: Loại bỏ unhealthy instances khỏi pool
- ✅ **Session Persistence**: Giữ session sticky (nếu cần)
- ✅ **SSL Termination**: Xử lý HTTPS ở tầng load balancer
- ✅ **Rate Limiting**: Giới hạn số requests từ một client

### 1.2. Load Balancer trong Hệ Thống Hiện Tại

**Hiện trạng**:
- ✅ **Nginx**: Đã có cấu hình sẵn trong `deploy/nginx/` nhưng **chưa được tích hợp vào docker-compose.yml**
- ❌ **HAProxy**: Chưa được sử dụng trong hệ thống

**Kiến trúc hiện tại**:
```
Client Request
    ↓
Nginx Load Balancer (Port 80) [Chưa chạy trong docker-compose]
    ↓
API Gateway Instances (Port 3000)
    ├─→ api-gateway-1:3000
    ├─→ api-gateway-2:3000
    └─→ api-gateway-3:3000
    ↓
Microservices (Auth, Order, Payment, ...)
```

---

## 2. Nginx Load Balancer - Hiện Trạng

### 2.1. Cấu Hình Hiện Tại

**File**: `deploy/nginx/nginx.conf`

**Tính năng đã cấu hình**:
- ✅ **Algorithm**: Least Connections (`least_conn`)
- ✅ **Health Checks**: `max_fails=3`, `fail_timeout=30s`
- ✅ **Keepalive**: 32 connections
- ✅ **WebSocket Support**: Đã cấu hình
- ✅ **Request Headers**: X-Real-IP, X-Forwarded-For, X-Forwarded-Proto
- ✅ **Timeout Configuration**: Connect 60s, Send 60s, Read 60s
- ✅ **Static Assets Caching**: Cache 1h cho `/static/`

**Cấu hình chi tiết**:

```nginx
upstream api_gateway {
    least_conn;
    server api-gateway:3000 max_fails=3 fail_timeout=30s;
    # Có thể thêm khi scale:
    # server api-gateway-2:3000 max_fails=3 fail_timeout=30s;
    # server api-gateway-3:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

### 2.2. Ưu Điểm của Nginx

1. **Hiệu Năng Cao**:
   - Event-driven architecture (không dùng thread)
   - Xử lý hàng chục nghìn connections đồng thời
   - Memory footprint thấp

2. **Tính Năng Phong Phú**:
   - Reverse proxy
   - Load balancing (4 algorithms: round-robin, least_conn, ip_hash, hash)
   - SSL/TLS termination
   - HTTP/2, WebSocket support
   - Caching (proxy_cache)
   - Rate limiting (limit_req, limit_conn)
   - Gzip compression
   - Static file serving

3. **Dễ Cấu Hình**:
   - Cú pháp cấu hình đơn giản, dễ đọc
   - Hỗ trợ nhiều modules
   - Tài liệu phong phú

4. **Phổ Biến**:
   - Được sử dụng rộng rãi trong production
   - Community lớn, nhiều best practices

### 2.3. Nhược Điểm của Nginx

1. **Health Checks Hạn Chế**:
   - Chỉ có passive health checks (dựa vào response codes)
   - Không có active health checks tích hợp sẵn (cần dùng nginx-plus hoặc module bên ngoài)

2. **Session Persistence**:
   - Cần dùng `ip_hash` hoặc `hash` directive
   - Không có cookie-based session persistence tích hợp

3. **Layer 4 Load Balancing**:
   - Chủ yếu làm việc ở Layer 7 (HTTP)
   - Layer 4 (TCP) cần cấu hình riêng

---

## 3. HAProxy - Tổng Quan

### 3.1. Giới Thiệu HAProxy

**HAProxy** (High Availability Proxy) là một load balancer và reverse proxy mã nguồn mở, chuyên về:

- ✅ **TCP/HTTP Load Balancing**
- ✅ **Advanced Health Checks**
- ✅ **Session Persistence**
- ✅ **Statistics Dashboard**
- ✅ **ACL (Access Control Lists)**

### 3.2. Ưu Điểm của HAProxy

1. **Health Checks Mạnh Mẽ**:
   - Active health checks tích hợp sẵn
   - Nhiều loại check: HTTP, TCP, MySQL, PostgreSQL, Redis
   - Cấu hình chi tiết: interval, timeout, retries

2. **Session Persistence**:
   - Cookie-based session persistence (appsession, cookie)
   - Source IP-based persistence
   - URL-based persistence

3. **Statistics Dashboard**:
   - Web-based stats page tích hợp
   - Real-time metrics: connections, requests, errors
   - CSV export

4. **ACL và Routing**:
   - Advanced routing rules dựa trên headers, paths, IPs
   - Content switching
   - Request/Response manipulation

5. **Layer 4 và Layer 7**:
   - Hỗ trợ cả TCP (Layer 4) và HTTP (Layer 7)
   - Có thể load balance bất kỳ protocol nào

6. **High Performance**:
   - Event-driven, single-threaded
   - Xử lý hàng trăm nghìn connections
   - Zero-copy forwarding

### 3.3. Nhược Điểm của HAProxy

1. **Cấu Hình Phức Tạp Hơn**:
   - Cú pháp cấu hình khác biệt
   - Cần hiểu rõ về ACL, backends, frontends

2. **Static File Serving**:
   - Không có khả năng serve static files như Nginx
   - Chỉ làm reverse proxy/load balancer

3. **Caching**:
   - Không có caching tích hợp
   - Cần kết hợp với Nginx hoặc Varnish

---

## 4. So Sánh Nginx vs HAProxy

| Tiêu Chí | Nginx | HAProxy |
|----------|-------|---------|
| **Primary Use Case** | Web server + Reverse proxy + Load balancer | Load balancer + Reverse proxy |
| **Health Checks** | Passive (dựa vào response) | Active + Passive (tích hợp sẵn) |
| **Session Persistence** | ip_hash, hash (hạn chế) | Cookie-based, source IP (mạnh) |
| **Statistics** | Cần module bên ngoài | Tích hợp sẵn (stats page) |
| **Static Files** | ✅ Có | ❌ Không |
| **Caching** | ✅ Có (proxy_cache) | ❌ Không |
| **Layer 4 (TCP)** | Cần cấu hình riêng | ✅ Hỗ trợ tốt |
| **Layer 7 (HTTP)** | ✅ Hỗ trợ tốt | ✅ Hỗ trợ tốt |
| **ACL/Routing** | Cơ bản | ✅ Mạnh mẽ |
| **Cấu Hình** | Đơn giản, dễ đọc | Phức tạp hơn |
| **Performance** | Rất cao | Rất cao |
| **Community** | Rất lớn | Lớn |
| **SSL Termination** | ✅ Có | ✅ Có |
| **WebSocket** | ✅ Có | ✅ Có |

---

## 5. Khi Nào Dùng Nginx? Khi Nào Dùng HAProxy?

### 5.1. Dùng Nginx Khi:

✅ **Cần serve static files**:
- Frontend assets (HTML, CSS, JS, images)
- API Gateway cũng serve static content

✅ **Cần caching**:
- Cache API responses
- Cache static assets

✅ **Cần một giải pháp "all-in-one"**:
- Web server + Reverse proxy + Load balancer trong một
- Giảm số lượng components

✅ **Cấu hình đơn giản**:
- Team quen với Nginx
- Cần setup nhanh

✅ **HTTP/HTTPS load balancing đơn giản**:
- Round-robin, least connections
- Không cần advanced routing

**Ví dụ trong hệ thống hiện tại**:
- Load balance API Gateway instances
- Serve static assets (nếu có)
- Cache một số API responses

### 5.2. Dùng HAProxy Khi:

✅ **Cần advanced health checks**:
- Active health checks với custom intervals
- Health checks cho database connections
- Health checks cho nhiều loại services

✅ **Cần session persistence mạnh**:
- Cookie-based session affinity
- Sticky sessions cho stateful services

✅ **Cần statistics dashboard**:
- Real-time monitoring
- Connection/request metrics
- Error tracking

✅ **Cần advanced routing**:
- Route dựa trên headers, paths, query params
- Content switching
- A/B testing

✅ **Cần Layer 4 load balancing**:
- Load balance TCP connections (database, Redis, etc.)
- Không chỉ HTTP

✅ **Cần ACL và security rules**:
- IP whitelisting/blacklisting
- Rate limiting per IP
- Request filtering

**Ví dụ use cases**:
- Load balance database connections (PostgreSQL read replicas)
- Load balance Redis clusters
- Advanced routing cho microservices (route dựa trên headers)
- Session persistence cho stateful services

### 5.3. Kết Hợp Cả Hai

**Kiến trúc kết hợp** (Nginx + HAProxy):

```
Client
    ↓
Nginx (Port 80/443)
    ├─→ Serve static files
    ├─→ SSL termination
    ├─→ Caching
    ↓
HAProxy (Port 8080)
    ├─→ Advanced load balancing
    ├─→ Health checks
    ├─→ Statistics
    ↓
API Gateway Instances
```

**Lợi ích**:
- Tận dụng ưu điểm của cả hai
- Nginx: Static files, caching
- HAProxy: Advanced load balancing, health checks

**Nhược điểm**:
- Tăng độ phức tạp
- Thêm một hop (latency tăng nhẹ)

---

## 6. Cấu Hình Chi Tiết

### 6.1. Nginx Configuration (Hiện Tại)

**File**: `deploy/nginx/nginx.conf`

```nginx
upstream api_gateway {
    least_conn;
    server api-gateway:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6.2. HAProxy Configuration (Mẫu)

**File**: `deploy/haproxy/haproxy.cfg` (Đề xuất)

```haproxy
global
    log stdout format raw local0
    maxconn 4096
    daemon

defaults
    mode http
    log global
    option httplog
    option dontlognull
    option forwardfor
    option http-server-close
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

# Statistics Dashboard
frontend stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE

# Main Frontend
frontend api_frontend
    bind *:80
    default_backend api_gateway_backend

    # ACL for health checks
    acl is_health path_beg /health
    use_backend health_backend if is_health

# Health Check Backend
backend health_backend
    server api-gateway-1 api-gateway:3000 check

# API Gateway Backend
backend api_gateway_backend
    balance leastconn
    option httpchk GET /health
    http-check expect status 200
    
    # Session persistence (cookie-based)
    cookie SERVERID insert indirect nocache
    
    server api-gateway-1 api-gateway:3000 check cookie s1
    # Thêm khi scale:
    # server api-gateway-2 api-gateway-2:3000 check cookie s2
    # server api-gateway-3 api-gateway-3:3000 check cookie s3
```

**Tính năng trong cấu hình HAProxy**:
- ✅ **Statistics Dashboard**: Port 8404, `/stats`
- ✅ **Active Health Checks**: `option httpchk GET /health`
- ✅ **Cookie-based Session Persistence**: `cookie SERVERID`
- ✅ **Least Connections**: `balance leastconn`
- ✅ **ACL Routing**: Route `/health` đến backend riêng

### 6.3. So Sánh Cấu Hình

| Tính Năng | Nginx | HAProxy |
|-----------|-------|---------|
| **Health Check** | `max_fails=3 fail_timeout=30s` (passive) | `option httpchk GET /health` (active) |
| **Algorithm** | `least_conn;` | `balance leastconn;` |
| **Session Persistence** | `ip_hash;` hoặc `hash $cookie_session;` | `cookie SERVERID insert;` |
| **Statistics** | Cần module bên ngoài | `stats enable; stats uri /stats;` |
| **ACL Routing** | `if` directive (hạn chế) | `acl` + `use_backend` (mạnh) |

---

## 7. Tích Hợp vào Docker Compose

### 7.1. Nginx Service (Đề Xuất Thêm)

**Thêm vào `deploy/docker-compose.yml`**:

```yaml
nginx:
  build:
    context: ./nginx
    dockerfile: Dockerfile
  container_name: nginx-lb
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - nginx-logs:/var/log/nginx
  depends_on:
    api-gateway:
      condition: service_started
  restart: unless-stopped
  networks:
    - microservices-network
```

**Cập nhật `api-gateway` service**:
- Không expose port 3000 ra ngoài (chỉ internal)
- Chỉ Nginx mới access được

### 7.2. HAProxy Service (Tùy Chọn)

**Tạo `deploy/haproxy/Dockerfile`**:

```dockerfile
FROM haproxy:2.8-alpine

COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

EXPOSE 80 8404

CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
```

**Thêm vào `deploy/docker-compose.yml`**:

```yaml
haproxy:
  build:
    context: ./haproxy
    dockerfile: Dockerfile
  container_name: haproxy-lb
  ports:
    - "8080:80"      # Load balancer port
    - "8404:8404"    # Statistics dashboard
  volumes:
    - ./haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
  depends_on:
    api-gateway:
      condition: service_started
  restart: unless-stopped
  networks:
    - microservices-network
```

### 7.3. Scaling với Load Balancer

**Với Nginx**:
```bash
# Scale API Gateway
docker compose up --scale api-gateway=3

# Cập nhật nginx.conf để thêm instances (hoặc dùng service discovery)
# Restart Nginx
docker compose restart nginx
```

**Với HAProxy**:
```bash
# Scale API Gateway
docker compose up --scale api-gateway=3

# HAProxy tự động phát hiện instances mới (nếu dùng service discovery)
# Hoặc cập nhật haproxy.cfg và restart
docker compose restart haproxy
```

---

## 8. Best Practices

### 8.1. Health Checks

**Nginx**:
```nginx
upstream api_gateway {
    least_conn;
    server api-gateway:3000 max_fails=3 fail_timeout=30s;
    # Thêm health check endpoint nếu có
}
```

**HAProxy**:
```haproxy
backend api_gateway_backend
    option httpchk GET /health
    http-check expect status 200
    http-check expect string "healthy"
    server api-gateway-1 api-gateway:3000 check inter 5s fall 3 rise 2
```

### 8.2. Session Persistence

**Nginx (IP-based)**:
```nginx
upstream api_gateway {
    ip_hash;  # Sticky session dựa trên IP
    server api-gateway:3000;
}
```

**HAProxy (Cookie-based)**:
```haproxy
backend api_gateway_backend
    cookie SERVERID insert indirect nocache
    server api-gateway-1 api-gateway:3000 check cookie s1
```

### 8.3. SSL/TLS Termination

**Nginx**:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location / {
        proxy_pass http://api_gateway;
    }
}
```

**HAProxy**:
```haproxy
frontend api_frontend
    bind *:443 ssl crt /etc/haproxy/cert.pem
    default_backend api_gateway_backend
```

### 8.4. Rate Limiting

**Nginx**:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location / {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://api_gateway;
    }
}
```

**HAProxy**:
```haproxy
frontend api_frontend
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny if { sc_http_req_rate(0) gt 10 }
```

### 8.5. Logging

**Nginx**:
```nginx
access_log /var/log/nginx/api_gateway_access.log;
error_log /var/log/nginx/api_gateway_error.log warn;
```

**HAProxy**:
```haproxy
global
    log stdout format raw local0

defaults
    log global
    option httplog
    option log-health-checks
```

---

## 9. Khuyến Nghị cho Hệ Thống Hiện Tại

### 9.1. Đề Xuất: Dùng Nginx (Hiện Tại)

**Lý do**:
1. ✅ Đã có cấu hình sẵn
2. ✅ Đơn giản, dễ maintain
3. ✅ Đủ cho use case hiện tại (load balance API Gateway)
4. ✅ Có thể mở rộng (caching, static files)

**Hành động**:
1. ✅ Thêm Nginx service vào `docker-compose.yml`
2. ✅ Cập nhật `api-gateway` để không expose port 3000 ra ngoài
3. ✅ Client chỉ access qua Nginx (port 80)

### 9.2. Xem Xét HAProxy Khi:

1. **Cần advanced health checks**:
   - Health checks cho database connections
   - Custom health check logic

2. **Cần statistics dashboard**:
   - Real-time monitoring
   - Connection/request metrics

3. **Cần Layer 4 load balancing**:
   - Load balance PostgreSQL read replicas
   - Load balance Redis clusters

4. **Cần advanced routing**:
   - Route dựa trên headers
   - A/B testing
   - Canary deployments

### 9.3. Kết Hợp (Tùy Chọn)

Nếu cần cả hai:
- **Nginx**: Entry point, SSL termination, static files, caching
- **HAProxy**: Advanced load balancing, health checks, statistics

---

## 10. Tổng Kết

### 10.1. Nginx

**Phù hợp khi**:
- ✅ Cần một giải pháp "all-in-one"
- ✅ Cần serve static files
- ✅ Cần caching
- ✅ Cấu hình đơn giản

**Không phù hợp khi**:
- ❌ Cần advanced health checks
- ❌ Cần statistics dashboard tích hợp
- ❌ Cần Layer 4 load balancing

### 10.2. HAProxy

**Phù hợp khi**:
- ✅ Cần advanced health checks
- ✅ Cần statistics dashboard
- ✅ Cần session persistence mạnh
- ✅ Cần Layer 4 load balancing
- ✅ Cần advanced routing/ACL

**Không phù hợp khi**:
- ❌ Cần serve static files
- ❌ Cần caching
- ❌ Cần cấu hình đơn giản

### 10.3. Kết Luận

**Cho hệ thống hiện tại**: **Nginx là lựa chọn tốt** vì:
- Đã có cấu hình sẵn
- Đủ cho use case hiện tại
- Dễ maintain và mở rộng

**Xem xét HAProxy** khi:
- Cần tính năng advanced mà Nginx không đáp ứng được
- Cần statistics dashboard
- Cần Layer 4 load balancing

---

## Tài Liệu Tham Khảo

- [Nginx Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [HAProxy Documentation](http://www.haproxy.org/#docs)
- [Nginx vs HAProxy Comparison](https://www.nginx.com/resources/glossary/nginx-vs-haproxy/)
- [HAProxy Statistics Dashboard](http://www.haproxy.org/#docs)



