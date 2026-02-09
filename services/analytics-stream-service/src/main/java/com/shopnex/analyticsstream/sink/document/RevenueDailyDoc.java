package com.shopnex.analyticsstream.sink.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "revenue_daily")
public class RevenueDailyDoc {
    @Id
    public String date;
    public double revenue;
    @Indexed
    public String updatedAt;

    public RevenueDailyDoc() {}

    public RevenueDailyDoc(String date, double revenue) {
        this.date = date;
        this.revenue = revenue;
        this.updatedAt = java.time.Instant.now().toString();
    }
}
