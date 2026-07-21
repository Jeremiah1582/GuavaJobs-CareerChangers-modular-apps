import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { AppError } from '../../shared/schemas/error.schema';

const MINUTE_LIMIT = 25;
const DAY_LIMIT = 250;

@Injectable()
export class AdzunaRateLimitService {
  private readonly logger = new Logger(AdzunaRateLimitService.name);

  constructor(private readonly redis: RedisService) {}

  async checkAndIncrement(): Promise<void> {
    const now = new Date();
    const minuteKey = `adzuna:rate:minute:${formatMinute(now)}`;
    const dayKey = `adzuna:rate:day:${formatDay(now)}`;

    const minuteCount = await this.redis.runCommand(async (client) => {
      const count = await client.incr(minuteKey);
      if (count === 1) {
        await client.expire(minuteKey, 120);
      }
      return count;
    });

    if (minuteCount === null) {
      this.logger.warn(
        'Redis unavailable — skipping Adzuna rate limit (start Redis for production limits)',
      );
      return;
    }

    const dayCount = await this.redis.runCommand(async (client) => {
      const count = await client.incr(dayKey);
      if (count === 1) {
        await client.expire(dayKey, 86_400);
      }
      return count;
    });

    if (dayCount === null) {
      return;
    }

    if (minuteCount > MINUTE_LIMIT) {
      throw new AppError(
        'RATE_LIMIT_EXCEEDED',
        'Adzuna rate limit exceeded (per minute). Try again shortly.',
        429,
      );
    }

    if (dayCount > DAY_LIMIT) {
      throw new AppError(
        'RATE_LIMIT_EXCEEDED',
        'Adzuna daily rate limit exceeded. Try again tomorrow.',
        429,
      );
    }
  }
}

function formatMinute(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

function formatDay(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
