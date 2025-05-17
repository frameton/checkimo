import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // retire les propriétés non déclarées dans les DTO
      transform: true, // applique les décorateurs @Transform et convertit les types
    }),
  );

  await app.listen(3000);
}
bootstrap();