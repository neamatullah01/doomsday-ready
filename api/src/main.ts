import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors();

  // Configure global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  // Configure consistent error handling filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configure Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Doomsday Ready API')
    .setDescription(
      'Full-Stack Developer Assessment API: MCU Movie Planning (prerequisites, graph traversal, cycle protection) & Watch-Party Booking Calculation (minimum-bundle dynamic programming).',
    )
    .setVersion('1.0')
    .addTag('Movies', 'Manage MCU movies, watch status, and prerequisite relations')
    .addTag('Cinemas', 'Manage cinemas and available seat-bundle configurations')
    .addTag('Health', 'API health and status check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Doomsday Ready API Docs',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
