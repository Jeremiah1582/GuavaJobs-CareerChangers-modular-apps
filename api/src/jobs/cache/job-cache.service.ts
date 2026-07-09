import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import {
  JobSearchResponse,
  UnifiedJob,
} from '../../shared/schemas/job.schema';

const JOB_DETAIL_TTL_SECONDS = 30 * 60;
const SEARCH_TTL_SECONDS = 15 * 60;

@Injectable()
export class JobCacheService {
  constructor(private readonly redis: RedisService) {}

  async getJob(canonicalKey: string): Promise<UnifiedJob | null> {
    const raw = await this.redis.client.get(this.jobKey(canonicalKey));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as UnifiedJob;
  }

  async setJob(job: UnifiedJob): Promise<void> {
    await this.redis.client.setex(
      this.jobKey(job.canonicalKey),
      JOB_DETAIL_TTL_SECONDS,
      JSON.stringify(job),
    );
  }

  async getSearch(cacheKey: string): Promise<JobSearchResponse | null> {
    const raw = await this.redis.client.get(this.searchKey(cacheKey));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as JobSearchResponse;
  }

  async setSearch(cacheKey: string, response: JobSearchResponse): Promise<void> {
    await this.redis.client.setex(
      this.searchKey(cacheKey),
      SEARCH_TTL_SECONDS,
      JSON.stringify(response),
    );
  }

  buildSearchCacheKey(params: Record<string, string | number | undefined>): string {
    const normalized = JSON.stringify(params);
    return createHash('sha256').update(normalized).digest('hex');
  }

  private jobKey(canonicalKey: string): string {
    return `jobs:detail:${canonicalKey.toLowerCase()}`;
  }

  private searchKey(hash: string): string {
    return `jobs:search:${hash}`;
  }
}
