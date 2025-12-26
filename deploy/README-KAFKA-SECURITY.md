# Kafka Security Setup Guide

Hướng dẫn setup Kafka với SASL authentication cho production.

## 1. Enable SASL Authentication

### Bước 1: Update docker-compose.yml

Sử dụng file `docker-compose.kafka-secure.yml` hoặc merge config vào `docker-compose.yml`:

```yaml
kafka:
  environment:
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,SASL_PLAINTEXT:SASL_PLAINTEXT
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,SASL_PLAINTEXT://kafka:9093
    KAFKA_INTER_BROKER_LISTENER_NAME: SASL_PLAINTEXT
    KAFKA_SASL_MECHANISM_INTER_BROKER_PROTOCOL: SCRAM-SHA-512
    KAFKA_SASL_ENABLED_MECHANISMS: SCRAM-SHA-512
```

### Bước 2: Setup Users

Chạy script setup:

```bash
cd deploy
./kafka-setup-sasl.sh
```

Script sẽ tạo các users:
- `kafka-admin` - Admin user
- `warehouse-service` - Warehouse service user
- `order-service` - Order service user
- `payment-service` - Payment service user

### Bước 3: Update Service Environment Variables

Thêm vào `.env` hoặc docker-compose.yml cho mỗi service:

```env
KAFKA_ENABLE_SASL=true
KAFKA_USERNAME=warehouse-service
KAFKA_PASSWORD=warehouse-service-password
KAFKA_SASL_MECHANISM=scram-sha-512
KAFKA_BROKERS=kafka:9093  # Use SASL port
```

## 2. Testing SASL

### Test với kafka-console-producer:

```bash
docker exec -it <kafka-container> kafka-console-producer \
  --bootstrap-server localhost:9093 \
  --topic test-topic \
  --producer-property security.protocol=SASL_PLAINTEXT \
  --producer-property sasl.mechanism=SCRAM-SHA-512 \
  --producer-property sasl.jaas.config='org.apache.kafka.common.security.scram.ScramLoginModule required username="warehouse-service" password="warehouse-service-password";'
```

### Test với kafka-console-consumer:

```bash
docker exec -it <kafka-container> kafka-console-consumer \
  --bootstrap-server localhost:9093 \
  --topic test-topic \
  --from-beginning \
  --consumer-property security.protocol=SASL_PLAINTEXT \
  --consumer-property sasl.mechanism=SCRAM-SHA-512 \
  --consumer-property sasl.jaas.config='org.apache.kafka.common.security.scram.ScramLoginModule required username="warehouse-service" password="warehouse-service-password";'
```

## 3. Disable SASL (Development)

Để disable SASL trong development:

```env
KAFKA_ENABLE_SASL=false
KAFKA_BROKERS=kafka:9092  # Use plaintext port
```

## 4. Security Best Practices

1. **Strong Passwords**: Sử dụng passwords mạnh (min 16 characters)
2. **Rotate Passwords**: Đổi passwords định kỳ
3. **Separate Users**: Mỗi service có user riêng
4. **Least Privilege**: Chỉ cấp quyền cần thiết
5. **Monitor Access**: Log và monitor tất cả access

## 5. Troubleshooting

### Issue: Cannot connect to Kafka

**Check**:
- Kafka container đang chạy
- Port 9093 accessible
- Username/password đúng
- SASL mechanism đúng (SCRAM-SHA-512)

### Issue: Authentication failed

**Check**:
- User đã được tạo: `kafka-configs --zookeeper zookeeper:2181 --describe --entity-type users`
- Password đúng
- SASL mechanism match

### Issue: Service cannot produce/consume

**Check**:
- Environment variables đã set đúng
- KAFKA_BROKERS point to đúng port (9093 cho SASL)
- Consumer group permissions

