package com.shopnex.analyticsstream.sink;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

/**
 * MongoDB beans only when sink is enabled and URI is set.
 * When app.sink.mongodb.enabled=false, do not set ANALYTICS_MONGO_URI so that this config is not active.
 */
@Configuration
@ConditionalOnProperty(name = "app.sink.mongodb.enabled", havingValue = "true")
public class SinkMongoConfig {

    @Value("${spring.data.mongodb.uri:}")
    private String uri;

    @Bean
    public MongoClient mongoClient() {
        if (uri == null || uri.isBlank()) {
            throw new IllegalStateException("ANALYTICS_MONGO_URI is required when app.sink.mongodb.enabled=true");
        }
        return MongoClients.create(uri);
    }

    @Bean
    public MongoTemplate mongoTemplate(MongoClient mongoClient) {
        // Use default database from URI, or "analytics_db"
        String db = "analytics_db";
        if (uri != null && uri.contains("/")) {
            String path = uri.substring(uri.lastIndexOf('/') + 1).split("\\?")[0];
            if (!path.isBlank()) db = path;
        }
        return new MongoTemplate(mongoClient, db);
    }
}
