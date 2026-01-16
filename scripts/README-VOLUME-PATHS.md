# Quick Guide: Xem Đường Dẫn Docker Volumes

## Cách Nhanh Nhất

### 1. Sử Dụng Script

```bash
cd /home/hieupv/demo-microservice-2/microservice_base
./scripts/show-volume-paths.sh
```

### 2. Docker Commands

#### Xem Docker Root Directory
```bash
docker info | grep "Docker Root Dir"
```
**Output**: `/var/lib/docker`

#### Xem Đường Dẫn Của Một Volume
```bash
docker volume inspect microservice_base_kafka-data --format '{{.Mountpoint}}'
```
**Output**: `/var/lib/docker/volumes/microservice_base_kafka-data/_data`

#### Xem Tất Cả Volumes Với Paths
```bash
for vol in $(docker volume ls --format "{{.Name}}" | grep microservice_base); do
    echo "$vol: $(docker volume inspect $vol --format '{{.Mountpoint}}')"
done
```

## Vị Trí Lưu Trữ

### Linux
```
/var/lib/docker/volumes/microservice_base_<volume-name>/_data/
```

### Windows (WSL2)
```
\\wsl$\docker-desktop-data\data\docker\volumes\microservice_base_<volume-name>/_data/
```

### macOS
- Không truy cập trực tiếp (trong Docker VM)
- Sử dụng Docker commands

## Ví Dụ Cụ Thể

### Kafka Volume
```bash
docker volume inspect microservice_base_kafka-data --format '{{.Mountpoint}}'
# Output: /var/lib/docker/volumes/microservice_base_kafka-data/_data
```

### MongoDB Volume
```bash
docker volume inspect microservice_base_mongo-data --format '{{.Mountpoint}}'
# Output: /var/lib/docker/volumes/microservice_base_mongo-data/_data
```

### PostgreSQL Volume
```bash
docker volume inspect microservice_base_postgres-auth-data --format '{{.Mountpoint}}'
# Output: /var/lib/docker/volumes/microservice_base_postgres-auth-data/_data
```

## Truy Cập Volume Data

### Xem Nội Dung (Không Cần Root)
```bash
docker run --rm -v microservice_base_kafka-data:/data alpine ls -la /data
```

### Xem Kích Thước
```bash
docker run --rm -v microservice_base_kafka-data:/data alpine du -sh /data
```

### Copy File Từ Volume
```bash
docker run --rm -v microservice_base_kafka-data:/data -v $(pwd):/backup \
  alpine cp /data/some-file /backup/
```

## Lưu Ý

⚠️ **Không truy cập trực tiếp** `/var/lib/docker/volumes/` trên Linux (cần root, có thể gây lỗi)

✅ **Sử dụng Docker commands** - An toàn và không cần root

Xem chi tiết trong [VOLUME_PATHS_GUIDE.md](../docs/VOLUME_PATHS_GUIDE.md)




