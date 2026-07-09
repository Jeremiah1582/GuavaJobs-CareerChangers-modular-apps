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
exports.JobCacheService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const redis_service_1 = require("../../redis/redis.service");
const JOB_DETAIL_TTL_SECONDS = 30 * 60;
const SEARCH_TTL_SECONDS = 15 * 60;
let JobCacheService = class JobCacheService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async getJob(canonicalKey) {
        const raw = await this.redis.client.get(this.jobKey(canonicalKey));
        if (!raw) {
            return null;
        }
        return JSON.parse(raw);
    }
    async setJob(job) {
        await this.redis.client.setex(this.jobKey(job.canonicalKey), JOB_DETAIL_TTL_SECONDS, JSON.stringify(job));
    }
    async getSearch(cacheKey) {
        const raw = await this.redis.client.get(this.searchKey(cacheKey));
        if (!raw) {
            return null;
        }
        return JSON.parse(raw);
    }
    async setSearch(cacheKey, response) {
        await this.redis.client.setex(this.searchKey(cacheKey), SEARCH_TTL_SECONDS, JSON.stringify(response));
    }
    buildSearchCacheKey(params) {
        const normalized = JSON.stringify(params);
        return (0, crypto_1.createHash)('sha256').update(normalized).digest('hex');
    }
    jobKey(canonicalKey) {
        return `jobs:detail:${canonicalKey.toLowerCase()}`;
    }
    searchKey(hash) {
        return `jobs:search:${hash}`;
    }
};
exports.JobCacheService = JobCacheService;
exports.JobCacheService = JobCacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], JobCacheService);
//# sourceMappingURL=job-cache.service.js.map