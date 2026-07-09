import { RedisService } from '../../redis/redis.service';
export declare class AdzunaRateLimitService {
    private readonly redis;
    constructor(redis: RedisService);
    checkAndIncrement(): Promise<void>;
}
