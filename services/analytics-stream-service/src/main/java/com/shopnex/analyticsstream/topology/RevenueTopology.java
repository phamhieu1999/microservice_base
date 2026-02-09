package com.shopnex.analyticsstream.topology;

import com.shopnex.analyticsstream.model.PaymentSuccessEvent;
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
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.support.serializer.JsonSerde;

import java.time.Duration;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Configuration
public class RevenueTopology {

    private static final String PAYMENT_SUCCESS_TOPIC = "payment.success";
    private static final String REVENUE_DAILY_TOPIC = "analytics.revenue.daily";
    private static final String REVENUE_1M_TOPIC = "analytics.revenue.1m";
    private static final String REVENUE_5M_TOPIC = "analytics.revenue.5m";
    private static final String USER_DAILY_TOPIC = "analytics.user.daily";

    static String dateKey(String isoTime) {
        try {
            return DateTimeFormatter.ISO_LOCAL_DATE
                    .format(java.time.Instant.parse(isoTime).atZone(ZoneOffset.UTC).toLocalDate());
        } catch (Exception e) {
            return DateTimeFormatter.ISO_LOCAL_DATE
                    .format(java.time.Instant.now().atZone(ZoneOffset.UTC).toLocalDate());
        }
    }

    @Bean
    public KStream<String, PaymentSuccessEvent> paymentStream(StreamsBuilder builder) {
        Serde<String> stringSerde = Serdes.String();
        JsonSerde<PaymentSuccessEvent> valueSerde = new JsonSerde<>(PaymentSuccessEvent.class);

        KStream<String, PaymentSuccessEvent> payments =
                builder.stream(PAYMENT_SUCCESS_TOPIC, Consumed.with(stringSerde, valueSerde));

        KStream<String, PaymentSuccessEvent> validPayments = payments
                .filter((k, v) -> v != null && v.amount != null && v.amount > 0 && v.createdAt != null);

        // Daily revenue by date
        KTable<Windowed<String>, Double> dailyRevenue =
                validPayments
                        .selectKey((orderId, event) -> dateKey(event.createdAt))
                        .groupByKey(Grouped.with(stringSerde, valueSerde))
                        .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofDays(1)))
                        .aggregate(
                                () -> 0.0,
                                (date, event, agg) -> agg + event.amount,
                                Materialized.with(stringSerde, Serdes.Double())
                        );
        dailyRevenue
                .toStream()
                .map((wk, value) -> org.apache.kafka.streams.KeyValue.pair(wk.key(), value))
                .to(REVENUE_DAILY_TOPIC, org.apache.kafka.streams.kstream.Produced.with(stringSerde, Serdes.Double()));

        // Real-time revenue 1m window
        KTable<Windowed<String>, Double> revenue1m =
                validPayments
                        .selectKey((k, v) -> "1m")
                        .groupByKey(Grouped.with(stringSerde, valueSerde))
                        .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1)))
                        .aggregate(
                                () -> 0.0,
                                (k, event, agg) -> agg + event.amount,
                                Materialized.with(stringSerde, Serdes.Double())
                        );
        revenue1m
                .toStream()
                .map((wk, value) -> org.apache.kafka.streams.KeyValue.pair(String.valueOf(wk.window().endTime().toEpochMilli()), value))
                .to(REVENUE_1M_TOPIC, org.apache.kafka.streams.kstream.Produced.with(stringSerde, Serdes.Double()));

        // Real-time revenue 5m window
        KTable<Windowed<String>, Double> revenue5m =
                validPayments
                        .selectKey((k, v) -> "5m")
                        .groupByKey(Grouped.with(stringSerde, valueSerde))
                        .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
                        .aggregate(
                                () -> 0.0,
                                (k, event, agg) -> agg + event.amount,
                                Materialized.with(stringSerde, Serdes.Double())
                        );
        revenue5m
                .toStream()
                .map((wk, value) -> org.apache.kafka.streams.KeyValue.pair(String.valueOf(wk.window().endTime().toEpochMilli()), value))
                .to(REVENUE_5M_TOPIC, org.apache.kafka.streams.kstream.Produced.with(stringSerde, Serdes.Double()));

        // User revenue per day (key: userId|date)
        KTable<Windowed<String>, Double> userDaily =
                validPayments
                        .filter((k, v) -> v.userId != null && !v.userId.isBlank())
                        .selectKey((k, v) -> v.userId + "|" + dateKey(v.createdAt))
                        .groupByKey(Grouped.with(stringSerde, valueSerde))
                        .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofDays(1)))
                        .aggregate(
                                () -> 0.0,
                                (key, event, agg) -> agg + event.amount,
                                Materialized.with(stringSerde, Serdes.Double())
                        );
        userDaily
                .toStream()
                .map((wk, value) -> org.apache.kafka.streams.KeyValue.pair(wk.key(), value))
                .to(USER_DAILY_TOPIC, org.apache.kafka.streams.kstream.Produced.with(stringSerde, Serdes.Double()));

        return payments;
    }
}

