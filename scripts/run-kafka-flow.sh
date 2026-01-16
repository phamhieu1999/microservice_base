#!/bin/bash

# Script tổng hợp để chạy luồng Kafka qua các service
# Usage: ./scripts/run-kafka-flow.sh [start|test|monitor|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Check if docker compose is available
check_docker_compose() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker không được cài đặt!"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null 2>&1; then
        print_error "Docker Compose không được cài đặt!"
        exit 1
    fi
}

# Start infrastructure (Kafka, databases)
start_infrastructure() {
    print_header "KHỞI ĐỘNG INFRASTRUCTURE"
    
    cd "$DEPLOY_DIR"
    
    print_info "Đang khởi động Kafka và Zookeeper..."
    docker compose up -d zookeeper kafka
    
    print_info "Đợi Kafka sẵn sàng (30 giây)..."
    sleep 30
    
    # Check Kafka health
    if docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
        print_success "Kafka đã sẵn sàng"
    else
        print_warning "Kafka chưa sẵn sàng, đợi thêm 30 giây..."
        sleep 30
    fi
    
    print_info "Đang khởi động databases..."
    docker compose up -d \
        mongo redis \
        postgres-auth postgres-order postgres-payment \
        postgres-seller postgres-promo postgres-loyalty \
        postgres-dispute postgres-settlement \
        elasticsearch clickhouse
    
    print_success "Infrastructure đã được khởi động"
}

# Start consumer services
start_consumer_services() {
    print_header "KHỞI ĐỘNG CONSUMER SERVICES"
    
    cd "$DEPLOY_DIR"
    
    print_info "Đang khởi động các service consumer..."
    
    # Core consumer services
    docker compose up -d \
        notification-service \
        analytics-service \
        warehouse-service \
        search-service
    
    # Order flow services
    docker compose up -d \
        order-service \
        payment-service \
        product-service
    
    # Business services
    docker compose up -d \
        loyalty-service \
        settlement-service \
        chat-service
    
    print_info "Đợi services khởi động (20 giây)..."
    sleep 20
    
    print_success "Consumer services đã được khởi động"
}

# Start producer services
start_producer_services() {
    print_header "KHỞI ĐỘNG PRODUCER SERVICES"
    
    cd "$DEPLOY_DIR"
    
    print_info "Đang khởi động các service producer..."
    
    docker compose up -d \
        auth-service \
        product-service \
        order-service \
        payment-service \
        dispute-service
    
    print_info "Đợi services khởi động (15 giây)..."
    sleep 15
    
    print_success "Producer services đã được khởi động"
}

# Test Kafka flow
test_kafka_flow() {
    print_header "TEST LUỒNG KAFKA"
    
    cd "$PROJECT_ROOT"
    
    print_info "Đang chạy test Kafka flow..."
    ./scripts/test-kafka-flow.sh full-test
    
    print_info "Đợi consumers xử lý messages (10 giây)..."
    sleep 10
    
    print_info "Kiểm tra consumer groups..."
    ./scripts/test-kafka-flow.sh list-consumers
}

# Monitor Kafka flow
monitor_kafka_flow() {
    print_header "MONITOR LUỒNG KAFKA"
    
    cd "$PROJECT_ROOT"
    
    print_info "Đang mở dashboard monitor..."
    print_info "Nhấn Ctrl+C để thoát"
    echo ""
    
    ./scripts/monitor-kafka-flow.sh dashboard
}

# Show service status
show_status() {
    print_header "TRẠNG THÁI SERVICES"
    
    cd "$DEPLOY_DIR"
    
    print_info "Services đang chạy:"
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" | \
        grep -E "NAME|kafka|notification|analytics|warehouse|search|order|payment|product|auth|chat|loyalty|settlement" || true
    
    echo ""
    print_info "Consumer Groups:"
    cd "$PROJECT_ROOT"
    ./scripts/test-kafka-flow.sh list-consumers
}

# Full flow: start everything and test
full_flow() {
    print_header "CHẠY TOÀN BỘ LUỒNG KAFKA"
    
    check_docker_compose
    
    # 1. Start infrastructure
    start_infrastructure
    
    # 2. Start consumer services
    start_consumer_services
    
    # 3. Start producer services
    start_producer_services
    
    # 4. Show status
    show_status
    
    # 5. Test flow
    test_kafka_flow
    
    print_header "HOÀN TẤT"
    print_success "Luồng Kafka đã được thiết lập và test!"
    echo ""
    print_info "Các lệnh hữu ích:"
    echo "  - Monitor: ./scripts/monitor-kafka-flow.sh dashboard"
    echo "  - Test lại: ./scripts/test-kafka-flow.sh full-test"
    echo "  - Xem logs: docker compose -f deploy/docker-compose.yml logs -f notification-service"
    echo "  - Xem consumer status: ./scripts/test-kafka-flow.sh list-consumers"
}

# Main
ACTION="${1:-all}"

case "$ACTION" in
    "infrastructure"|"infra")
        check_docker_compose
        start_infrastructure
        ;;
    "consumers")
        check_docker_compose
        start_consumer_services
        ;;
    "producers")
        check_docker_compose
        start_producer_services
        ;;
    "test")
        test_kafka_flow
        ;;
    "monitor")
        monitor_kafka_flow
        ;;
    "status")
        show_status
        ;;
    "all"|"full")
        full_flow
        ;;
    *)
        echo "Usage: $0 [action]"
        echo ""
        echo "Actions:"
        echo "  infrastructure  - Chỉ khởi động infrastructure (Kafka, DBs)"
        echo "  consumers      - Khởi động consumer services"
        echo "  producers      - Khởi động producer services"
        echo "  test           - Test luồng Kafka"
        echo "  monitor        - Monitor real-time luồng Kafka"
        echo "  status         - Hiển thị trạng thái services"
        echo "  all (default)  - Chạy toàn bộ: start + test"
        echo ""
        exit 1
        ;;
esac

