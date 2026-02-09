import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class ReviewProxyService {
  private readonly logger = new Logger(ReviewProxyService.name);
  private readonly reviewBaseUrl =
    process.env.REVIEW_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://review-service:3007'
      : 'http://localhost:3007');
  private readonly requestTimeout = 10000; // 10 seconds

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`Review service URL: ${this.reviewBaseUrl}`);
  }

  private async executeRequest<T>(
    operation: string,
    requestFn: () => any,
  ): Promise<T> {
    return this.circuitBreaker.execute(
      'review-service',
      async () => {
        try {
          this.logger.debug(`Executing ${operation} to ${this.reviewBaseUrl}`);
          const res: any = await firstValueFrom(
            requestFn().pipe(
              timeout(this.requestTimeout),
              catchError((error) => {
                this.logger.error(
                  `Error ${operation} to ${this.reviewBaseUrl}: ${error.message}`,
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
                    'Review service request timeout',
                    HttpStatus.GATEWAY_TIMEOUT,
                  );
                }
                throw new HttpException(
                  `Review service is unavailable: ${error.message}`,
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
            'Review service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, review service unavailable');
        throw new HttpException(
          'Review service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  async createReview(authorization: string, body: any) {
    return this.executeRequest('create review', () =>
      this.http.post(`${this.reviewBaseUrl}/reviews`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async getReviewById(id: string) {
    return this.executeRequest(`get review ${id}`, () =>
      this.http.get(`${this.reviewBaseUrl}/reviews/${id}`),
    );
  }

  async updateReview(authorization: string, id: string, body: any) {
    return this.executeRequest(`update review ${id}`, () =>
      this.http.patch(`${this.reviewBaseUrl}/reviews/${id}`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async deleteReview(authorization: string, id: string) {
    return this.executeRequest(`delete review ${id}`, () =>
      this.http.delete(`${this.reviewBaseUrl}/reviews/${id}`, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async listByProduct(productId: string, query?: any) {
    return this.executeRequest(`list reviews for product ${productId}`, () =>
      this.http.get(`${this.reviewBaseUrl}/products/${productId}/reviews`, {
        params: query,
      }),
    );
  }

  async getStatsByProduct(productId: string) {
    return this.executeRequest(`get stats for product ${productId}`, () =>
      this.http.get(`${this.reviewBaseUrl}/products/${productId}/reviews/stats`),
    );
  }

  async listByUser(userId: string, query?: any) {
    return this.executeRequest(`list reviews for user ${userId}`, () =>
      this.http.get(`${this.reviewBaseUrl}/users/${userId}/reviews`, {
        params: query,
      }),
    );
  }

  async listAll(query?: any) {
    return this.executeRequest('list all reviews', () =>
      this.http.get(`${this.reviewBaseUrl}/reviews`, {
        params: query,
      }),
    );
  }
}


