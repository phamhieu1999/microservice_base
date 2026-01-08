import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class PaymentProxyService {
  private readonly logger = new Logger(PaymentProxyService.name);
  private readonly paymentBaseUrl =
    process.env.PAYMENT_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://payment-service:3004'
      : 'http://localhost:3004');
  private readonly requestTimeout = 10000; // 10 seconds

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`Payment service URL: ${this.paymentBaseUrl}`);
  }

  private async executeRequest<T>(
    operation: string,
    requestFn: () => any,
  ): Promise<T> {
    return this.circuitBreaker.execute(
      'payment-service',
      async () => {
        try {
          this.logger.debug(`Executing ${operation} to ${this.paymentBaseUrl}`);
          const res: any = await firstValueFrom(
            requestFn().pipe(
              timeout(this.requestTimeout),
              catchError((error) => {
                this.logger.error(
                  `Error ${operation} to ${this.paymentBaseUrl}: ${error.message}`,
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
                    'Payment service request timeout',
                    HttpStatus.GATEWAY_TIMEOUT,
                  );
                }
                throw new HttpException(
                  `Payment service is unavailable: ${error.message}`,
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
            'Payment service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, payment service unavailable');
        throw new HttpException(
          'Payment service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  // Create Payment
  async createPayment(authorization: string, userId: string, body: any) {
    return this.executeRequest('create payment', () =>
      this.http.post(`${this.paymentBaseUrl}/payments`, body, {
        headers: {
          Authorization: authorization,
          'x-user-id': userId,
        },
      }),
    );
  }

  // Get Payment Status
  async getPaymentStatus(authorization: string, id: string) {
    return this.executeRequest(`get payment status ${id}`, () =>
      this.http.get(`${this.paymentBaseUrl}/payments/${id}`, {
        headers: {
          Authorization: authorization,
        },
      }),
    );
  }

  // Refund Payment
  async refundPayment(authorization: string, id: string, body: any) {
    return this.executeRequest(`refund payment ${id}`, () =>
      this.http.post(`${this.paymentBaseUrl}/payments/${id}/refund`, body, {
        headers: {
          Authorization: authorization,
        },
      }),
    );
  }

  // Webhook (no auth required)
  async handleWebhook(provider: string, body: any, signature?: string) {
    const params = signature ? { signature } : {};
    return this.executeRequest(`webhook ${provider}`, () =>
      this.http.post(`${this.paymentBaseUrl}/payments/webhook/${provider}`, body, {
        params,
      }),
    );
  }
}

