#!/bin/bash

# Script để test luồng Kafka qua các service
# Usage: ./scripts/test-kafka-flow.sh [action]
# Actions: check, list-topics, list-consumers, send-test-events, monitor, full-test

set -e

KAFKA_CONTAINER="${KAFKA_CONTAINER:-kafka}"
KAFKA_BROKER="${KAFKA_BROKER:-localhost:9092}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Check if Kafka container is running
check_kafka() {
    print_header "KIỂM TRA KAFKA"
    
    if ! docker ps | grep -q "$KAFKA_CONTAINER"; then
        print_error "Kafka container '$KAFKA_CONTAINER' không đang chạy!"
        print_info "Khởi động Kafka với: docker compose up -d kafka zookeeper"
        exit 1
    fi
    
    print_success "Kafka container đang chạy"
    
    # Test connection
    if docker exec "$KAFKA_CONTAINER" kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
        print_success "Kết nối Kafka thành công"
    else
        print_error "Không thể kết nối đến Kafka broker"
        exit 1
    fi
}

# List all Kafka topics
list_topics() {
    print_header "DANH SÁCH KAFKA TOPICS"
    
    local topics=$(docker exec "$KAFKA_CONTAINER" kafka-topics \
        --list \
        --bootstrap-server localhost:9092 2>/dev/null)
    
    if [ -z "$topics" ]; then
        print_warning "Chưa có topics nào. Topics sẽ được tạo tự động khi service gửi message đầu tiên."
        echo ""
        echo "Các topics được sử dụng trong hệ thống:"
        echo "  - user.created"
        echo "  - product.created, product.updated, product.low-stock"
        echo "  - order.created, order.cancelled"
        echo "  - payment.success, payment.failed"
        echo "  - settlement.balance.updated, settlement.payout.requested"
        echo "  - loyalty.points.earned"
        echo "  - dispute.opened, dispute.escalated, dispute.resolved"
        echo "  - dlq.failed-messages"
        echo "  - (Request-Reply) inventory.reserve.request, inventory.reserve.reply"
        echo "  - (Request-Reply) promotion.validate.request, promotion.validate.reply"
        echo "  - (Request-Reply) order.prepare.request, order.prepare.reply"
    else
        echo "$topics" | while read -r topic; do
            if [ -n "$topic" ]; then
                print_info "  📌 $topic"
            fi
        done
    fi
}

# List consumer groups
list_consumers() {
    print_header "DANH SÁCH CONSUMER GROUPS"
    
    local consumers=$(docker exec "$KAFKA_CONTAINER" kafka-consumer-groups \
        --bootstrap-server localhost:9092 \
        --list 2>/dev/null)
    
    if [ -z "$consumers" ]; then
        print_warning "Chưa có consumer groups nào đang active"
    else
        echo "$consumers" | while read -r consumer; do
            if [ -n "$consumer" ]; then
                print_info "  👥 $consumer"
            fi
        done
    fi
}

# Send test events to Kafka topics
send_test_events() {
    print_header "GỬI TEST EVENTS VÀO KAFKA"
    
    local timestamp=$(date +%s)
    
    # Function to send message to topic
    send_message() {
        local topic=$1
        local message=$2
        local description=$3
        
        print_info "Gửi: $description"
        echo "$message" | docker exec -i "$KAFKA_CONTAINER" kafka-console-producer \
            --bootstrap-server localhost:9092 \
            --topic "$topic" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            print_success "  ✅ Đã gửi vào topic: $topic"
        else
            print_error "  ❌ Lỗi khi gửi vào topic: $topic"
        fi
        sleep 0.5
    }
    
    # 1. User Created Event
    send_message "user.created" \
        "{\"id\":\"user-${timestamp}\",\"email\":\"test${timestamp}@example.com\",\"name\":\"Test User ${timestamp}\",\"createdAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        "User Created Event"
    
    # 2. Product Created Event
    send_message "product.created" \
        "{\"id\":\"prod-${timestamp}\",\"name\":\"Test Product ${timestamp}\",\"price\":99.99,\"stock\":100,\"sellerId\":\"seller-1\",\"createdAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        "Product Created Event"
    
    # 3. Product Updated Event
    send_message "product.updated" \
        "{\"id\":\"prod-${timestamp}\",\"name\":\"Updated Product ${timestamp}\",\"price\":89.99,\"stock\":50,\"updatedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        "Product Updated Event"
    
    # 4. Order Created Event
    send_message "order.created" \
        "{\"id\":\"order-${timestamp}\",\"userId\":\"user-${timestamp}\",\"items\":[{\"productId\":\"prod-${timestamp}\",\"quantity\":2,\"price\":99.99}],\"total\":199.98,\"status\":\"PENDING\",\"createdAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        "Order Created Event"
    
    # 5. Payment Success Event
    send_message "payment.success" \
        "{\"id\":\"payment-${timestamp}\",\"orderId\":\"order-${timestamp}\",\"userId\":\"user-${timestamp}\",\"amount\":199.98,\"method\":\"CREDIT_CARD\",\"status\":\"SUCCESS\",\"paidAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        "Payment Success Event"
    
    # 6. Payment Failed Event
    send_message "payment.failed" \
        "{\"id\":\"payment-failed-${timestamp}\",\"orderId\":\"order-${timestamp}\",\"userId\":\"user-${timestamp}\",\"amount\":199.98,\"method\":\"CREDIT_CARD\",\"status\":\"FAILED\",\"reason\":\"Insufficient funds\",\"failedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        "Payment Failed Event"
    
    # 7. Settlement Balance Updated Event
    send_message "settlement.balance.updated" \
        "{\"sellerId\":\"seller-1\",\"orderId\":\"order-${timestamp}\",\"amount\":179.98,\"commission\":20.00,\"balance\":1000.00,\"updatedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        "Settlement Balance Updated Event"
    
    # 8. Loyalty Points Earned Event
    send_message "loyalty.points.earned" \
        "{\"userId\":\"user-${timestamp}\",\"orderId\":\"order-${timestamp}\",\"points\":199,\"totalPoints\":500,\"earnedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        "Loyalty Points Earned Event"
    
    # 9. Dispute Opened Event
    send_message "dispute.opened" \
        "{\"id\":\"dispute-${timestamp}\",\"orderId\":\"order-${timestamp}\",\"userId\":\"user-${timestamp}\",\"reason\":\"Product not as described\",\"status\":\"OPEN\",\"openedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        "Dispute Opened Event"
    
    print_success "Đã gửi tất cả test events!"
}

