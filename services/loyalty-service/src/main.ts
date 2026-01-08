import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { JsonLoggerService } from './common/json-logger.service';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLoggerService('loyalty-service'),
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

  const port = process.env.PORT || 3015;
  
  try {
    // Log before listening
    console.log(`\n🚀 Starting Loyalty Service on port ${port}...\n`);
    
    await app.listen(port);
    
    // Display service URLs in console (using console.log to bypass JSON logger)
    console.log('\n' + '='.repeat(60));
    console.log('✅ Loyalty Service is running!');
    console.log('='.repeat(60));
    console.log(`📍 Service URL:     http://localhost:${port}`);
    console.log(`📚 Swagger Docs:    http://localhost:${port}/api-docs`);
    console.log(`🔍 Swagger JSON:    http://localhost:${port}/api-docs-json`);
    console.log(`❤️  Health Check:    http://localhost:${port}/health`);
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
