import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { initializeSchema } from './migration';

@Injectable()
export class ClickHouseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClickHouseService.name);
  private client: ClickHouseClient;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const host = this.configService.get<string>('CLICKHOUSE_HOST', 'clickhouse');
      const port = this.configService.get<number>('CLICKHOUSE_PORT', 8123);
      const username = this.configService.get<string>('CLICKHOUSE_USER', 'default');
      const password = this.configService.get<string>('CLICKHOUSE_PASSWORD', '');
      const database = this.configService.get<string>('CLICKHOUSE_DB', 'warehouse_db');
      const enableHttps = this.configService.get<boolean>('CLICKHOUSE_ENABLE_HTTPS', false);
      const httpsPort = this.configService.get<number>('CLICKHOUSE_HTTPS_PORT', 8443);

      // Build connection URL
      const protocol = enableHttps ? 'https' : 'http';
      const connectionPort = enableHttps ? httpsPort : port;
      const connectionHost = `${protocol}://${host}:${connectionPort}`;

      // Validate password strength (warn nếu password rỗng hoặc yếu)
      if (!password || password.length < 8) {
        this.logger.warn(
          'ClickHouse password is empty or weak. Please set a strong password for production!'
        );
      }

      const clientConfig: any = {
        host: connectionHost,
        username,
        password,
        database,
        // Connection pooling để tối ưu performance
        max_open_connections: 10,
        request_timeout: 30000, // 30 seconds timeout
        // Compression để giảm bandwidth
        compression: {
          request: true,
          response: true,
        },
      };

      // TODO: Add HTTPS/TLS configuration (cần certificates)
      // if (enableHttps) {
      //   clientConfig.ca = fs.readFileSync(this.configService.get<string>('CLICKHOUSE_CA_CERT_PATH'), 'utf-8');
      //   clientConfig.cert = fs.readFileSync(this.configService.get<string>('CLICKHOUSE_CLIENT_CERT_PATH'), 'utf-8');
      //   clientConfig.key = fs.readFileSync(this.configService.get<string>('CLICKHOUSE_CLIENT_KEY_PATH'), 'utf-8');
      // }

      this.client = createClient(clientConfig);

      // Test connection với retry logic
      const maxRetries = 5;
      let retryCount = 0;
      let connected = false;

      while (retryCount < maxRetries && !connected) {
        try {
          await this.client.ping();
          connected = true;
          this.logger.log(
            `Connected to ClickHouse at ${connectionHost} with connection pooling${enableHttps ? ' (HTTPS)' : ''}`
          );
          
          // Initialize schema (fallback - khuyến nghị chạy migration trước)
          // Note: Nên chạy migration riêng: npm run migration
          await initializeSchema(this.client);
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
            this.logger.warn(
              `Failed to connect to ClickHouse (attempt ${retryCount}/${maxRetries}). Retrying in ${backoffMs}ms...`,
              error instanceof Error ? error.message : 'Unknown error'
            );
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          } else {
            this.logger.error(
              `Failed to connect to ClickHouse after ${maxRetries} attempts. Service will continue but ClickHouse features will be unavailable.`,
              error instanceof Error ? error.message : 'Unknown error'
            );
            // Không throw error để service vẫn có thể khởi động
          }
        }
      }
    } catch (error) {
      this.logger.error(
        'Error initializing ClickHouse service',
        error instanceof Error ? error.message : 'Unknown error'
      );
      // Không throw error để service vẫn có thể khởi động
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('ClickHouse connection closed');
    }
  }

  getClient(): ClickHouseClient {
    if (!this.client) {
      throw new Error('ClickHouse client is not initialized. Please check connection.');
    }
    return this.client;
  }

  /**
   * Check if ClickHouse client is ready
   */
  isClientReady(): boolean {
    return !!this.client;
  }

}

