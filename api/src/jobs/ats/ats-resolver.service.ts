import { Injectable } from '@nestjs/common';
import { ResolvedAts } from './types/unified-job.types';

@Injectable()
export class AtsResolverService {
  resolveFromUrl(url: string): ResolvedAts | null {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }

    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    // Greenhouse
    const ghBoards = path.match(
      /^\/([^/]+)\/jobs\/(\d+)\/?$/i,
    );
    if (
      ghBoards &&
      (host === 'boards.greenhouse.io' ||
        host === 'job-boards.greenhouse.io' ||
        host.endsWith('.greenhouse.io'))
    ) {
      return {
        atsType: 'greenhouse',
        board: ghBoards[1]!,
        jobId: ghBoards[2]!,
      };
    }

    // Lever
    const lever = path.match(/^\/([^/]+)\/([0-9a-f-]{36}|[a-z0-9-]+)\/?$/i);
    if (lever && host === 'jobs.lever.co') {
      return {
        atsType: 'lever',
        board: lever[1]!,
        jobId: lever[2]!,
      };
    }

    // Ashby
    const ashby = path.match(/^\/([^/]+)\/([0-9a-f-]{36})\/?$/i);
    if (ashby && host === 'jobs.ashbyhq.com') {
      return {
        atsType: 'ashby',
        board: ashby[1]!,
        jobId: ashby[2]!,
      };
    }

    const ashbyApp = path.match(/^\/([^/]+)\/application\/([0-9a-f-]{36})\/?$/i);
    if (ashbyApp && host === 'jobs.ashbyhq.com') {
      return {
        atsType: 'ashby',
        board: ashbyApp[1]!,
        jobId: ashbyApp[2]!,
      };
    }

    return null;
  }

  /** Extract employer ATS URLs embedded in Adzuna HTML descriptions. */
  extractFromText(text: string): ResolvedAts | null {
    const urls = text.match(/https?:\/\/[^\s"'<>]+/gi) ?? [];
    for (const raw of urls) {
      const cleaned = raw.replace(/[),.;]+$/, '');
      const direct = this.resolveFromUrl(cleaned);
      if (direct) {
        return direct;
      }
    }
    return null;
  }

  /** Follow Adzuna redirect URLs (often tracking links) to find the employer ATS URL. */
  async resolveFromRedirect(redirectUrl: string): Promise<ResolvedAts | null> {
    const direct = this.resolveFromUrl(redirectUrl);
    if (direct) {
      return direct;
    }

    try {
      const res = await fetch(redirectUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': 'GuavaJobs/1.0 (+https://guavajobs.app)' },
        signal: AbortSignal.timeout(8000),
      });
      return this.resolveFromUrl(res.url);
    } catch {
      return null;
    }
  }
}
