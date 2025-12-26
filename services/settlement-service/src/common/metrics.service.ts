import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private metrics: Map<string, number> = new Map();

  incrementCounter(name: string, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    this.metrics.set(key, value);
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = `${name}_histogram_${this.getKey('', labels)}`;
    const values = (this.metrics.get(key) as any) || [];
    values.push(value);
    this.metrics.set(key, values as any);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }
}
