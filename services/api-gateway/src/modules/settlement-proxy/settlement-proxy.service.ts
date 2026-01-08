import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class SettlementProxyService {
  private readonly logger = new Logger(SettlementProxyService.name);
  private readonly settlementBaseUrl =
    process.env.SETTLEMENT_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://settlement-service:3017'
      : 'http://localhost:3017');
  private readonly requestTimeout = 10000; // 10 seconds

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`Settlement service URL: ${this.settlementBaseUrl}`);
  }

  private async executeRequest<T>(
    operation: string,
    requestFn: () => any,
  ): Promise<T> {
    return this.circuitBreaker.execute(
      'settlement-service',
      async () => {
        try {
          this.logger.debug(`Executing ${operation} to ${this.settlementBaseUrl}`);
          const res: any = await firstValueFrom(
            requestFn().pipe(
              timeout(this.requestTimeout),
              catchError((error) => {
                this.logger.error(
                  `Error ${operation} to ${this.settlementBaseUrl}: ${error.message}`,
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
                    'Settlement service request timeout',
                    HttpStatus.GATEWAY_TIMEOUT,
                  );
                }
                throw new HttpException(
                  `Settlement service is unavailable: ${error.message}`,
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
            'Settlement service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, settlement service unavailable');
        throw new HttpException(
          'Settlement service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  // Balance methods
  async getSellerBalance(authorization: string, sellerId: string) {
    return this.executeRequest(`get balance for seller ${sellerId}`, () =>
      this.http.get(`${this.settlementBaseUrl}/settlements/seller/${sellerId}/balance`, {
        headers: { Authorization: authorization },
      }),
    );
  }

  // Payout methods
  async listPayouts(authorization: string, sellerId: string, query?: any) {
    return this.executeRequest(`list payouts for seller ${sellerId}`, () =>
      this.http.get(`${this.settlementBaseUrl}/settlements/seller/${sellerId}/payouts`, {
        headers: { Authorization: authorization },
        params: query,
      }),
    );
  }

  async requestPayout(authorization: string, sellerId: string, body: any) {
    return this.executeRequest(`request payout for seller ${sellerId}`, () =>
      this.http.post(`${this.settlementBaseUrl}/settlements/seller/${sellerId}/payouts`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async getPayoutById(authorization: string, payoutId: string) {
    return this.executeRequest(`get payout ${payoutId}`, () =>
      this.http.get(`${this.settlementBaseUrl}/settlements/payouts/${payoutId}`, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async updatePayoutStatus(authorization: string, payoutId: string, body: any) {
    return this.executeRequest(`update payout status ${payoutId}`, () =>
      this.http.patch(`${this.settlementBaseUrl}/settlements/payouts/${payoutId}/status`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  // Commission config methods
  async createCommissionConfig(authorization: string, body: any) {
    return this.executeRequest('create commission config', () =>
      this.http.post(`${this.settlementBaseUrl}/settlements/commission-configs`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async getCommissionConfigs(authorization: string, query?: any) {
    return this.executeRequest('get commission configs', () =>
      this.http.get(`${this.settlementBaseUrl}/settlements/commission-configs`, {
        headers: { Authorization: authorization },
        params: query,
      }),
    );
  }
}

