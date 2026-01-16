# Troubleshooting: Lỗi Build Service Ở Local (WSL)

## 🔍 Vấn Đề

Khi chạy `npm run build` ở local trong WSL, gặp lỗi:
```
'nest' is not recognized as an internal or external command
UNC paths are not supported
CMD.EXE was started...
```

Nhưng khi chạy trong Docker thì lại chạy được.

## 📋 Nguyên Nhân

### 1. **Chưa Cài Đặt Dependencies**
- `node_modules` chưa tồn tại
- `@nestjs/cli` (chứa `nest` command) chưa được cài đặt
- Trong Docker: `npm install` đã chạy trong Dockerfile → có đầy đủ dependencies
- Ở local: chưa chạy `npm install` → thiếu dependencies

### 2. **NPM Đang Chạy Từ Windows**
- Lỗi `UNC paths are not supported` và `CMD.EXE` cho thấy npm đang được gọi từ Windows
- Path: `\\wsl.localhost\Ubuntu-24.04\...` là Windows UNC path
- NPM từ Windows không thể chạy trong WSL environment đúng cách

## ✅ Giải Pháp

### Giải Pháp 1: Cài Đặt Dependencies Ở Local

```bash
cd services/notification-service
npm install
```

Sau đó chạy lại:
```bash
npm run build
```

### Giải Pháp 2: Đảm Bảo Dùng NPM Từ WSL

Kiểm tra npm đang chạy từ đâu:
```bash
which npm
which node
```

Nếu thấy path như `/mnt/c/Program Files/nodejs/npm` → đang dùng npm từ Windows.

**Cài đặt Node.js trong WSL:**
```bash
# Cài đặt Node.js trong WSL (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Hoặc dùng nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

Sau đó kiểm tra lại:
```bash
which npm  # Nên thấy: /usr/bin/npm hoặc ~/.nvm/versions/node/...
which node
```

### Giải Pháp 3: Sử Dụng Docker Cho Development

Nếu gặp vấn đề với WSL, có thể dùng Docker cho development:

```bash
# Chạy với hot reload
cd deploy
docker compose -f docker-compose.dev.yml up -d notification-service
docker compose -f docker-compose.dev.yml logs -f notification-service
```

## 🔄 So Sánh: Docker vs Local

| Môi Trường | Dependencies | NPM | Kết Quả |
|------------|--------------|-----|---------|
| **Docker** | ✅ Đã cài (trong Dockerfile) | ✅ Từ container | ✅ Chạy được |
| **Local (WSL)** | ❌ Chưa cài | ⚠️ Từ Windows | ❌ Lỗi |

## 📝 Checklist Để Fix

- [ ] Cài đặt Node.js trong WSL (không dùng từ Windows)
- [ ] Chạy `npm install` trong service directory
- [ ] Kiểm tra `node_modules/.bin/nest` tồn tại
- [ ] Đảm bảo đang dùng npm từ WSL: `which npm`

## 🛠️ Quick Fix

```bash
# 1. Cài đặt Node.js trong WSL (nếu chưa có)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Cài đặt dependencies
cd services/notification-service
npm install

# 3. Build
npm run build
```

## 💡 Lưu Ý

1. **Không nên dùng npm từ Windows** trong WSL vì:
   - Path conflicts (UNC paths)
   - File permissions issues
   - Performance issues

2. **Nên cài Node.js trực tiếp trong WSL** để:
   - Tránh path conflicts
   - Tốt hơn cho development
   - Tương thích với các tools khác

3. **Docker là lựa chọn tốt** nếu:
   - Không muốn cài Node.js trong WSL
   - Muốn môi trường giống production
   - Muốn isolate dependencies

