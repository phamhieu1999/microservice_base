import { Injectable, LoggerService, Logger } from '@nestjs/common';

@Injectable()
export class JsonLoggerService implements LoggerService {
  private readonly logger = new Logger();

  log(message: string, context?: string) {
    this.logger.log(JSON.stringify({ level: 'info', message, context, timestamp: new Date().toISOString() }));
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(JSON.stringify({ level: 'error', message, trace, context, timestamp: new Date().toISOString() }));
  }

  warn(message: string, context?: string) {
    this.logger.warn(JSON.stringify({ level: 'warn', message, context, timestamp: new Date().toISOString() }));
  }

  debug(message: string, context?: string) {
    this.logger.debug(JSON.stringify({ level: 'debug', message, context, timestamp: new Date().toISOString() }));
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(JSON.stringify({ level: 'verbose', message, context, timestamp: new Date().toISOString() }));
  }
}

