#!/bin/bash

# Script để fix npm issue trong WSL khi npm đang chạy từ Windows
# Usage: ./scripts/fix-npm-wsl.sh

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

print_header "FIX NPM ISSUE TRONG WSL"

# Check if npm is from Windows
NPM_PATH=$(which npm 2>/dev/null || echo "")
if [[ "$NPM_PATH" == *"/mnt/c"* ]] || [[ "$NPM_PATH" == *"Program Files"* ]]; then
    print_warning "NPM đang chạy từ Windows: $NPM_PATH"
    print_warning "Điều này gây lỗi 'UNC paths are not supported' và 'Maximum call stack size exceeded'"
    echo ""
    
    # Check if Node.js is installed in WSL
    if command -v /usr/bin/node >/dev/null 2>&1 || command -v ~/.nvm/versions/node/*/bin/node >/dev/null 2>&1; then
        print_info "Node.js đã được cài trong WSL nhưng npm không được tìm thấy đúng cách"
    else
        print_info "Node.js chưa được cài trong WSL"
    fi
    
    echo ""
    print_info "Có 2 cách để fix:"
    echo ""
    echo "CÁCH 1: Cài Node.js trong WSL (Khuyến nghị)"
    echo "----------------------------------------"
    echo "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "sudo apt-get install -y nodejs"
    echo ""
    echo "Hoặc dùng nvm (tốt hơn):"
    echo "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "source ~/.bashrc"
    echo "nvm install 20"
    echo "nvm use 20"
    echo ""
    echo "CÁCH 2: Dùng Docker cho development"
    echo "----------------------------------------"
    echo "cd deploy"
    echo "docker compose -f docker-compose.dev.yml up -d order-service"
    echo ""
    
    # Try to install using workaround
    print_info "Đang thử workaround: dùng npx với path đầy đủ..."
    
    SERVICE_NAME="${1:-order-service}"
    SERVICE_DIR="services/$SERVICE_NAME"
    
    if [ -d "$SERVICE_DIR" ]; then
        cd "$SERVICE_DIR"
        
        # Try to install using npx
        print_info "Thử cài đặt dependencies cho $SERVICE_NAME..."
        
        # Create a temporary npm script wrapper
        if command -v node >/dev/null 2>&1; then
            NODE_PATH=$(which node)
            print_info "Tìm thấy Node.js: $NODE_PATH"
            
            # Try installing with explicit node path
            if [ -f "package.json" ]; then
                print_info "Đang cài đặt dependencies (có thể mất vài phút)..."
                
                # Use node directly to run npm
                if $NODE_PATH "$(dirname $NPM_PATH)/npm" install --legacy-peer-deps 2>&1 | tail -20; then
                    print_success "Đã cài đặt dependencies!"
                else
                    print_error "Vẫn gặp lỗi. Vui lòng cài Node.js trong WSL (xem hướng dẫn trên)"
                    exit 1
                fi
            fi
        else
            print_error "Không tìm thấy Node.js. Vui lòng cài Node.js trong WSL"
            exit 1
        fi
    fi
else
    print_success "NPM đang chạy từ WSL: $NPM_PATH"
    print_info "Không cần fix!"
fi

print_success "Hoàn tất!"

