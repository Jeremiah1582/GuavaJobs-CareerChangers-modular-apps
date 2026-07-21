import {
  JobAttribution,
  JobListItem,
} from '../../shared/schemas/job.schema';

export const SEARCH_PAGE_SIZE = 20;

export type MergeSearchInput = {
  curated: JobListItem[];
  adzuna: JobListItem[];
  page: number;
  adzunaTotal: number;
  pageSize?: number;
};

export type MergeSearchResult = {
  results: JobListItem[];
  totalResults: number;
  attribution: JobAttribution;
};

/**
 * Prefer curated (full JD) when canonical keys collide; curated first on page 1,
 * then fill with Adzuna. When Adzuna is empty, paginate curated alone.
 * When Adzuna has rows, pages > 1 are Adzuna-only (deduped).
 * `totalResults` is approximate (Adzuna count + curated match count).
 *
 * Attribution (locked): `"Jobs by Adzuna"` if any result has `source === 'adzuna'`;
 * otherwise `"Company career pages"`.
 */
export function mergeJobSearchResults(input: MergeSearchInput): MergeSearchResult {
  const pageSize = input.pageSize ?? SEARCH_PAGE_SIZE;
  const page = Math.max(1, input.page);
  const curatedKeys = new Set(
    input.curated.map((j) => j.canonicalKey.toLowerCase()),
  );
  const adzunaDeduped = input.adzuna.filter(
    (j) => !curatedKeys.has(j.canonicalKey.toLowerCase()),
  );

  let results: JobListItem[];
  if (adzunaDeduped.length === 0 && input.adzunaTotal === 0) {
    const start = (page - 1) * pageSize;
    results = input.curated.slice(start, start + pageSize);
  } else if (page <= 1) {
    const curatedSlice = input.curated.slice(0, pageSize);
    const fill = adzunaDeduped.slice(
      0,
      Math.max(0, pageSize - curatedSlice.length),
    );
    results = [...curatedSlice, ...fill];
  } else {
    results = adzunaDeduped.slice(0, pageSize);
  }

  const attribution: JobAttribution = results.some((r) => r.source === 'adzuna')
    ? 'Jobs by Adzuna'
    : 'Company career pages';

  return {
    results,
    totalResults: input.adzunaTotal + input.curated.length,
    attribution,
  };
}
