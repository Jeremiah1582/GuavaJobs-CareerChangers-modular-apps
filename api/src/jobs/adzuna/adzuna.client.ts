import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig, getAdzunaAppKey } from '../../config/env.validation';
import { AdzunaListing } from '../ats/types/unified-job.types';

type AdzunaSearchResponse = {
  count?: number;
  results?: Array<{
    id: string | number;
    title?: string;
    description?: string;
    redirect_url?: string;
    created?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    company?: { display_name?: string };
    location?: { display_name?: string };
  }>;
};

@Injectable()
export class AdzunaClient {
  private readonly appId: string;
  private readonly appKey: string;
  private readonly defaultCountry: string;

  constructor(config: ConfigService<EnvConfig, true>) {
    const env: EnvConfig = {
      ADZUNA_APP_ID: config.get('ADZUNA_APP_ID', { infer: true }),
      ADZUNA_APP_KEY: config.get('ADZUNA_APP_KEY', { infer: true }),
      ADZUNA_API_KEY: config.get('ADZUNA_API_KEY', { infer: true }),
      ADZUNA_DEFAULT_COUNTRY: config.get('ADZUNA_DEFAULT_COUNTRY', { infer: true }),
    } as EnvConfig;
    this.appId = env.ADZUNA_APP_ID ?? '';
    this.appKey = getAdzunaAppKey(env);
    this.defaultCountry = env.ADZUNA_DEFAULT_COUNTRY ?? 'gb';
  }

  isConfigured(): boolean {
    return Boolean(this.appId && this.appKey);
  }

  async search(params: {
    q?: string;
    location?: string;
    country?: string;
    page?: number;
  }): Promise<{ listings: AdzunaListing[]; totalResults: number }> {
    const country = (params.country ?? this.defaultCountry).toLowerCase();
    const page = params.page ?? 1;

    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`,
    );
    url.searchParams.set('app_id', this.appId);
    url.searchParams.set('app_key', this.appKey);
    url.searchParams.set('results_per_page', '20');
    if (params.q) {
      url.searchParams.set('what', params.q);
    }
    if (params.location) {
      url.searchParams.set('where', params.location);
    }

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Adzuna search failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as AdzunaSearchResponse;
    const listings: AdzunaListing[] = (data.results ?? []).map((r) => ({
      id: String(r.id),
      title: r.title ?? 'Untitled role',
      company: r.company?.display_name ?? 'Unknown company',
      location: r.location?.display_name ?? null,
      description: r.description ?? '',
      redirectUrl: r.redirect_url ?? '',
      created: r.created,
      salaryMin: r.salary_min ?? null,
      salaryMax: r.salary_max ?? null,
      salaryCurrency: r.salary_currency ?? null,
    }));

    return {
      listings,
      totalResults: data.count ?? listings.length,
    };
  }
}
