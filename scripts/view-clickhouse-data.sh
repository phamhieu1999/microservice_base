#!/bin/bash

# Script để xem dữ liệu ClickHouse
# Usage: ./scripts/view-clickhouse-data.sh

CLICKHOUSE_HOST="${CLICKHOUSE_HOST:-localhost}"
CLICKHOUSE_PORT="${CLICKHOUSE_PORT:-8123}"
CLICKHOUSE_USER="${CLICKHOUSE_USER:-warehouse_user}"
CLICKHOUSE_PASSWORD="${CLICKHOUSE_PASSWORD:-warehouse_password}"
CLICKHOUSE_DB="${CLICKHOUSE_DB:-warehouse_db}"

BASE_URL="http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}"

echo "=========================================="
echo "📊 TỔNG QUAN DỮ LIỆU CLICKHOUSE"
echo "=========================================="
echo ""

# Function to execute query
query() {
    local query_str="$1"
    local format="${2:-JSONEachRow}"
    # Add FORMAT to query string
    local full_query="${query_str} FORMAT ${format}"
    # Use --data-urlencode for proper URL encoding
    curl -s -G "${BASE_URL}/" \
        --data-urlencode "query=${full_query}" \
        --user "${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}"
}

echo "📈 SỐ LƯỢNG RECORDS TRONG CÁC BẢNG:"
echo "-----------------------------------"
echo "fact_order: $(query "SELECT count(*) FROM ${CLICKHOUSE_DB}.fact_order" | grep -o '[0-9]*')"
echo "fact_payment: $(query "SELECT count(*) FROM ${CLICKHOUSE_DB}.fact_payment" | grep -o '[0-9]*')"
echo "fact_settlement: $(query "SELECT count(*) FROM ${CLICKHOUSE_DB}.fact_settlement" | grep -o '[0-9]*')"
echo "fact_loyalty: $(query "SELECT count(*) FROM ${CLICKHOUSE_DB}.fact_loyalty" | grep -o '[0-9]*')"
echo "dim_user: $(query "SELECT count(*) FROM ${CLICKHOUSE_DB}.dim_user" | grep -o '[0-9]*')"
echo ""

echo "📅 DOANH THU THEO NGÀY (10 ngày gần nhất):"
echo "-----------------------------------"
query "SELECT toDate(order_date) as date, count(*) as orders, sum(total_amount) as total_revenue FROM ${CLICKHOUSE_DB}.fact_order GROUP BY date ORDER BY date DESC LIMIT 10"

echo ""
echo "🏪 TOP 10 SELLER THEO DOANH THU:"
echo "-----------------------------------"
query "SELECT seller_id, count(*) as orders, sum(total_amount) as revenue FROM ${CLICKHOUSE_DB}.fact_order GROUP BY seller_id ORDER BY revenue DESC LIMIT 10"

echo ""
echo "💳 PHƯƠNG THỨC THANH TOÁN:"
echo "-----------------------------------"
query "SELECT payment_method, count(*) as count, sum(amount) as total FROM ${CLICKHOUSE_DB}.fact_payment WHERE status='SUCCESS' GROUP BY payment_method ORDER BY total DESC"

echo ""
echo "⭐ LOYALTY POINTS TỔNG QUAN:"
echo "-----------------------------------"
query "SELECT sum(points_earned) as total_earned, sum(points_redeemed) as total_redeemed, count(DISTINCT user_id) as users FROM ${CLICKHOUSE_DB}.fact_loyalty"

echo ""
echo "💰 SETTLEMENT TỔNG QUAN:"
echo "-----------------------------------"
query "SELECT payout_status, count(*) as count, sum(payout_amount) as total FROM ${CLICKHOUSE_DB}.fact_settlement GROUP BY payout_status"

echo ""
echo "📊 MATERIALIZED VIEW - DOANH THU HÀNG NGÀY:"
echo "-----------------------------------"
query "SELECT * FROM ${CLICKHOUSE_DB}.mv_daily_revenue ORDER BY revenue_date DESC LIMIT 10"

echo ""
echo "=========================================="
echo "✅ Hoàn thành!"
echo "=========================================="

