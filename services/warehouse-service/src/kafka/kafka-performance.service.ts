import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';

/**
 * Service để tối ưu Kafka performance và quản lý consumer groups
 */
@Injectable()
export class KafkaPerformanceService {
  private readonly logger = new Logger(KafkaPerformanceService.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get optimized consumer config dựa trên workload
   */
  getOptimizedConsumerConfig(workload: 'high-throughput' | 'low-latency' | 'balanced' = 'balanced') {
    const baseConfig = {
      allowAutoTopicCreation: false,
      retry: {
        retries: 3,
        initialRetryTime: 100,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    };

    switch (workload) {
      case 'high-throughput':
        // Tối ưu cho throughput cao - batch lớn hơn, ít heartbeat
        return {
          ...baseConfig,
          maxBytesPerPartition: 5242880, // 5MB per partition
          minBytes: 5120, // 5KB
          maxWaitTimeInMs: 10000, // 10s
          sessionTimeout: 60000, // 60s
          heartbeatInterval: 10000, // 10s
          maxInFlightRequests: 5, // Parallel processing
        };

      case 'low-latency':
        // Tối ưu cho latency thấp - batch nhỏ, heartbeat thường xuyên
        return {
          ...baseConfig,
          maxBytesPerPartition: 262144, // 256KB per partition
          minBytes: 512, // 512 bytes
          maxWaitTimeInMs: 1000, // 1s
          sessionTimeout: 30000, // 30s
          heartbeatInterval: 3000, // 3s
          maxInFlightRequests: 1, // Sequential processing
        };

      case 'balanced':
      default:
        // Balanced config - trade-off giữa throughput và latency
        return {
          ...baseConfig,
          maxBytesPerPartition: 1048576, // 1MB per partition
          minBytes: 1024, // 1KB
          maxWaitTimeInMs: 5000, // 5s
          sessionTimeout: 30000, // 30s
          heartbeatInterval: 3000, // 3s
          maxInFlightRequests: 1, // Sequential để đảm bảo order
        };
    }
  }

  /**
   * Get consumer với config tối ưu
   */
  getOptimizedConsumer(groupId: string, workload: 'high-throughput' | 'low-latency' | 'balanced' = 'balanced') {
    const config = this.getOptimizedConsumerConfig(workload);
    this.logger.log(`Creating consumer with ${workload} configuration`);
    return this.kafkaService.getConsumer(groupId, config);
  }

  /**
   * Validate consumer group configuration
   */
  validateConsumerGroup(groupId: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!groupId || groupId.trim().length === 0) {
      issues.push('Consumer group ID cannot be empty');
    }

    if (groupId.length > 255) {
      issues.push('Consumer group ID is too long (max 255 characters)');
    }

    // Validate format (alphanumeric, dash, underscore)
    if (!/^[a-zA-Z0-9_-]+$/.test(groupId)) {
      issues.push('Consumer group ID contains invalid characters');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

