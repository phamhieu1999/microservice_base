# Nginx Load Balancer - Quick Start Guide

## ✅ Đã Tích Hợp

Nginx Load Balancer đã được tích hợp vào `docker-compose.yml` và sẵn sàng sử dụng!

## 🚀 Cách Sử Dụng

### 1. Khởi Động Hệ Thống (Bao Gồm Nginx)

```bash
cd /home/hieupv/demo-microservice-2/microservice_base/deploy
docker compose up -d
```

### 2. Kiểm Tra Nginx Đang Chạy

```bash
# Kiểm tra container
docker compose ps nginx

# Kiểm tra logs
docker compose logs nginx

# Kiểm tra health
curl http://localhost/health
```

### 3. Truy Cập API Qua Nginx

**Trước đây** (trực tiếp API Gateway):
```bash
curl http://localhost:3000/api/products
```

**Bây giờ** (qua Nginx Load Balancer):
```bash
curl http://localhost/api/products
curl http://localhost/health
```

### 4. Scale API Gateway

```bash
# Scale API Gateway lên 3 instances
docker compose up -d --scale api-gateway=3

# Kiểm tra số lượng instances
docker compose ps api-gateway

# Test load balancing
for i in {1..10}; do curl http://localhost/health & done; wait
```

## 📊 Kiến Trúc

```
Client Request
    ↓
Nginx Load Balancer (Port 80) ← Entry Point
    ↓
API Gateway Instances (Port 3000) [Internal]
    ├─→ api-gateway-1:3000
    ├─→ api-gateway-2:3000
    └─→ api-gateway-3:3000
    ↓
Microservices
```

## 🔧 Cấu Hình

- **File cấu hình**: `deploy/nginx/nginx.conf`
- **Load balancing algorithm**: Least Connections (`least_conn`)
- **Health checks**: `max_fails=3`, `fail_timeout=30s`
- **Ports**: 
  - `80`: HTTP
  - `443`: HTTPS (sẵn sàng cho SSL/TLS)

## 📝 Lưu Ý

1. **Port 3000 vẫn exposed**: API Gateway vẫn có thể truy cập trực tiếp qua port 3000 (hữu ích cho development)
2. **Production**: Có thể ẩn port 3000 bằng cách comment dòng `ports: - "3000:3000"` trong `docker-compose.yml`
3. **Logs**: Nginx logs được lưu trong volume `nginx-logs`

## 🐛 Troubleshooting

### Nginx không start

```bash
# Check config syntax
docker compose run --rm nginx nginx -t

# Check logs
docker compose logs nginx
```

### API Gateway không accessible qua Nginx

```bash
# Test từ Nginx container
docker compose exec nginx wget -O- http://api-gateway:3000/health

# Check network
docker network inspect microservice_base_default
```

## 📚 Tài Liệu Tham Khảo

- [NGINX_INTEGRATION.md](./NGINX_INTEGRATION.md) - Hướng dẫn chi tiết
- [NGINX_HAPROXY_ANALYSIS.md](../docs/NGINX_HAPROXY_ANALYSIS.md) - So sánh Nginx vs HAProxy
- [SCALING.md](./SCALING.md) - Hướng dẫn scaling services



