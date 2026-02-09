import { Injectable, Logger } from '@nestjs/common';
import { ClickHouseService } from '../database/clickhouse.service';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);

  constructor(
    private readonly clickhouse: ClickHouseService,
    private readonly kafka: KafkaService,
  ) {}

  /**
   * Check ClickHouse health
   */
  async checkClickHouse(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      const client = this.clickhouse.getClient();
      await client.ping();
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('ClickHouse health check failed', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check Kafka health
   */
  async checkKafka(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      const isHealthy = await this.kafka.checkHealth();
      if (isHealthy) {
        return { status: 'ok' };
      }
      return { status: 'error', message: 'Kafka client not initialized or connection failed' };
    } catch (error) {
      this.logger.error('Kafka health check failed', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Comprehensive health check
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    services: {
      clickhouse: { status: 'ok' | 'error'; message?: string };
      kafka: { status: 'ok' | 'error'; message?: string };
    };
  }> {
    const [clickhouseHealth, kafkaHealth] = await Promise.allSettled([
      this.checkClickHouse(),
      this.checkKafka(),
    ]);

    const clickhouse = clickhouseHealth.status === 'fulfilled' 
      ? clickhouseHealth.value 
      : { status: 'error' as const, message: clickhouseHealth.reason?.message };
    
    const kafka = kafkaHealth.status === 'fulfilled'
      ? kafkaHealth.value
      : { status: 'error' as const, message: kafkaHealth.reason?.message };

    const services = { clickhouse, kafka };
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (clickhouse.status === 'ok' && kafka.status === 'ok') {
      overallStatus = 'healthy';
    } else if (clickhouse.status === 'ok' || kafka.status === 'ok') {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
    };
  }
}

