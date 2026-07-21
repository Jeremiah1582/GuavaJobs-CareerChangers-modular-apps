import * as curatedBoards from '../jobs/curated/curated-boards.loader';
import { JobCacheService } from '../jobs/cache/job-cache.service';
import { GreenhouseAdapter } from '../jobs/ats/adapters/greenhouse.adapter';
import { LeverAdapter } from '../jobs/ats/adapters/lever.adapter';
import { AshbyAdapter } from '../jobs/ats/adapters/ashby.adapter';
import { CuratedAtsSyncProcessor } from './curated-ats-sync.processor';

describe('CuratedAtsSyncProcessor', () => {
  const cache = {
    replaceBoardJobs: jest.fn(),
    bumpCuratedVersion: jest.fn(),
  } as unknown as JobCacheService;

  const greenhouse = {
    listJobs: jest.fn(),
  } as unknown as GreenhouseAdapter;
  const lever = { listJobs: jest.fn() } as unknown as LeverAdapter;
  const ashby = { listJobs: jest.fn() } as unknown as AshbyAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(curatedBoards, 'loadCuratedBoards').mockReturnValue([
      {
        atsType: 'greenhouse',
        board: 'stripe',
        company: 'Stripe',
        countries: ['gb'],
      },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes jobs and replaces board keys', async () => {
    (greenhouse.listJobs as jest.Mock).mockResolvedValue([
      {
        canonicalKey: 'greenhouse:stripe:1',
        title: 'Engineer',
        company: 'Stripe',
        location: null,
        snippet: 'Build',
        description: 'Build things',
        applyUrl: 'https://example.com/1',
        atsType: 'greenhouse',
        hasFullDescription: true,
        applyType: 'url',
        source: 'ats_direct',
        fetchedAt: new Date().toISOString(),
      },
    ]);
    (cache.replaceBoardJobs as jest.Mock).mockResolvedValue({
      added: 1,
      removed: 0,
    });

    const processor = new CuratedAtsSyncProcessor(
      cache,
      greenhouse,
      lever,
      ashby,
    );
    const summary = await processor.syncAllBoards();

    expect(summary.jobsWritten).toBe(1);
    expect(cache.replaceBoardJobs).toHaveBeenCalledWith(
      'greenhouse',
      'stripe',
      expect.any(Array),
    );
    expect(cache.bumpCuratedVersion).toHaveBeenCalled();
  });
});
