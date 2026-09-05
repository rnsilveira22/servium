import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { CadastroModule } from './cadastro/cadastro.module';
import { EmailModule } from './email/email.module';
import { AuthController } from './auth/auth.controller';
import { RequireAuth } from './auth/auth.guard';
import { HealthController, MetricsController } from './common/health.controller';
import { MetricsInterceptor } from './common/metrics.interceptor';

@Module({
  imports: [CadastroModule, EmailModule, AuditoriaModule],
  controllers: [AppController, AuthController, HealthController, MetricsController],
  providers: [
    RequireAuth,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
