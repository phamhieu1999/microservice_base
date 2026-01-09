import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WarehouseProxyService {
  private readonly warehouseServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Default: localhost cho dev local, hoặc set env WAREHOUSE_SERVICE_URL cho Docker
    this.warehouseServiceUrl = this.configService.get<string>(
      'WAREHOUSE_SERVICE_URL',
      process.env.NODE_ENV === 'production' 
        ? 'http://warehouse-service:3018' 
        : 'http://localhost:3018',
    );
  }

  async getDailyRevenue(startDate?: string, endDate?: string, sellerId?: string) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (sellerId) params.sellerId = sellerId;

      const response = await firstValueFrom(
        this.httpService.get(`${this.warehouseServiceUrl}/api/warehouse/revenue/daily`, { params }),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch daily revenue',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTopSellers(limit?: number, startDate?: string, endDate?: string) {
    try {
      const params: any = {};
      if (limit) params.limit = limit;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await firstValueFrom(
        this.httpService.get(`${this.warehouseServiceUrl}/api/warehouse/sellers/top`, { params }),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch top sellers',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTopProducts(limit?: number, startDate?: string, endDate?: string) {
    try {
      const params: any = {};
      if (limit) params.limit = limit;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await firstValueFrom(
        this.httpService.get(`${this.warehouseServiceUrl}/api/warehouse/products/top`, { params }),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch top products',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * =========================
   * Health proxy (warehouse)
   * =========================
   */

  async getServiceHealth() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.warehouseServiceUrl}/api/health`),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch warehouse service health',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getClickhouseHealth() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.warehouseServiceUrl}/api/health/clickhouse`),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch warehouse ClickHouse health',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getKafkaHealth() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.warehouseServiceUrl}/api/health/kafka`),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch warehouse Kafka health',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * =========================
   * Monitoring proxy (warehouse)
   * =========================
   */

  async getMonitoringHealth() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.warehouseServiceUrl}/api/monitoring/health`),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch warehouse monitoring health',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getKafkaLag(groupId?: string) {
    try {
      const params: any = {};
      if (groupId) params.groupId = groupId;

      const response = await firstValueFrom(
        this.httpService.get(`${this.warehouseServiceUrl}/api/monitoring/kafka/lag`, { params }),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch warehouse Kafka lag',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getClickhouseQueryStats(hours?: number) {
    try {
      const params: any = {};
      if (hours !== undefined) params.hours = hours;

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.warehouseServiceUrl}/api/monitoring/clickhouse/queries`,
          { params },
        ),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch warehouse ClickHouse query stats',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getClickhouseTableSizes() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.warehouseServiceUrl}/api/monitoring/clickhouse/tables`,
        ),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch warehouse ClickHouse table sizes',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getClickhousePartitionInfo(table: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.warehouseServiceUrl}/api/monitoring/clickhouse/partitions/${table}`,
        ),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch warehouse ClickHouse partition info',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getClickhouseRecentInserts(table: string, hours?: number) {
    try {
      const params: any = {};
      if (hours !== undefined) params.hours = hours;

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.warehouseServiceUrl}/api/monitoring/clickhouse/inserts/${table}`,
          { params },
        ),
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to fetch warehouse ClickHouse recent inserts',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

