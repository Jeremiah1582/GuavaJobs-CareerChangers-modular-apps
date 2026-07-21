import { JobSource } from '../../../shared/schemas/job.schema';

export type AtsFetchOptions = {
  /** Display company name (curated boards); defaults to board slug. */
  company?: string;
  /**
   * `adzuna` when enriching an Adzuna listing; `ats_direct` for curated sync
   * and direct board fetches (default).
   */
  source?: JobSource;
};
