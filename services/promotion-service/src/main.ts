import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { JsonLoggerService } from './common/json-logger.service';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new JsonLoggerService('promotion-service');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: new JsonLoggerService('promotion-service'),
      abortOnError: false, // Don't abort on errors, allow app to start
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    setupSwagger(app);

    const port = process.env.PORT || 3009;
    await app.listen(port);
    
    logger.log(`🚀 Promotion Service is running on: http://localhost:${port}`);
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api-docs`);
    logger.log(`❤️  Health check: http://localhost:${port}/health`);
    logger.log(`📊 Metrics: http://localhost:${port}/metrics`);
    
    // Check if database is available
    if (process.env.SKIP_DB === 'true') {
      logger.warn('⚠️  Database connection is disabled (SKIP_DB=true)');
      logger.warn('⚠️  Promotion endpoints will not work without database');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Failed to start Promotion Service', errorStack);
    logger.error(`Error: ${errorMessage}`);
    
    if (errorMessage.includes('database') || errorMessage.includes('authentication') || errorMessage.includes('password')) {
      logger.error('💡 Tip: Make sure PostgreSQL is running and database credentials are correct');
      logger.error('💡 Set environment variables: PROMO_DB_HOST, PROMO_DB_PORT, PROMO_DB_USER, PROMO_DB_PASSWORD, PROMO_DB_NAME');
      logger.error('💡 Or set SKIP_DB=true to start service without database (for testing)');
    }
    
    process.exit(1);
  }
}

bootstrap();


