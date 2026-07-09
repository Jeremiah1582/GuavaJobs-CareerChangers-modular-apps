import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

const TTL_SECONDS = 86_400;

@Injectable()
export class IdempotencyService {
  constructor(private readonly redis: RedisService) {}

  async getExistingApplicationId(
    userId: string,
    key: string,
  ): Promise<string | null> {
    return this.redis.client.get(this.redisKey(userId, key));
  }

  async bind(userId: string, key: string, applicationId: string): Promise<void> {
    await this.redis.client.setex(
      this.redisKey(userId, key),
      TTL_SECONDS,
      applicationId,
    );
  }

  private redisKey(userId: string, key: string): string {
    return `idempotency:${userId}:${key}`;
  }
}
