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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdzunaRateLimitService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const error_schema_1 = require("../../shared/schemas/error.schema");
const MINUTE_LIMIT = 25;
const DAY_LIMIT = 250;
let AdzunaRateLimitService = class AdzunaRateLimitService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async checkAndIncrement() {
        const now = new Date();
        const minuteKey = `adzuna:rate:minute:${formatMinute(now)}`;
        const dayKey = `adzuna:rate:day:${formatDay(now)}`;
        const minuteCount = await this.redis.client.incr(minuteKey);
        if (minuteCount === 1) {
            await this.redis.client.expire(minuteKey, 120);
        }
        const dayCount = await this.redis.client.incr(dayKey);
        if (dayCount === 1) {
            await this.redis.client.expire(dayKey, 86_400);
        }
        if (minuteCount > MINUTE_LIMIT) {
            throw new error_schema_1.AppError('RATE_LIMIT_EXCEEDED', 'Adzuna rate limit exceeded (per minute). Try again shortly.', 429);
        }
        if (dayCount > DAY_LIMIT) {
            throw new error_schema_1.AppError('RATE_LIMIT_EXCEEDED', 'Adzuna daily rate limit exceeded. Try again tomorrow.', 429);
        }
    }
};
exports.AdzunaRateLimitService = AdzunaRateLimitService;
exports.AdzunaRateLimitService = AdzunaRateLimitService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], AdzunaRateLimitService);
function formatMinute(d) {
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}
function formatDay(d) {
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}
function pad(n) {
    return n.toString().padStart(2, '0');
}
//# sourceMappingURL=adzuna-rate-limit.service.js.map