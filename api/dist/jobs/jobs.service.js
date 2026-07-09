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
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const adzuna_client_1 = require("./adzuna/adzuna.client");
const adzuna_rate_limit_service_1 = require("./adzuna/adzuna-rate-limit.service");
const ats_enrichment_service_1 = require("./ats/ats-enrichment.service");
const ats_resolver_service_1 = require("./ats/ats-resolver.service");
const canonical_key_util_1 = require("./ats/canonical-key.util");
const job_cache_service_1 = require("./cache/job-cache.service");
const error_schema_1 = require("../shared/schemas/error.schema");
const MAX_ENRICH_PER_SEARCH = 8;
let JobsService = JobsService_1 = class JobsService {
    adzuna;
    rateLimit;
    cache;
    resolver;
    enrichment;
    logger = new common_1.Logger(JobsService_1.name);
    constructor(adzuna, rateLimit, cache, resolver, enrichment) {
        this.adzuna = adzuna;
        this.rateLimit = rateLimit;
        this.cache = cache;
        this.resolver = resolver;
        this.enrichment = enrichment;
    }
    async search(query) {
        if (!this.adzuna.isConfigured()) {
            throw new error_schema_1.AppError('JOBS_NOT_CONFIGURED', 'Adzuna credentials are not configured (ADZUNA_APP_ID + ADZUNA_API_KEY)', 503);
        }
        const country = (query.country ?? 'gb').toLowerCase();
        const cacheKey = this.cache.buildSearchCacheKey({
            q: query.q ?? '',
            location: query.location ?? '',
            country,
            page: query.page,
        });
        const cached = await this.cache.getSearch(cacheKey);
        if (cached) {
            return cached;
        }
        await this.rateLimit.checkAndIncrement();
        const { listings, totalResults } = await this.adzuna.search({
            q: query.q,
            location: query.location,
            country,
            page: query.page,
        });
        const baseItems = await Promise.all(listings.map((listing) => this.listingToItem(listing, country)));
        for (const listing of listings) {
            await this.cacheAdzunaListing(listing, country);
        }
        const enriched = await this.enrichListItems(baseItems.slice(0, MAX_ENRICH_PER_SEARCH));
        const results = baseItems.map((item) => {
            const match = enriched.find((e) => e.canonicalKey === item.canonicalKey ||
                e.applyUrl === item.applyUrl);
            return match ? this.toListItem(match) : item;
        });
        for (const job of enriched) {
            await this.cache.setJob(job);
        }
        const response = {
            results,
            page: query.page,
            totalResults,
            attribution: 'Jobs by Adzuna',
        };
        await this.cache.setSearch(cacheKey, response);
        return response;
    }
    async getByCanonicalKey(rawKey, options) {
        const canonicalKey = decodeURIComponent(rawKey).trim().toLowerCase();
        const cached = await this.cache.getJob(canonicalKey);
        if (cached && !options?.expandAts) {
            return cached;
        }
        const parsed = (0, canonical_key_util_1.parseCanonicalKey)(canonicalKey);
        if (!parsed) {
            throw new error_schema_1.AppError('JOB_NOT_FOUND', 'Invalid job key format', 404);
        }
        if (parsed.atsType === 'adzuna') {
            if (!cached) {
                throw new error_schema_1.AppError('JOB_NOT_FOUND', 'Job not in cache; run search again to refresh Adzuna listings', 404);
            }
            if (options?.expandAts) {
                const enriched = await this.tryExpandWithAts(cached);
                if (enriched) {
                    return enriched;
                }
            }
            return cached;
        }
        if (cached) {
            return cached;
        }
        const job = await this.enrichment.fetchByCanonicalKey(canonicalKey);
        if (!job) {
            throw new error_schema_1.AppError('JOB_NOT_FOUND', 'Job not found or ATS fetch failed', 404);
        }
        await this.cache.setJob(job);
        return job;
    }
    async tryExpandWithAts(cached) {
        const resolved = (cached.applyUrl
            ? await this.resolver.resolveFromRedirect(cached.applyUrl)
            : null) ??
            (cached.description
                ? this.resolver.extractFromText(cached.description)
                : null);
        if (!resolved) {
            return null;
        }
        const atsKey = (0, canonical_key_util_1.buildCanonicalKey)(resolved.atsType, resolved.board, resolved.jobId);
        const existing = await this.cache.getJob(atsKey);
        if (existing) {
            return existing;
        }
        const job = await this.enrichment.fetchByCanonicalKey(atsKey);
        if (!job) {
            return null;
        }
        await this.cache.setJob(job);
        return job;
    }
    async listingToItem(listing, country) {
        const resolved = listing.redirectUrl
            ? (await this.resolver.resolveFromRedirect(listing.redirectUrl)) ??
                this.resolver.extractFromText(listing.description)
            : this.resolver.extractFromText(listing.description);
        const canonicalKey = resolved
            ? (0, canonical_key_util_1.buildCanonicalKey)(resolved.atsType, resolved.board, resolved.jobId)
            : (0, canonical_key_util_1.buildAdzunaKey)(country, listing.id);
        const atsType = resolved?.atsType ?? 'adzuna';
        const applyUrl = listing.redirectUrl || 'https://www.adzuna.com';
        const snippet = stripHtml(listing.description).slice(0, 280);
        return {
            canonicalKey,
            title: listing.title,
            company: listing.company,
            location: listing.location,
            snippet,
            applyUrl,
            atsType,
            hasFullDescription: false,
            applyType: listing.redirectUrl ? 'url' : 'unknown',
            salaryMin: listing.salaryMin ?? null,
            salaryMax: listing.salaryMax ?? null,
            salaryCurrency: listing.salaryCurrency ?? null,
            postedAt: listing.created ?? null,
        };
    }
    async cacheAdzunaListing(listing, country) {
        const description = stripHtml(listing.description);
        const job = {
            canonicalKey: (0, canonical_key_util_1.buildAdzunaKey)(country, listing.id),
            title: listing.title,
            company: listing.company,
            location: listing.location,
            snippet: description.slice(0, 280),
            description,
            applyUrl: listing.redirectUrl || 'https://www.adzuna.com',
            atsType: 'adzuna',
            hasFullDescription: description.length > 200,
            applyType: listing.redirectUrl ? 'url' : 'unknown',
            source: 'adzuna',
            fetchedAt: new Date().toISOString(),
            adzunaId: listing.id,
            adzunaCountry: country,
            salaryMin: listing.salaryMin ?? null,
            salaryMax: listing.salaryMax ?? null,
            salaryCurrency: listing.salaryCurrency ?? null,
            postedAt: listing.created ?? null,
        };
        await this.cache.setJob(job);
    }
    async enrichListItems(items) {
        const jobs = [];
        await Promise.all(items.map(async (item) => {
            try {
                if (item.atsType === 'adzuna' || item.atsType === 'unknown') {
                    const cached = await this.cache.getJob(item.canonicalKey);
                    if (cached) {
                        const expanded = await this.tryExpandWithAts(cached);
                        if (expanded) {
                            jobs.push(expanded);
                        }
                    }
                    return;
                }
                const enriched = await this.enrichment.fetchByCanonicalKey(item.canonicalKey);
                if (enriched) {
                    jobs.push(enriched);
                }
            }
            catch (err) {
                this.logger.debug(`Enrichment skipped for ${item.canonicalKey}: ${err instanceof Error ? err.message : err}`);
            }
        }));
        return jobs;
    }
    toListItem(job) {
        return {
            canonicalKey: job.canonicalKey,
            title: job.title,
            company: job.company,
            location: job.location,
            snippet: job.snippet,
            applyUrl: job.applyUrl,
            atsType: job.atsType,
            hasFullDescription: job.hasFullDescription,
            applyType: job.applyType,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            postedAt: job.postedAt,
        };
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [adzuna_client_1.AdzunaClient,
        adzuna_rate_limit_service_1.AdzunaRateLimitService,
        job_cache_service_1.JobCacheService,
        ats_resolver_service_1.AtsResolverService,
        ats_enrichment_service_1.AtsEnrichmentService])
], JobsService);
function stripHtml(html) {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=jobs.service.js.map