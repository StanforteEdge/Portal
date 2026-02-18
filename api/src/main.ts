import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  });

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
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const authWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const loginLimit = Number(process.env.AUTH_LOGIN_RATE_LIMIT_MAX || 10);
  const forgotLimit = Number(process.env.AUTH_FORGOT_RATE_LIMIT_MAX || 5);
  const inviteLimit = Number(process.env.AUTH_INVITE_ACCEPT_RATE_LIMIT_MAX || 10);
  app.use('/v1/auth/login', rateLimit({ windowMs: authWindowMs, max: loginLimit, standardHeaders: true, legacyHeaders: false }));
  app.use('/v1/auth/forgot-password', rateLimit({ windowMs: authWindowMs, max: forgotLimit, standardHeaders: true, legacyHeaders: false }));
  app.use('/v1/auth/accept-invite', rateLimit({ windowMs: authWindowMs, max: inviteLimit, standardHeaders: true, legacyHeaders: false }));

  const jwtSecret = process.env.JWT_SECRET || '';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || '';
  if (process.env.NODE_ENV === 'production') {
    if (!jwtSecret || !refreshSecret || jwtSecret === 'change-me' || refreshSecret === 'change-me-too') {
      throw new Error('JWT secrets must be set to non-default values in production');
    }
  }

  // Permanent JSON-level BigInt handling for all API responses.
  app.getHttpAdapter().getInstance().set('json replacer', (_key: string, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}

bootstrap();
