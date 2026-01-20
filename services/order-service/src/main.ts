import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { JsonLoggerService } from './common/json-logger.service';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new JsonLoggerService('order-service');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger,
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

    const port = process.env.PORT || 3003;
    await app.listen(port);
    logger.log(`Order Service is running on port ${port}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Failed to start Order Service', errorStack);
    logger.error(`Error: ${errorMessage}`);
    
    if (errorMessage.includes('database') || errorMessage.includes('authentication') || errorMessage.includes('password')) {
      logger.error('💡 Tip: Make sure PostgreSQL is running and database credentials are correct');
      logger.error('💡 Set environment variables: ORDER_DB_HOST, ORDER_DB_PORT, ORDER_DB_USER, ORDER_DB_PASSWORD, ORDER_DB_NAME');
    }
    
    if (errorMessage.includes('kafka') || errorMessage.includes('KAFKA')) {
      logger.error('💡 Tip: Make sure Kafka is running and KAFKA_BROKERS is set correctly');
      logger.error('💡 Or set KAFKA_ENABLED=false to start service without Kafka');
    }
    
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new JsonLoggerService('order-service');
  logger.error('Uncaught Exception', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logger = new JsonLoggerService('order-service');
  logger.error('Unhandled Rejection', reason instanceof Error ? reason.stack : String(reason));
  process.exit(1);
});

bootstrap();


