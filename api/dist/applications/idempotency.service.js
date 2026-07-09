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
exports.IdempotencyService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const TTL_SECONDS = 86_400;
let IdempotencyService = class IdempotencyService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async getExistingApplicationId(userId, key) {
        return this.redis.client.get(this.redisKey(userId, key));
    }
    async bind(userId, key, applicationId) {
        await this.redis.client.setex(this.redisKey(userId, key), TTL_SECONDS, applicationId);
    }
    redisKey(userId, key) {
        return `idempotency:${userId}:${key}`;
    }
};
exports.IdempotencyService = IdempotencyService;
exports.IdempotencyService = IdempotencyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], IdempotencyService);
//# sourceMappingURL=idempotency.service.js.map