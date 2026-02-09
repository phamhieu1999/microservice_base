#!/bin/bash

# Script để monitor real-time luồng Kafka qua các service
# Usage: ./scripts/monitor-kafka-flow.sh [topic_name] [duration_seconds]

set -e

KAFKA_CONTAINER="${KAFKA_CONTAINER:-kafka}"
KAFKA_BROKER="${KAFKA_BROKER:-localhost:9092}"
TOPIC="${1:-}"
DURATION="${2:-60}"

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

# Check if Kafka container is running
check_kafka() {
    if ! docker ps | grep -q "$KAFKA_CONTAINER"; then
        print_error "Kafka container '$KAFKA_CONTAINER' không đang chạy!"
        print_info "Khởi động Kafka với: docker compose -f deploy/docker-compose.yml up -d kafka zookeeper"
        exit 1
    fi
}

# Monitor messages from a specific topic
monitor_topic() {
    local topic=$1
    local duration=$2
    
    print_header "MONITOR TOPIC: $topic"
    print_info "Đang lắng nghe messages từ topic '$topic' trong ${duration}s..."
    print_info "Nhấn Ctrl+C để dừng sớm"
    echo ""
    
    timeout "${duration}" docker exec -it "$KAFKA_CONTAINER" kafka-console-consumer \
        --bootstrap-server localhost:9092 \
        --topic "$topic" \
        --from-beginning \
        --max-messages 100 2>/dev/null || true
}

# Monitor all topics
monitor_all_topics() {
    print_header "MONITOR TẤT CẢ TOPICS"
    
    local topics=$(docker exec "$KAFKA_CONTAINER" kafka-topics \
        --list \
        --bootstrap-server localhost:9092 2>/dev/null)
    
    if [ -z "$topics" ]; then
        print_warning "Chưa có topics nào"
        return
    fi
    
    print_info "Đang monitor các topics sau (${DURATION}s mỗi topic):"
    echo "$topics" | while read -r topic; do
        if [ -n "$topic" ]; then
            echo "  📌 $topic"
        fi
    done
    echo ""
    
    echo "$topics" | while read -r topic; do
        if [ -n "$topic" ]; then
            monitor_topic "$topic" "$DURATION"
            sleep 1
        fi
    done
}

# Show consumer groups status
show_consumer_status() {
    print_header "TRẠNG THÁI CONSUMER GROUPS"
    
    local consumers=$(docker exec "$KAFKA_CONTAINER" kafka-consumer-groups \
        --bootstrap-server localhost:9092 \
        --list 2>/dev/null)
    
    if [ -z "$consumers" ]; then
        print_warning "Chưa có consumer groups nào đang active"
        print_info "Khởi động các service consumer để bắt đầu consume messages:"
        echo "  docker compose -f deploy/docker-compose.yml up -d notification-service"
        echo "  docker compose -f deploy/docker-compose.yml up -d analytics-service"
        echo "  docker compose -f deploy/docker-compose.yml up -d warehouse-service"
        echo "  docker compose -f deploy/docker-compose.yml up -d search-service"
        echo "  docker compose -f deploy/docker-compose.yml up -d order-service"
        echo "  docker compose -f deploy/docker-compose.yml up -d payment-service"
        echo "  docker compose -f deploy/docker-compose.yml up -d product-service"
        echo "  docker compose -f deploy/docker-compose.yml up -d loyalty-service"
        echo "  docker compose -f deploy/docker-compose.yml up -d settlement-service"
        echo "  docker compose -f deploy/docker-compose.yml up -d chat-service"
        return
    fi
    
    echo "$consumers" | while read -r consumer; do
        if [ -n "$consumer" ]; then
            print_info "Consumer Group: $consumer"
            docker exec "$KAFKA_CONTAINER" kafka-consumer-groups \
                --bootstrap-server localhost:9092 \
                --group "$consumer" \
                --describe 2>/dev/null | head -30 || true
            echo ""
        fi
    done
}

# Show topic offsets
show_topic_offsets() {
    print_header "OFFSETS CỦA CÁC TOPICS"
    
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
            docker exec "$KAFKA_CONTAINER" kafka-run-class kafka.tools.GetOffsetShell \
                --broker-list localhost:9092 \
                --topic "$topic" \
                --time -1 2>/dev/null || true
            echo ""
        fi
    done
}

# Real-time monitoring dashboard
dashboard() {
    print_header "KAFKA FLOW DASHBOARD"
    
    while true; do
        clear
        print_header "KAFKA FLOW DASHBOARD - $(date '+%Y-%m-%d %H:%M:%S')"
        
        echo -e "${CYAN}📊 TOPICS:${NC}"
        docker exec "$KAFKA_CONTAINER" kafka-topics \
            --list \
            --bootstrap-server localhost:9092 2>/dev/null | \
            while read -r topic; do
                if [ -n "$topic" ]; then
                    local count=$(docker exec "$KAFKA_CONTAINER" kafka-run-class kafka.tools.GetOffsetShell \
                        --broker-list localhost:9092 \
                        --topic "$topic" \
                        --time -1 2>/dev/null | \
                        awk -F: '{sum+=$3} END {print sum+0}')
                    echo "  📌 $topic: $count messages"
                fi
            done
        
        echo ""
        echo -e "${CYAN}👥 CONSUMER GROUPS:${NC}"
        local consumers=$(docker exec "$KAFKA_CONTAINER" kafka-consumer-groups \
            --bootstrap-server localhost:9092 \
            --list 2>/dev/null)
        
        if [ -z "$consumers" ]; then
            echo "  ⚠️  Chưa có consumer groups nào"
        else
            echo "$consumers" | while read -r consumer; do
                if [ -n "$consumer" ]; then
                    echo "  👥 $consumer"
                fi
            done
        fi
        
        echo ""
        print_info "Nhấn Ctrl+C để thoát"
        sleep 5
    done
}

# Main
check_kafka

case "${1:-dashboard}" in
    "topic"|"monitor-topic")
        if [ -z "$TOPIC" ]; then
            print_error "Vui lòng chỉ định topic name"
            echo "Usage: $0 topic <topic_name> [duration_seconds]"
            exit 1
        fi
        monitor_topic "$TOPIC" "${2:-60}"
        ;;
    "all"|"monitor-all")
        monitor_all_topics
        ;;
    "consumers"|"status")
        show_consumer_status
        ;;
    "offsets")
        show_topic_offsets
        ;;
    "dashboard"|"dash")
        dashboard
        ;;
    *)
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  dashboard (default)  - Real-time dashboard"
        echo "  topic <name> [sec]   - Monitor specific topic"
        echo "  all [sec]            - Monitor all topics"
        echo "  consumers            - Show consumer groups status"
        echo "  offsets              - Show topic offsets"
        echo ""
        echo "Examples:"
        echo "  $0 dashboard"
        echo "  $0 topic order.created 30"
        echo "  $0 all 10"
        echo "  $0 consumers"
        exit 1
        ;;
esac

