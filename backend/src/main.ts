import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rifle Barrel MES API')
    .setDescription('Manufacturing Execution System API for rifle barrel production')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('barrels', 'Barrel management endpoints')
    .addTag('stations', 'Station management endpoints')
    .addTag('auth', 'Authentication endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3001);
  await app.listen(port);
  
  console.log(`🚀 MES Backend running on: http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
