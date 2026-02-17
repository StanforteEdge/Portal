import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('v1');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('StanforteEdge Portal API')
    .setDescription('Backend API documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
        description: 'Paste JWT access token'
      },
      'bearer'
    )
    .addSecurityRequirements('bearer')
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDoc, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: {
      persistAuthorization: true
    }
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  // Permanent JSON-level BigInt handling for all API responses.
  app.getHttpAdapter().getInstance().set('json replacer', (_key: string, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}

bootstrap();
