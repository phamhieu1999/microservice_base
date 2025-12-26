import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private counters: Record<string, number> = {};
  private histograms: Record<string, number[]> = {};

  incrementCounter(name: string, _labels?: Record<string, string>) {
    this.counters[name] = (this.counters[name] || 0) + 1;
  }

  observeHistogram(name: string, value: number, _labels?: Record<string, string>) {
    if (!this.histograms[name]) {
      this.histograms[name] = [];
    }
    this.histograms[name].push(value);
  }

  getMetrics() {
    return {
      ...this.counters,
      ...this.histograms,
    } as Record<string, number | number[]>;
  }
}
