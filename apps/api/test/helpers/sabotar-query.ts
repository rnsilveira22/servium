/**
 * Injeção de falha em testes de integração (PRM-P0.2-B, CA-03-1..4).
 *
 * Wrapper no `client.query` da conexão real: cada instrução continua executando
 * no Postgres de verdade, exceto quando casa com `alvoSql` (regex sobre o texto
 * da instrução) — nesse caso lança após o disparo. Sem `vi.spyOn` puro (que não
 * chamaria o Postgres real), sem constraint/trigger forjada, sem SQL inválido.
 */
import type { QueryResult } from 'pg';
import type pg from 'pg';

export interface Sabotagem {
  desfazer: () => void;
  readonly disparos: number;
}

export function sabotarQuery(
  client: pg.Client,
  alvoSql: RegExp,
  erro: Error = new Error('sabotagem: falha injetada')
): Sabotagem {
  const original = client.query.bind(client);
  let ativo = true;
  let disparos = 0;

  const wrap = (
    queryTextOrConfig: string | pg.QueryConfig,
    values?: readonly unknown[]
  ): Promise<QueryResult> => {
    const sql = typeof queryTextOrConfig === 'string' ? queryTextOrConfig : queryTextOrConfig.text;
    if (ativo && sql !== undefined && alvoSql.test(sql)) {
      disparos++;
      return Promise.reject(erro);
    }
    const resultado =
      values === undefined
        ? original(queryTextOrConfig)
        : original(queryTextOrConfig, values as never[]);
    return resultado as Promise<QueryResult>;
  };

  client.query = wrap as unknown as typeof client.query;

  return {
    desfazer: () => {
      ativo = false;
      client.query = original;
    },
    get disparos() {
      return disparos;
    },
  };
}