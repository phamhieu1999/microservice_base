import { Injectable, Logger } from '@nestjs/common';
import { ClickHouseService } from '../database/clickhouse.service';
import { KafkaService } from '../kafka/kafka.service';
import { Kafka } from 'kafkajs';

@Injectable()
export class WarehouseMonitorService {
  private readonly logger = new Logger(WarehouseMonitorService.name);
  private kafka: Kafka;
  private metricsCache: Map<string, any> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor(
    private readonly clickhouse: ClickHouseService,
    private readonly kafkaService: KafkaService,
  ) {
    // Initialize Kafka admin client for monitoring với SASL support
    const brokers = process.env.KAFKA_BROKERS?.split(',') || ['kafka:9092'];
    const kafkaUsername = process.env.KAFKA_USERNAME;
    const kafkaPassword = process.env.KAFKA_PASSWORD;
    const enableSasl = process.env.KAFKA_ENABLE_SASL === 'true';
    const kafkaSaslMechanism = process.env.KAFKA_SASL_MECHANISM || 'plain';

    const kafkaConfig: any = {
      clientId: 'warehouse-monitor',
      brokers,
    };

    if (enableSasl && kafkaUsername && kafkaPassword) {
      kafkaConfig.sasl = {
        mechanism: kafkaSaslMechanism as 'plain' | 'scram-sha-256' | 'scram-sha-512',
        username: kafkaUsername,
        password: kafkaPassword,
      };
    }

    this.kafka = new Kafka(kafkaConfig);
  }

