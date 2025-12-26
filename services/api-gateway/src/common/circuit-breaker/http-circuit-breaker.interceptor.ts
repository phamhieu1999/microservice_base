import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CircuitBreakerService } from './circuit-breaker.service';
import { HttpService } from '@nestjs/axios';

/**
 * HTTP Circuit Breaker Interceptor
 * 
 * Protects downstream service calls from cascading failures.
 * When a service is failing, the circuit opens and rejects requests
 * immediately, preventing further load on the failing service.
 */
@Injectable()
export class HttpCircuitBreakerInterceptor implements NestInterceptor {
  constructor(
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly httpService: HttpService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const serviceName = this.extractServiceName(request.url);

    // Execute with circuit breaker protection
    return new Observable((observer) => {
      this.circuitBreaker
        .execute(
          serviceName,
          async () => {
            // Wrap the handler in a promise
            return new Promise((resolve, reject) => {
              const subscription = next.handle().subscribe({
                next: (value) => {
                  resolve(value);
                  observer.next(value);
                  observer.complete();
                },
                error: (error) => {
                  reject(error);
                  observer.error(error);
                },
              });
            });
          },
          async () => {
            // Fallback: return error response
            observer.error({
              statusCode: 503,
              message: `Service ${serviceName} is temporarily unavailable`,
              error: 'Service Unavailable',
            });
          },
        )
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  /**
   * Extract service name from request URL
   */
  private extractServiceName(url: string): string {
    // Extract service name from URL pattern
    // e.g., /products -> product-service
    // e.g., /orders -> order-service
    const parts = url.split('/').filter((p) => p);
    if (parts.length > 0) {
      const service = parts[0];
      return `${service}-service`;
    }
    return 'unknown-service';
  }
}

