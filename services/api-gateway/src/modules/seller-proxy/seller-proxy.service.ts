import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class SellerProxyService {
  private readonly logger = new Logger(SellerProxyService.name);
  private readonly sellerBaseUrl =
    process.env.SELLER_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://seller-service:3008'
      : 'http://localhost:3008');
  private readonly requestTimeout = 10000; // 10 seconds

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`Seller service URL: ${this.sellerBaseUrl}`);
  }

  private async executeRequest<T>(
    operation: string,
    requestFn: () => any,
  ): Promise<T> {
    return this.circuitBreaker.execute(
      'seller-service',
      async () => {
        try {
          this.logger.debug(`Executing ${operation} to ${this.sellerBaseUrl}`);
          const res: any = await firstValueFrom(
            requestFn().pipe(
              timeout(this.requestTimeout),
              catchError((error) => {
                this.logger.error(
                  `Error ${operation} to ${this.sellerBaseUrl}: ${error.message}`,
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
                    'Seller service request timeout',
                    HttpStatus.GATEWAY_TIMEOUT,
                  );
                }
                throw new HttpException(
                  `Seller service is unavailable: ${error.message}`,
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
            'Seller service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, seller service unavailable');
        throw new HttpException(
          'Seller service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  // Seller methods
  async register(authorization: string, body: any) {
    return this.executeRequest('register seller', () =>
      this.http.post(`${this.sellerBaseUrl}/sellers/register`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async getMe(authorization: string) {
    return this.executeRequest('get seller me', () =>
      this.http.get(`${this.sellerBaseUrl}/sellers/me`, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async getAllSellers(query?: any) {
    return this.executeRequest('get all sellers', () =>
      this.http.get(`${this.sellerBaseUrl}/sellers`, {
        params: query,
      }),
    );
  }

  async getSellerById(id: string) {
    return this.executeRequest(`get seller ${id}`, () =>
      this.http.get(`${this.sellerBaseUrl}/sellers/${id}`),
    );
  }

  async updateSellerStatus(authorization: string, id: string, body: any) {
    return this.executeRequest(`update seller status ${id}`, () =>
      this.http.patch(`${this.sellerBaseUrl}/sellers/${id}/status`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  // Shop methods
  async createShop(authorization: string, body: any) {
    return this.executeRequest('create shop', () =>
      this.http.post(`${this.sellerBaseUrl}/shops`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async getShops(query?: any) {
    return this.executeRequest('get shops', () =>
      this.http.get(`${this.sellerBaseUrl}/shops`, {
        params: query,
      }),
    );
  }

  async getShopById(id: string) {
    return this.executeRequest(`get shop ${id}`, () =>
      this.http.get(`${this.sellerBaseUrl}/shops/${id}`),
    );
  }

  async getMyShops(authorization: string) {
    return this.executeRequest('get my shops', () =>
      this.http.get(`${this.sellerBaseUrl}/shops/me/all`, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async updateShop(authorization: string, id: string, body: any) {
    return this.executeRequest(`update shop ${id}`, () =>
      this.http.put(`${this.sellerBaseUrl}/shops/${id}`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async deleteShop(authorization: string, id: string) {
    return this.executeRequest(`delete shop ${id}`, () =>
      this.http.delete(`${this.sellerBaseUrl}/shops/${id}`, {
        headers: { Authorization: authorization },
      }),
    );
  }
}


