import { GreenhouseAdapter } from './greenhouse.adapter';
import { LeverAdapter } from './lever.adapter';
import { AshbyAdapter } from './ashby.adapter';

describe('ATS adapter listJobs', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('Greenhouse listJobs maps board jobs with ats_direct source', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [
          {
            id: 42,
            title: 'Engineer',
            content: '<p>Build great products with TypeScript every day</p>'.repeat(3),
            absolute_url: 'https://boards.greenhouse.io/stripe/jobs/42',
            location: { name: 'London' },
            updated_at: '2026-07-01T00:00:00.000Z',
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const adapter = new GreenhouseAdapter();
    const jobs = await adapter.listJobs('stripe', {
      company: 'Stripe',
      source: 'ats_direct',
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.canonicalKey).toBe('greenhouse:stripe:42');
    expect(jobs[0]?.company).toBe('Stripe');
    expect(jobs[0]?.source).toBe('ats_direct');
    expect(jobs[0]?.hasFullDescription).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/boards/stripe/jobs?content=true'),
      expect.any(Object),
    );
  });

  it('Lever listJobs maps postings', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'abc',
          text: 'Designer',
          descriptionPlain: 'Design beautiful products for customers everywhere',
          hostedUrl: 'https://jobs.lever.co/spotify/abc',
          categories: { location: 'Amsterdam' },
          createdAt: Date.parse('2026-07-01T00:00:00.000Z'),
        },
      ],
    }) as unknown as typeof fetch;

    const adapter = new LeverAdapter();
    const jobs = await adapter.listJobs('spotify', {
      company: 'Spotify',
      source: 'ats_direct',
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.canonicalKey).toBe('lever:spotify:abc');
    expect(jobs[0]?.company).toBe('Spotify');
    expect(jobs[0]?.source).toBe('ats_direct');
  });

  it('Ashby listJobs maps board jobs', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [
          {
            id: 'j1',
            title: 'PM',
            descriptionPlain: 'Ship product with clarity and care for users worldwide',
            jobUrl: 'https://jobs.ashbyhq.com/linear/j1',
            location: 'Remote',
            publishedAt: '2026-07-01T00:00:00.000Z',
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const adapter = new AshbyAdapter();
    const jobs = await adapter.listJobs('linear', {
      company: 'Linear',
      source: 'ats_direct',
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.canonicalKey).toBe('ashby:linear:j1');
    expect(jobs[0]?.company).toBe('Linear');
    expect(jobs[0]?.source).toBe('ats_direct');
  });

  it('Greenhouse fetchJob defaults source to ats_direct', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        title: 'Role',
        content: '<p>Hello world content that is long enough for full description</p>',
        absolute_url: 'https://boards.greenhouse.io/stripe/jobs/1',
      }),
    }) as unknown as typeof fetch;

    const adapter = new GreenhouseAdapter();
    const job = await adapter.fetchJob('stripe', '1');
    expect(job?.source).toBe('ats_direct');
  });
});
