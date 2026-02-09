import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { JsonLoggerService } from './common/json-logger.service';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLoggerService('dispute-service'),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerUrl = setupSwagger(app);

  const port = process.env.PORT || 3016;
  await app.listen(port);

  console.log('\n🚀 Dispute Service is running!');
  console.log(`📍 Server: http://localhost:${port}`);
  console.log(`📚 Swagger API Docs: ${swaggerUrl}`);
  console.log(`📖 Swagger JSON: ${swaggerUrl}-json\n`);
}

bootstrap();
