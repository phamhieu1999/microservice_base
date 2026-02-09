import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger
  setupSwagger(app);

  await app.listen(process.env.PORT || 3006);
  console.log(`🚀 Cart Service is running on: http://localhost:${process.env.PORT || 3006}`);
  console.log(`📚 Swagger documentation: http://localhost:${process.env.PORT || 3006}/api-docs`);
}

bootstrap();


