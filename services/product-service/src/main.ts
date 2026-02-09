import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { JsonLoggerService } from './common/json-logger.service';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new JsonLoggerService('product-service');
  
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

    const port = process.env.PORT || 3002;
    await app.listen(port);
    logger.log(`Product Service is running on port ${port}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Failed to start Product Service', errorStack);
    logger.error(`Error: ${errorMessage}`);
    
    if (errorMessage.includes('database') || errorMessage.includes('mongodb') || errorMessage.includes('mongo')) {
      logger.error('💡 Tip: Make sure MongoDB is running and connection string is correct');
      logger.error('💡 Set environment variable: PRODUCT_MONGO_URI');
    }
    
    if (errorMessage.includes('kafka') || errorMessage.includes('KAFKA')) {
      logger.error('💡 Tip: Make sure Kafka is running and KAFKA_BROKERS is set correctly');
      logger.error('💡 Or set KAFKA_ENABLED=false to start service without Kafka');
    }
    
    if (errorMessage.includes('redis') || errorMessage.includes('REDIS')) {
      logger.error('💡 Tip: Make sure Redis is running and REDIS_HOST, REDIS_PORT are set correctly');
      logger.error('💡 Or set REDIS_ENABLED=false to use in-memory cache');
    }
    
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new JsonLoggerService('product-service');
  logger.error('Uncaught Exception', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logger = new JsonLoggerService('product-service');
  logger.error('Unhandled Rejection', reason instanceof Error ? reason.stack : String(reason));
  process.exit(1);
});

bootstrap();


