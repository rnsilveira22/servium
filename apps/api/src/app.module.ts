import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { CadastroModule } from './cadastro/cadastro.module';
import { AuthController } from './auth/auth.controller';
import { RequireAuth } from './auth/auth.guard';

@Module({
  imports: [CadastroModule],
  controllers: [AppController, AuthController],
  providers: [RequireAuth],
})
export class AppModule {}
