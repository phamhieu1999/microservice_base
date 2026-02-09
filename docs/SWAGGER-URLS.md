# Swagger URLs Cho Các Services

## 📋 Notification Service

### URLs
- **Swagger UI**: http://localhost:3005/api-docs
- **Swagger JSON**: http://localhost:3005/api-docs-json
- **Health Check**: http://localhost:3005/health

### Port
- **Port**: 3005

### Endpoints
- `GET /health` - Health check (public)
- `GET /notifications` - Get notifications (protected, requires JWT)
- `GET /notifications/unread-count` - Get unread count (protected)
- `POST /notifications/:id/read` - Mark as read (protected)

### Authentication
- Swagger hỗ trợ JWT Bearer authentication
- Click "Authorize" button trong Swagger UI để nhập token

## 🚀 Cách Truy Cập

### Nếu Service Chạy Trong Docker

1. **Kiểm tra service đang chạy:**
   ```bash
   docker ps | grep notification
   ```

2. **Kiểm tra port mapping:**
   ```bash
   docker compose -f deploy/docker-compose.yml ps notification-service
   ```

3. **Nếu port chưa được expose, thêm vào docker-compose.yml:**
   ```yaml
   notification-service:
     ports:
       - "3005:3005"
   ```

4. **Restart service:**
   ```bash
   cd deploy
   docker compose up -d notification-service
   ```

5. **Truy cập Swagger:**
   - Mở browser: http://localhost:3005/api-docs

### Nếu Service Chạy Ở Local

1. **Chạy service:**
   ```bash
   ./scripts/run-service-local.sh notification-service
   ```

2. **Truy cập Swagger:**
   - Mở browser: http://localhost:3005/api-docs

## 🔍 Kiểm Tra Service

```bash
# Health check
curl http://localhost:3005/health

# Swagger JSON
curl http://localhost:3005/api-docs-json | jq '.info'
```

## 📝 Lưu Ý

- Swagger UI chỉ hoạt động khi service đang chạy
- Một số endpoints yêu cầu JWT token (click "Authorize" trong Swagger UI)
- Port có thể khác nếu được cấu hình trong environment variables

