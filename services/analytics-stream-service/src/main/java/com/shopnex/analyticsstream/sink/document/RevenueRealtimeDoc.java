package com.shopnex.analyticsstream.sink.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "revenue_realtime")
public class RevenueRealtimeDoc {
    @Id
    public String id;  // windowEndMs_windowType e.g. "1738834560000_1m"
    public long windowEndMs;
    public String windowType;  // "1m" or "5m"
    public double revenue;
    @Indexed
    public String updatedAt;

    public RevenueRealtimeDoc() {}

    public RevenueRealtimeDoc(String id, long windowEndMs, String windowType, double revenue) {
        this.id = id;
        this.windowEndMs = windowEndMs;
        this.windowType = windowType;
        this.revenue = revenue;
        this.updatedAt = java.time.Instant.now().toString();
    }
}
