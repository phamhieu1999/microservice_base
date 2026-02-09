import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class DisputeProxyService {
  private readonly logger = new Logger(DisputeProxyService.name);
  private readonly disputeBaseUrl =
    process.env.DISPUTE_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://dispute-service:3016'
      : 'http://localhost:3016');
  private readonly requestTimeout = 10000; // 10 seconds

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`Dispute service URL: ${this.disputeBaseUrl}`);
  }

  private async executeRequest<T>(
    operation: string,
    requestFn: () => any,
  ): Promise<T> {
    return this.circuitBreaker.execute(
      'dispute-service',
      async () => {
        try {
          this.logger.debug(`Executing ${operation} to ${this.disputeBaseUrl}`);
          const res: any = await firstValueFrom(
            requestFn().pipe(
              timeout(this.requestTimeout),
              catchError((error) => {
                this.logger.error(
                  `Error ${operation} to ${this.disputeBaseUrl}: ${error.message}`,
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
                    'Dispute service request timeout',
                    HttpStatus.GATEWAY_TIMEOUT,
                  );
                }
                throw new HttpException(
                  `Dispute service is unavailable: ${error.message}`,
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
            'Dispute service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, dispute service unavailable');
        throw new HttpException(
          'Dispute service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  createDispute(body: any) {
    return this.executeRequest('create dispute', () =>
      this.http.post(`${this.disputeBaseUrl}/disputes`, body),
    );
  }

  getDisputeById(id: string) {
    return this.executeRequest('get dispute by id', () =>
      this.http.get(`${this.disputeBaseUrl}/disputes/${id}`),
    );
  }

  getDisputesByUser(userId: string, page?: number, limit?: number) {
    return this.executeRequest('get disputes by user', () =>
      this.http.get(`${this.disputeBaseUrl}/disputes/user/${userId}`, {
        params: { page, limit },
      }),
    );
  }

  replyToDispute(id: string, body: any) {
    return this.executeRequest('reply to dispute', () =>
      this.http.post(`${this.disputeBaseUrl}/disputes/${id}/reply`, body),
    );
  }

  escalateDispute(id: string, body: any) {
    return this.executeRequest('escalate dispute', () =>
      this.http.post(`${this.disputeBaseUrl}/disputes/${id}/escalate`, body),
    );
  }

  resolveDispute(id: string, body: any) {
    return this.executeRequest('resolve dispute', () =>
      this.http.post(`${this.disputeBaseUrl}/disputes/${id}/resolve`, body),
    );
  }

  listDisputes(params: { status?: string; sellerId?: string; userId?: string; page?: number; limit?: number }) {
    return this.executeRequest('list disputes', () =>
      this.http.get(`${this.disputeBaseUrl}/admin/disputes`, { params }),
    );
  }
}

