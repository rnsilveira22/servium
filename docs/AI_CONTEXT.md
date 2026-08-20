# Contexto para Agentes de IA — ServiumAI

> Este documento orienta agentes de IA (e novos colaboradores) que trabalhem neste repositório. Leia-o integralmente antes de qualquer alteração.

## Projeto

**ServiumAI** — plataforma B2B de funcionários digitais especializados.

## Missão

Permitir que empresas mantenham uma força de trabalho digital organizada: funcionários digitais com função, permissões, limites e supervisão humana, executando atividades operacionais e rotineiras.

## Mercado inicial

Escritórios de contabilidade brasileiros. **Vertical inicial, não limitação estrutural** — a arquitetura não deve acoplar a plataforma ao setor contábil.

## Estado atual

**Fundação / Pré-MVP.** Não há stack definida, não há código de produto, não há funcionalidades implementadas. O repositório contém documentação de fundação e governança.

## Fonte da verdade

O próprio repositório `rnsilveira22/servium`. Materiais antigos no ambiente local **não** fazem parte deste projeto e não devem ser considerados como referência.

## Regras para agentes

Todo agente deve:

1. ler [`README.md`](../README.md);
2. ler [`PROJECT_INDEX.md`](PROJECT_INDEX.md);
3. ler este arquivo (`AI_CONTEXT.md`);
4. verificar ADRs existentes em [`decisions/`](decisions/README.md);
5. verificar o estado atual do Git antes de alterar qualquer coisa;
6. não assumir requisitos inexistentes;
7. não inventar decisões arquiteturais;
8. preservar compatibilidade com decisões aceitas;
9. executar testes relevantes antes de concluir tarefas (quando houver testes definidos);
10. documentar decisões importantes em ADRs;
11. informar arquivos alterados;
12. informar testes executados;
13. informar riscos ou pendências;
14. nunca inserir credenciais no repositório.

## Anti-alucinação de projeto

Um agente **não deve assumir como existentes** — nem em documentação, código ou discussão:

- APIs;
- bancos de dados;
- filas;
- provedores de IA;
- provedores de cloud;
- frameworks;
- serviços;
- funcionalidades;
- requisitos;
- integrações;

que não estejam **documentados neste repositório ou efetivamente implementados**.

Se um agente precisar de uma dessas premissas para propor algo, deve registrá-la explicitamente como hipótese ou proposta (por exemplo, em ADR com status `Proposed`), nunca como fato.

## Documentos de referência obrigatórios

| Documento | Uso |
|---|---|
| [`../README.md`](../README.md) | Porta de entrada do projeto |
| [`PROJECT_VISION.md`](PROJECT_VISION.md) | Visão, problema e hipóteses |
| [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) | Princípios que restringem decisões |
| [`GLOSSARY.md`](GLOSSARY.md) | Terminologia oficial |
| [`PROJECT_INDEX.md`](PROJECT_INDEX.md) | Mapa da documentação |
