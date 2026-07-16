import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import {
  AI_GENERATION_QUEUE,
  CV_PARSE_QUEUE,
} from '../queue/queue.constants';
import { RedisService } from '../redis/redis.service';

type QueueStats = { waiting: number; active: number };

export type HealthCheckResult = {
  status: 'ok' | 'degraded' | 'error';
  database: 'connected' | 'disconnected';
  schema: 'ready' | 'missing';
  redis: 'connected' | 'disconnected';
  latencyMs: number;
  databaseLatencyMs?: number;
  redisLatencyMs?: number;
  queues?: {
    cvParse: QueueStats;
    aiGeneration: QueueStats;
  };
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue(CV_PARSE_QUEUE) private readonly cvParseQueue: Queue,
    @InjectQueue(AI_GENERATION_QUEUE) private readonly aiQueue: Queue,
  ) {}

  async check(): Promise<{ result: HealthCheckResult; httpStatus: number }> {
    const started = Date.now();
    let database: HealthCheckResult['database'] = 'disconnected';
    let schema: HealthCheckResult['schema'] = 'missing';
    let redis: HealthCheckResult['redis'] = 'disconnected';
    let databaseLatencyMs: number | undefined;
    let redisLatencyMs: number | undefined;

    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      databaseLatencyMs = Date.now() - dbStart;
      database = 'connected';
    } catch {
      database = 'disconnected';
    }

    if (database === 'connected') {
      try {
        await this.prisma.user.findFirst({
          select: { id: true },
        });
        schema = 'ready';
      } catch {
        schema = 'missing';
      }
    }

    try {
      const redisStart = Date.now();
      const pong = await this.redis.client.ping();
      redisLatencyMs = Date.now() - redisStart;
      redis = pong === 'PONG' ? 'connected' : 'disconnected';
    } catch {
      redis = 'disconnected';
    }

    const [cvWaiting, cvActive, aiWaiting, aiActive] = await Promise.all([
      this.cvParseQueue.getWaitingCount(),
      this.cvParseQueue.getActiveCount(),
      this.aiQueue.getWaitingCount(),
      this.aiQueue.getActiveCount(),
    ]);

    const latencyMs = Date.now() - started;
    let status: HealthCheckResult['status'] = 'ok';
    if (database === 'disconnected' || schema === 'missing') {
      status = 'error';
    } else if (redis === 'disconnected') {
      status = 'degraded';
    }

    const result: HealthCheckResult = {
      status,
      database,
      schema,
      redis,
      latencyMs,
      databaseLatencyMs,
      redisLatencyMs,
      queues: {
        cvParse: { waiting: cvWaiting, active: cvActive },
        aiGeneration: { waiting: aiWaiting, active: aiActive },
      },
    };

    const httpStatus =
      database === 'disconnected' || schema === 'missing' ? 503 : 200;
    return { result, httpStatus };
  }
}
