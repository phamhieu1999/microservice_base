import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class AnalyticsProxyService {
  private readonly logger = new Logger(AnalyticsProxyService.name);
  private readonly analyticsBaseUrl =
    process.env.ANALYTICS_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://analytics-service:3014'
      : 'http://localhost:3014');
  private readonly requestTimeout = 15000; // 15 seconds (analytics queries may take longer)

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`Analytics service URL: ${this.analyticsBaseUrl}`);
  }

  private async executeRequest<T>(
    operation: string,
    requestFn: () => any,
  ): Promise<T> {
    return this.circuitBreaker.execute(
      'analytics-service',
      async () => {
        try {
          this.logger.debug(`Executing ${operation} to ${this.analyticsBaseUrl}`);
          const res: any = await firstValueFrom(
            requestFn().pipe(
              timeout(this.requestTimeout),
              catchError((error) => {
                this.logger.error(
                  `Error ${operation} to ${this.analyticsBaseUrl}: ${error.message}`,
                  error.stack,
                );
                if (error.response) {
                  throw new HttpException(
                    error.response.data || `Failed to ${operation}`,
                    error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
                  );
                }
                if (error.name === 'TimeoutError') {
                  this.logger.error(`Request timeout when ${operation}`);
                  throw new HttpException(
                    'Analytics service request timeout',
                    HttpStatus.GATEWAY_TIMEOUT,
                  );
                }
                throw new HttpException(
                  `Analytics service is unavailable: ${error.message}`,
                  HttpStatus.SERVICE_UNAVAILABLE,
                );
              }),
            ),
          );
          return res.data as T;
        } catch (error) {
          if (error instanceof HttpException) {
            throw error;
          }
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(`Unexpected error ${operation}: ${errorMessage}`, errorStack);
          throw new HttpException(
            'Analytics service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, analytics service unavailable');
        throw new HttpException(
          'Analytics service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  // Revenue Analytics
  getRevenueByPeriod(startDate: string, endDate: string, period?: 'daily' | 'weekly' | 'monthly') {
    return this.executeRequest('get revenue by period', () =>
      this.http.get(`${this.analyticsBaseUrl}/analytics/revenue`, {
        params: { startDate, endDate, period: period || 'daily' },
      }),
    );
  }

  getTotalRevenue(startDate: string, endDate: string) {
    return this.executeRequest('get total revenue', () =>
      this.http.get(`${this.analyticsBaseUrl}/analytics/revenue/total`, {
        params: { startDate, endDate },
      }),
    );
  }

  // Product Analytics
  getTopProducts(limit?: number, sortBy?: 'sales' | 'revenue') {
    return this.executeRequest('get top products', () =>
      this.http.get(`${this.analyticsBaseUrl}/analytics/products/top`, {
        params: { limit, sortBy },
      }),
    );
  }

  getProductMetrics(productId: string) {
    return this.executeRequest('get product metrics', () =>
      this.http.get(`${this.analyticsBaseUrl}/analytics/products/${productId}`),
    );
  }

  getProductsByCategory(category: string) {
    return this.executeRequest('get products by category', () =>
      this.http.get(`${this.analyticsBaseUrl}/analytics/products/category/${category}`),
    );
  }

  getProductsBySeller(sellerId: string) {
    return this.executeRequest('get products by seller', () =>
      this.http.get(`${this.analyticsBaseUrl}/analytics/products/seller/${sellerId}`),
    );
  }

  // User Analytics
  getUserMetrics(startDate: string, endDate: string) {
    return this.executeRequest('get user metrics', () =>
      this.http.get(`${this.analyticsBaseUrl}/analytics/users`, {
        params: { startDate, endDate },
      }),
    );
  }

  getDAU(date: string) {
    return this.executeRequest('get DAU', () =>
      this.http.get(`${this.analyticsBaseUrl}/analytics/users/dau`, {
        params: { date },
      }),
    );
  }

  getMAU(year: number, month: number) {
    return this.executeRequest('get MAU', () =>
      this.http.get(`${this.analyticsBaseUrl}/analytics/users/mau`, {
        params: { year, month },
      }),
    );
  }
}