  /**
   * Get Kafka consumer lag
   */
  async getConsumerLag(groupId: string = 'warehouse-service-group') {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const groupDescription = await admin.describeGroups([groupId]);
      const group = groupDescription.groups[0];

      if (!group || group.state !== 'Stable') {
        await admin.disconnect();
        return { groupId, lag: 0, state: group?.state || 'Unknown' };
      }

      // Get all topics
      const topics = await admin.listTopics();
      const topicMetadata = await admin.fetchTopicMetadata({ topics });

      let totalLag = 0;
      const partitionLags: any[] = [];

      for (const topic of topics) {
        const topicMeta = topicMetadata.topics.find(t => t.name === topic);
        if (!topicMeta) continue;

        for (const partition of topicMeta.partitions) {
          try {
            // Get high water mark (latest offset)
            const offsets = await admin.fetchTopicOffsets(topic);
            const partitionOffset = offsets.find(o => o.partition === partition.partitionId);
            
            if (partitionOffset) {
              // Get consumer group offset
              const groupOffsets = await admin.fetchOffsets({ groupId, topics: [{ topic, partitions: [{ partition: partition.partitionId }] }] });
              const consumerOffset = groupOffsets[0]?.partitions[0]?.offset || '0';
              
              const lag = parseInt(partitionOffset.offset) - parseInt(consumerOffset);
              totalLag += lag;
              
              partitionLags.push({
                topic,
                partition: partition.partitionId,
                lag,
                highWaterMark: partitionOffset.offset,
                consumerOffset,
              });
            }
          } catch (error) {
            this.logger.warn(`Error getting lag for ${topic}:${partition.partitionId}`, error);
          }
        }
      }

      await admin.disconnect();

      return {
        groupId,
        totalLag,
        partitionLags,
        state: group.state,
      };
    } catch (error) {
      this.logger.error('Error getting consumer lag', error);
      throw error;
    }
  }

  /**
   * Get ClickHouse query performance stats
   */
  async getQueryStats(hours: number = 1) {
    const cacheKey = `query_stats_${hours}`;
    const cached = this.metricsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const client = this.clickhouse.getClient();
      
      const result = await client.query({
        query: `
          SELECT
            query,
            count() AS query_count,
            avg(query_duration_ms) AS avg_duration_ms,
            max(query_duration_ms) AS max_duration_ms,
            min(query_duration_ms) AS min_duration_ms,
            sum(read_rows) AS total_read_rows,
            sum(read_bytes) AS total_read_bytes,
            formatReadableSize(sum(read_bytes)) AS total_read_size
          FROM system.query_log
          WHERE type = 'QueryFinish'
            AND event_time >= now() - INTERVAL ${hours} HOUR
            AND query NOT LIKE '%system.%'
          GROUP BY query
          ORDER BY avg_duration_ms DESC
          LIMIT 20
        `,
        format: 'JSONEachRow',
        request_timeout: 30000,
      });

      const data = await result.json();
      
      // Cache result
      this.metricsCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      this.logger.error('Error getting query stats', error);
      throw error;
    }
  }

  /**
   * Get ClickHouse table sizes
   */
  async getTableSizes() {
    const cacheKey = 'table_sizes';
    const cached = this.metricsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const client = this.clickhouse.getClient();
      
      const result = await client.query({
        query: `
          SELECT
            table,
            formatReadableSize(sum(bytes)) AS size,
            sum(rows) AS rows,
            count() AS parts,
            max(modification_time) AS last_modified
          FROM system.parts
          WHERE database = 'warehouse_db'
            AND active = 1
          GROUP BY table
          ORDER BY sum(bytes) DESC
        `,
        format: 'JSONEachRow',
        request_timeout: 30000,
      });

      const data = await result.json();
      
      // Cache result
      this.metricsCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      this.logger.error('Error getting table sizes', error);
      throw error;
    }
  }

  /**
   * Get ClickHouse partition info
   */
  async getPartitionInfo(table: string) {
    try {
      const client = this.clickhouse.getClient();
      
      const result = await client.query({
        query: `
          SELECT
            partition,
            rows,
            formatReadableSize(bytes_on_disk) AS size,
            min_date,
            max_date,
            modification_time
          FROM system.parts
          WHERE database = 'warehouse_db'
            AND table = {table:String}
            AND active = 1
          ORDER BY partition DESC
        `,
        query_params: { table },
        format: 'JSONEachRow',
        request_timeout: 30000,
      });

      return await result.json();
    } catch (error) {
      this.logger.error(`Error getting partition info for ${table}`, error);
      throw error;
    }
  }

  /**
   * Get recent insert stats
   */
  async getRecentInsertStats(table: string, hours: number = 24) {
    try {
      const client = this.clickhouse.getClient();
      
      let dateColumn = 'created_at';
      if (table === 'fact_order') dateColumn = 'order_date';
      if (table === 'fact_payment') dateColumn = 'payment_date';
      if (table === 'fact_settlement') dateColumn = 'settlement_date';
      if (table === 'fact_loyalty') dateColumn = 'transaction_date';

      const result = await client.query({
        query: `
          SELECT
            toStartOfHour(${dateColumn}) AS hour,
            count() AS insert_count,
            formatReadableSize(sum(bytes_on_disk)) AS size
          FROM system.parts
          WHERE database = 'warehouse_db'
            AND table = {table:String}
            AND active = 1
            AND modification_time >= now() - INTERVAL ${hours} HOUR
          GROUP BY hour
          ORDER BY hour DESC
        `,
        query_params: { table },
        format: 'JSONEachRow',
        request_timeout: 30000,
      });

      return await result.json();
    } catch (error) {
      this.logger.error(`Error getting recent insert stats for ${table}`, error);
      throw error;
    }
  }

  /**
   * Get system health metrics
   */
  async getHealthMetrics() {
    try {
      const [consumerLag, tableSizes, queryStats] = await Promise.allSettled([
        this.getConsumerLag(),
        this.getTableSizes(),
        this.getQueryStats(1),
      ]);

      return {
        kafka: {
          consumerLag: consumerLag.status === 'fulfilled' ? consumerLag.value : null,
          error: consumerLag.status === 'rejected' ? consumerLag.reason?.message : null,
        },
        clickhouse: {
          tableSizes: tableSizes.status === 'fulfilled' ? tableSizes.value : null,
          queryStats: queryStats.status === 'fulfilled' ? queryStats.value : null,
          error: tableSizes.status === 'rejected' ? tableSizes.reason?.message : null,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting health metrics', error);
      throw error;
    }
  }

  /**
   * Clear metrics cache
   */
  clearCache() {
    this.metricsCache.clear();
    this.logger.log('Metrics cache cleared');
  }
}

