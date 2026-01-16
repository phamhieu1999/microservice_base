#!/bin/bash

# Script để cài đặt dependencies cho tất cả services hoặc một service cụ thể
# Usage: ./scripts/install-dependencies.sh [service-name]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICES_DIR="$PROJECT_ROOT/services"

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

# Check if Node.js is installed in WSL
check_node() {
    print_info "Kiểm tra Node.js..."
    
    # Check if npm from Windows is being used
    if command -v npm >/dev/null 2>&1; then
        NPM_PATH=$(which npm)
        if [[ "$NPM_PATH" == *"/mnt/c"* ]] || [[ "$NPM_PATH" == *"Program Files"* ]]; then
            print_warning "NPM đang chạy từ Windows: $NPM_PATH"
            print_warning "Điều này có thể gây lỗi. Khuyến nghị cài Node.js trong WSL"
            echo ""
            print_info "Cài đặt Node.js trong WSL:"
            echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
            echo "  sudo apt-get install -y nodejs"
            echo ""
            read -p "Tiếp tục với npm từ Windows? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_error "Đã hủy. Vui lòng cài Node.js trong WSL trước."
                exit 1
            fi
        else
            print_success "NPM từ WSL: $NPM_PATH"
        fi
    else
        print_error "NPM không được tìm thấy!"
        print_info "Cài đặt Node.js:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        exit 1
    fi
    
    NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
    NPM_VERSION=$(npm --version 2>/dev/null || echo "unknown")
    
    print_info "Node.js: $NODE_VERSION"
    print_info "NPM: $NPM_VERSION"
    echo ""
}

# Install dependencies for a service
install_service() {
    local service_name=$1
    local service_dir="$SERVICES_DIR/$service_name"
    
    if [ ! -d "$service_dir" ]; then
        print_error "Service '$service_name' không tồn tại!"
        return 1
    fi
    
    print_header "Cài đặt dependencies: $service_name"
    
    cd "$service_dir"
    
    if [ -f "package.json" ]; then
        print_info "Đang cài đặt dependencies..."
        
        # Try npm install, if fails, try with --legacy-peer-deps
        if npm install 2>&1 | tee /tmp/npm-install.log; then
            print_success "Đã cài đặt dependencies cho $service_name"
        else
            print_warning "npm install thất bại, thử với --legacy-peer-deps..."
            if npm install --legacy-peer-deps 2>&1 | tee /tmp/npm-install.log; then
                print_success "Đã cài đặt dependencies cho $service_name (với --legacy-peer-deps)"
            else
                print_error "Không thể cài đặt dependencies cho $service_name"
                print_info "Xem log: /tmp/npm-install.log"
                return 1
            fi
        fi
        
        # Verify nest CLI
        if [ -f "node_modules/.bin/nest" ]; then
            print_success "Nest CLI đã được cài đặt"
        else
            print_warning "Nest CLI không được tìm thấy (có thể không phải NestJS service)"
        fi
    else
        print_warning "Không tìm thấy package.json"
    fi
    
    echo ""
    return 0
}

# Main
SERVICE_NAME="${1:-}"

print_header "CÀI ĐẶT DEPENDENCIES"

check_node

if [ -z "$SERVICE_NAME" ]; then
    print_info "Cài đặt dependencies cho tất cả services..."
    echo ""
    
    # Get all services
    SERVICES=$(ls -d "$SERVICES_DIR"/*/ 2>/dev/null | sed 's|.*/||' | sed 's|/$||')
    
    if [ -z "$SERVICES" ]; then
        print_error "Không tìm thấy services nào!"
        exit 1
    fi
    
    SUCCESS=0
    FAILED=0
    
    for service in $SERVICES; do
        if install_service "$service"; then
            ((SUCCESS++))
        else
            ((FAILED++))
        fi
    done
    
    echo ""
    print_header "KẾT QUẢ"
    print_success "Thành công: $SUCCESS"
    if [ $FAILED -gt 0 ]; then
        print_error "Thất bại: $FAILED"
    fi
else
    install_service "$SERVICE_NAME"
fi

print_success "Hoàn tất!"
