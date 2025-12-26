#!/bin/bash
# Script để setup Kafka cluster với replication
# Chạy script này sau khi Kafka cluster đã start

set -e

KAFKA_BROKERS="localhost:9092,localhost:9094,localhost:9095"
ZOOKEEPER="localhost:2181"

echo "Setting up Kafka cluster with replication..."

# Topics với replication factor 3
TOPICS=(
  "order.created:3"
  "order.cancelled:3"
  "payment.success:3"
  "payment.failed:3"
  "settlement.balance.updated:3"
  "settlement.payout.requested:3"
  "loyalty.points.earned:3"
  "loyalty.points.redeemed:3"
  "user.created:3"
  "product.created:3"
  "product.updated:3"
  "dispute.opened:3"
  "dispute.escalated:3"
  "dispute.resolved:3"
)

# Tạo topics với replication
for topic_config in "${TOPICS[@]}"; do
  IFS=':' read -r topic_name replication_factor <<< "$topic_config"
  
  echo "Creating topic: $topic_name with replication factor: $replication_factor"
  
  docker exec -it demo-microservice-1-kafka-1-1 kafka-topics \
    --create \
    --bootstrap-server $KAFKA_BROKERS \
    --topic "$topic_name" \
    --partitions 3 \
    --replication-factor $replication_factor \
    --if-not-exists || echo "Topic $topic_name may already exist"
done

# List all topics
echo ""
echo "Listing all topics:"
docker exec -it demo-microservice-1-kafka-1-1 kafka-topics \
  --list \
  --bootstrap-server $KAFKA_BROKERS

# Describe topics để verify replication
echo ""
echo "Topic replication details:"
for topic_config in "${TOPICS[@]}"; do
  IFS=':' read -r topic_name replication_factor <<< "$topic_config"
  echo "Topic: $topic_name"
  docker exec -it demo-microservice-1-kafka-1-1 kafka-topics \
    --describe \
    --bootstrap-server $KAFKA_BROKERS \
    --topic "$topic_name" || true
  echo ""
done

# Check broker status
echo "Broker status:"
docker exec -it demo-microservice-1-kafka-1-1 kafka-broker-api-versions \
  --bootstrap-server $KAFKA_BROKERS || true

echo ""
echo "Kafka cluster setup completed!"
echo ""
echo "Brokers:"
echo "  - kafka-1: localhost:9092"
echo "  - kafka-2: localhost:9094"
echo "  - kafka-3: localhost:9095"
echo ""
echo "Update KAFKA_BROKERS in services:"
echo "  KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092"

