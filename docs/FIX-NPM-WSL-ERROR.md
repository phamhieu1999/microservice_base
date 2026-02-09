# Fix Lỗi NPM Trong WSL: "Maximum call stack size exceeded"

## 🔍 Vấn Đề

Khi chạy `npm install` hoặc `npm run start:dev` trong WSL, gặp lỗi:
```
npm error Maximum call stack size exceeded
'nest' is not recognized as an internal or external command
UNC paths are not supported
```

## 📋 Nguyên Nhân

1. **Node.js chưa được cài trong WSL**
   - Chỉ có Node.js từ Windows (`/mnt/c/Program Files/nodejs/`)
   - NPM từ Windows không tương thích với WSL file system

2. **NPM đang chạy từ Windows**
   - Path: `/mnt/c/Program Files/nodejs/npm`
   - Gây lỗi với UNC paths và file permissions

## ✅ Giải Pháp

### Cách 1: Cài Node.js Trong WSL (Khuyến Nghị)

#### Sử dụng script tự động:
```bash
./scripts/install-nodejs-wsl.sh
```

#### Hoặc cài thủ công:
```bash
# Cài đặt Node.js 20.x từ NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra
node -v
npm -v
which node  # Nên thấy: /usr/bin/node (không phải /mnt/c/...)
```

### Cách 2: Sử Dụng NVM (Tốt Hơn Cho Development)

```bash
# Cài đặt nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Cài đặt Node.js 20
nvm install 20
nvm use 20

# Set default
nvm alias default 20

# Kiểm tra
node -v
npm -v
```

### Cách 3: Dùng Docker Cho Development

Nếu không muốn cài Node.js trong WSL:

```bash
cd deploy
docker compose -f docker-compose.dev.yml up -d notification-service
docker compose -f docker-compose.dev.yml logs -f notification-service
```

## 🔄 Sau Khi Cài Node.js

### 1. Cài Dependencies Cho Service

```bash
cd services/notification-service
npm install
```

### 2. Chạy Service

```bash
npm run start:dev
```

## ✅ Kiểm Tra

Sau khi cài Node.js, kiểm tra:

```bash
# Kiểm tra Node.js
node -v        # Nên thấy: v20.x.x
which node     # Nên thấy: /usr/bin/node hoặc ~/.nvm/... (KHÔNG phải /mnt/c/...)

# Kiểm tra NPM
npm -v         # Nên thấy: 10.x.x
which npm      # Nên thấy: /usr/bin/npm hoặc ~/.nvm/... (KHÔNG phải /mnt/c/...)
```

## 🛠️ Troubleshooting

### Vẫn thấy npm từ Windows sau khi cài

1. **Restart terminal:**
   ```bash
   # Đóng và mở lại terminal
   ```

2. **Reload bashrc:**
   ```bash
   source ~/.bashrc
   ```

3. **Kiểm tra PATH:**
   ```bash
   echo $PATH | grep -o '/usr/bin\|~/.nvm'
   ```

4. **Thêm vào ~/.bashrc (nếu dùng nvm):**
   ```bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   ```

### npm install vẫn lỗi

1. **Xóa cache:**
   ```bash
   npm cache clean --force
   ```

2. **Xóa node_modules và package-lock.json:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Dùng --legacy-peer-deps:**
   ```bash
   npm install --legacy-peer-deps
   ```

## 📝 Lưu Ý

1. **Không nên dùng npm từ Windows** trong WSL vì:
   - UNC path issues
   - File permission conflicts
   - Performance issues
   - "Maximum call stack size exceeded" errors

2. **Nên cài Node.js trực tiếp trong WSL** để:
   - Tránh path conflicts
   - Tốt hơn cho development
   - Tương thích với các tools khác

3. **Docker là lựa chọn tốt** nếu:
   - Không muốn cài Node.js trong WSL
   - Muốn môi trường giống production
   - Muốn isolate dependencies

## 🎯 Quick Fix

```bash
# 1. Cài Node.js trong WSL
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Restart terminal hoặc
source ~/.bashrc

# 3. Kiểm tra
node -v
which node  # Nên thấy /usr/bin/node

# 4. Cài dependencies
cd services/notification-service
npm install

# 5. Chạy service
npm run start:dev
```

