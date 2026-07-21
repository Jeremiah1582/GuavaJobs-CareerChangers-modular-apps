import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import {
  JobSearchResponse,
  UnifiedJob,
} from '../../shared/schemas/job.schema';
import { ensurePlainJobDescription } from '../ats/strip-html.util';

const JOB_DETAIL_TTL_SECONDS = 30 * 60;
/** Curated ATS postings refreshed on sync; keep longer between runs. */
const CURATED_JOB_TTL_SECONDS = 12 * 60 * 60;
const SEARCH_TTL_SECONDS = 15 * 60;

const CURATED_KEYS_SET = 'jobs:curated:keys';
const CURATED_VERSION_KEY = 'jobs:curated:version';

@Injectable()
export class JobCacheService {
  constructor(private readonly redis: RedisService) {}

  async getJob(canonicalKey: string): Promise<UnifiedJob | null> {
    const raw = await this.redis.runCommand((client) =>
      client.get(this.jobKey(canonicalKey)),
    );
    if (!raw) {
      return null;
    }
    return sanitizeCachedJob(JSON.parse(raw) as UnifiedJob);
  }

  async setJob(
    job: UnifiedJob,
    options?: { ttlSeconds?: number },
  ): Promise<void> {
    const ttl = options?.ttlSeconds ?? JOB_DETAIL_TTL_SECONDS;
    await this.redis.runCommand((client) =>
      client.setex(this.jobKey(job.canonicalKey), ttl, JSON.stringify(job)),
    );
  }

  async getSearch(cacheKey: string): Promise<JobSearchResponse | null> {
    const raw = await this.redis.runCommand((client) =>
      client.get(this.searchKey(cacheKey)),
    );
    if (!raw) {
      return null;
    }
    return sanitizeCachedSearch(JSON.parse(raw) as JobSearchResponse);
  }

  async setSearch(cacheKey: string, response: JobSearchResponse): Promise<void> {
    await this.redis.runCommand((client) =>
      client.setex(
        this.searchKey(cacheKey),
        SEARCH_TTL_SECONDS,
        JSON.stringify(response),
      ),
    );
  }

  buildSearchCacheKey(params: Record<string, string | number | undefined>): string {
    const normalized = JSON.stringify(params);
    return createHash('sha256').update(normalized).digest('hex');
  }

  async getCuratedVersion(): Promise<number> {
    const raw = await this.redis.runCommand((client) =>
      client.get(CURATED_VERSION_KEY),
    );
    if (!raw) {
      return 0;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  async bumpCuratedVersion(): Promise<number> {
    const next = await this.redis.runCommand((client) =>
      client.incr(CURATED_VERSION_KEY),
    );
    return next ?? 0;
  }

  async countCuratedKeys(): Promise<number> {
    const n = await this.redis.runCommand((client) =>
      client.scard(CURATED_KEYS_SET),
    );
    return n ?? 0;
  }

  async getCuratedJobs(): Promise<UnifiedJob[]> {
    const keys = await this.redis.runCommand((client) =>
      client.smembers(CURATED_KEYS_SET),
    );
    if (!keys?.length) {
      return [];
    }

    const jobs: UnifiedJob[] = [];
    for (const key of keys) {
      const job = await this.getJob(key);
      if (job) {
        jobs.push(job);
      }
    }
    return jobs;
  }

  /**
   * Replace all curated membership for one board: remove stale keys, write
   * current postings with curated TTL, update global curated key set.
   */
  async replaceBoardJobs(
    atsType: string,
    board: string,
    jobs: UnifiedJob[],
  ): Promise<{ added: number; removed: number }> {
    const boardSetKey = this.boardKeysSet(atsType, board);
    const previous =
      (await this.redis.runCommand((client) =>
        client.smembers(boardSetKey),
      )) ?? [];
    const nextKeys = jobs.map((j) => j.canonicalKey.toLowerCase());
    const nextSet = new Set(nextKeys);
    const stale = previous.filter((k) => !nextSet.has(k.toLowerCase()));

    for (const job of jobs) {
      await this.setJob(job, { ttlSeconds: CURATED_JOB_TTL_SECONDS });
    }

    await this.redis.runCommand(async (client) => {
      const multi = client.multi();
      if (stale.length) {
        multi.srem(CURATED_KEYS_SET, ...stale);
        for (const key of stale) {
          multi.del(this.jobKey(key));
        }
      }
      multi.del(boardSetKey);
      if (nextKeys.length) {
        multi.sadd(boardSetKey, ...nextKeys);
        multi.sadd(CURATED_KEYS_SET, ...nextKeys);
      }
      await multi.exec();
    });

    return { added: nextKeys.length, removed: stale.length };
  }

  private boardKeysSet(atsType: string, board: string): string {
    return `jobs:curated:boards:${atsType.toLowerCase()}:${board.toLowerCase()}`;
  }

  private jobKey(canonicalKey: string): string {
    return `jobs:detail:${canonicalKey.toLowerCase()}`;
  }

  private searchKey(hash: string): string {
    return `jobs:search:${hash}`;
  }
}

function sanitizeCachedJob(job: UnifiedJob): UnifiedJob {
  const description = ensurePlainJobDescription(job.description ?? '');
  if (description === (job.description ?? '')) {
    return job;
  }
  return {
    ...job,
    description,
    snippet: description.slice(0, 280) || job.snippet,
    hasFullDescription:
      description.length > 100 ? true : job.hasFullDescription,
  };
}

function sanitizeCachedSearch(response: JobSearchResponse): JobSearchResponse {
  return {
    ...response,
    results: response.results.map((item) => {
      const snippet = ensurePlainJobDescription(item.snippet ?? '');
      if (snippet === (item.snippet ?? '')) {
        return item;
      }
      return {
        ...item,
        snippet: snippet.slice(0, 280),
        hasFullDescription:
          snippet.length > 100 ? true : item.hasFullDescription,
      };
    }),
  };
}
