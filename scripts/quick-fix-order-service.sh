#!/bin/bash

# Quick fix cho order-service: Cài dependencies và chạy service
# Usage: ./scripts/quick-fix-order-service.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_DIR="$PROJECT_ROOT/services/order-service"

print_info() {
    echo -e "\033[0;34mℹ️  $1\033[0m"
}

print_success() {
    echo -e "\033[0;32m✅ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

print_error() {
    echo -e "\033[0;31m❌ $1\033[0m"
}

print_header() {
    echo ""
    echo -e "\033[0;36m========================================\033[0m"
    echo -e "\033[0;36m$1\033[0m"
    echo -e "\033[0;36m========================================\033[0m"
    echo ""
}

print_header "QUICK FIX ORDER-SERVICE"

cd "$SERVICE_DIR"

# Check if node_modules exists
if [ -d "node_modules" ] && [ -f "node_modules/.bin/nest" ]; then
    print_success "Dependencies đã được cài đặt"
else
    print_warning "Dependencies chưa được cài đặt"
    
    # Check npm source
    NPM_PATH=$(which npm 2>/dev/null || echo "")
    if [[ "$NPM_PATH" == *"/mnt/c"* ]]; then
        print_error "NPM đang chạy từ Windows - sẽ gây lỗi!"
        echo ""
        print_info "Giải pháp:"
        echo "1. Cài Node.js trong WSL:"
        echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "   sudo apt-get install -y nodejs"
        echo ""
        echo "2. Hoặc dùng Docker:"
        echo "   cd deploy"
        echo "   docker compose -f docker-compose.dev.yml up -d order-service"
        echo ""
        exit 1
    fi
    
    print_info "Đang cài đặt dependencies..."
    npm install --legacy-peer-deps
    
    if [ -f "node_modules/.bin/nest" ]; then
        print_success "Đã cài đặt dependencies!"
    else
        print_error "Cài đặt thất bại hoặc không phải NestJS service"
        exit 1
    fi
fi

print_info "Đang khởi động order-service..."
print_info "Nhấn Ctrl+C để dừng"
echo ""

npm run start:dev

