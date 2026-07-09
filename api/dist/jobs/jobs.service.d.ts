import { AdzunaClient } from './adzuna/adzuna.client';
import { AdzunaRateLimitService } from './adzuna/adzuna-rate-limit.service';
import { AtsEnrichmentService } from './ats/ats-enrichment.service';
import { AtsResolverService } from './ats/ats-resolver.service';
import { JobCacheService } from './cache/job-cache.service';
import { JobSearchQuery, JobSearchResponse, UnifiedJob } from '../shared/schemas/job.schema';
export declare class JobsService {
    private readonly adzuna;
    private readonly rateLimit;
    private readonly cache;
    private readonly resolver;
    private readonly enrichment;
    private readonly logger;
    constructor(adzuna: AdzunaClient, rateLimit: AdzunaRateLimitService, cache: JobCacheService, resolver: AtsResolverService, enrichment: AtsEnrichmentService);
    search(query: JobSearchQuery): Promise<JobSearchResponse>;
    getByCanonicalKey(rawKey: string, options?: {
        expandAts?: boolean;
    }): Promise<UnifiedJob>;
    private tryExpandWithAts;
    private listingToItem;
    private cacheAdzunaListing;
    private enrichListItems;
    private toListItem;
}
