import { Module } from '@nestjs/common';

import { CadastroController } from './cadastro.controller';
import { CiclosController } from './ciclos.controller';

@Module({
  controllers: [CadastroController, CiclosController],
})
export class CadastroModule {}
