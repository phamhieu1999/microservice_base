import { Controller, Get, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    @Optional()
    @InjectConnection()
    private readonly connection?: Connection,
  ) {}

  @Get()
  async health() {
    let dbStatus = 'unknown';
    
    if (this.connection) {
      try {
        await this.connection.query('SELECT 1');
        dbStatus = 'connected';
      } catch (error) {
        dbStatus = 'disconnected';
      }
    } else {
      dbStatus = 'not_configured';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      service: 'promotion-service',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}

