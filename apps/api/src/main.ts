import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  const allowedOrigins = process.env.ALLOWED_ORIGINS || '';
  app.enableCors({
    origin: allowedOrigins ? allowedOrigins.split(',').map(s => s.trim()).filter(Boolean) : true,
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  const uploadDir = process.env.UPLOAD_DIR
    ? resolve(process.env.UPLOAD_DIR)
    : resolve(process.cwd(), '../../uploads');
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.API_PORT || 4000;

  const swaggerEnabled = process.env.NODE_ENV === 'production'
    ? process.env.ENABLE_SWAGGER === 'true'
    : process.env.ENABLE_SWAGGER !== 'false';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Banco Ricco API')
      .setDescription('Banco Ricco Digital Platform API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log(`Swagger docs enabled at /api/docs`);
  }

  await app.listen(port);
  console.log(`Banco Ricco API running on port ${port} with /api prefix`);
}

bootstrap();
