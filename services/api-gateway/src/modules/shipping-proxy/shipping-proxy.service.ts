import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class ShippingProxyService {
  private readonly logger = new Logger(ShippingProxyService.name);
  private readonly shippingBaseUrl =
    process.env.SHIPPING_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true'
      ? 'http://shipping-service:3006'
      : 'http://localhost:3006');
  private readonly requestTimeout = 10000; // 10 seconds

  constructor(
    private readonly http: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.logger.log(`Shipping service URL: ${this.shippingBaseUrl}`);
  }

  private async executeRequest<T>(
    operation: string,
    requestFn: () => any,
  ): Promise<T> {
    return this.circuitBreaker.execute(
      'shipping-service',
      async () => {
        try {
          this.logger.debug(`Executing ${operation} to ${this.shippingBaseUrl}`);
          const res: any = await firstValueFrom(
            requestFn().pipe(
              timeout(this.requestTimeout),
              catchError((error) => {
                this.logger.error(
                  `Error ${operation} to ${this.shippingBaseUrl}: ${error.message}`,
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
                    'Shipping service request timeout',
                    HttpStatus.GATEWAY_TIMEOUT,
                  );
                }
                throw new HttpException(
                  `Shipping service is unavailable: ${error.message}`,
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
            'Shipping service is unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      },
      async () => {
        this.logger.warn('Circuit breaker is OPEN, shipping service unavailable');
        throw new HttpException(
          'Shipping service is temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }

  // Shipping Methods
  async getAllShippingMethods() {
    return this.executeRequest('get all shipping methods', () =>
      this.http.get(`${this.shippingBaseUrl}/shipping/methods`),
    );
  }

  async getShippingMethodById(id: string) {
    return this.executeRequest(`get shipping method ${id}`, () =>
      this.http.get(`${this.shippingBaseUrl}/shipping/methods/${id}`),
    );
  }

  async createShippingMethod(authorization: string, body: any) {
    return this.executeRequest('create shipping method', () =>
      this.http.post(`${this.shippingBaseUrl}/shipping/methods`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async updateShippingMethod(authorization: string, id: string, body: any) {
    return this.executeRequest(`update shipping method ${id}`, () =>
      this.http.put(`${this.shippingBaseUrl}/shipping/methods/${id}`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async deleteShippingMethod(authorization: string, id: string) {
    return this.executeRequest(`delete shipping method ${id}`, () =>
      this.http.delete(`${this.shippingBaseUrl}/shipping/methods/${id}`, {
        headers: { Authorization: authorization },
      }),
    );
  }

  // Quotes
  async getQuote(body: any, methodId?: string) {
    const params = methodId ? { methodId } : {};
    return this.executeRequest('get shipping quote', () =>
      this.http.post(`${this.shippingBaseUrl}/shipping/quote`, body, {
        params,
      }),
    );
  }

  async getQuoteById(id: string) {
    return this.executeRequest(`get quote ${id}`, () =>
      this.http.get(`${this.shippingBaseUrl}/shipping/quote/${id}`),
    );
  }

  async acceptQuote(authorization: string, id: string) {
    return this.executeRequest(`accept quote ${id}`, () =>
      this.http.post(`${this.shippingBaseUrl}/shipping/quote/${id}/accept`, {}, {
        headers: { Authorization: authorization },
      }),
    );
  }

  // Shipping Orders
  async createShippingOrder(authorization: string, body: any) {
    return this.executeRequest('create shipping order', () =>
      this.http.post(`${this.shippingBaseUrl}/shipping/orders`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }

  async getAllShippingOrders(status?: string) {
    const params = status ? { status } : {};
    return this.executeRequest('get all shipping orders', () =>
      this.http.get(`${this.shippingBaseUrl}/shipping/orders`, {
        params,
      }),
    );
  }

  async getShippingOrderByOrderId(orderId: string) {
    return this.executeRequest(`get shipping order by orderId ${orderId}`, () =>
      this.http.get(`${this.shippingBaseUrl}/shipping/orders/order/${orderId}`),
    );
  }

  async getShippingOrderByTrackingNumber(trackingNumber: string) {
    return this.executeRequest(`get shipping order by tracking ${trackingNumber}`, () =>
      this.http.get(`${this.shippingBaseUrl}/shipping/tracking/${trackingNumber}`),
    );
  }

  // Tracking
  async updateTracking(authorization: string, trackingNumber: string, body: any) {
    return this.executeRequest(`update tracking ${trackingNumber}`, () =>
      this.http.put(`${this.shippingBaseUrl}/shipping/tracking/${trackingNumber}`, body, {
        headers: { Authorization: authorization },
      }),
    );
  }
}


