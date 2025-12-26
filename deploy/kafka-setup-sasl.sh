#!/bin/bash
# Script để setup Kafka với SASL authentication
# Chạy script này sau khi Kafka container đã start

set -e

KAFKA_CONTAINER="demo-microservice-1-kafka-1"
ZOOKEEPER="localhost:2181"

echo "Setting up Kafka SASL authentication..."

# Tạo admin user
echo "Creating admin user..."
docker exec $KAFKA_CONTAINER kafka-configs \
  --zookeeper $ZOOKEEPER \
  --alter \
  --add-config 'SCRAM-SHA-512=[password=kafka-admin-password]' \
  --entity-type users \
  --entity-name kafka-admin || echo "Admin user may already exist"

# Tạo warehouse-service user
echo "Creating warehouse-service user..."
docker exec $KAFKA_CONTAINER kafka-configs \
  --zookeeper $ZOOKEEPER \
  --alter \
  --add-config 'SCRAM-SHA-512=[password=warehouse-service-password]' \
  --entity-type users \
  --entity-name warehouse-service || echo "Warehouse user may already exist"

# Tạo order-service user
echo "Creating order-service user..."
docker exec $KAFKA_CONTAINER kafka-configs \
  --zookeeper $ZOOKEEPER \
  --alter \
  --add-config 'SCRAM-SHA-512=[password=order-service-password]' \
  --entity-type users \
  --entity-name order-service || echo "Order user may already exist"

# Tạo payment-service user
echo "Creating payment-service user..."
docker exec $KAFKA_CONTAINER kafka-configs \
  --zookeeper $ZOOKEEPER \
  --alter \
  --add-config 'SCRAM-SHA-512=[password=payment-service-password]' \
  --entity-type users \
  --entity-name payment-service || echo "Payment user may already exist"

# List users
echo "Listing all users:"
docker exec $KAFKA_CONTAINER kafka-configs \
  --zookeeper $ZOOKEEPER \
  --describe \
  --entity-type users

echo "Kafka SASL setup completed!"
echo ""
echo "To enable SASL in services, set these environment variables:"
echo "  KAFKA_ENABLE_SASL=true"
echo "  KAFKA_USERNAME=<service-username>"
echo "  KAFKA_PASSWORD=<service-password>"
echo "  KAFKA_SASL_MECHANISM=scram-sha-512"
echo "  KAFKA_BROKERS=kafka:9093"  # Use SASL port

