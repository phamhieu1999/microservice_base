package com.shopnex.analyticsstream.sink.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "product_daily")
public class ProductDailyDoc {
    @Id
    public String key;  // date|productId
    public String date;
    public String productId;
    public long quantity;
    public double revenue;
    @Indexed
    public String updatedAt;

    public ProductDailyDoc() {}

    public ProductDailyDoc(String key, long quantity, double revenue) {
        this.key = key;
        this.quantity = quantity;
        this.revenue = revenue;
        this.updatedAt = java.time.Instant.now().toString();
        if (key != null && key.contains("|")) {
            int i = key.indexOf('|');
            this.date = key.substring(0, i);
            this.productId = key.substring(i + 1);
        }
    }
}
