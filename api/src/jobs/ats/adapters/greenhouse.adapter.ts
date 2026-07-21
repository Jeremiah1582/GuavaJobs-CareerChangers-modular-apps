import { Injectable } from '@nestjs/common';
import { UnifiedJob } from '../../../shared/schemas/job.schema';
import { buildCanonicalKey } from '../canonical-key.util';
import { stripHtml } from '../strip-html.util';
import { AtsFetchOptions } from './adapter-options';

type GreenhouseJob = {
  id: number;
  title: string;
  content?: string;
  absolute_url?: string;
  location?: { name?: string };
  updated_at?: string;
};

type GreenhouseListResponse = {
  jobs?: GreenhouseJob[];
};

@Injectable()
export class GreenhouseAdapter {
  async fetchJob(
    board: string,
    jobId: string,
    options?: AtsFetchOptions,
  ): Promise<UnifiedJob | null> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs/${encodeURIComponent(jobId)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as GreenhouseJob;
    return this.mapJob(board, data, options);
  }

  async listJobs(
    board: string,
    options?: AtsFetchOptions,
  ): Promise<UnifiedJob[]> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`Greenhouse listJobs failed (${res.status}) for ${board}`);
    }

    const data = (await res.json()) as GreenhouseListResponse;
    return (data.jobs ?? []).map((job) => this.mapJob(board, job, options));
  }

  private mapJob(
    board: string,
    data: GreenhouseJob,
    options?: AtsFetchOptions,
  ): UnifiedJob {
    const jobId = String(data.id);
    const description = stripHtml(data.content ?? '');
    const applyUrl =
      data.absolute_url ?? `https://boards.greenhouse.io/${board}/jobs/${jobId}`;

    return {
      canonicalKey: buildCanonicalKey('greenhouse', board, jobId),
      title: data.title,
      company: options?.company ?? board,
      location: data.location?.name ?? null,
      snippet: description.slice(0, 280),
      description,
      applyUrl,
      atsType: 'greenhouse',
      hasFullDescription: description.length > 100,
      applyType: 'url',
      source: options?.source ?? 'ats_direct',
      fetchedAt: new Date().toISOString(),
      postedAt: data.updated_at ?? null,
    };
  }
}
