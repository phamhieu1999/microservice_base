# Scripts Helper

Thư mục này chứa các scripts tiện ích để quản lý và chạy các services trong dự án.

## 📋 Danh Sách Scripts

### 1. `start-service.sh`
Chạy một service cụ thể ở chế độ development hoặc production.

**Usage:**
```bash
./scripts/start-service.sh <service-name> [dev|prod]
```

**Ví dụ:**
```bash
# Development mode (mặc định)
./scripts/start-service.sh auth-service
./scripts/start-service.sh auth-service dev

# Production mode
./scripts/start-service.sh auth-service prod
```

**Tính năng:**
- ✅ Kiểm tra service name hợp lệ
- ✅ Tự động cài đặt dependencies
- ✅ Tự động build trước khi chạy production
- ✅ Hiển thị thông tin chi tiết

---

### 2. `list-services.sh`
Liệt kê tất cả các services và trạng thái của chúng.

**Usage:**
```bash
./scripts/list-services.sh
```

**Output bao gồm:**
- Danh sách tất cả services
- Port từ file .env (nếu có)
- Trạng thái build (đã build/chưa build)
- Tổng số services

---

### 3. `build-all.sh`
Build tất cả các services một lúc.

**Usage:**
```bash
./scripts/build-all.sh
```

**Tính năng:**
- ✅ Tự động tìm tất cả services
- ✅ Tự động cài đặt dependencies từ root (cho npm workspaces)
- ✅ Build từng service
- ✅ Báo cáo kết quả chi tiết

**Lưu ý:** 
- Script này sẽ build tất cả services, có thể mất thời gian nếu có nhiều services
- Với npm workspaces, dependencies sẽ được cài đặt từ root trước

---

### 4. `install-dependencies.sh`
Cài đặt dependencies cho toàn bộ dự án (hỗ trợ npm workspaces).

**Usage:**
```bash
./scripts/install-dependencies.sh
```

**Tính năng:**
- ✅ Tự động phát hiện npm workspaces
- ✅ Cài đặt dependencies từ root (workspaces) hoặc từng service (non-workspaces)
- ✅ Báo cáo kết quả chi tiết

**Lưu ý:** 
- Nên chạy script này trước khi build hoặc chạy services lần đầu
- Với npm workspaces, chỉ cần cài đặt một lần từ root

---

## 🚀 Quick Start

### Cài đặt dependencies (lần đầu):
```bash
./scripts/install-dependencies.sh
```

### Chạy một service:
```bash
./scripts/start-service.sh api-gateway
```

### Xem danh sách services:
```bash
./scripts/list-services.sh
```

### Build tất cả services:
```bash
./scripts/build-all.sh
```

---

## 📝 Lưu Ý

1. Tất cả scripts cần quyền thực thi (đã được set bằng `chmod +x`)
2. Chạy scripts từ thư mục root của dự án
3. Đảm bảo đã cài đặt Node.js và npm
4. Đối với production mode, cần build trước (script tự động làm điều này)

---

## 🔍 Troubleshooting

### Script không chạy được:
```bash
# Kiểm tra quyền thực thi
ls -l scripts/*.sh

# Cấp quyền thực thi nếu cần
chmod +x scripts/*.sh
```

### Service không tìm thấy:
- Kiểm tra tên service có đúng không
- Chạy `./scripts/list-services.sh` để xem danh sách services hợp lệ

### Build thất bại:
- Kiểm tra dependencies đã cài đặt chưa
- Kiểm tra TypeScript version
- Xem log chi tiết trong console

---

## 📚 Xem Thêm

Xem file `docs/SERVICE_COMMANDS.md` để biết chi tiết về:
- Các lệnh chạy từng service
- Cấu hình môi trường
- Troubleshooting chi tiết
- Thông tin về từng service

