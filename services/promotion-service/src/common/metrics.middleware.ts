import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';
import { TracingService } from './tracing.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MetricsMiddleware.name);

  constructor(
    private readonly metrics: MetricsService,
    private readonly tracing: TracingService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const spanId = this.tracing.startSpan(`${req.method} ${req.path}`);

    // Add trace ID to response headers
    const span = this.tracing.getSpan(spanId);
    const traceId = span?.traceId;
    if (traceId) {
      res.setHeader('X-Trace-Id', traceId);
    }

    // Track request
    this.metrics.incrementCounter('http_requests_total', {
      method: req.method,
      path: req.path,
    });

    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode.toString();

      // Metrics
      this.metrics.incrementCounter('http_requests_total', {
        method: req.method,
        path: req.path,
        status: statusCode,
      });
      this.metrics.observeHistogram('http_request_duration_ms', duration, {
        method: req.method,
        path: req.path,
        status: statusCode,
      });

      // Tracing
      const status = res.statusCode >= 400 ? 'error' : 'ok';
      this.tracing.endSpan(spanId, status);

      this.logger.debug(
        `${req.method} ${req.path} ${statusCode} ${duration}ms [traceId: ${traceId}]`,
      );
    });

    next();
  }
}

