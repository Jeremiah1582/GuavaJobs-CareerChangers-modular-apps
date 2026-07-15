import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const incoming = req.headers['x-request-id'];
    const requestId =
      typeof incoming === 'string' && incoming.trim().length > 0
        ? incoming.trim().slice(0, 128)
        : randomUUID();

    res.setHeader('X-Request-Id', requestId);
    const started = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const path = req.originalUrl ?? req.url;
        this.logger.log(
          JSON.stringify({
            requestId,
            method: req.method,
            path,
            status: res.statusCode,
            ms: Date.now() - started,
          }),
        );
      }),
    );
  }
}
