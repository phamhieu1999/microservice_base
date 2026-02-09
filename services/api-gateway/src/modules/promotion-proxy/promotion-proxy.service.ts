import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class PromotionProxyService {
  private readonly logger = new Logger(PromotionProxyService.name);
  private readonly promoBaseUrl =
    process.env.PROMOTION_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://promotion-service:3009'
      : 'http://localhost:3009');
  private readonly requestTimeout = 10000; // 10 seconds

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`Promotion service URL: ${this.promoBaseUrl}`);
  }

  private async executeRequest<T>(
    operation: string,
    requestFn: () => any,
  ): Promise<T> {
    return this.circuitBreaker.execute(
      'promotion-service',
      async () => {
        try {
          this.logger.debug(`Executing ${operation} to ${this.promoBaseUrl}`);
          const res: any = await firstValueFrom(
            requestFn().pipe(
              timeout(this.requestTimeout),
              catchError((error) => {
                this.logger.error(
                  `Error ${operation} to ${this.promoBaseUrl}: ${error.message}`,
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
                    'Promotion service request timeout',
                    HttpStatus.GATEWAY_TIMEOUT,
                  );
                }
                throw new HttpException(
                  `Promotion service is unavailable: ${error.message}`,
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
            'Promotion service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, promotion service unavailable');
        throw new HttpException(
          'Promotion service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  async validate(authorization: string, body: any) {
    return this.executeRequest('validate voucher', () =>
      this.http.post(`${this.promoBaseUrl}/vouchers/validate`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async apply(authorization: string, body: any) {
    return this.executeRequest('apply voucher', () =>
      this.http.post(`${this.promoBaseUrl}/vouchers/apply`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async exchangeLoyaltyVoucher(authorization: string, userId: string, points: number) {
    return this.executeRequest('exchange loyalty voucher', () =>
      this.http.post(
        `${this.promoBaseUrl}/loyalty-vouchers/exchange`,
        { userId, points },
        {
          headers: { Authorization: authorization },
        },
      ),
    );
  }
}


