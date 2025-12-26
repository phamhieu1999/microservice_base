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
    this.warehouseServiceUrl = this.configService.get<string>(
      'WAREHOUSE_SERVICE_URL',
      'http://warehouse-service:3018',
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
}

