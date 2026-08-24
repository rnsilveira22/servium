import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthController } from './auth/auth.controller';
import { RequireAuth } from './auth/auth.guard';

@Module({
  controllers: [AppController, AuthController],
  providers: [RequireAuth],
})
export class AppModule {}
