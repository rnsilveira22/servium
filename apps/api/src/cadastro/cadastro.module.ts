import { Module } from '@nestjs/common';

import { AgentesController } from './agentes.controller';
import { AtividadesController } from './atividades.controller';
import { CadastroController } from './cadastro.controller';
import { CiclosController } from './ciclos.controller';
import { ConfiguracoesController } from './configuracoes.controller';
import { EmailTemplatesController } from './email-templates.controller';

@Module({
  controllers: [
    CadastroController,
    CiclosController,
    ConfiguracoesController,
    EmailTemplatesController,
    AtividadesController,
    AgentesController,
  ],
})
export class CadastroModule {}
