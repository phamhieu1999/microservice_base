#!/bin/bash

# Script để xem dữ liệu từ các bảng ClickHouse
# Usage: ./scripts/view-clickhouse-tables.sh [table_name] [limit]

CLICKHOUSE_HOST="${CLICKHOUSE_HOST:-localhost}"
CLICKHOUSE_PORT="${CLICKHOUSE_PORT:-8123}"
CLICKHOUSE_USER="${CLICKHOUSE_USER:-warehouse_user}"
CLICKHOUSE_PASSWORD="${CLICKHOUSE_PASSWORD:-warehouse_password}"
CLICKHOUSE_DB="${CLICKHOUSE_DB:-warehouse_db}"

BASE_URL="http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}"
TABLE_NAME="${1:-all}"
LIMIT="${2:-10}"

# Function to execute query
query() {
    local query_str="$1"
    curl -s -G "${BASE_URL}/" \
        --data-urlencode "query=${query_str}" \
        --user "${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}"
}

show_table() {
    local table=$1
    local limit=$2
    local order_by=$3
    
    echo "=========================================="
    echo "📊 BẢNG: ${table}"
    echo "=========================================="
    
    if [ -z "$order_by" ]; then
        order_by="created_at DESC"
    fi
    
    query "SELECT * FROM ${CLICKHOUSE_DB}.${table} ORDER BY ${order_by} LIMIT ${limit} FORMAT PrettyCompact"
    echo ""
}

case "$TABLE_NAME" in
    "fact_order"|"order")
        show_table "fact_order" "$LIMIT" "order_datetime DESC"
        ;;
    "fact_payment"|"payment")
        show_table "fact_payment" "$LIMIT" "payment_datetime DESC"
        ;;
    "fact_settlement"|"settlement")
        show_table "fact_settlement" "$LIMIT" "settlement_datetime DESC"
        ;;
    "fact_loyalty"|"loyalty")
        show_table "fact_loyalty" "$LIMIT" "transaction_datetime DESC"
        ;;
    "dim_user"|"user")
        show_table "dim_user" "$LIMIT" "created_at DESC"
        ;;
    "dim_product"|"product")
        show_table "dim_product" "$LIMIT" "created_at DESC"
        ;;
    "dim_seller"|"seller")
        show_table "dim_seller" "$LIMIT" "created_at DESC"
        ;;
    "mv_daily_revenue"|"revenue")
        show_table "mv_daily_revenue" "$LIMIT" "revenue_date DESC"
        ;;
    "all"|*)
        echo "📊 XEM TẤT CẢ CÁC BẢNG"
        echo ""
        show_table "fact_order" "$LIMIT" "order_datetime DESC"
        show_table "fact_payment" "$LIMIT" "payment_datetime DESC"
        show_table "fact_settlement" "$LIMIT" "settlement_datetime DESC"
        show_table "fact_loyalty" "$LIMIT" "transaction_datetime DESC"
        show_table "dim_user" "$LIMIT" "created_at DESC"
        show_table "dim_product" "$LIMIT" "created_at DESC"
        show_table "dim_seller" "$LIMIT" "created_at DESC"
        ;;
esac

echo "✅ Hoàn thành!"
echo ""
echo "💡 Sử dụng:"
echo "  ./scripts/view-clickhouse-tables.sh [table_name] [limit]"
echo ""
echo "  Ví dụ:"
echo "    ./scripts/view-clickhouse-tables.sh fact_order 20"
echo "    ./scripts/view-clickhouse-tables.sh payment 15"
echo "    ./scripts/view-clickhouse-tables.sh all 5"

