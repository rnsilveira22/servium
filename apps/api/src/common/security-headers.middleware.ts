/**
 * P1-3 · Security headers + ORIGIN check (defesa CSRF "conforme arquitetura").
 *
 * - Headers de segurança (ASVS V4 + G-01/G-03): a API responde JSON; o CSP
 *   restritivo `default-src 'none'` é aplicável ao corpo de resposta.
 * - HSTS (G-07, V4.2) apenas em produção (exige TLS terminado no proxy).
 * - ORIGIN check: para métodos com efeito colateral, se um `Origin`/`Referer`
 *   cross-site for enviado, a requisição é rejeitada (403). A base primária de
 *   mitigação de CSRF segue sendo o cookie `SameSite=Lax` + HttpOnly
 *   (auth.controller.ts) — este é defense-in-depth contra drift de origem.
 */
import type { NextFunction, Request, Response } from 'express';

const METODOS_MUTAVEIS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface SecurityHeadersOptions {
  origins: string[];
  isProduction: boolean;
}

export function corsOriginsRaw(): string[] {
  return (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function origemPermitida(origin: string | undefined, origins: string[]): boolean {
  if (!origin) return true;
  return origins.includes(origin);
}

export function securityHeaders(options: SecurityHeadersOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader("Permissions-Policy", 'camera=(), geolocation=(), microphone=(), interest-cohort=()');
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    if (options.isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (METODOS_MUTAVEIS.has(req.method) && !origemPermitida(req.headers.origin, options.origins)) {
      res.status(403).json({ erro: 'origem não autorizada' });
      return;
    }
    next();
  };
}