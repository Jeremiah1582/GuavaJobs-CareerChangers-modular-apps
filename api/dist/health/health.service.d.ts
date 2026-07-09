import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
type QueueStats = {
    waiting: number;
    active: number;
};
export type HealthCheckResult = {
    status: 'ok' | 'degraded' | 'error';
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
    latencyMs: number;
    databaseLatencyMs?: number;
    redisLatencyMs?: number;
    queues?: {
        cvParse: QueueStats;
        aiGeneration: QueueStats;
    };
};
export declare class HealthService {
    private readonly prisma;
    private readonly redis;
    private readonly cvParseQueue;
    private readonly aiQueue;
    constructor(prisma: PrismaService, redis: RedisService, cvParseQueue: Queue, aiQueue: Queue);
    check(): Promise<{
        result: HealthCheckResult;
        httpStatus: number;
    }>;
}
export {};
