import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
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

    const port = process.env.PORT || 3007;
    await app.listen(port);
    
    console.log(`🚀 Review Service is running on: http://localhost:${port}`);
    console.log(`📚 Swagger documentation: http://localhost:${port}/api-docs`);
    console.log(`📄 Swagger JSON: http://localhost:${port}/api-docs-json`);
    
    // Log MongoDB connection status
    const mongoUri = process.env.REVIEW_MONGO_URI || 
      (process.env.NODE_ENV === 'production' 
        ? 'mongodb://mongo:27017/review_db'
        : 'mongodb://localhost:27017/review_db');
    console.log(`🔌 MongoDB URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  } catch (error) {
    console.error('❌ Failed to start Review Service:', error);
    process.exit(1);
  }
}

bootstrap();


