#!/bin/bash

# Script để build tất cả các services

echo "🏗️  Đang build tất cả các services..."
echo "======================================"
echo ""

# Lưu thư mục gốc
ROOT_DIR=$(pwd)
SERVICES_DIR="services"
FAILED_SERVICES=()
SUCCESS_COUNT=0
TOTAL_COUNT=0

if [ ! -d "$SERVICES_DIR" ]; then
    echo "❌ Thư mục services không tồn tại!"
    exit 1
fi

# Kiểm tra và cài đặt dependencies từ root (cho npm workspaces)
if [ -f "package.json" ] && grep -q "workspaces" package.json; then
    echo "📦 Kiểm tra dependencies ở root (npm workspaces)..."
    if [ ! -d "node_modules" ] || [ ! -d "node_modules/.bin" ]; then
        echo "   ⚠️  Đang cài đặt dependencies từ root..."
        npm install
        if [ $? -ne 0 ]; then
            echo "   ❌ Cài đặt dependencies thất bại!"
            exit 1
        fi
        echo "   ✅ Đã cài đặt dependencies từ root"
    else
        echo "   ✅ Dependencies đã được cài đặt"
    fi
    echo ""
fi

# Tìm tất cả các services có package.json
for service_dir in "$SERVICES_DIR"/*; do
    if [ -d "$service_dir" ] && [ -f "$service_dir/package.json" ]; then
        service_name=$(basename "$service_dir")
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
        
        echo "📦 Đang build: $service_name"
        cd "$ROOT_DIR/$service_dir"
        
        # Kiểm tra node_modules trong service (có thể không có nếu dùng workspaces)
        # Với workspaces, dependencies có thể ở root, nên không bắt buộc phải có node_modules ở đây
        
        # Build service - sử dụng npx để đảm bảo tìm được nest CLI
        # npm run build sẽ tự động sử dụng npx nếu cần
        if npm run build 2>&1; then
            echo "   ✅ Build thành công: $service_name"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo "   ❌ Build thất bại: $service_name"
            FAILED_SERVICES+=("$service_name")
        fi
        
        echo ""
        cd "$ROOT_DIR"
    fi
done

echo "======================================"
echo "📊 Kết quả:"
echo "   ✅ Thành công: $SUCCESS_COUNT/$TOTAL_COUNT"
echo "   ❌ Thất bại: ${#FAILED_SERVICES[@]}"

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo ""
    echo "❌ Các services build thất bại:"
    for service in "${FAILED_SERVICES[@]}"; do
        echo "   - $service"
    done
    exit 1
fi

echo ""
echo "✅ Tất cả services đã được build thành công!"

