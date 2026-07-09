import { Injectable } from '@nestjs/common';
import { UnifiedJob } from '../../../shared/schemas/job.schema';
import { buildCanonicalKey } from '../canonical-key.util';

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
  async fetchJob(site: string, postingId: string): Promise<UnifiedJob | null> {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}/${encodeURIComponent(postingId)}?mode=json`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as LeverPosting;
    const description =
      data.descriptionPlain?.trim() ||
      stripHtml(data.description ?? '') ||
      data.text?.trim() ||
      '';
    const applyUrl =
      data.applyUrl ?? data.hostedUrl ?? `https://jobs.lever.co/${site}/${postingId}`;

    return {
      canonicalKey: buildCanonicalKey('lever', site, postingId),
      title: data.text,
      company: site,
      location: data.categories?.location ?? null,
      snippet: description.slice(0, 280),
      description,
      applyUrl,
      atsType: 'lever',
      hasFullDescription: description.length > 100,
      applyType: 'url',
      source: 'adzuna',
      fetchedAt: new Date().toISOString(),
      postedAt: data.createdAt
        ? new Date(data.createdAt).toISOString()
        : null,
    };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
