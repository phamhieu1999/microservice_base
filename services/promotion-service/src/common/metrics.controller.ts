import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  getMetrics() {
    // Prometheus format (simplified)
    const metrics = this.metrics.getMetrics();
    const lines: string[] = [];

    for (const [key, value] of Object.entries(metrics)) {
      if (Array.isArray(value)) {
        // Histogram
        const sum = value.reduce((a, b) => a + b, 0);
        const count = value.length;
        const avg = count > 0 ? sum / count : 0;
        lines.push(`# TYPE ${key} histogram`);
        lines.push(`${key}_sum ${sum}`);
        lines.push(`${key}_count ${count}`);
        lines.push(`${key}_avg ${avg}`);
      } else {
        // Counter or Gauge
        lines.push(`# TYPE ${key} gauge`);
        lines.push(`${key} ${value}`);
      }
    }

    return lines.join('\n') + '\n';
  }
}

