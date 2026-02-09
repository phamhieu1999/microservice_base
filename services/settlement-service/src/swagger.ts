import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Settlement Service API')
    .setDescription('Settlement & Payout Service API Documentation. Manage seller balances, payout requests, and commission configurations.')
    .setVersion('1.0')
    .addTag('balances', 'Seller balance management endpoints')
    .addTag('payouts', 'Payout request management endpoints')
    .addTag('commission-configs', 'Commission configuration management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
