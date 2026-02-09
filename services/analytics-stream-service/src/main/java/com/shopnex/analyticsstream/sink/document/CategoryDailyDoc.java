package com.shopnex.analyticsstream.sink.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "category_daily")
public class CategoryDailyDoc {
    @Id
    public String key;  // date|category
    public String date;
    public String category;
    public double revenue;
    @Indexed
    public String updatedAt;

    public CategoryDailyDoc() {}

    public CategoryDailyDoc(String key, double revenue) {
        this.key = key;
        this.revenue = revenue;
        this.updatedAt = java.time.Instant.now().toString();
        if (key != null && key.contains("|")) {
            int i = key.indexOf('|');
            this.date = key.substring(0, i);
            this.category = key.substring(i + 1);
        }
    }
}
