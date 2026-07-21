import { CuratedBoard, findCuratedBoard } from './curated-boards.loader';
import { parseCanonicalKey } from '../ats/canonical-key.util';
import { JobListItem, JobSearchQuery, UnifiedJob } from '../../shared/schemas/job.schema';

const COUNTRY_LOCATION_ALIASES: Record<string, string[]> = {
  gb: ['united kingdom', 'uk', 'england', 'scotland', 'wales', 'london', 'manchester', 'bristol', 'edinburgh'],
  ie: ['ireland', 'dublin', 'cork'],
  nl: ['netherlands', 'amsterdam', 'rotterdam', 'utrecht'],
  de: ['germany', 'berlin', 'munich', 'hamburg', 'frankfurt'],
  fr: ['france', 'paris', 'lyon'],
  es: ['spain', 'madrid', 'barcelona'],
  se: ['sweden', 'stockholm'],
};

/**
 * Soft-filter curated jobs by q / location / country (board countries + location text).
 */
export function filterCuratedJobs(
  jobs: UnifiedJob[],
  query: JobSearchQuery,
  country: string,
): JobListItem[] {
  const q = query.q?.trim().toLowerCase() ?? '';
  const locationFilter = query.location?.trim().toLowerCase() ?? '';
  const countryCode = country.toLowerCase();

  return jobs
    .filter((job) => matchesCountrySoft(job, countryCode))
    .filter((job) => {
      if (!q) return true;
      const haystack = `${job.title} ${job.company} ${job.snippet} ${job.description}`
        .toLowerCase();
      return haystack.includes(q);
    })
    .filter((job) => {
      if (!locationFilter) return true;
      const loc = (job.location ?? '').toLowerCase();
      return loc.includes(locationFilter);
    })
    .map(curatedToListItem);
}

function matchesCountrySoft(job: UnifiedJob, country: string): boolean {
  const parsed = parseCanonicalKey(job.canonicalKey);
  const board: CuratedBoard | undefined = parsed
    ? findCuratedBoard(parsed.atsType, parsed.board)
    : undefined;

  if (board?.countries.includes(country)) {
    return true;
  }

  const loc = (job.location ?? '').toLowerCase();
  if (!loc || loc.includes('remote') || loc.includes('anywhere')) {
    return true;
  }

  const aliases = COUNTRY_LOCATION_ALIASES[country] ?? [country];
  if (aliases.some((a) => loc.includes(a))) {
    return true;
  }

  // Soft: if board lists other markets only and location is clearly elsewhere, skip
  if (board && !board.countries.includes(country)) {
    return false;
  }

  return true;
}

export function curatedToListItem(job: UnifiedJob): JobListItem {
  return {
    canonicalKey: job.canonicalKey,
    title: job.title,
    company: job.company,
    location: job.location,
    snippet: job.snippet,
    applyUrl: job.applyUrl,
    atsType: job.atsType,
    hasFullDescription: job.hasFullDescription,
    applyType: job.applyType,
    source: job.source ?? 'ats_direct',
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    postedAt: job.postedAt,
  };
}
