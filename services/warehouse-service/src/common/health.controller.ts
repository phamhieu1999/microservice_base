import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return await this.healthCheckService.getHealthStatus();
  }

  @Get('clickhouse')
  @ApiOperation({ summary: 'ClickHouse health check' })
  async clickhouseHealth() {
    return await this.healthCheckService.checkClickHouse();
  }

  @Get('kafka')
  @ApiOperation({ summary: 'Kafka health check' })
  async kafkaHealth() {
    return await this.healthCheckService.checkKafka();
  }
}

