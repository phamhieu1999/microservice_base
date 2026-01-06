#!/bin/bash

# Script đơn giản để chạy Kafka bằng Docker Compose
# Có thể chạy từ bất kỳ đâu trong dự án

set -e

# Tìm thư mục root của dự án (có chứa thư mục deploy)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

# Chuyển đến thư mục deploy
cd "$DEPLOY_DIR"

# Ưu tiên sử dụng docker-compose.kafka-only.yml nếu có (đơn giản hơn, không có lỗi validation)
# Nếu không có, dùng docker-compose.yml
if [ -f "docker-compose.kafka-only.yml" ]; then
    COMPOSE_FILE="docker-compose.kafka-only.yml"
    echo "📄 Sử dụng: docker-compose.kafka-only.yml (chỉ Kafka và Zookeeper)"
else
    COMPOSE_FILE="docker-compose.yml"
    echo "📄 Sử dụng: docker-compose.yml"
fi

# Kiểm tra file tồn tại
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Không tìm thấy $COMPOSE_FILE trong $DEPLOY_DIR"
    exit 1
fi

echo "🚀 Đang khởi động Kafka và Zookeeper..."
echo "======================================"
echo ""
echo "💡 Lưu ý: Script này sử dụng Docker Compose (không cần Docker Desktop)"
echo "   Nếu Docker chưa chạy, hãy chạy: sudo systemctl start docker"
echo ""

# Kiểm tra Docker có đang chạy không
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker không đang chạy."
    echo ""
    echo "💡 Khởi động Docker:"
    echo "   - Nếu dùng Docker Desktop: Mở Docker Desktop"
    echo "   - Nếu dùng Docker Engine: sudo systemctl start docker"
    echo "   - Hoặc: sudo service docker start"
    exit 1
fi

# Kiểm tra Docker daemon
if ! docker ps > /dev/null 2>&1; then
    echo "⚠️  Docker daemon không phản hồi"
    echo "   Đang thử khởi động Docker service..."
    
    # Thử khởi động Docker service (nếu có quyền)
    if command -v systemctl > /dev/null 2>&1 && systemctl is-active --quiet docker 2>/dev/null; then
        echo "   Docker service đang chạy"
    elif command -v systemctl > /dev/null 2>&1; then
        echo "   Thử: sudo systemctl start docker"
        sudo systemctl start docker 2>/dev/null || true
    fi
    
    # Kiểm tra lại
    if ! docker ps > /dev/null 2>&1; then
        echo "❌ Không thể kết nối đến Docker daemon"
        exit 1
    fi
fi

# docker-compose.yml đã được kiểm tra ở trên

# Sử dụng docker compose (plugin) - Docker Compose V2
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
    echo "✅ Sử dụng: docker compose (plugin)"
else
    echo "❌ Không tìm thấy docker compose"
    echo ""
    echo "💡 Giải pháp:"
    echo "   1. Đảm bảo Docker Desktop đang chạy"
    echo "   2. Kích hoạt WSL integration trong Docker Desktop settings"
    echo "   3. Cài đặt Docker Compose V2 (thường đi kèm với Docker Desktop)"
    echo ""
    echo "   Xem thêm: https://docs.docker.com/compose/"
    exit 1
fi

# Kiểm tra Kafka và Zookeeper đã chạy chưa
if docker ps | grep -q "kafka\|zookeeper"; then
    echo "⚠️  Kafka hoặc Zookeeper đã đang chạy"
    echo ""
    read -p "Bạn có muốn restart? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Đang dừng Kafka và Zookeeper..."
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" stop kafka zookeeper 2>/dev/null || true
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" rm -f kafka zookeeper 2>/dev/null || true
    else
        echo "✅ Kafka và Zookeeper đã chạy. Bỏ qua."
        exit 0
    fi
fi

# Khởi động Zookeeper và Kafka
echo "📦 Đang khởi động Zookeeper và Kafka..."

# Chạy với file compose cụ thể
if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d zookeeper kafka 2>&1; then
    echo ""
    echo "❌ Không thể khởi động Kafka và Zookeeper"
    echo ""
    echo "💡 Có thể do:"
    echo "   1. Port đã được sử dụng (9092 hoặc 2181)"
    echo "   2. Docker không đủ quyền"
    echo "   3. Lỗi trong $COMPOSE_FILE"
    echo ""
    echo "   Kiểm tra logs: $DOCKER_COMPOSE -f $COMPOSE_FILE logs"
    echo "   Kiểm tra port: lsof -i :9092 -i :2181"
    exit 1
fi

echo ""
echo "⏳ Đang chờ Kafka khởi động (30 giây)..."
sleep 30

# Kiểm tra Kafka đã sẵn sàng chưa
echo ""
echo "🔍 Đang kiểm tra Kafka..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec $(docker ps -q -f name=kafka) kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
        echo "✅ Kafka đã sẵn sàng!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Đang thử lại... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 3
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "⚠️  Không thể kết nối đến Kafka sau $MAX_RETRIES lần thử"
    echo "   Vui lòng kiểm tra logs: $DOCKER_COMPOSE logs kafka"
    exit 1
fi

# Hiển thị thông tin
echo ""
echo "======================================"
echo "✅ Kafka đã được khởi động thành công!"
echo ""
echo "📋 Thông tin:"
echo "   - Kafka Broker: localhost:9092"
echo "   - Zookeeper: localhost:2181"
echo ""
echo "🔧 Các lệnh hữu ích:"
echo "   - Xem logs: $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f kafka"
echo "   - Dừng Kafka: $DOCKER_COMPOSE -f $COMPOSE_FILE stop kafka zookeeper"
echo "   - Xóa containers: $DOCKER_COMPOSE -f $COMPOSE_FILE rm -f kafka zookeeper"
echo "   - Tạo topics: ./kafka-cluster-setup.sh (nếu cần cluster)"
echo ""

