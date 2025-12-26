import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Warehouse Service API')
    .setDescription('Data Warehouse Service with ClickHouse - Analytics and Reporting API')
    .setVersion('1.0')
    .addTag('warehouse', 'Warehouse data queries')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}

