# Hướng Dẫn Xem Đường Dẫn Lưu Trữ Docker Volumes

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Vị Trí Lưu Trữ Volumes](#2-vị-trí-lưu-trữ-volumes)
3. [Cách Xem Đường Dẫn](#3-cách-xem-đường-dẫn)
4. [Truy Cập Volume Data](#4-truy-cập-volume-data)
5. [Backup và Restore](#5-backup-và-restore)

---

## 1. Tổng Quan

Docker volumes được lưu trữ trong **Docker storage area** trên máy local. Vị trí cụ thể phụ thuộc vào:
- **OS**: Linux, Windows, macOS
- **Docker installation**: Docker Desktop, Docker Engine
- **Storage driver**: overlay2, aufs, etc.

---

## 2. Vị Trí Lưu Trữ Volumes

### 2.1. Linux (Docker Engine)

**Default location**:
```
/var/lib/docker/volumes/
```

**Volume path structure**:
```
/var/lib/docker/volumes/
├── <project>_<volume-name>/
│   └── _data/          ← Actual data storage
```

**Ví dụ**:
```
/var/lib/docker/volumes/microservice_base_kafka-data/_data/
/var/lib/docker/volumes/microservice_base_mongo-data/_data/
/var/lib/docker/volumes/microservice_base_postgres-auth-data/_data/
```

### 2.2. Windows (Docker Desktop với WSL2)

**WSL2 path**:
```
\\wsl$\docker-desktop-data\data\docker\volumes\
```

**Hoặc trong WSL2 shell**:
```
/var/lib/docker/volumes/
```

**Windows path** (nếu không dùng WSL2):
```
C:\ProgramData\docker\volumes\
```

### 2.3. macOS (Docker Desktop)

**Docker VM path** (không truy cập trực tiếp):
- Docker Desktop tạo một Linux VM
- Volumes được lưu trong VM, không truy cập trực tiếp từ macOS

**Workaround**: Sử dụng Docker commands để truy cập

---

## 3. Cách Xem Đường Dẫn

### 3.1. Sử Dụng Script (Recommended)

**Script**: `scripts/show-volume-paths.sh`

```bash
# Xem tất cả volumes
cd /home/hieupv/demo-microservice-2/microservice_base
./scripts/show-volume-paths.sh

# Xem một volume cụ thể
./scripts/show-volume-paths.sh microservice_base_kafka-data
```

### 3.2. Docker Commands

#### Xem Docker Root Directory

```bash
docker info | grep "Docker Root Dir"
```

**Output**:
```
Docker Root Dir: /var/lib/docker
```

#### List Tất Cả Volumes

```bash
docker volume ls
```

**Output**:
```
DRIVER    VOLUME NAME
local     microservice_base_kafka-data
local     microservice_base_mongo-data
local     microservice_base_postgres-auth-data
...
```

#### Xem Đường Dẫn Cụ Thể Của Một Volume

```bash
docker volume inspect microservice_base_kafka-data
```

**Output**:
```json
[
    {
        "CreatedAt": "2024-01-01T00:00:00Z",
        "Driver": "local",
        "Labels": {
            "com.docker.compose.project": "microservice_base",
            "com.docker.compose.volume": "kafka-data"
        },
        "Mountpoint": "/var/lib/docker/volumes/microservice_base_kafka-data/_data",
        "Name": "microservice_base_kafka-data",
        "Options": {},
        "Scope": "local"
    }
]
```

**Chỉ lấy Mountpoint**:
```bash
docker volume inspect microservice_base_kafka-data --format '{{.Mountpoint}}'
```

**Output**:
```
/var/lib/docker/volumes/microservice_base_kafka-data/_data
```

#### Xem Tất Cả Volumes Với Paths

```bash
for vol in $(docker volume ls --format "{{.Name}}" | grep microservice_base); do
    echo "Volume: $vol"
    echo "  Path: $(docker volume inspect $vol --format '{{.Mountpoint}}')"
    echo ""
done
```

### 3.3. Truy Cập Trực Tiếp (Linux)

**⚠️ Cần quyền root hoặc sudo**

```bash
# Xem danh sách volumes
sudo ls -la /var/lib/docker/volumes/

# Xem nội dung một volume
sudo ls -la /var/lib/docker/volumes/microservice_base_kafka-data/_data/

# Xem kích thước
sudo du -sh /var/lib/docker/volumes/microservice_base_kafka-data/_data/
```

---

## 4. Truy Cập Volume Data

### 4.1. Sử Dụng Docker Container

**Cách an toàn nhất** - không cần root:

```bash
# Xem nội dung volume
docker run --rm -v microservice_base_kafka-data:/data alpine ls -la /data

# Xem kích thước
docker run --rm -v microservice_base_kafka-data:/data alpine du -sh /data

# Copy file từ volume
docker run --rm -v microservice_base_kafka-data:/data -v $(pwd):/backup \
  alpine cp /data/some-file /backup/
```

### 4.2. Sử Dụng Docker Exec

**Nếu container đang chạy**:

```bash
# Exec vào container có mount volume
docker exec -it kafka ls -la /var/lib/kafka/data

# Copy file từ container
docker cp kafka:/var/lib/kafka/data/some-file ./backup/
```

### 4.3. Sử Dụng Bind Mount (Temporary)

**Mount volume vào container với quyền truy cập**:

```bash
docker run --rm -it \
  -v microservice_base_kafka-data:/data \
  -v $(pwd):/backup \
  alpine sh

# Trong container:
# cd /data
# ls -la
# cp -r * /backup/
```

---

## 5. Backup và Restore

### 5.1. Backup Volume

**Backup Kafka data**:
```bash
docker run --rm \
  -v microservice_base_kafka-data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/kafka-data-$(date +%Y%m%d).tar.gz -C /data .
```

**Backup MongoDB**:
```bash
docker run --rm \
  -v microservice_base_mongo-data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/mongo-data-$(date +%Y%m%d).tar.gz -C /data .
```

**Backup PostgreSQL**:
```bash
# Backup database
docker exec postgres-auth pg_dump -U auth_user auth_db > backups/auth-db-$(date +%Y%m%d).sql

# Hoặc backup volume
docker run --rm \
  -v microservice_base_postgres-auth-data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-auth-$(date +%Y%m%d).tar.gz -C /data .
```

### 5.2. Restore Volume

**Restore Kafka data**:
```bash
# Stop container
docker compose stop kafka

# Restore
docker run --rm \
  -v microservice_base_kafka-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/kafka-data-20240101.tar.gz -C /data

# Start container
docker compose start kafka
```

**Restore PostgreSQL**:
```bash
# Restore database
docker exec -i postgres-auth psql -U auth_user auth_db < backups/auth-db-20240101.sql
```

---

## 6. Kiểm Tra Kích Thước Volumes

### 6.1. Sử Dụng Docker System DF

```bash
docker system df -v
```

**Output**:
```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          20        20        5.2GB     0B (0%)
Containers      35        35        2.1GB     0B (0%)
Local Volumes   20        20        15.3GB    0B (0%)
Build Cache     0         0         0B        0B
```

### 6.2. Kiểm Tra Từng Volume

```bash
for vol in $(docker volume ls --format "{{.Name}}" | grep microservice_base); do
    SIZE=$(docker run --rm -v $vol:/data alpine du -sh /data 2>/dev/null | awk '{print $1}' || echo "N/A")
    echo "$vol: $SIZE"
done
```

---

## 7. Xóa Volumes

### 7.1. Xóa Một Volume

**⚠️ Cảnh báo: Sẽ xóa tất cả data trong volume**

```bash
docker volume rm microservice_base_kafka-data
```

### 7.2. Xóa Tất Cả Unused Volumes

```bash
docker volume prune
```

### 7.3. Xóa Volumes Khi Down Compose

```bash
# Xóa containers và volumes
docker compose down -v

# Chỉ xóa volumes (giữ containers)
docker compose down --volumes
```

---

## 8. Troubleshooting

### 8.1. Không Thấy Volumes

**Nguyên nhân**: Volumes chưa được tạo

**Giải pháp**:
```bash
cd deploy/
docker compose up -d
```

### 8.2. Permission Denied

**Linux**:
```bash
# Cần sudo để truy cập trực tiếp
sudo ls -la /var/lib/docker/volumes/

# Hoặc sử dụng Docker commands (không cần sudo)
docker volume inspect <volume-name>
```

### 8.3. Volume Không Tồn Tại

**Kiểm tra**:
```bash
docker volume ls | grep <volume-name>
```

**Tạo lại**:
```bash
docker compose up -d <service-name>
```

---

## 9. Best Practices

### 9.1. Không Truy Cập Trực Tiếp

**❌ Bad**: Truy cập trực tiếp `/var/lib/docker/volumes/`
- Cần root permission
- Có thể gây lỗi nếu Docker đang sử dụng

**✅ Good**: Sử dụng Docker commands
- An toàn hơn
- Không cần root
- Docker quản lý permissions

### 9.2. Backup Thường Xuyên

**Recommended**:
- Daily backups cho critical data
- Weekly backups cho monitoring data
- Test restore process định kỳ

### 9.3. Monitor Volume Sizes

**Check định kỳ**:
```bash
docker system df -v
```

**Set alerts** nếu volume quá lớn

---

## 10. Tổng Kết

### 10.1. Quick Reference

| Task | Command |
|------|---------|
| **Xem Docker root** | `docker info \| grep "Docker Root Dir"` |
| **List volumes** | `docker volume ls` |
| **Xem volume path** | `docker volume inspect <name> --format '{{.Mountpoint}}'` |
| **Xem volume size** | `docker system df -v` |
| **Backup volume** | `docker run --rm -v <vol>:/data:ro -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .` |
| **Restore volume** | `docker run --rm -v <vol>:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /data` |

### 10.2. Volume Locations Summary

**Linux**:
- Path: `/var/lib/docker/volumes/<project>_<volume-name>/_data/`
- Access: `sudo` hoặc Docker commands

**Windows (WSL2)**:
- Path: `\\wsl$\docker-desktop-data\data\docker\volumes\`
- Access: WSL2 shell hoặc Docker commands

**macOS**:
- Path: Trong Docker VM (không truy cập trực tiếp)
- Access: Chỉ qua Docker commands

---

**Tài liệu được tạo**: 2024
**Phiên bản**: 1.0




