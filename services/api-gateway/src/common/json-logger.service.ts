import { LoggerService } from '@nestjs/common';

export class JsonLoggerService implements LoggerService {
  constructor(private readonly serviceName: string) {}

  log(message: any, context?: string) {
    this.print('log', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.print('error', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.print('warn', message, context);
  }

  debug?(message: any, context?: string) {
    this.print('debug', message, context);
  }

  verbose?(message: any, context?: string) {
    this.print('verbose', message, context);
  }

  private print(level: string, message: any, context?: string, trace?: string) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      context,
      message,
      trace,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
  }
}


