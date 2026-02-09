import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, CompressionTypes } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'kafka:9092').split(',');
    const kafkaUsername = this.configService.get<string>('KAFKA_USERNAME');
    const kafkaPassword = this.configService.get<string>('KAFKA_PASSWORD');
    const kafkaSaslMechanism = this.configService.get<string>('KAFKA_SASL_MECHANISM', 'plain');
    const enableSasl = this.configService.get<boolean>('KAFKA_ENABLE_SASL', false);
    
    // Build Kafka config với optional SASL
    const kafkaConfig: any = {
      clientId: 'warehouse-service',
      brokers,
    };

    // Add SASL authentication nếu được enable
    if (enableSasl && kafkaUsername && kafkaPassword) {
      kafkaConfig.sasl = {
        mechanism: kafkaSaslMechanism as 'plain' | 'scram-sha-256' | 'scram-sha-512',
        username: kafkaUsername,
        password: kafkaPassword,
      };
      this.logger.log(`Kafka SASL authentication enabled with mechanism: ${kafkaSaslMechanism}`);
    }

    // TODO: Add SSL for production (cần certificates)
    // if (this.configService.get<boolean>('KAFKA_ENABLE_SSL', false)) {
    //   kafkaConfig.ssl = {
    //     rejectUnauthorized: true,
    //     ca: [fs.readFileSync(this.configService.get<string>('KAFKA_CA_CERT_PATH'), 'utf-8')],
    //     cert: fs.readFileSync(this.configService.get<string>('KAFKA_CLIENT_CERT_PATH'), 'utf-8'),
    //     key: fs.readFileSync(this.configService.get<string>('KAFKA_CLIENT_KEY_PATH'), 'utf-8'),
    //   };
    // }

    this.kafka = new Kafka(kafkaConfig);

    // Producer với retry mechanism
    this.producer = this.kafka.producer({
      maxInFlightRequests: 5,
      idempotent: true, // Exactly-once semantics
      retry: {
        retries: 3,
        initialRetryTime: 100,
        multiplier: 2,
      },
    });
  }

  async onModuleInit() {
    try {
      // Test connection với retry logic
      const maxRetries = 5;
      let retryCount = 0;
      let connected = false;

      while (retryCount < maxRetries && !connected) {
        try {
          await this.producer.connect();
          connected = true;
          this.logger.log('Kafka producer connected');
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
            this.logger.warn(
              `Failed to connect Kafka producer (attempt ${retryCount}/${maxRetries}). Retrying in ${backoffMs}ms...`,
              error instanceof Error ? error.message : 'Unknown error'
            );
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          } else {
            this.logger.error(
              `Failed to connect Kafka producer after ${maxRetries} attempts. Service will continue but Kafka features will be unavailable.`,
              error instanceof Error ? error.message : 'Unknown error'
            );
            // Không throw error để service vẫn có thể khởi động
          }
        }
      }
    } catch (error) {
      this.logger.error(
        'Error initializing Kafka service',
        error instanceof Error ? error.message : 'Unknown error'
      );
      // Không throw error để service vẫn có thể khởi động
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  getConsumer(groupId: string, options?: {
    maxBytesPerPartition?: number;
    minBytes?: number;
    maxWaitTimeInMs?: number;
    sessionTimeout?: number;
    heartbeatInterval?: number;
    maxInFlightRequests?: number;
    allowAutoTopicCreation?: boolean;
  }): Consumer {
    const defaultOptions = {
      maxBytesPerPartition: 1048576, // 1MB per partition
      minBytes: 1024, // Wait for at least 1KB
      maxWaitTimeInMs: 5000, // Max wait 5s
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxInFlightRequests: 1, // Process sequentially để đảm bảo order
      allowAutoTopicCreation: false, // Không tự động tạo topics
    };

    return this.kafka.consumer({
      groupId,
      ...defaultOptions,
      ...options,
      retry: {
        retries: 3,
        initialRetryTime: 100,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    });
  }

  async emit(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
    } catch (error) {
      this.logger.error(`Failed to emit message to topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Check Kafka connection health
   */
  async checkHealth(): Promise<boolean> {
    try {
      if (!this.kafka || !this.producer) {
        return false;
      }
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      return true;
    } catch (error) {
      this.logger.error('Kafka health check failed', error);
      return false;
    }
  }

  /**
   * Get Kafka instance (for internal use)
   */
  getKafkaInstance(): Kafka | null {
    return this.kafka || null;
  }
}

