import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { setupSwagger } from './swagger';
import { JsonLoggerService } from './common/json-logger.service';

async function bootstrap() {
  // Bắt các lỗi chưa được xử lý toàn cục để debug nguyên nhân crash
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION in warehouse-service:', err);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION in warehouse-service:', reason);
  });

  try {
    const app = await NestFactory.create(AppModule, {
      logger: new JsonLoggerService('warehouse-service'),
    });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  setupSwagger(app);

  const port = process.env.PORT || 3018;
  await app.listen(port);
  
  console.log(`🚀 Warehouse Service is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api-docs`);
  } catch (error) {
    console.error(
      'Error during warehouse-service bootstrap:',
      error instanceof Error ? { message: error.message, stack: error.stack } : error,
    );
    throw error;
  }
}

bootstrap().catch((err) => {
  console.error('Bootstrap crashed with error:', err);
});

