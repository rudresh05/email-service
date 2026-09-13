import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-api-key',
  });

  // Global Exception Filter enforcing standard Output Error Contract
  app.useGlobalFilters(new HttpExceptionFilter());

  // Zero-Fallback Strict Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that are not in the DTO
      forbidNonWhitelisted: true, // Reject requests containing unknown extraneous properties
      transform: true, // Automatically transform payloads to DTO instance types
      stopAtFirstError: false, // Return all validation errors together
    }),
  );

  // OpenAPI / Swagger Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rudra Central Email Microservice')
    .setDescription(
      'Autonomous, zero-fallback, zero-cost email delivery API serving rudresh-portfolio, leetcode_to_github, and future applications.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT/Token',
        description: 'Provide your CENTRAL_SERVICE_SECRET key',
      },
      'bearer-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Alternative authentication header using x-api-key',
      },
      'x-api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Rudra Email API Documentation',
  });

  await app.listen(port);

  logger.log(`================================================================`);
  logger.log(`[STARTUP] Rudra Central Email Microservice running: http://localhost:${port}`);
  logger.log(`[SWAGGER] Interactive API Documentation available at: http://localhost:${port}/docs`);
  logger.log(`[HEALTH]  Health check endpoint: http://localhost:${port}/api/emails/health`);
  logger.log(`[POLICY]  Zero-Fallback Policy Active: Strict DTO & Template Enforced`);
  logger.log(`[STATUS]  Service Status: Online & Operational`);
  logger.log(`================================================================`);
}
bootstrap();
