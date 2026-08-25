import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { requestContext } from './request-context';

const HEADER = 'x-request-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const id = (req.headers[HEADER] as string | undefined) ?? randomUUID();
    req.headers[HEADER] = id;
    res.setHeader(HEADER, id);
    requestContext.run({ correlationId: id }, () => next());
  }
}
