# Phân Tích Bug và Giải Pháp: "nest: not found"

## 🐛 Mô Tả Bug

Khi chạy script `build-all.sh`, gặp lỗi:
```
sh: 1: nest: not found
❌ Build thất bại: <service-name>
```

## 🔍 Nguyên Nhân

### 1. **Npm Workspaces (Monorepo)**
- Dự án sử dụng **npm workspaces** (monorepo pattern)
- Dependencies được **hoisted** lên thư mục root
- Các services không có `node_modules` riêng, mà sử dụng chung từ root

### 2. **Dependencies Chưa Được Cài Đặt**
- Script `build-all.sh` cũ chỉ cài đặt dependencies trong từng service
- Với workspaces, cần cài đặt từ **root** trước
- `@nestjs/cli` (chứa lệnh `nest`) chưa được cài đặt hoặc không có trong PATH

### 3. **Lệnh `nest` Không Tìm Thấy**
- Lệnh `nest build` trong `package.json` cần `@nestjs/cli`
- Nếu dependencies chưa được cài đặt đầy đủ, `nest` command không tồn tại
- npm sẽ tự động sử dụng `npx` nhưng vẫn cần dependencies đã được cài đặt

## ✅ Giải Pháp Đã Áp Dụng

### 1. **Cập Nhật Script `build-all.sh`**

**Thay đổi:**
- ✅ Kiểm tra và cài đặt dependencies từ **root** trước khi build
- ✅ Phát hiện npm workspaces tự động
- ✅ Sử dụng `npm run build` (npm tự động xử lý `npx` nếu cần)
- ✅ Cải thiện error handling và logging

**Code mới:**
```bash
# Kiểm tra và cài đặt dependencies từ root (cho npm workspaces)
if [ -f "package.json" ] && grep -q "workspaces" package.json; then
    echo "📦 Kiểm tra dependencies ở root (npm workspaces)..."
    if [ ! -d "node_modules" ] || [ ! -d "node_modules/.bin" ]; then
        echo "   ⚠️  Đang cài đặt dependencies từ root..."
        npm install
        # ...
    fi
fi
```

### 2. **Cập Nhật Script `start-service.sh`**

**Thay đổi:**
- ✅ Kiểm tra và cài đặt dependencies từ root trước
- ✅ Xử lý cả trường hợp có và không có workspaces
- ✅ Đảm bảo dependencies sẵn sàng trước khi chạy service

### 3. **Tạo Script Mới `install-dependencies.sh`**

**Mục đích:**
- Cài đặt dependencies một cách tập trung
- Hỗ trợ cả workspaces và non-workspaces
- Có thể chạy độc lập trước khi build/run services

**Usage:**
```bash
./scripts/install-dependencies.sh
```

## 📋 Cách Sử Dụng Sau Khi Fix

### Bước 1: Cài Đặt Dependencies (Lần Đầu)
```bash
# Cách 1: Sử dụng script helper
./scripts/install-dependencies.sh

# Cách 2: Cài đặt thủ công từ root
npm install
```

### Bước 2: Build Services
```bash
# Build tất cả services
./scripts/build-all.sh

# Hoặc build từng service
cd services/<service-name>
npm run build
```

### Bước 3: Chạy Services
```bash
# Chạy một service
./scripts/start-service.sh <service-name> [dev|prod]
```

## 🔧 Kiểm Tra Dependencies Đã Cài Đặt

### Kiểm tra từ root:
```bash
# Kiểm tra node_modules ở root
ls -la node_modules/.bin/ | grep nest

# Hoặc
which nest
# Nếu dùng workspaces, có thể không có trong PATH nhưng vẫn dùng được qua npm run
```

### Kiểm tra trong service:
```bash
cd services/analytics-service
npm run build
# Nếu thành công = dependencies đã được cài đặt đúng
```

## 🎯 Best Practices

### 1. **Luôn Cài Đặt Dependencies Từ Root Trước**
```bash
# Với npm workspaces
npm install  # Từ root directory
```

### 2. **Sử Dụng Scripts Helper**
- Sử dụng `./scripts/install-dependencies.sh` để đảm bảo cài đặt đúng cách
- Scripts tự động phát hiện và xử lý workspaces

### 3. **Kiểm Tra Trước Khi Build**
```bash
# Kiểm tra dependencies
./scripts/install-dependencies.sh

# Sau đó mới build
./scripts/build-all.sh
```

## 🐛 Troubleshooting

### Vẫn gặp lỗi "nest: not found":

1. **Xóa và cài lại dependencies:**
```bash
# Từ root
rm -rf node_modules package-lock.json
npm install
```

2. **Kiểm tra @nestjs/cli:**
```bash
# Kiểm tra trong node_modules
ls node_modules/.bin/ | grep nest

# Hoặc
npm list @nestjs/cli
```

3. **Cài đặt thủ công nếu cần:**
```bash
# Từ root
npm install @nestjs/cli --save-dev
```

### Build vẫn thất bại:

1. **Kiểm tra TypeScript:**
```bash
npm list typescript
```

2. **Kiểm tra log chi tiết:**
```bash
# Bỏ --silent để xem log
cd services/<service-name>
npm run build
```

3. **Xóa dist và build lại:**
```bash
cd services/<service-name>
rm -rf dist
npm run build
```

## 📚 Tài Liệu Liên Quan

- Xem `docs/SERVICE_COMMANDS.md` để biết chi tiết về các lệnh chạy services
- Xem `scripts/README.md` để biết cách sử dụng các scripts helper

## ✅ Kết Luận

Bug đã được fix bằng cách:
1. ✅ Phát hiện và xử lý npm workspaces đúng cách
2. ✅ Cài đặt dependencies từ root trước khi build
3. ✅ Cải thiện error handling trong scripts
4. ✅ Tạo script helper để cài đặt dependencies tập trung

Sau khi fix, các scripts sẽ hoạt động đúng với cả workspaces và non-workspaces projects.

