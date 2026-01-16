#!/bin/bash

# Script để hiển thị đường dẫn lưu trữ của Docker volumes
# Usage: ./show-volume-paths.sh [volume-name]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Docker Volume Paths Information ===${NC}\n"

# Get Docker root directory
DOCKER_ROOT=$(docker info 2>/dev/null | grep "Docker Root Dir" | awk '{print $4}')
if [ -z "$DOCKER_ROOT" ]; then
    echo -e "${YELLOW}Warning: Cannot get Docker root directory${NC}"
    DOCKER_ROOT="/var/lib/docker"
fi

echo -e "${GREEN}Docker Root Directory:${NC} $DOCKER_ROOT"
echo -e "${GREEN}Volumes Location:${NC} $DOCKER_ROOT/volumes/"
echo ""

# Check if volumes exist
VOLUMES=$(docker volume ls --format "{{.Name}}" | grep "microservice_base" || true)

if [ -z "$VOLUMES" ]; then
    echo -e "${YELLOW}No volumes found with prefix 'microservice_base'${NC}"
    echo -e "${YELLOW}Volumes will be created when you run: docker compose up${NC}"
    echo ""
    echo -e "${BLUE}Expected volumes after docker compose up:${NC}"
    echo "  - microservice_base_redis-data"
    echo "  - microservice_base_prometheus-data"
    echo "  - microservice_base_grafana-data"
    echo "  - microservice_base_alertmanager-data"
    echo "  - microservice_base_postgres-auth-data"
    echo "  - microservice_base_postgres-order-data"
    echo "  - microservice_base_postgres-payment-data"
    echo "  - microservice_base_postgres-seller-data"
    echo "  - microservice_base_postgres-promo-data"
    echo "  - microservice_base_postgres-shipping-data"
    echo "  - microservice_base_postgres-loyalty-data"
    echo "  - microservice_base_postgres-dispute-data"
    echo "  - microservice_base_postgres-settlement-data"
    echo "  - microservice_base_mongo-data"
    echo "  - microservice_base_elasticsearch-data"
    echo "  - microservice_base_clickhouse-data"
    echo "  - microservice_base_clickhouse-logs"
    echo "  - microservice_base_zookeeper-data"
    echo "  - microservice_base_zookeeper-logs"
    echo "  - microservice_base_kafka-data"
    exit 0
fi

# If specific volume name provided
if [ -n "$1" ]; then
    VOLUME_NAME="$1"
    if ! echo "$VOLUMES" | grep -q "^$VOLUME_NAME$"; then
        echo -e "${YELLOW}Volume '$VOLUME_NAME' not found${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}=== Volume: $VOLUME_NAME ===${NC}\n"
    docker volume inspect "$VOLUME_NAME" --format "{{.Mountpoint}}" | while read MOUNTPOINT; do
        echo -e "${GREEN}Mount Point:${NC} $MOUNTPOINT"
        echo -e "${GREEN}Size:${NC} $(du -sh "$MOUNTPOINT" 2>/dev/null | awk '{print $1}' || echo 'N/A')"
        echo ""
    done
    exit 0
fi

# List all volumes with paths
echo -e "${BLUE}=== All Microservice Volumes ===${NC}\n"

for VOLUME in $VOLUMES; do
    echo -e "${GREEN}Volume:${NC} $VOLUME"
    MOUNTPOINT=$(docker volume inspect "$VOLUME" --format "{{.Mountpoint}}" 2>/dev/null || echo "N/A")
    if [ "$MOUNTPOINT" != "N/A" ]; then
        echo -e "  ${BLUE}Path:${NC} $MOUNTPOINT"
        SIZE=$(du -sh "$MOUNTPOINT" 2>/dev/null | awk '{print $1}' || echo 'N/A')
        echo -e "  ${BLUE}Size:${NC} $SIZE"
    else
        echo -e "  ${YELLOW}Path: N/A${NC}"
    fi
    echo ""
done

echo -e "${BLUE}=== Quick Access Commands ===${NC}\n"
echo "To inspect a specific volume:"
echo "  docker volume inspect <volume-name>"
echo ""
echo "To see volume contents:"
echo "  ls -la \$(docker volume inspect <volume-name> --format '{{.Mountpoint}}')"
echo ""
echo "To backup a volume:"
echo "  docker run --rm -v <volume-name>:/data:ro -v \$(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data ."
echo ""




