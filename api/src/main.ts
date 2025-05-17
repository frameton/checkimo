import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiSuccessInterceptor } from './interceptors/api-success.interceptor';
import { ApiExceptionFilter } from './interceptors/api-exception.filter';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // 1. Interceptor pour envelopper les réponses « succès »
  app.useGlobalInterceptors(new ApiSuccessInterceptor());

  // 2. Filter pour gérer les erreurs homogènes
  app.useGlobalFilters(new ApiExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // retire les propriétés non déclarées dans les DTO
      transform: true, // applique les décorateurs @Transform et convertit les types
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Checkimo API')
    .setDescription('Documentation Swagger pour l’API Checkimo')
    .setVersion('1.0')
    .addBearerAuth() // Pour Authorization: Bearer <token>
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();