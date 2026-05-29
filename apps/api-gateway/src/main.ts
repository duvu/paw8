import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '../../../libs/common/src/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix with versioning
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter with i18n support
  const i18nService = app.get<I18nService>(I18nService);
  app.useGlobalFilters(new AllExceptionsFilter(i18nService));

  // CORS for local dev
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  });

  const port = process.env.APP_PORT ?? 3000;
  await app.listen(port);
  console.log(`API Gateway running on http://localhost:${port}/api/v1`);
}
bootstrap();
