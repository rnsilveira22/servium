import { Module } from '@nestjs/common';

import { AuditoriaController } from './auditoria.controller';

@Module({
  controllers: [AuditoriaController],
})
export class AuditoriaModule {}