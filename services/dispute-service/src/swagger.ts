import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): string {
  const config = new DocumentBuilder()
    .setTitle('Dispute Service API')
    .setDescription('Dispute Management Service API Documentation')
    .setVersion('1.0')
    .addTag('disputes', 'Dispute management endpoints')
    .addTag('disputes-admin', 'Admin dispute management endpoints')
    .addServer('http://localhost:3016', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3016;
  const swaggerPath = 'api-docs';
  return `http://localhost:${port}/${swaggerPath}`;
}
