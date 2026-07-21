import { JobCacheService } from './job-cache.service';
import type { UnifiedJob } from '../../shared/schemas/job.schema';

describe('JobCacheService.replaceBoardJobs', () => {
  it('removes stale board keys and writes current postings', async () => {
    const multi = {
      srem: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      sadd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };

    const client = {
      smembers: jest.fn().mockResolvedValue([
        'greenhouse:stripe:old',
        'greenhouse:stripe:keep',
      ]),
      setex: jest.fn().mockResolvedValue('OK'),
      multi: jest.fn(() => multi),
    };

    const redis = {
      runCommand: jest.fn(async (fn: (c: typeof client) => Promise<unknown>) =>
        fn(client),
      ),
    };

    const cache = new JobCacheService(redis as never);

    const jobs: UnifiedJob[] = [
      {
        canonicalKey: 'greenhouse:stripe:keep',
        title: 'Keep',
        company: 'Stripe',
        location: null,
        snippet: 'x',
        description: 'x',
        applyUrl: 'https://boards.greenhouse.io/stripe/jobs/keep',
        atsType: 'greenhouse',
        hasFullDescription: true,
        applyType: 'url',
        source: 'ats_direct',
        fetchedAt: new Date().toISOString(),
      },
      {
        canonicalKey: 'greenhouse:stripe:new',
        title: 'New',
        company: 'Stripe',
        location: null,
        snippet: 'y',
        description: 'y',
        applyUrl: 'https://boards.greenhouse.io/stripe/jobs/new',
        atsType: 'greenhouse',
        hasFullDescription: true,
        applyType: 'url',
        source: 'ats_direct',
        fetchedAt: new Date().toISOString(),
      },
    ];

    const result = await cache.replaceBoardJobs('greenhouse', 'stripe', jobs);

    expect(result.added).toBe(2);
    expect(result.removed).toBe(1);
    expect(client.setex).toHaveBeenCalledTimes(2);
    expect(multi.srem).toHaveBeenCalled();
    expect(multi.del).toHaveBeenCalled();
    expect(multi.sadd).toHaveBeenCalled();
  });
});
