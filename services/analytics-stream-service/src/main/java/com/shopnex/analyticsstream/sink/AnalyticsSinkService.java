package com.shopnex.analyticsstream.sink;

import com.shopnex.analyticsstream.model.ProductDailyStats;
import com.shopnex.analyticsstream.sink.document.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.sink.mongodb.enabled", havingValue = "true")
public class AnalyticsSinkService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsSinkService.class);

    private final MongoTemplate mongoTemplate;

    public AnalyticsSinkService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @KafkaListener(topics = "analytics.revenue.daily", groupId = "analytics-sink", containerFactory = "sinkListenerFactory")
    public void revenueDaily(@Payload Double revenue, @Header(KafkaHeaders.RECEIVED_KEY) String date) {
        if (date == null || revenue == null) return;
        mongoTemplate.save(new RevenueDailyDoc(date, revenue));
        log.trace("Sink revenue.daily key={} revenue={}", date, revenue);
    }

    @KafkaListener(topics = "analytics.revenue.1m", groupId = "analytics-sink", containerFactory = "sinkListenerFactory")
    public void revenue1m(@Payload Double revenue, @Header(KafkaHeaders.RECEIVED_KEY) String windowEndMs) {
        if (windowEndMs == null || revenue == null) return;
        long ms = Long.parseLong(windowEndMs);
        String id = windowEndMs + "_1m";
        mongoTemplate.save(new RevenueRealtimeDoc(id, ms, "1m", revenue));
        log.trace("Sink revenue.1m windowEnd={} revenue={}", windowEndMs, revenue);
    }

    @KafkaListener(topics = "analytics.revenue.5m", groupId = "analytics-sink", containerFactory = "sinkListenerFactory")
    public void revenue5m(@Payload Double revenue, @Header(KafkaHeaders.RECEIVED_KEY) String windowEndMs) {
        if (windowEndMs == null || revenue == null) return;
        long ms = Long.parseLong(windowEndMs);
        String id = windowEndMs + "_5m";
        mongoTemplate.save(new RevenueRealtimeDoc(id, ms, "5m", revenue));
        log.trace("Sink revenue.5m windowEnd={} revenue={}", windowEndMs, revenue);
    }

    @KafkaListener(topics = "analytics.user.daily", groupId = "analytics-sink", containerFactory = "sinkListenerFactory")
    public void userDaily(@Payload Double revenue, @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        if (key == null || revenue == null) return;
        mongoTemplate.save(new UserDailyDoc(key, revenue));
        log.trace("Sink user.daily key={} revenue={}", key, revenue);
    }

    @KafkaListener(topics = "analytics.product.daily", groupId = "analytics-sink", containerFactory = "productSinkListenerFactory")
    public void productDaily(@Payload ProductDailyStats stats, @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        if (key == null || stats == null) return;
        mongoTemplate.save(new ProductDailyDoc(key, stats.quantity, stats.revenue));
        log.trace("Sink product.daily key={} qty={} revenue={}", key, stats.quantity, stats.revenue);
    }

    @KafkaListener(topics = "analytics.seller.daily", groupId = "analytics-sink", containerFactory = "sinkListenerFactory")
    public void sellerDaily(@Payload Double revenue, @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        if (key == null || revenue == null) return;
        mongoTemplate.save(new SellerDailyDoc(key, revenue));
        log.trace("Sink seller.daily key={} revenue={}", key, revenue);
    }

    @KafkaListener(topics = "analytics.category.daily", groupId = "analytics-sink", containerFactory = "sinkListenerFactory")
    public void categoryDaily(@Payload Double revenue, @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        if (key == null || revenue == null) return;
        mongoTemplate.save(new CategoryDailyDoc(key, revenue));
        log.trace("Sink category.daily key={} revenue={}", key, revenue);
    }
}
