import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { Logger } from '@nestjs/common';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
    // Enable CORS
    app.enableCors();
    
    // Setup Swagger
    setupSwagger(app);
    
    const port = process.env.PORT || 3005;
    await app.listen(port);
    
    logger.log(`Notification service is running on port ${port}`);
    logger.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
    logger.log(`MongoDB URI: ${process.env.NOTIFICATION_MONGO_URI || 'mongodb://localhost:27017/notification_db'}`);
  } catch (error) {
    logger.error('Failed to start notification service:', error);
    process.exit(1);
  }
}

bootstrap();


