import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Client } from 'pg';
import { APP_URL } from '@servium-ia/db';
import { getCounts } from './metrics.service';
import { coletarMetricasNegocio, type MetricasNegocio } from './metrics-negocio.service';
import { RequireAuth, Roles, type AuthedRequest } from '../auth/auth.guard';

@Controller('health')
export class HealthController {
  @Get()
  async check(): Promise<{ status: string; db: boolean; timestamp: string }> {
    let db = false;
    const client = new Client({ connectionString: APP_URL });
    try {
      await client.connect();
      await client.query('SELECT 1');
      db = true;
    } catch {
      db = false;
    } finally {
      void client.end();
    }
    return { status: 'ok', db, timestamp: new Date().toISOString() };
  }
}

@Controller()
export class MetricsController {
  @Get('metrics')
  getMetrics(): Record<string, number> {
    return getCounts();
  }

  /** B-5 (criterio 9): métricas mínimas de negócio, RLS-contextual (admin-only). */
  @UseGuards(RequireAuth)
  @Roles('admin')
  @Get('metrics/negocio')
  async getMetricsNegocio(@Req() req: AuthedRequest): Promise<MetricasNegocio> {
    // req.pg é encerrado pelo RequireAuth junto com a resposta.
    return coletarMetricasNegocio(req.pg as Client);
  }
}
