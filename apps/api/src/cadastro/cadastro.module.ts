import { Module } from '@nestjs/common';

import { CadastroController } from './cadastro.controller';

@Module({
  controllers: [CadastroController],
})
export class CadastroModule {}
