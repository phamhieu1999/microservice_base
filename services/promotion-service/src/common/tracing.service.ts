import { Injectable, Logger } from '@nestjs/common';

// OpenTelemetry tracing (simplified, trong production nên dùng @opentelemetry/api)
@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);
  private traces: Map<string, any> = new Map();

  startSpan(operationName: string, traceId?: string): string {
    const spanId = `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTraceId = traceId || `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.traces.set(spanId, {
      traceId: newTraceId,
      spanId,
      operationName,
      startTime: Date.now(),
      attributes: {},
    });

    this.logger.debug(`Started span: ${operationName} [traceId: ${newTraceId}, spanId: ${spanId}]`);
    return spanId;
  }

  endSpan(spanId: string, status: 'ok' | 'error' = 'ok', error?: Error) {
    const span = this.traces.get(spanId);
    if (!span) return;

    const duration = Date.now() - span.startTime;
    span.endTime = Date.now();
    span.duration = duration;
    span.status = status;
    if (error) {
      span.error = error.message;
    }

    this.logger.debug(
      `Ended span: ${span.operationName} [duration: ${duration}ms, status: ${status}]`,
    );

    // Trong production, gửi span đến OpenTelemetry collector
    this.traces.delete(spanId);
  }

  addAttribute(spanId: string, key: string, value: any) {
    const span = this.traces.get(spanId);
    if (span) {
      span.attributes[key] = value;
    }
  }

  getTrace(traceId: string): any[] {
    return Array.from(this.traces.values()).filter((t) => t.traceId === traceId);
  }

  getSpan(spanId: string): any {
    return this.traces.get(spanId);
  }

  // Get active trace ID (from most recent span)
  getActiveTraceId(): string | undefined {
    const spans = Array.from(this.traces.values());
    if (spans.length === 0) return undefined;
    // Return trace ID from most recently created span
    const sorted = spans.sort((a, b) => b.startTime - a.startTime);
    return sorted[0]?.traceId;
  }
}

