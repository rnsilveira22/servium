import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from '@nestjs/common';
import { tap } from 'rxjs';
import { increment } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method ?? 'UNKNOWN';
    increment(`request:${method}`);

    return next.handle().pipe(
      tap({
        error: () => {
          increment('errors');
        },
      }),
    );
  }
}
