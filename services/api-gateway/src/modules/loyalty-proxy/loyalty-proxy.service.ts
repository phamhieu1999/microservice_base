import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class LoyaltyProxyService {
  private readonly logger = new Logger(LoyaltyProxyService.name);
  private readonly loyaltyBaseUrl =
    process.env.LOYALTY_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://loyalty-service:3015'
      : 'http://localhost:3015');
  private readonly requestTimeout = 10000; // 10 seconds

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`Loyalty service URL: ${this.loyaltyBaseUrl}`);
  }

  private async executeRequest<T>(
    operation: string,
    requestFn: () => any,
  ): Promise<T> {
    return this.circuitBreaker.execute(
      'loyalty-service',
      async () => {
        try {
          this.logger.debug(`Executing ${operation} to ${this.loyaltyBaseUrl}`);
          const res: any = await firstValueFrom(
            requestFn().pipe(
              timeout(this.requestTimeout),
              catchError((error) => {
                this.logger.error(
                  `Error ${operation} to ${this.loyaltyBaseUrl}: ${error.message}`,
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
                    'Loyalty service request timeout',
                    HttpStatus.GATEWAY_TIMEOUT,
                  );
                }
                throw new HttpException(
                  `Loyalty service is unavailable: ${error.message}`,
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
            'Loyalty service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, loyalty service unavailable');
        throw new HttpException(
          'Loyalty service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  getPoints(userId: string) {
    return this.executeRequest('get points', () =>
      this.http.get(`${this.loyaltyBaseUrl}/loyalty/points`, {
        headers: { 'x-user-id': userId },
      }),
    );
  }

  getHistory(userId: string, limit?: number, skip?: number) {
    return this.executeRequest('get history', () =>
      this.http.get(`${this.loyaltyBaseUrl}/loyalty/history`, {
        headers: { 'x-user-id': userId },
        params: { limit, skip },
      }),
    );
  }

  redeem(userId: string, body: any) {
    return this.executeRequest('redeem points', () =>
      this.http.post(`${this.loyaltyBaseUrl}/loyalty/redeem`, body, {
        headers: { 'x-user-id': userId },
      }),
    );
  }

  createReferral(userId: string) {
    return this.executeRequest('create referral', () =>
      this.http.post(
        `${this.loyaltyBaseUrl}/loyalty/referral`,
        {},
        {
          headers: { 'x-user-id': userId },
        },
      ),
    );
  }
}


