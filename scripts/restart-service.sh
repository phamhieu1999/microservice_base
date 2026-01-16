#!/bin/bash

# Script để restart một hoặc nhiều services
# Usage: ./scripts/restart-service.sh <service-name> [service-name2 ...]

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

# Check dependencies for a service
check_dependencies() {
    local service=$1
    
    case "$service" in
        auth-service)
            print_info "Kiểm tra dependencies cho auth-service..."
            # Check postgres-auth
            if ! docker compose -f "$DEPLOY_DIR/docker-compose.yml" ps postgres-auth | grep -q "Up"; then
                print_warning "postgres-auth chưa chạy. Đang khởi động..."
                docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d postgres-auth
                sleep 3
            fi
            # Check kafka
            if ! docker compose -f "$DEPLOY_DIR/docker-compose.yml" ps kafka | grep -q "Up"; then
                print_warning "kafka chưa chạy. Đang khởi động..."
                docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d zookeeper kafka
                sleep 10
            fi
            ;;
        order-service)
            print_info "Kiểm tra dependencies cho order-service..."
            # Check postgres-order
            if ! docker compose -f "$DEPLOY_DIR/docker-compose.yml" ps postgres-order | grep -q "Up"; then
                print_warning "postgres-order chưa chạy. Đang khởi động..."
                docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d postgres-order
                sleep 3
            fi
            # Check kafka
            if ! docker compose -f "$DEPLOY_DIR/docker-compose.yml" ps kafka | grep -q "Up"; then
                print_warning "kafka chưa chạy. Đang khởi động..."
                docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d zookeeper kafka
                sleep 10
            fi
            ;;
        *)
            print_info "Kiểm tra dependencies chung..."
            # Check kafka (most services need it)
            if ! docker compose -f "$DEPLOY_DIR/docker-compose.yml" ps kafka | grep -q "Up"; then
                print_warning "kafka chưa chạy. Đang khởi động..."
                docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d zookeeper kafka
                sleep 10
            fi
            ;;
    esac
}

# Restart a service
restart_service() {
    local service=$1
    
    print_header "RESTART SERVICE: $service"
    
    cd "$DEPLOY_DIR"
    
    # Check dependencies
    check_dependencies "$service"
    
    # Check current status
    print_info "Trạng thái hiện tại:"
    docker compose ps "$service" || true
    echo ""
    
    # Show recent logs if service exists
    if docker compose ps "$service" | grep -q "$service"; then
        print_info "Logs gần đây (10 dòng cuối):"
        docker compose logs --tail=10 "$service" 2>/dev/null || true
        echo ""
    fi
    
    # Stop service
    print_info "Đang dừng service..."
    docker compose stop "$service" 2>/dev/null || true
    
    # Remove container if exists
    print_info "Đang xóa container cũ..."
    docker compose rm -f "$service" 2>/dev/null || true
    
    # Start service
    print_info "Đang khởi động service..."
    docker compose up -d "$service"
    
    # Wait a bit
    sleep 3
    
    # Check status
    print_info "Trạng thái sau khi restart:"
    docker compose ps "$service"
    echo ""
    
    # Check if running
    if docker compose ps "$service" | grep -q "Up"; then
        print_success "Service $service đã được khởi động thành công!"
        
        # Show logs
        print_info "Logs (10 dòng cuối):"
        docker compose logs --tail=10 "$service"
    else
        print_error "Service $service chưa chạy được. Kiểm tra logs:"
        docker compose logs --tail=20 "$service"
        return 1
    fi
    
    return 0
}

# Main
if [ $# -eq 0 ]; then
    print_error "Vui lòng chỉ định tên service(s)"
    echo ""
    echo "Usage: $0 <service-name> [service-name2 ...]"
    echo ""
    echo "Ví dụ:"
    echo "  $0 auth-service"
    echo "  $0 auth-service order-service"
    echo "  $0 all  # Restart tất cả services"
    exit 1
fi

cd "$DEPLOY_DIR"

if [ "$1" == "all" ]; then
    print_header "RESTART TẤT CẢ SERVICES"
    
    SERVICES=$(docker compose config --services 2>/dev/null | grep -E "-service$|api-gateway" || echo "")
    
    if [ -z "$SERVICES" ]; then
        print_error "Không tìm thấy services nào!"
        exit 1
    fi
    
    SUCCESS=0
    FAILED=0
    
    for service in $SERVICES; do
        if restart_service "$service"; then
            ((SUCCESS++))
        else
            ((FAILED++))
        fi
        echo ""
    done
    
    print_header "KẾT QUẢ"
    print_success "Thành công: $SUCCESS"
    if [ $FAILED -gt 0 ]; then
        print_error "Thất bại: $FAILED"
    fi
else
    # Restart specified services
    for service in "$@"; do
        restart_service "$service"
        echo ""
    done
fi

print_success "Hoàn tất!"

