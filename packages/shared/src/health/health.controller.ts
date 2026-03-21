import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  @Get()
  health() {
    return { status: 'ok', service: this.serviceName };
  }
}

export function createHealthController(serviceName: string) {
  @Controller('health')
  class DynamicHealthController {
    @Get()
    health() {
      return { status: 'ok', service: serviceName };
    }
  }
  return DynamicHealthController;
}
