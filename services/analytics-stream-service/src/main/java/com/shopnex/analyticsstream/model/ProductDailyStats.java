package com.shopnex.analyticsstream.model;

/**
 * Aggregate stats per product per day: quantity sold and revenue.
 */
public class ProductDailyStats {
    public long quantity;
    public double revenue;

    public ProductDailyStats() {}

    public ProductDailyStats(long quantity, double revenue) {
        this.quantity = quantity;
        this.revenue = revenue;
    }
}
