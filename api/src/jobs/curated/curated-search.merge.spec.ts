import { filterCuratedJobs } from './curated-search.filter';
import { mergeJobSearchResults } from './curated-search.merge';
import type { JobListItem, UnifiedJob } from '../../shared/schemas/job.schema';

function curatedJob(overrides: Partial<UnifiedJob> = {}): UnifiedJob {
  return {
    canonicalKey: 'greenhouse:stripe:123',
    title: 'Software Engineer',
    company: 'Stripe',
    location: 'London, UK',
    snippet: 'Build payments infrastructure',
    description: 'Build payments infrastructure with TypeScript',
    applyUrl: 'https://boards.greenhouse.io/stripe/jobs/123',
    atsType: 'greenhouse',
    hasFullDescription: true,
    applyType: 'url',
    source: 'ats_direct',
    fetchedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('filterCuratedJobs', () => {
  it('filters by query against title/company/description', () => {
    const jobs = [
      curatedJob(),
      curatedJob({
        canonicalKey: 'greenhouse:stripe:456',
        title: 'Account Executive',
        description: 'Sales role',
        snippet: 'Sales role',
      }),
    ];

    const filtered = filterCuratedJobs(jobs, { q: 'typescript', page: 1 }, 'gb');

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe('Software Engineer');
    expect(filtered[0]?.source).toBe('ats_direct');
  });

  it('soft-filters by location substring', () => {
    const jobs = [
      curatedJob({ location: 'London, UK' }),
      curatedJob({
        canonicalKey: 'greenhouse:stripe:789',
        location: 'Berlin, Germany',
        title: 'Berlin Engineer',
      }),
    ];

    const filtered = filterCuratedJobs(
      jobs,
      { location: 'london', page: 1 },
      'gb',
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.location).toContain('London');
  });
});

describe('mergeJobSearchResults', () => {
  it('prefers curated full JD when canonical keys collide', () => {
    const adzuna: JobListItem = {
      canonicalKey: 'greenhouse:stripe:123',
      title: 'Software Engineer',
      company: 'Stripe',
      location: 'London, UK',
      snippet: 'Short snippet',
      applyUrl: 'https://example.com',
      atsType: 'greenhouse',
      hasFullDescription: false,
      applyType: 'url',
      source: 'adzuna',
    };

    const merged = mergeJobSearchResults({
      curated: [
        {
          canonicalKey: 'greenhouse:stripe:123',
          title: 'Software Engineer',
          company: 'Stripe',
          location: 'London, UK',
          snippet: 'Build payments',
          applyUrl: 'https://boards.greenhouse.io/stripe/jobs/123',
          atsType: 'greenhouse',
          hasFullDescription: true,
          applyType: 'url',
          source: 'ats_direct',
        },
      ],
      adzuna: [adzuna],
      page: 1,
      adzunaTotal: 50,
    });

    expect(merged.results).toHaveLength(1);
    expect(merged.results[0]?.hasFullDescription).toBe(true);
    expect(merged.results[0]?.source).toBe('ats_direct');
    // Deduped to curated-only page → Company career pages
    expect(merged.attribution).toBe('Company career pages');
    expect(merged.totalResults).toBe(51);
  });

  it('returns Adzuna-shaped results when curated is empty', () => {
    const adzuna: JobListItem = {
      canonicalKey: 'adzuna:gb:999',
      title: 'PM',
      company: 'Acme',
      location: 'Manchester',
      snippet: 'Lead product',
      applyUrl: 'https://www.adzuna.com/999',
      atsType: 'adzuna',
      hasFullDescription: false,
      applyType: 'url',
      source: 'adzuna',
    };

    const merged = mergeJobSearchResults({
      curated: [],
      adzuna: [adzuna],
      page: 1,
      adzunaTotal: 10,
    });

    expect(merged.results).toEqual([adzuna]);
    expect(merged.attribution).toBe('Jobs by Adzuna');
    expect(merged.totalResults).toBe(10);
  });

  it('uses Company career pages attribution for curated-only', () => {
    const curated = Array.from({ length: 25 }, (_, index) => ({
      canonicalKey: `greenhouse:stripe:${index}`,
      title: `Role ${index}`,
      company: 'Stripe',
      location: 'London',
      snippet: 'x',
      applyUrl: `https://boards.greenhouse.io/stripe/jobs/${index}`,
      atsType: 'greenhouse' as const,
      hasFullDescription: true,
      applyType: 'url' as const,
      source: 'ats_direct' as const,
    }));

    const page2 = mergeJobSearchResults({
      curated,
      adzuna: [],
      page: 2,
      adzunaTotal: 0,
    });

    expect(page2.results).toHaveLength(5);
    expect(page2.attribution).toBe('Company career pages');
  });

  it('fills page 1 with Adzuna after curated', () => {
    const curated: JobListItem[] = [
      {
        canonicalKey: 'greenhouse:stripe:1',
        title: 'Curated',
        company: 'Stripe',
        location: 'London',
        snippet: 'x',
        applyUrl: 'https://boards.greenhouse.io/stripe/jobs/1',
        atsType: 'greenhouse',
        hasFullDescription: true,
        applyType: 'url',
        source: 'ats_direct',
      },
    ];
    const adzuna: JobListItem[] = [
      {
        canonicalKey: 'adzuna:gb:2',
        title: 'Adzuna role',
        company: 'Acme',
        location: 'Leeds',
        snippet: 'y',
        applyUrl: 'https://www.adzuna.com/2',
        atsType: 'adzuna',
        hasFullDescription: false,
        applyType: 'url',
        source: 'adzuna',
      },
    ];

    const merged = mergeJobSearchResults({
      curated,
      adzuna,
      page: 1,
      adzunaTotal: 100,
    });

    expect(merged.results.map((r) => r.canonicalKey)).toEqual([
      'greenhouse:stripe:1',
      'adzuna:gb:2',
    ]);
    expect(merged.attribution).toBe('Jobs by Adzuna');
  });
});
