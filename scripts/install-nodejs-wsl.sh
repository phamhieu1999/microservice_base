#!/bin/bash

# Script để cài đặt Node.js trong WSL
# Usage: ./scripts/install-nodejs-wsl.sh

set -e

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

print_header "CÀI ĐẶT NODE.JS TRONG WSL"

# Check if node is already installed
if command -v node >/dev/null 2>&1 && ! which node | grep -q "/mnt/c"; then
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    print_success "Node.js đã được cài đặt!"
    print_info "Node.js: $NODE_VERSION"
    print_info "NPM: $NPM_VERSION"
    print_info "Path: $(which node)"
    exit 0
fi

print_info "Node.js chưa được cài trong WSL"
print_info "Đang cài đặt Node.js 20.x..."
echo ""

# Method 1: Using NodeSource (Recommended)
print_info "Cách 1: Cài từ NodeSource (Khuyến nghị)"
echo ""

# Check if curl is available
if ! command -v curl >/dev/null 2>&1; then
    print_warning "curl chưa được cài. Đang cài đặt..."
    sudo apt-get update
    sudo apt-get install -y curl
fi

# Install Node.js from NodeSource
print_info "Đang thêm NodeSource repository..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

print_info "Đang cài đặt Node.js..."
sudo apt-get install -y nodejs

# Verify installation
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    NODE_PATH=$(which node)
    
    print_success "Đã cài đặt Node.js thành công!"
    print_info "Node.js: $NODE_VERSION"
    print_info "NPM: $NPM_VERSION"
    print_info "Path: $NODE_PATH"
    
    # Verify it's from WSL, not Windows
    if [[ "$NODE_PATH" == *"/mnt/c"* ]]; then
        print_error "Node.js vẫn đang chạy từ Windows!"
        print_info "Vui lòng restart terminal hoặc chạy: source ~/.bashrc"
    else
        print_success "Node.js đang chạy từ WSL!"
    fi
else
    print_error "Cài đặt thất bại!"
    exit 1
fi

print_header "HOÀN TẤT"

print_info "Bây giờ bạn có thể:"
echo "  1. Cài dependencies: cd services/notification-service && npm install"
echo "  2. Chạy service: npm run start:dev"
echo ""

print_warning "Nếu vẫn gặp lỗi, hãy restart terminal hoặc chạy:"
echo "  source ~/.bashrc"

