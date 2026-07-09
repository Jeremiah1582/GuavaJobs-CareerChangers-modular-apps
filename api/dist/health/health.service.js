"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_constants_1 = require("../queue/queue.constants");
const redis_service_1 = require("../redis/redis.service");
let HealthService = class HealthService {
    prisma;
    redis;
    cvParseQueue;
    aiQueue;
    constructor(prisma, redis, cvParseQueue, aiQueue) {
        this.prisma = prisma;
        this.redis = redis;
        this.cvParseQueue = cvParseQueue;
        this.aiQueue = aiQueue;
    }
    async check() {
        const started = Date.now();
        let database = 'disconnected';
        let redis = 'disconnected';
        let databaseLatencyMs;
        let redisLatencyMs;
        try {
            const dbStart = Date.now();
            await this.prisma.$queryRaw `SELECT 1`;
            databaseLatencyMs = Date.now() - dbStart;
            database = 'connected';
        }
        catch {
            database = 'disconnected';
        }
        try {
            const redisStart = Date.now();
            const pong = await this.redis.client.ping();
            redisLatencyMs = Date.now() - redisStart;
            redis = pong === 'PONG' ? 'connected' : 'disconnected';
        }
        catch {
            redis = 'disconnected';
        }
        const [cvWaiting, cvActive, aiWaiting, aiActive] = await Promise.all([
            this.cvParseQueue.getWaitingCount(),
            this.cvParseQueue.getActiveCount(),
            this.aiQueue.getWaitingCount(),
            this.aiQueue.getActiveCount(),
        ]);
        const latencyMs = Date.now() - started;
        let status = 'ok';
        if (database === 'disconnected') {
            status = 'error';
        }
        else if (redis === 'disconnected') {
            status = 'degraded';
        }
        const result = {
            status,
            database,
            redis,
            latencyMs,
            databaseLatencyMs,
            redisLatencyMs,
            queues: {
                cvParse: { waiting: cvWaiting, active: cvActive },
                aiGeneration: { waiting: aiWaiting, active: aiActive },
            },
        };
        const httpStatus = database === 'disconnected' ? 503 : 200;
        return { result, httpStatus };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)(queue_constants_1.CV_PARSE_QUEUE)),
    __param(3, (0, bullmq_1.InjectQueue)(queue_constants_1.AI_GENERATION_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_2.Queue,
        bullmq_2.Queue])
], HealthService);
//# sourceMappingURL=health.service.js.map