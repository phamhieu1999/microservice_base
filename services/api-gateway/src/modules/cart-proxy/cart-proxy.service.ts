import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';
import { CartItemDto } from './dto/cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@Injectable()
export class CartProxyService {
  private readonly logger = new Logger(CartProxyService.name);
  private readonly cartBaseUrl =
    process.env.CART_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://cart-service:3006'
      : 'http://localhost:3006');
  private readonly requestTimeout = 10000; // 10 seconds

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`Cart service URL: ${this.cartBaseUrl}`);
  }

  async getCart(authorization: string): Promise<CartResponseDto> {
    return this.circuitBreaker.execute(
      'cart-service',
      async () => {
        try {
          this.logger.debug(`Getting cart from ${this.cartBaseUrl}/cart`);
          const res = await firstValueFrom(
            this.http
              .get<CartResponseDto>(`${this.cartBaseUrl}/cart`, {
                headers: { Authorization: authorization },
              })
              .pipe(
                timeout(this.requestTimeout),
                catchError((error) => {
                  this.logger.error(
                    `Error getting cart from ${this.cartBaseUrl}: ${error.message}`,
                    error.stack,
                  );
                  if (error.response) {
                    throw new HttpException(
                      error.response.data || 'Failed to get cart',
                      error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                  }
                  if (error.name === 'TimeoutError') {
                    this.logger.error('Request timeout when getting cart');
                    throw new HttpException(
                      'Cart service request timeout',
                      HttpStatus.GATEWAY_TIMEOUT,
                    );
                  }
                  throw new HttpException(
                    `Cart service is unavailable: ${error.message}`,
                    HttpStatus.SERVICE_UNAVAILABLE,
                  );
                }),
              ),
          );
          return res.data;
        } catch (error) {
          if (error instanceof HttpException) {
            throw error;
          }
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(`Unexpected error getting cart: ${errorMessage}`, errorStack);
          throw new HttpException(
            'Cart service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, cart service unavailable');
        throw new HttpException(
          'Cart service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  async upsertItem(authorization: string, body: CartItemDto): Promise<CartResponseDto> {
    return this.circuitBreaker.execute(
      'cart-service',
      async () => {
        try {
          this.logger.debug(`Upserting cart item to ${this.cartBaseUrl}/cart/items`, body);
          const res = await firstValueFrom(
            this.http
              .post<CartResponseDto>(`${this.cartBaseUrl}/cart/items`, body, {
                headers: { Authorization: authorization },
              })
              .pipe(
                timeout(this.requestTimeout),
                catchError((error) => {
                  this.logger.error(
                    `Error upserting cart item to ${this.cartBaseUrl}: ${error.message}`,
                    error.stack,
                  );
                  if (error.response) {
                    throw new HttpException(
                      error.response.data || 'Failed to upsert cart item',
                      error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                  }
                  if (error.name === 'TimeoutError') {
                    this.logger.error('Request timeout when upserting cart item');
                    throw new HttpException(
                      'Cart service request timeout',
                      HttpStatus.GATEWAY_TIMEOUT,
                    );
                  }
                  throw new HttpException(
                    `Cart service is unavailable: ${error.message}`,
                    HttpStatus.SERVICE_UNAVAILABLE,
                  );
                }),
              ),
          );
          return res.data;
        } catch (error) {
          if (error instanceof HttpException) {
            throw error;
          }
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(`Unexpected error upserting cart item: ${errorMessage}`, errorStack);
          throw new HttpException(
            'Cart service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, cart service unavailable');
        throw new HttpException(
          'Cart service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  async removeItem(authorization: string, productId: string): Promise<CartResponseDto> {
    return this.circuitBreaker.execute(
      'cart-service',
      async () => {
        try {
          this.logger.debug(`Removing cart item from ${this.cartBaseUrl}/cart/items/${productId}`);
          const res = await firstValueFrom(
            this.http
              .delete<CartResponseDto>(`${this.cartBaseUrl}/cart/items/${productId}`, {
                headers: { Authorization: authorization },
              })
              .pipe(
                timeout(this.requestTimeout),
                catchError((error) => {
                  this.logger.error(
                    `Error removing cart item from ${this.cartBaseUrl}: ${error.message}`,
                    error.stack,
                  );
                  if (error.response) {
                    throw new HttpException(
                      error.response.data || 'Failed to remove cart item',
                      error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                  }
                  if (error.name === 'TimeoutError') {
                    this.logger.error('Request timeout when removing cart item');
                    throw new HttpException(
                      'Cart service request timeout',
                      HttpStatus.GATEWAY_TIMEOUT,
                    );
                  }
                  throw new HttpException(
                    `Cart service is unavailable: ${error.message}`,
                    HttpStatus.SERVICE_UNAVAILABLE,
                  );
                }),
              ),
          );
          return res.data;
        } catch (error) {
          if (error instanceof HttpException) {
            throw error;
          }
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(`Unexpected error removing cart item: ${errorMessage}`, errorStack);
          throw new HttpException(
            'Cart service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, cart service unavailable');
        throw new HttpException(
          'Cart service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }
}


