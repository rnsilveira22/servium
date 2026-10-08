import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { INestApplication } from '@nestjs/common';
import { CorrelationIdMiddleware } from './common/correlation-id.middleware';
import { securityHeaders, corsOriginsRaw } from './common/security-headers.middleware';
import { LoginRateLimitInterceptor } from './auth/login-rate-limit.interceptor';

export function buildApp(logger = false): Promise<INestApplication> {
  // Retorno assíncrono para injetar middlewares após a criação do app
  // (ordem: CORS → correlation-id → security headers → interceptors).
  return NestFactory.create(AppModule, {
    logger: logger ? ['log', 'error', 'warn'] : false,
  }).then((app) => {
    const allowedOrigins = corsOriginsRaw();

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });

    app.enableShutdownHooks();
    app.use(new CorrelationIdMiddleware().use);
    app.use(
      securityHeaders({
        origins: allowedOrigins,
        isProduction: process.env.NODE_ENV === 'production',
      })
    );
    // Estado in-memory por instância (single-instance): criado aqui para ser
    // isolado por app em testes e reaproveitado pelo processo principal.
    app.useGlobalInterceptors(new LoginRateLimitInterceptor());

    return app;
  });
}
