package com.shopnex.analyticsstream;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.kafka.annotation.EnableKafkaStreams;

/**
 * Entry point for the Kafka Streams analytics application.
 * {@link EnableKafkaStreams} enables Spring Kafka Streams infrastructure
 * and provides a {@link org.apache.kafka.streams.StreamsBuilder} bean
 * that is injected into topology configuration classes.
 * Set ANALYTICS_SINK_ENABLED=false to run stream-only without MongoDB.
 */
@SpringBootApplication(exclude = MongoAutoConfiguration.class)
@EnableKafkaStreams
public class AnalyticsStreamApplication {

    public static void main(String[] args) {
        SpringApplication.run(AnalyticsStreamApplication.class, args);
    }
}

