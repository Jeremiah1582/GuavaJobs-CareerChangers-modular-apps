import { RedisService } from '../redis/redis.service';
export declare class IdempotencyService {
    private readonly redis;
    constructor(redis: RedisService);
    getExistingApplicationId(userId: string, key: string): Promise<string | null>;
    bind(userId: string, key: string, applicationId: string): Promise<void>;
    private redisKey;
}
