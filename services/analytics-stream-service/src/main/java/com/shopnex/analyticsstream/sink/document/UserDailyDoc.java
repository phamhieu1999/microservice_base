package com.shopnex.analyticsstream.sink.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "user_daily")
public class UserDailyDoc {
    @Id
    public String key;  // userId|date
    public String userId;
    public String date;
    public double revenue;
    @Indexed
    public String updatedAt;

    public UserDailyDoc() {}

    public UserDailyDoc(String key, double revenue) {
        this.key = key;
        this.revenue = revenue;
        this.updatedAt = java.time.Instant.now().toString();
        if (key != null && key.contains("|")) {
            int i = key.indexOf('|');
            this.userId = key.substring(0, i);
            this.date = key.substring(i + 1);
        }
    }
}
