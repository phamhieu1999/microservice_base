import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TracingService } from './tracing.service';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  constructor(private readonly tracing: TracingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const traceId = request.headers['x-trace-id'] || request.headers['x-request-id'];

    // Start span
    const spanId = this.tracing.startSpan(
      `${request.method} ${request.path}`,
      traceId as string,
    );

    // Add trace ID to request for downstream services
    request.traceId = this.tracing.getSpan(spanId)?.traceId;

    return next.handle().pipe(
      tap({
        next: () => {
          this.tracing.endSpan(spanId, 'ok');
        },
        error: (error) => {
          this.tracing.endSpan(spanId, 'error', error);
        },
      }),
    );
  }
}

