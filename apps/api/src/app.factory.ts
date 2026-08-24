import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { INestApplication } from '@nestjs/common';

/** Factory usada pelo bootstrap e pelos testes de integração. */
export async function buildApp(logger = false): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { logger: logger ? ['log', 'error', 'warn'] : false });
  app.enableShutdownHooks();
  return app;
}
