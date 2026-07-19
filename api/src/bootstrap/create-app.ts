import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { EnvConfig } from '../config/env.validation';

function isAllowedWebOrigin(
  origin: string,
  configured: string | undefined,
): boolean {
  const allowed = new Set(
    [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      configured,
    ].filter((v): v is string => Boolean(v && v.trim())),
  );

  if (allowed.has(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.vercel.app')) {
      return true;
    }
    // Local LAN access (phone / other device hitting Next via private IP)
    const localHost =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(url.hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(url.hostname);
    const localPort =
      url.port === '3000' ||
      url.port === '3001' ||
      url.port === '3002' ||
      url.port === '';
    return localHost && localPort;
  } catch {
    return false;
  }
}

export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvConfig, true>);
  const webOrigin = config.get('WEB_ORIGIN', { infer: true });
  const logger = new Logger('CORS');

  // Disable Express ETags so GET /applications/:id never returns empty 304s
  // through the Next.js rewrite proxy (breaks JSON clients / CV polling).
  const http = app.getHttpAdapter().getInstance() as {
    set?: (key: string, value: unknown) => void;
    use?: (
      handler: (
        req: unknown,
        res: { setHeader: (k: string, v: string) => void },
        next: () => void,
      ) => void,
    ) => void;
  };
  http.set?.('etag', false);
  http.use?.((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    next();
  });

  app.enableCors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, server-to-server) send no Origin.
      if (!origin) {
        callback(null, true);
        return;
      }
      const ok = isAllowedWebOrigin(origin, webOrigin);
      if (!ok) {
        logger.warn(`Blocked origin: ${origin}`);
      }
      callback(null, ok);
    },
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GuavaJobs API')
    .setDescription('GuavaJobs backend — Phase 5')
    .setVersion('0.5.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  return app;
}
