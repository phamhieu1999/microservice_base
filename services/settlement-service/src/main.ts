import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { JsonLoggerService } from './common/json-logger.service';
import { setupSwagger } from './swagger';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m',
};

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: new JsonLoggerService('settlement-service'),
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Setup Swagger
    setupSwagger(app);

    const port = process.env.PORT || 3017;
    await app.listen(port);
    
    // Colorful startup logs
    console.log('\n' + colors.bgCyan + colors.bright + colors.white + '═══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.bgCyan + colors.bright + colors.white + '  🚀  SETTLEMENT SERVICE STARTED SUCCESSFULLY  🚀  ' + colors.reset);
    console.log(colors.bgCyan + colors.bright + colors.white + '═══════════════════════════════════════════════════════════' + colors.reset + '\n');
    
    console.log(colors.green + colors.bright + '✓' + colors.reset + colors.cyan + ' Service URL:' + colors.reset + colors.bright + ` http://localhost:${port}` + colors.reset);
    console.log(colors.green + colors.bright + '✓' + colors.reset + colors.cyan + ' Swagger Docs:' + colors.reset + colors.bright + ` http://localhost:${port}/api-docs` + colors.reset);
    console.log(colors.green + colors.bright + '✓' + colors.reset + colors.cyan + ' Swagger JSON:' + colors.reset + colors.bright + ` http://localhost:${port}/api-docs-json` + colors.reset);
    
    // Log database connection info
    const dbHost = process.env.SETTLEMENT_DB_HOST || 'localhost';
    const dbPort = process.env.SETTLEMENT_DB_PORT || (dbHost === 'localhost' ? '5440' : '5432');
    const dbName = process.env.SETTLEMENT_DB_NAME || 'settlement_db';
    console.log(colors.green + colors.bright + '✓' + colors.reset + colors.cyan + ' PostgreSQL:' + colors.reset + colors.yellow + ` ${dbHost}:${dbPort}/${dbName}` + colors.reset);
    
    // Log Kafka connection info
    const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
    console.log(colors.green + colors.bright + '✓' + colors.reset + colors.cyan + ' Kafka Brokers:' + colors.reset + colors.yellow + ` ${kafkaBrokers}` + colors.reset);
    
    console.log('\n' + colors.dim + '───────────────────────────────────────────────────────────────' + colors.reset);
    console.log(colors.dim + `  Settlement Service v1.0.0 | Port: ${port} | Environment: ${process.env.NODE_ENV || 'development'}` + colors.reset);
    console.log(colors.dim + '───────────────────────────────────────────────────────────────' + colors.reset + '\n');
  } catch (error) {
    console.error(colors.red + colors.bright + '❌ Failed to start Settlement Service:' + colors.reset, error);
    process.exit(1);
  }
}

bootstrap();
