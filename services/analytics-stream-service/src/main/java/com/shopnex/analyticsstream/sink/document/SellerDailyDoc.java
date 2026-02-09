package com.shopnex.analyticsstream.sink.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "seller_daily")
public class SellerDailyDoc {
    @Id
    public String key;  // date|sellerId
    public String date;
    public String sellerId;
    public double revenue;
    @Indexed
    public String updatedAt;

    public SellerDailyDoc() {}

    public SellerDailyDoc(String key, double revenue) {
        this.key = key;
        this.revenue = revenue;
        this.updatedAt = java.time.Instant.now().toString();
        if (key != null && key.contains("|")) {
            int i = key.indexOf('|');
            this.date = key.substring(0, i);
            this.sellerId = key.substring(i + 1);
        }
    }
}
