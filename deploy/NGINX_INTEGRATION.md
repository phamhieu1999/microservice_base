# Hướng Dẫn Tích Hợp Nginx Load Balancer

## Tổng Quan

Hiện tại, Nginx Load Balancer đã có cấu hình sẵn trong `deploy/nginx/` nhưng chưa được tích hợp vào `docker-compose.yml`. Tài liệu này hướng dẫn cách tích hợp Nginx vào hệ thống.

## Kiến Trúc Sau Khi Tích Hợp

```
Client Request
    ↓
Nginx Load Balancer (Port 80) ← Entry Point
    ↓
API Gateway Instances (Port 3000) [Internal only]
    ├─→ api-gateway-1:3000
    ├─→ api-gateway-2:3000
    └─→ api-gateway-3:3000
    ↓
Microservices
```

## Các Bước Tích Hợp

### Bước 1: Thêm Nginx Service vào docker-compose.yml

Thêm service sau vào `deploy/docker-compose.yml` (sau phần `zookeeper`, trước `kafka`):

```yaml
nginx:
  build:
    context: ./nginx
    dockerfile: Dockerfile
  container_name: nginx-lb
  ports:
    - "80:80"
    - "443:443"  # Optional: cho SSL/TLS
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - nginx-logs:/var/log/nginx
  depends_on:
    api-gateway:
      condition: service_started
  restart: unless-stopped
  networks:
    - default
```

### Bước 2: Cập Nhật API Gateway Service

**Option 1: Giữ port 3000 exposed (cho development)**
- Giữ nguyên cấu hình hiện tại
- Client có thể access qua cả Nginx (port 80) và trực tiếp (port 3000)

**Option 2: Chỉ internal (recommended cho production)**
- Xóa hoặc comment dòng `ports: - "3000:3000"`
- Chỉ Nginx mới access được API Gateway

```yaml
api-gateway:
  # ... existing config ...
  # ports:
  #   - "3000:3000"  # Comment out - only accessible via Nginx
  depends_on:
    - auth-service
    # ... other dependencies ...
```

### Bước 3: Thêm Volume cho Nginx Logs

Thêm vào phần `volumes:` ở cuối file:

```yaml
volumes:
  # ... existing volumes ...
  nginx-logs:
```

### Bước 4: Cập Nhật Nginx Config (Nếu Cần)

File `deploy/nginx/nginx.conf` đã có cấu hình sẵn. Nếu muốn scale API Gateway, cập nhật upstream:

```nginx
upstream api_gateway {
    least_conn;
    server api-gateway:3000 max_fails=3 fail_timeout=30s;
    # Khi scale, Docker Compose tự động tạo service names:
    # api-gateway-1, api-gateway-2, api-gateway-3
    # Cần cập nhật thủ công hoặc dùng service discovery
    keepalive 32;
}
```

**Lưu ý**: Khi scale với `docker compose up --scale api-gateway=3`, Docker Compose tạo các containers với tên `api-gateway-1`, `api-gateway-2`, `api-gateway-3`. Tuy nhiên, service name vẫn là `api-gateway`, nên Nginx có thể access tất cả instances qua service name này.

### Bước 5: Chạy Hệ Thống

```bash
# Build và start tất cả services (bao gồm Nginx)
docker compose -f deploy/docker-compose.yml up -d

# Kiểm tra Nginx đang chạy
docker compose -f deploy/docker-compose.yml ps nginx

# Kiểm tra logs
docker compose -f deploy/docker-compose.yml logs nginx

# Test load balancing
curl http://localhost/health
curl http://localhost/api/products
```

## Scaling API Gateway với Nginx

### Scale API Gateway

```bash
# Scale API Gateway lên 3 instances
docker compose -f deploy/docker-compose.yml up -d --scale api-gateway=3

# Kiểm tra số lượng instances
docker compose -f deploy/docker-compose.yml ps api-gateway
```

### Cập Nhật Nginx Config (Nếu Cần Explicit Server Names)

Nếu muốn chỉ định rõ từng instance trong Nginx config:

```nginx
upstream api_gateway {
    least_conn;
    server api-gateway-1:3000 max_fails=3 fail_timeout=30s;
    server api-gateway-2:3000 max_fails=3 fail_timeout=30s;
    server api-gateway-3:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

**Lưu ý**: Với Docker Compose, service name `api-gateway` tự động load balance đến tất cả instances, nên không cần cập nhật config.

## Kiểm Tra và Monitoring

### Health Check

```bash
# Check Nginx status
curl http://localhost/health

# Check Nginx logs
docker compose -f deploy/docker-compose.yml logs -f nginx

# Check API Gateway instances
docker compose -f deploy/docker-compose.yml ps api-gateway
```

### Load Testing

```bash
# Test với Apache Bench
ab -n 1000 -c 10 http://localhost/api/products

# Test với curl (multiple requests)
for i in {1..10}; do curl http://localhost/health & done; wait
```

## Troubleshooting

### Nginx không start

```bash
# Check Nginx config syntax
docker compose -f deploy/docker-compose.yml run --rm nginx nginx -t

# Check logs
docker compose -f deploy/docker-compose.yml logs nginx
```

### API Gateway không accessible qua Nginx

1. **Check network**: Đảm bảo Nginx và API Gateway cùng network
2. **Check service name**: Đảm bảo `api-gateway` trong nginx.conf khớp với service name trong docker-compose.yml
3. **Check API Gateway health**: `curl http://api-gateway:3000/health` (từ trong Nginx container)

```bash
# Test từ Nginx container
docker compose -f deploy/docker-compose.yml exec nginx wget -O- http://api-gateway:3000/health
```

### Load không được distribute đều

1. **Check algorithm**: Đảm bảo `least_conn` hoặc `round_robin` được cấu hình đúng
2. **Check health checks**: Đảm bảo `max_fails` và `fail_timeout` hợp lý
3. **Check logs**: Xem Nginx access logs để phân tích distribution

## Best Practices

1. **Production**: Ẩn API Gateway port 3000, chỉ expose qua Nginx
2. **Development**: Có thể giữ port 3000 exposed để test trực tiếp
3. **SSL/TLS**: Thêm SSL certificate và cấu hình HTTPS trong Nginx
4. **Logging**: Rotate logs định kỳ để tránh đầy disk
5. **Monitoring**: Tích hợp Nginx metrics vào Prometheus (cần nginx-prometheus-exporter)

## Tùy Chọn: SSL/TLS Termination

Thêm SSL/TLS vào Nginx:

1. **Tạo SSL certificate** (hoặc dùng Let's Encrypt)
2. **Cập nhật nginx.conf**:

```nginx
server {
    listen 443 ssl http2;
    server_name localhost;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://api_gateway;
        # ... proxy settings ...
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name localhost;
    return 301 https://$server_name$request_uri;
}
```

3. **Mount certificate vào container**:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
    - nginx-logs:/var/log/nginx
```

## Tài Liệu Tham Khảo

- [Nginx Load Balancing Documentation](https://nginx.org/en/docs/http/load_balancing.html)
- [NGINX_HAPROXY_ANALYSIS.md](../docs/NGINX_HAPROXY_ANALYSIS.md) - So sánh Nginx vs HAProxy
- [SCALING.md](./SCALING.md) - Hướng dẫn scaling services



