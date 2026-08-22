# [SIMULAÇÃO] História SRV-D001 — Exportar pendências em CSV

> **História FICTÍCIA e DESCARTÁVEL**, criada exclusivamente para o Dry Run da Software Factory V1 (`DRY_RUN_REPORT.md`). NÃO representa requisito real do MVP e NÃO deve ser implementada.

## Épico

`EPIC-SIM — Validação do processo (não existe no backlog real)`

## User Story

**Como** usuário de escritório contábil (simulado), **quero** exportar a lista de pendências em CSV, **para** arquivar o controle mensal externamente.

## Contexto

Simulação para validar contratos PO→Senior→Dev→QA→PO. Sem ligação com `MVP_SCOPE.md`.

## Problema

Nenhum — história sintética.

## Objetivo

Exercitar o fluxo completo de handoffs sem desenvolver feature real.

## Regras de negócio

- RN-01 (simulada): export contém apenas itens do ciclo ativo.

## Critérios de aceite

- CA-01: Dado um ciclo com 3 pendências abertas, quando solicito exportação, então recebo CSV com cabeçalho + 3 linhas.
- CA-02: Dado um ciclo sem pendências, quando solicito exportação, então recebo arquivo válido apenas com cabeçalho.

## Dependências / Restrições

- Nenhuma (simulação).

## Prioridade

`P3 - Low` (simulação)

## Status final

`DONE` (simulado em `DRY_RUN_REPORT.md`)
