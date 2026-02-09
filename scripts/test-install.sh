#!/bin/bash

# Script test nhanh để kiểm tra dependencies có thể cài đặt được không

echo "🧪 Test cài đặt dependencies..."
echo "======================================"
echo ""

# Kiểm tra các package có vấn đề
echo "📋 Kiểm tra các package versions:"
echo ""

# Test @nestjs/cache-manager
echo -n "  - @nestjs/cache-manager: "
npm view @nestjs/cache-manager@3.1.0 version 2>/dev/null | head -1 || echo "❌ Không tìm thấy"

# Test cache-manager
echo -n "  - cache-manager: "
npm view cache-manager@6.0.0 version 2>/dev/null | head -1 || echo "❌ Không tìm thấy"

# Test supertest
echo -n "  - supertest: "
npm view supertest@6.3.4 version 2>/dev/null | head -1 || echo "❌ Không tìm thấy"

echo ""
echo "📦 Thử cài đặt một package test..."
echo ""

# Test cài đặt một package nhỏ
if npm install --no-save lodash@latest 2>&1 | grep -q "added"; then
    echo "✅ npm install hoạt động bình thường"
    npm uninstall lodash --no-save > /dev/null 2>&1
else
    echo "❌ npm install có vấn đề"
    echo ""
    echo "Kiểm tra log:"
    npm install --no-save lodash@latest 2>&1 | tail -5
fi

echo ""
echo "======================================"

