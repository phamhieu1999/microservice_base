#!/bin/bash

# Script wrapper để chạy Kafka từ bất kỳ đâu trong dự án
# Usage: ./scripts/start-kafka.sh hoặc từ bất kỳ đâu: ./scripts/start-kafka.sh

set -e

# Tìm thư mục root của dự án
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KAFKA_SCRIPT="$PROJECT_ROOT/deploy/kafka-setup.sh"

# Kiểm tra script tồn tại
if [ ! -f "$KAFKA_SCRIPT" ]; then
    echo "❌ Không tìm thấy kafka-setup.sh trong $PROJECT_ROOT/deploy/"
    exit 1
fi

# Chạy script
exec "$KAFKA_SCRIPT"

