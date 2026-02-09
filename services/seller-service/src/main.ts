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

    const port = process.env.PORT || 3008;
    await app.listen(port);
    
    console.log(`🚀 Seller Service is running on: http://localhost:${port}`);
    console.log(`📚 Swagger documentation: http://localhost:${port}/api-docs`);
    console.log(`📄 Swagger JSON: http://localhost:${port}/api-docs-json`);
    
    // Log database connection info
    const dbHost = process.env.SELLER_DB_HOST || 'localhost';
    const dbPort = process.env.SELLER_DB_PORT || (dbHost === 'localhost' ? '5436' : '5432');
    console.log(`🔌 PostgreSQL: ${dbHost}:${dbPort}/${process.env.SELLER_DB_NAME || 'seller_db'}`);
  } catch (error) {
    console.error('❌ Failed to start Seller Service:', error);
    process.exit(1);
  }
}

bootstrap();


