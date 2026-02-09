package com.shopnex.analyticsstream.model;

import java.util.List;

public class OrderCreatedEvent {
    public String id;
    public String userId;
    public Double totalAmount;
    public String createdAt;
    public List<OrderItem> items;

    public static class OrderItem {
        public String productId;
        public Double unitPrice;
        public Integer quantity;
        public String sellerId;
        public String category;
    }
}

