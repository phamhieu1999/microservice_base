import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Promotion Service API')
    .setDescription('Promotion Management Service API Documentation')
    .setVersion('1.0')
    .addTag('promotions', 'Promotion management endpoints')
    .addTag('vouchers', 'Voucher management endpoints')
    .addTag('loyalty', 'Loyalty exchange endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

