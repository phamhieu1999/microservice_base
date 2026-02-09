import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class DLQProxyService {
  private readonly logger = new Logger(DLQProxyService.name);
  private readonly dlqBaseUrl =
    process.env.DLQ_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://dlq-service:3013'
      : 'http://localhost:3013');
  private readonly requestTimeout = 10000; // 10 seconds

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`DLQ service URL: ${this.dlqBaseUrl}`);
  }

  private async executeRequest<T>(
    operation: string,
    requestFn: () => any,
  ): Promise<T> {
    return this.circuitBreaker.execute(
      'dlq-service',
      async () => {
        try {
          this.logger.debug(`Executing ${operation} to ${this.dlqBaseUrl}`);
          const res: any = await firstValueFrom(
            requestFn().pipe(
              timeout(this.requestTimeout),
              catchError((error) => {
                this.logger.error(
                  `Error ${operation} to ${this.dlqBaseUrl}: ${error.message}`,
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
                    'DLQ service request timeout',
                    HttpStatus.GATEWAY_TIMEOUT,
                  );
                }
                throw new HttpException(
                  `DLQ service is unavailable: ${error.message}`,
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
            'DLQ service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, dlq service unavailable');
        throw new HttpException(
          'DLQ service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  listFailedMessages(limit?: number, skip?: number) {
    return this.executeRequest('list failed messages', () =>
      this.http.get(`${this.dlqBaseUrl}/dlq`, {
        params: { limit, skip },
      }),
    );
  }

  getFailedMessage(id: string) {
    return this.executeRequest('get failed message by id', () =>
      this.http.get(`${this.dlqBaseUrl}/dlq/${id}`),
    );
  }

  retryFailedMessage(id: string) {
    return this.executeRequest('retry failed message', () =>
      this.http.post(`${this.dlqBaseUrl}/dlq/${id}/retry`),
    );
  }

  deleteFailedMessage(id: string) {
    return this.executeRequest('delete failed message', () =>
      this.http.delete(`${this.dlqBaseUrl}/dlq/${id}`),
    );
  }
}