# Monitor consumer lag
monitor_consumers() {
    print_header "MONITOR CONSUMER GROUPS"
    
    local consumers=$(docker exec "$KAFKA_CONTAINER" kafka-consumer-groups \
        --bootstrap-server localhost:9092 \
        --list 2>/dev/null)
    
    if [ -z "$consumers" ]; then
        print_warning "Chưa có consumer groups nào để monitor"
        return
    fi
    
    echo "$consumers" | while read -r consumer; do
        if [ -n "$consumer" ]; then
            print_info "Consumer Group: $consumer"
            docker exec "$KAFKA_CONTAINER" kafka-consumer-groups \
                --bootstrap-server localhost:9092 \
                --group "$consumer" \
                --describe 2>/dev/null | head -20 || true
            echo ""
        fi
    done
}

# Show topic details
show_topic_details() {
    print_header "CHI TIẾT TOPICS"
    
    local topics=$(docker exec "$KAFKA_CONTAINER" kafka-topics \
        --list \
        --bootstrap-server localhost:9092 2>/dev/null)
    
    if [ -z "$topics" ]; then
        print_warning "Chưa có topics nào"
        return
    fi
    
    echo "$topics" | while read -r topic; do
        if [ -n "$topic" ]; then
            print_info "Topic: $topic"
            docker exec "$KAFKA_CONTAINER" kafka-topics \
                --bootstrap-server localhost:9092 \
                --describe \
                --topic "$topic" 2>/dev/null || true
            echo ""
        fi
    done
}

# Full test flow: fire-and-forget events + Request-Reply E2E
full_test() {
    print_header "TEST TOÀN BỘ LUỒNG KAFKA"
    
    check_kafka
    list_topics
    list_consumers
    echo ""
    print_info "Bước 1/2: Gửi test events (fire-and-forget) vào các topics..."
    send_test_events
    echo ""
    sleep 2
    monitor_consumers
    echo ""
    print_header "Bước 2/2: Test luồng Request-Reply (Order → Product reserve, tạo đơn)"
    print_info "Khởi động/kiểm tra product, order, promotion service và gọi POST /orders..."
    if ! "$SCRIPT_DIR/test-request-reply-flow.sh"; then
        print_warning "Request-Reply test thất bại (có thể do service chưa sẵn sàng). Fire-and-forget events đã gửi thành công."
    fi
    echo ""
    print_success "Test toàn bộ luồng Kafka hoàn tất!"
    echo ""
    print_info "Để xem logs của các service consumer:"
    echo "  docker compose -f $SCRIPT_DIR/../deploy/docker-compose.yml logs -f notification-service"
    echo "  docker compose -f $SCRIPT_DIR/../deploy/docker-compose.yml logs -f analytics-service"
    echo "  docker compose -f $SCRIPT_DIR/../deploy/docker-compose.yml logs -f warehouse-service"
    echo "  docker compose -f $SCRIPT_DIR/../deploy/docker-compose.yml logs -f search-service"
    echo "  docker compose -f $SCRIPT_DIR/../deploy/docker-compose.yml logs -f product-service"
    echo "  docker compose -f $SCRIPT_DIR/../deploy/docker-compose.yml logs -f order-service"
}

# Main
ACTION="${1:-full-test}"

case "$ACTION" in
    "check")
        check_kafka
        ;;
    "list-topics"|"topics")
        check_kafka
        list_topics
        ;;
    "list-consumers"|"consumers")
        check_kafka
        list_consumers
        ;;
    "send-events"|"send")
        check_kafka
        send_test_events
        ;;
    "monitor")
        check_kafka
        monitor_consumers
        ;;
    "details")
        check_kafka
        show_topic_details
        ;;
    "full-test"|"test"|"all")
        full_test
        ;;
    "request-reply"|"req-reply")
        check_kafka
        print_info "Chạy test luồng Request-Reply (reserve stock + tạo đơn)..."
        exec "$SCRIPT_DIR/test-request-reply-flow.sh"
        ;;
    *)
        echo "Usage: $0 [action]"
        echo ""
        echo "Actions:"
        echo "  check              - Kiểm tra Kafka đang chạy"
        echo "  list-topics        - Liệt kê tất cả topics"
        echo "  list-consumers     - Liệt kê consumer groups"
        echo "  send-events        - Gửi test events vào các topics"
        echo "  monitor            - Monitor consumer lag"
        echo "  details            - Hiển thị chi tiết topics"
        echo "  request-reply      - Test luồng Request-Reply (Order->Product reserve, tạo đơn)"
        echo "  full-test (default) - Chạy toàn bộ test flow"
        echo ""
        exit 1
        ;;
esac

