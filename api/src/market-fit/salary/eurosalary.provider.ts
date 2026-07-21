import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../config/env.validation';
import { RedisService } from '../../redis/redis.service';
import type { MarketFitSalaryBand } from '../../shared/schemas/market-fit.schema';
import type { SeniorityLevel } from '../../shared/schemas/enums.schema';
import {
  EUROSALARY_COUNTRIES,
  titleToEuroSalarySlug,
} from './eurosalary-jobs';

type EuroSalaryApiData = {
  salary_gross_annual?: number;
  currency?: string;
  job_title?: string;
  level?: string;
};

const CACHE_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class EuroSalaryProvider {
  private readonly logger = new Logger(EuroSalaryProvider.name);
  readonly attribution =
    'EU/IE salary bands from EuroSalary (Eurostat + job-board sources).';

  constructor(
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly redis: RedisService,
  ) {}

  supportsCountry(country: string): boolean {
    return EUROSALARY_COUNTRIES.has(country.toLowerCase());
  }

  async lookup(
    title: string,
    country: string,
    seniority: SeniorityLevel,
  ): Promise<MarketFitSalaryBand | null> {
    const code = country.toLowerCase();
    if (!this.supportsCountry(code)) return null;

    const slug = titleToEuroSalarySlug(title);
    if (!slug) return null;

    const level = this.mapSeniority(seniority);
    const cacheKey = `eurosalary:${code}:${slug}:${level}`;

    try {
      const cached = await this.redis.client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as MarketFitSalaryBand;
      }
    } catch {
      // Redis optional for salary cache
    }

    const url = new URL('https://api.eurosalary.eu/v1/salary');
    url.searchParams.set('country', code.toUpperCase());
    url.searchParams.set('job', slug);
    url.searchParams.set('level', level);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const apiKey = this.config.get('EUROSALARY_API_KEY', { infer: true });
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    try {
      const res = await fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) {
        this.logger.warn(
          `EuroSalary ${res.status} for ${code}/${slug}/${level}`,
        );
        return null;
      }
      const body = (await res.json()) as {
        status?: string;
        data?: EuroSalaryApiData;
      };
      const annual = body.data?.salary_gross_annual;
      if (typeof annual !== 'number' || !Number.isFinite(annual) || annual <= 0) {
        return null;
      }

      const currency = (body.data?.currency ?? 'EUR').toUpperCase().slice(0, 3);
      // Approximate band ±18% around reported annual gross for the level.
      const min = Math.round(annual * 0.82);
      const max = Math.round(annual * 1.18);
      const band: MarketFitSalaryBand = {
        min,
        max,
        median: Math.round(annual),
        period: 'year',
        currency,
        source: 'eurosalary',
        label: `EuroSalary · ${body.data?.job_title ?? slug} (${level})`,
      };

      try {
        await this.redis.client.set(
          cacheKey,
          JSON.stringify(band),
          'EX',
          CACHE_TTL_SEC,
        );
      } catch {
        // ignore cache write failures
      }

      return band;
    } catch (err) {
      this.logger.warn(
        `EuroSalary fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  private mapSeniority(seniority: SeniorityLevel): 'junior' | 'mid' | 'senior' {
    switch (seniority) {
      case 'INTERN':
      case 'JUNIOR':
        return 'junior';
      case 'SENIOR':
      case 'LEAD':
      case 'EXECUTIVE':
      case 'C_LEVEL':
        return 'senior';
      default:
        return 'mid';
    }
  }
}
