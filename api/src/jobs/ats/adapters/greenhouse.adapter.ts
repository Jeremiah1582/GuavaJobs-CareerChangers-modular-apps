import { Injectable } from '@nestjs/common';
import { UnifiedJob } from '../../../shared/schemas/job.schema';
import { buildCanonicalKey } from '../canonical-key.util';

type GreenhouseJob = {
  id: number;
  title: string;
  content?: string;
  absolute_url?: string;
  location?: { name?: string };
  updated_at?: string;
};

@Injectable()
export class GreenhouseAdapter {
  async fetchJob(board: string, jobId: string): Promise<UnifiedJob | null> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs/${encodeURIComponent(jobId)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as GreenhouseJob;
    const description = stripHtml(data.content ?? '');
    const applyUrl = data.absolute_url ?? `https://boards.greenhouse.io/${board}/jobs/${jobId}`;

    return {
      canonicalKey: buildCanonicalKey('greenhouse', board, jobId),
      title: data.title,
      company: board,
      location: data.location?.name ?? null,
      snippet: description.slice(0, 280),
      description,
      applyUrl,
      atsType: 'greenhouse',
      hasFullDescription: description.length > 100,
      applyType: 'url',
      source: 'adzuna',
      fetchedAt: new Date().toISOString(),
      postedAt: data.updated_at ?? null,
    };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
