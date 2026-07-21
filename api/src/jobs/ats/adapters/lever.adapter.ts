import { Injectable } from '@nestjs/common';
import { UnifiedJob } from '../../../shared/schemas/job.schema';
import { buildCanonicalKey } from '../canonical-key.util';
import { stripHtml } from '../strip-html.util';
import { AtsFetchOptions } from './adapter-options';

type LeverPosting = {
  id: string;
  text: string;
  hostedUrl?: string;
  applyUrl?: string;
  categories?: {
    location?: string;
    team?: string;
    commitment?: string;
  };
  descriptionPlain?: string;
  description?: string;
  createdAt?: number;
};

@Injectable()
export class LeverAdapter {
  async fetchJob(
    site: string,
    postingId: string,
    options?: AtsFetchOptions,
  ): Promise<UnifiedJob | null> {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}/${encodeURIComponent(postingId)}?mode=json`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as LeverPosting;
    return this.mapPosting(site, data, options);
  }

  async listJobs(
    site: string,
    options?: AtsFetchOptions,
  ): Promise<UnifiedJob[]> {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`Lever listJobs failed (${res.status}) for ${site}`);
    }

    const data = (await res.json()) as LeverPosting[];
    return (Array.isArray(data) ? data : []).map((posting) =>
      this.mapPosting(site, posting, options),
    );
  }

  private mapPosting(
    site: string,
    data: LeverPosting,
    options?: AtsFetchOptions,
  ): UnifiedJob {
    const description =
      data.descriptionPlain?.trim() ||
      stripHtml(data.description ?? '') ||
      data.text?.trim() ||
      '';
    const applyUrl =
      data.applyUrl ?? data.hostedUrl ?? `https://jobs.lever.co/${site}/${data.id}`;

    return {
      canonicalKey: buildCanonicalKey('lever', site, data.id),
      title: data.text,
      company: options?.company ?? site,
      location: data.categories?.location ?? null,
      snippet: description.slice(0, 280),
      description,
      applyUrl,
      atsType: 'lever',
      hasFullDescription: description.length > 100,
      applyType: 'url',
      source: options?.source ?? 'ats_direct',
      fetchedAt: new Date().toISOString(),
      postedAt: data.createdAt
        ? new Date(data.createdAt).toISOString()
        : null,
    };
  }
}
