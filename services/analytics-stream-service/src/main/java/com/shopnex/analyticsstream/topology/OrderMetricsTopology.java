package com.shopnex.analyticsstream.topology;

import com.shopnex.analyticsstream.model.OrderCreatedEvent;
import com.shopnex.analyticsstream.model.ProductDailyStats;
import org.apache.kafka.common.serialization.Serde;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.Grouped;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.KTable;
import org.apache.kafka.streams.kstream.Materialized;
import org.apache.kafka.streams.kstream.TimeWindows;
import org.apache.kafka.streams.kstream.Windowed;
import org.apache.kafka.streams.KeyValue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.support.serializer.JsonSerde;

import java.time.Duration;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class OrderMetricsTopology {

    private static final String ORDER_CREATED_TOPIC = "order.created";
    private static final String PRODUCT_DAILY_TOPIC = "analytics.product.daily";
    private static final String SELLER_DAILY_TOPIC = "analytics.seller.daily";
    private static final String CATEGORY_DAILY_TOPIC = "analytics.category.daily";

    private static String dateKey(String isoTime) {
        try {
            return DateTimeFormatter.ISO_LOCAL_DATE
                    .format(java.time.Instant.parse(isoTime).atZone(ZoneOffset.UTC).toLocalDate());
        } catch (Exception e) {
            return DateTimeFormatter.ISO_LOCAL_DATE
                    .format(java.time.Instant.now().atZone(ZoneOffset.UTC).toLocalDate());
        }
    }

    @Bean
    public KStream<String, OrderCreatedEvent> orderStream(StreamsBuilder builder) {
        Serde<String> stringSerde = Serdes.String();
        JsonSerde<OrderCreatedEvent> orderSerde = new JsonSerde<>(OrderCreatedEvent.class);
        JsonSerde<ProductDailyStats> statsSerde = new JsonSerde<>(ProductDailyStats.class);

        KStream<String, OrderCreatedEvent> orders =
                builder.stream(ORDER_CREATED_TOPIC, Consumed.with(stringSerde, orderSerde));

        KStream<String, OrderCreatedEvent> validOrders = orders.filter((k, v) ->
                v != null && v.createdAt != null && v.items != null && !v.items.isEmpty());

        // Product metrics: key = date|productId, value = ProductDailyStats(quantity, revenue)
        KStream<String, ProductDailyStats> productRecords = validOrders.flatMap((orderId, order) -> {
            String d = dateKey(order.createdAt);
            List<KeyValue<String, ProductDailyStats>> out = new ArrayList<>();
            for (OrderCreatedEvent.OrderItem item : order.items) {
                if (item == null || item.productId == null || item.productId.isBlank()) continue;
                int qty = item.quantity != null ? item.quantity : 0;
                double price = item.unitPrice != null ? item.unitPrice : 0.0;
                double revenue = qty * price;
                out.add(KeyValue.pair(d + "|" + item.productId, new ProductDailyStats(qty, revenue)));
            }
            return out;
        });

        KTable<Windowed<String>, ProductDailyStats> productDaily = productRecords
                .groupByKey(Grouped.with(stringSerde, statsSerde))
                .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofDays(1)))
                .aggregate(
                        () -> new ProductDailyStats(0L, 0.0),
                        (key, value, agg) -> new ProductDailyStats(agg.quantity + value.quantity, agg.revenue + value.revenue),
                        Materialized.with(stringSerde, statsSerde)
                );
        productDaily
                .toStream()
                .map((wk, value) -> KeyValue.pair(wk.key(), value))
                .to(PRODUCT_DAILY_TOPIC, org.apache.kafka.streams.kstream.Produced.with(stringSerde, statsSerde));

        // Seller metrics: key = date|sellerId, value = revenue (Double)
        KStream<String, Double> sellerRecords = validOrders.flatMap((orderId, order) -> {
            String d = dateKey(order.createdAt);
            List<KeyValue<String, Double>> out = new ArrayList<>();
            for (OrderCreatedEvent.OrderItem item : order.items) {
                if (item == null) continue;
                String sellerId = (item.sellerId != null && !item.sellerId.isBlank()) ? item.sellerId : "unknown";
                int qty = item.quantity != null ? item.quantity : 0;
                double price = item.unitPrice != null ? item.unitPrice : 0.0;
                out.add(KeyValue.pair(d + "|" + sellerId, qty * price));
            }
            return out;
        });
        sellerRecords
                .groupByKey(Grouped.with(stringSerde, Serdes.Double()))
                .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofDays(1)))
                .aggregate(() -> 0.0, (k, v, a) -> a + v, Materialized.with(stringSerde, Serdes.Double()))
                .toStream()
                .map((wk, value) -> KeyValue.pair(wk.key(), value))
                .to(SELLER_DAILY_TOPIC, org.apache.kafka.streams.kstream.Produced.with(stringSerde, Serdes.Double()));

        // Category metrics: key = date|category, value = revenue (Double)
        KStream<String, Double> categoryRecords = validOrders.flatMap((orderId, order) -> {
            String d = dateKey(order.createdAt);
            List<KeyValue<String, Double>> out = new ArrayList<>();
            for (OrderCreatedEvent.OrderItem item : order.items) {
                if (item == null) continue;
                String cat = (item.category != null && !item.category.isBlank()) ? item.category : "unknown";
                int qty = item.quantity != null ? item.quantity : 0;
                double price = item.unitPrice != null ? item.unitPrice : 0.0;
                out.add(KeyValue.pair(d + "|" + cat, qty * price));
            }
            return out;
        });
        categoryRecords
                .groupByKey(Grouped.with(stringSerde, Serdes.Double()))
                .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofDays(1)))
                .aggregate(() -> 0.0, (k, v, a) -> a + v, Materialized.with(stringSerde, Serdes.Double()))
                .toStream()
                .map((wk, value) -> KeyValue.pair(wk.key(), value))
                .to(CATEGORY_DAILY_TOPIC, org.apache.kafka.streams.kstream.Produced.with(stringSerde, Serdes.Double()));

        return orders;
    }
}
