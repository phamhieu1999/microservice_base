import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { JsonLoggerService } from './common/json-logger.service';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLoggerService('dlq-service'),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger
  const swaggerPath = setupSwagger(app);

  const port = process.env.PORT || 3013;
  await app.listen(port);

  const baseUrl = `http://localhost:${port}`;
  console.log(`\n🚀 DLQ Service is running on: ${baseUrl}`);
  console.log(`📚 Swagger documentation: ${baseUrl}${swaggerPath}\n`);
}

bootstrap();

