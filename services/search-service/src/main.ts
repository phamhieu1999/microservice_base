import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Setup Swagger
  setupSwagger(app);
  
  const port = process.env.PORT || 3012;
  await app.listen(port);
  console.log(`Search Service running on port ${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
}
bootstrap();

