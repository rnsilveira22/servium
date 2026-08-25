import { Injectable } from '@nestjs/common';
import { getCorrelationId } from './request-context';

type Level = 'log' | 'error' | 'warn' | 'debug';

interface LogEntry {
  timestamp: string;
  level: Level;
  message: string;
  correlationId?: string;
  context?: string;
  [key: string]: unknown;
}

@Injectable()
export class StructuredLogger {
  private write(level: Level, message: string, context?: string, extra?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: getCorrelationId(),
      ...extra,
    };
    if (context) entry.context = context;
    const line = JSON.stringify(entry);
    if (level === 'error') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }

  log(message: string, context?: string, extra?: Record<string, unknown>): void {
    this.write('log', message, context, extra);
  }

  error(message: string, context?: string, extra?: Record<string, unknown>): void {
    this.write('error', message, context, extra);
  }

  warn(message: string, context?: string, extra?: Record<string, unknown>): void {
    this.write('warn', message, context, extra);
  }

  debug(message: string, context?: string, extra?: Record<string, unknown>): void {
    this.write('debug', message, context, extra);
  }
}
