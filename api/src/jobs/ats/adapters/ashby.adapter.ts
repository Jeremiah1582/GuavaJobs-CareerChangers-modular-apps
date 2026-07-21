import { Injectable } from '@nestjs/common';
import { UnifiedJob } from '../../../shared/schemas/job.schema';
import { buildCanonicalKey } from '../canonical-key.util';
import { stripHtml } from '../strip-html.util';
import { AtsFetchOptions } from './adapter-options';

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
  async fetchJob(
    boardName: string,
    jobPostingId: string,
    options?: AtsFetchOptions,
  ): Promise<UnifiedJob | null> {
    try {
      const jobs = await this.fetchBoard(boardName);
      const job = jobs.find((j) => j.id === jobPostingId);
      if (!job) {
        return null;
      }
      return this.mapJob(boardName, job, options);
    } catch {
      return null;
    }
  }

  async listJobs(
    boardName: string,
    options?: AtsFetchOptions,
  ): Promise<UnifiedJob[]> {
    const jobs = await this.fetchBoard(boardName);
    return jobs.map((job) => this.mapJob(boardName, job, options));
  }

  private async fetchBoard(boardName: string): Promise<AshbyJob[]> {
    const listUrl = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardName)}`;
    const res = await fetch(listUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`Ashby listJobs failed (${res.status}) for ${boardName}`);
    }

    const data = (await res.json()) as AshbyBoardResponse;
    return data.jobs ?? [];
  }

  private mapJob(
    boardName: string,
    job: AshbyJob,
    options?: AtsFetchOptions,
  ): UnifiedJob {
    const description =
      job.descriptionPlain?.trim() ||
      stripHtml(job.descriptionHtml ?? '') ||
      '';
    const applyUrl =
      job.applyUrl ??
      job.jobUrl ??
      `https://jobs.ashbyhq.com/${boardName}/${job.id}`;

    return {
      canonicalKey: buildCanonicalKey('ashby', boardName, job.id),
      title: job.title,
      company: options?.company ?? boardName,
      location: job.location ?? null,
      snippet: description.slice(0, 280),
      description,
      applyUrl,
      atsType: 'ashby',
      hasFullDescription: description.length > 100,
      applyType: 'url',
      source: options?.source ?? 'ats_direct',
      fetchedAt: new Date().toISOString(),
      postedAt: job.publishedAt ?? null,
    };
  }
}
