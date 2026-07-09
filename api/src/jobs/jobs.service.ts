import { Injectable, Logger } from '@nestjs/common';
import { AdzunaClient } from './adzuna/adzuna.client';
import { AdzunaRateLimitService } from './adzuna/adzuna-rate-limit.service';
import { AtsEnrichmentService } from './ats/ats-enrichment.service';
import { AtsResolverService } from './ats/ats-resolver.service';
import {
  buildAdzunaKey,
  buildCanonicalKey,
  parseCanonicalKey,
} from './ats/canonical-key.util';
import { AdzunaListing } from './ats/types/unified-job.types';
import { JobCacheService } from './cache/job-cache.service';
import { AppError } from '../shared/schemas/error.schema';
import {
  JobListItem,
  JobSearchQuery,
  JobSearchResponse,
  UnifiedJob,
} from '../shared/schemas/job.schema';

const MAX_ENRICH_PER_SEARCH = 8;

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly adzuna: AdzunaClient,
    private readonly rateLimit: AdzunaRateLimitService,
    private readonly cache: JobCacheService,
    private readonly resolver: AtsResolverService,
    private readonly enrichment: AtsEnrichmentService,
  ) {}

  async search(query: JobSearchQuery): Promise<JobSearchResponse> {
    if (!this.adzuna.isConfigured()) {
      throw new AppError(
        'JOBS_NOT_CONFIGURED',
        'Adzuna credentials are not configured (ADZUNA_APP_ID + ADZUNA_API_KEY)',
        503,
      );
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

    const baseItems = await Promise.all(
      listings.map((listing) => this.listingToItem(listing, country)),
    );

    for (const listing of listings) {
      await this.cacheAdzunaListing(listing, country);
    }

    const enriched = await this.enrichListItems(
      baseItems.slice(0, MAX_ENRICH_PER_SEARCH),
    );

    const results: JobListItem[] = baseItems.map((item) => {
      const match = enriched.find(
        (e) =>
          e.canonicalKey === item.canonicalKey ||
          e.applyUrl === item.applyUrl,
      );
      return match ? this.toListItem(match) : item;
    });

    for (const job of enriched) {
      await this.cache.setJob(job);
    }

    const response: JobSearchResponse = {
      results,
      page: query.page,
      totalResults,
      attribution: 'Jobs by Adzuna',
    };

    await this.cache.setSearch(cacheKey, response);
    return response;
  }

  async getByCanonicalKey(
    rawKey: string,
    options?: { expandAts?: boolean },
  ): Promise<UnifiedJob> {
    const canonicalKey = decodeURIComponent(rawKey).trim().toLowerCase();
    const cached = await this.cache.getJob(canonicalKey);
    if (cached && !options?.expandAts) {
      return cached;
    }

    const parsed = parseCanonicalKey(canonicalKey);
    if (!parsed) {
      throw new AppError('JOB_NOT_FOUND', 'Invalid job key format', 404);
    }

    if (parsed.atsType === 'adzuna') {
      if (!cached) {
        throw new AppError(
          'JOB_NOT_FOUND',
          'Job not in cache; run search again to refresh Adzuna listings',
          404,
        );
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
      throw new AppError('JOB_NOT_FOUND', 'Job not found or ATS fetch failed', 404);
    }

    await this.cache.setJob(job);
    return job;
  }

  /** Resolve Adzuna listing → employer ATS and fetch full job description when possible. */
  private async tryExpandWithAts(cached: UnifiedJob): Promise<UnifiedJob | null> {
    const resolved =
      (cached.applyUrl
        ? await this.resolver.resolveFromRedirect(cached.applyUrl)
        : null) ??
      (cached.description
        ? this.resolver.extractFromText(cached.description)
        : null);

    if (!resolved) {
      return null;
    }

    const atsKey = buildCanonicalKey(
      resolved.atsType,
      resolved.board,
      resolved.jobId,
    );
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

  private async listingToItem(
    listing: AdzunaListing,
    country: string,
  ): Promise<JobListItem> {
    const resolved = listing.redirectUrl
      ? (await this.resolver.resolveFromRedirect(listing.redirectUrl)) ??
        this.resolver.extractFromText(listing.description)
      : this.resolver.extractFromText(listing.description);

    const canonicalKey = resolved
      ? buildCanonicalKey(resolved.atsType, resolved.board, resolved.jobId)
      : buildAdzunaKey(country, listing.id);

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

  private async cacheAdzunaListing(
    listing: AdzunaListing,
    country: string,
  ): Promise<void> {
    const description = stripHtml(listing.description);
    const job: UnifiedJob = {
      canonicalKey: buildAdzunaKey(country, listing.id),
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

  private async enrichListItems(items: JobListItem[]): Promise<UnifiedJob[]> {
    const jobs: UnifiedJob[] = [];

    await Promise.all(
      items.map(async (item) => {
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
          const enriched = await this.enrichment.fetchByCanonicalKey(
            item.canonicalKey,
          );
          if (enriched) {
            jobs.push(enriched);
          }
        } catch (err) {
          this.logger.debug(
            `Enrichment skipped for ${item.canonicalKey}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }),
    );

    return jobs;
  }

  private toListItem(job: UnifiedJob): JobListItem {
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
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
