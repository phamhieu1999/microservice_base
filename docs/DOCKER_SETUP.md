# Hướng Dẫn Setup Docker và Docker Compose (Không Cần Docker Desktop)

## 🎯 Mục Tiêu

Chạy Docker Compose mà không cần Docker Desktop, sử dụng Docker Engine trực tiếp.

---

## 📦 Cài Đặt Docker Engine

### Ubuntu/Debian:

```bash
# Cập nhật package index
sudo apt-get update

# Cài đặt dependencies
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Thêm Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Setup repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker Engine và Docker Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Khởi động Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Thêm user vào docker group (để chạy docker không cần sudo)
sudo usermod -aG docker $USER

# Logout và login lại để áp dụng thay đổi
```

### Kiểm Tra Cài Đặt:

```bash
# Kiểm tra Docker
docker --version
docker info

# Kiểm tra Docker Compose plugin
docker compose version

# Kiểm tra Docker service
sudo systemctl status docker
```

---

## 🚀 Sử Dụng Docker Compose

### Khởi Động Docker Service:

```bash
# Nếu Docker service chưa chạy
sudo systemctl start docker

# Hoặc
sudo service docker start

# Kiểm tra status
sudo systemctl status docker
```

### Chạy Kafka Setup:

```bash
# Từ root của dự án
./scripts/start-kafka.sh

# Hoặc từ deploy
cd deploy
./kafka-setup.sh
```

---

## 🔧 Troubleshooting

### Lỗi: "Cannot connect to the Docker daemon"

**Giải pháp:**
```bash
# Khởi động Docker service
sudo systemctl start docker

# Kiểm tra Docker daemon
docker info

# Nếu vẫn lỗi, kiểm tra quyền
sudo usermod -aG docker $USER
# Logout và login lại
```

### Lỗi: "Permission denied while trying to connect to the Docker daemon socket"

**Giải pháp:**
```bash
# Thêm user vào docker group
sudo usermod -aG docker $USER

# Logout và login lại
# Hoặc
newgrp docker

# Kiểm tra
groups
# Phải thấy 'docker' trong danh sách
```

### Lỗi: "docker compose command not found"

**Giải pháp:**
```bash
# Cài đặt Docker Compose plugin
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Hoặc cài đặt standalone docker-compose
sudo apt-get install -y docker-compose

# Kiểm tra
docker compose version
# hoặc
docker-compose --version
```

### Docker Service Không Khởi Động

```bash
# Kiểm tra logs
sudo journalctl -u docker

# Restart service
sudo systemctl restart docker

# Enable auto-start
sudo systemctl enable docker
```

---

## 📋 So Sánh: Docker Desktop vs Docker Engine

| Tính Năng | Docker Desktop | Docker Engine |
|-----------|---------------|---------------|
| **Cài đặt** | Dễ (GUI) | Cần cài đặt thủ công |
| **WSL 2** | Tích hợp sẵn | Cần cấu hình |
| **Resource** | Nặng hơn | Nhẹ hơn |
| **GUI** | Có | Không |
| **Docker Compose** | Plugin sẵn có | Cần cài plugin |
| **Phù hợp** | Development | Production/Server |

---

## ✅ Checklist

- [ ] Docker Engine đã được cài đặt
- [ ] Docker service đang chạy (`sudo systemctl status docker`)
- [ ] User đã được thêm vào docker group
- [ ] Docker Compose plugin đã được cài đặt
- [ ] Có thể chạy `docker ps` không cần sudo
- [ ] Có thể chạy `docker compose version`

---

## 🎯 Quick Start

```bash
# 1. Khởi động Docker (nếu chưa chạy)
sudo systemctl start docker

# 2. Kiểm tra Docker
docker info

# 3. Chạy Kafka
./scripts/start-kafka.sh
```

---

## 📚 Tài Liệu Tham Khảo

- [Docker Engine Installation](https://docs.docker.com/engine/install/)
- [Docker Compose Installation](https://docs.docker.com/compose/install/)
- [Post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/)

---

Chúc bạn thành công! 🚀

