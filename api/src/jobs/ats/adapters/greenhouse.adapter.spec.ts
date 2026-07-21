import { GreenhouseAdapter } from './greenhouse.adapter';

describe('GreenhouseAdapter.listJobs', () => {
  const adapter = new GreenhouseAdapter();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps board listings to ats_direct unified jobs', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [
          {
            id: 123,
            title: 'Software Engineer',
            content: '<p>' + 'Build payments infrastructure. '.repeat(8) + '</p>',
            absolute_url: 'https://boards.greenhouse.io/stripe/jobs/123',
            location: { name: 'London, UK' },
            updated_at: '2026-07-01T10:00:00.000Z',
          },
        ],
      }),
    } as Response);

    const jobs = await adapter.listJobs('stripe', {
      company: 'Stripe',
      source: 'ats_direct',
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.source).toBe('ats_direct');
    expect(jobs[0]?.company).toBe('Stripe');
    expect(jobs[0]?.hasFullDescription).toBe(true);
    expect(jobs[0]?.canonicalKey).toBe('greenhouse:stripe:123');
  });
});
