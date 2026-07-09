import { Injectable } from '@nestjs/common';
import { UnifiedJob } from '../../../shared/schemas/job.schema';
import { buildCanonicalKey } from '../canonical-key.util';

type AshbyJob = {
  id: string;
  title: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  jobUrl?: string;
  applyUrl?: string;
  location?: string;
  publishedAt?: string;
};

type AshbyBoardResponse = {
  jobs?: AshbyJob[];
};

@Injectable()
export class AshbyAdapter {
  async fetchJob(boardName: string, jobPostingId: string): Promise<UnifiedJob | null> {
    const listUrl = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardName)}`;
    const res = await fetch(listUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as AshbyBoardResponse;
    const job = data.jobs?.find((j) => j.id === jobPostingId);
    if (!job) {
      return null;
    }

    const description =
      job.descriptionPlain?.trim() ||
      stripHtml(job.descriptionHtml ?? '') ||
      '';
    const applyUrl =
      job.applyUrl ??
      job.jobUrl ??
      `https://jobs.ashbyhq.com/${boardName}/${jobPostingId}`;

    return {
      canonicalKey: buildCanonicalKey('ashby', boardName, jobPostingId),
      title: job.title,
      company: boardName,
      location: job.location ?? null,
      snippet: description.slice(0, 280),
      description,
      applyUrl,
      atsType: 'ashby',
      hasFullDescription: description.length > 100,
      applyType: 'url',
      source: 'adzuna',
      fetchedAt: new Date().toISOString(),
      postedAt: job.publishedAt ?? null,
    };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
