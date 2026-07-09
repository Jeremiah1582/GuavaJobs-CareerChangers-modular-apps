import { RedisService } from '../../redis/redis.service';
import { JobSearchResponse, UnifiedJob } from '../../shared/schemas/job.schema';
export declare class JobCacheService {
    private readonly redis;
    constructor(redis: RedisService);
    getJob(canonicalKey: string): Promise<UnifiedJob | null>;
    setJob(job: UnifiedJob): Promise<void>;
    getSearch(cacheKey: string): Promise<JobSearchResponse | null>;
    setSearch(cacheKey: string, response: JobSearchResponse): Promise<void>;
    buildSearchCacheKey(params: Record<string, string | number | undefined>): string;
    private jobKey;
    private searchKey;
}
