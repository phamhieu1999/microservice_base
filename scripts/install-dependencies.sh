#!/bin/bash

# Script để cài đặt dependencies cho tất cả services
# Sử dụng cho npm workspaces

echo "📦 Đang cài đặt dependencies cho dự án..."
echo "======================================"
echo ""

# Kiểm tra có phải là npm workspace không
if [ ! -f "package.json" ]; then
    echo "❌ Không tìm thấy package.json ở root!"
    echo "   Vui lòng chạy script từ thư mục root của dự án."
    exit 1
fi

# Kiểm tra có workspaces không
if grep -q "workspaces" package.json; then
    echo "✅ Phát hiện npm workspaces"
    echo "📦 Đang cài đặt dependencies từ root..."
    echo ""
    
    # Thử cài đặt bình thường trước
    npm install 2>&1 | tee /tmp/npm-install.log
    
    INSTALL_EXIT_CODE=${PIPESTATUS[0]}
    
    # Nếu thất bại và có lỗi ERESOLVE, thử với --legacy-peer-deps
    if [ $INSTALL_EXIT_CODE -ne 0 ] && grep -q "ERESOLVE" /tmp/npm-install.log; then
        echo ""
        echo "   ⚠️  Gặp lỗi ERESOLVE, thử với --legacy-peer-deps..."
        npm install --legacy-peer-deps
        INSTALL_EXIT_CODE=$?
    fi
    
    if [ $INSTALL_EXIT_CODE -eq 0 ]; then
        echo ""
        echo "✅ Đã cài đặt dependencies thành công!"
        echo ""
        echo "💡 Lưu ý: Với npm workspaces, dependencies được hoisted lên root."
        echo "   Các services sẽ sử dụng dependencies từ node_modules ở root."
    else
        echo ""
        echo "❌ Cài đặt dependencies thất bại!"
        exit 1
    fi
else
    echo "⚠️  Không phát hiện npm workspaces"
    echo "📦 Đang cài đặt dependencies cho từng service..."
    echo ""
    
    SERVICES_DIR="services"
    SUCCESS_COUNT=0
    FAILED_SERVICES=()
    
    if [ ! -d "$SERVICES_DIR" ]; then
        echo "❌ Thư mục services không tồn tại!"
        exit 1
    fi
    
    for service_dir in "$SERVICES_DIR"/*; do
        if [ -d "$service_dir" ] && [ -f "$service_dir/package.json" ]; then
            service_name=$(basename "$service_dir")
            echo "📦 Đang cài đặt: $service_name"
            
            cd "$service_dir"
            
            # Thử cài đặt bình thường trước
            npm install --silent 2>&1 | tee /tmp/npm-install-service.log > /dev/null
            INSTALL_EXIT_CODE=${PIPESTATUS[0]}
            
            # Nếu thất bại và có lỗi ERESOLVE, thử với --legacy-peer-deps
            if [ $INSTALL_EXIT_CODE -ne 0 ] && grep -q "ERESOLVE" /tmp/npm-install-service.log; then
                echo "   ⚠️  Gặp lỗi ERESOLVE, thử với --legacy-peer-deps..."
                if npm install --legacy-peer-deps --silent; then
                    echo "   ✅ Thành công: $service_name (với --legacy-peer-deps)"
                    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
                else
                    echo "   ❌ Thất bại: $service_name"
                    FAILED_SERVICES+=("$service_name")
                fi
            elif [ $INSTALL_EXIT_CODE -eq 0 ]; then
                echo "   ✅ Thành công: $service_name"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                echo "   ❌ Thất bại: $service_name"
                FAILED_SERVICES+=("$service_name")
            fi
            cd - > /dev/null
        fi
    done
    
    echo ""
    echo "======================================"
    echo "📊 Kết quả:"
    echo "   ✅ Thành công: $SUCCESS_COUNT"
    echo "   ❌ Thất bại: ${#FAILED_SERVICES[@]}"
    
    if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
        echo ""
        echo "❌ Các services cài đặt thất bại:"
        for service in "${FAILED_SERVICES[@]}"; do
            echo "   - $service"
        done
        exit 1
    fi
fi

echo ""
echo "✅ Hoàn tất!"

