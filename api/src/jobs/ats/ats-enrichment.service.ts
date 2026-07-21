import { Injectable } from '@nestjs/common';
import { JobSource } from '../../shared/schemas/job.schema';
import { parseCanonicalKey } from './canonical-key.util';
import { AshbyAdapter } from './adapters/ashby.adapter';
import { GreenhouseAdapter } from './adapters/greenhouse.adapter';
import { LeverAdapter } from './adapters/lever.adapter';
import { AtsFetchOptions } from './adapters/adapter-options';

@Injectable()
export class AtsEnrichmentService {
  constructor(
    private readonly greenhouse: GreenhouseAdapter,
    private readonly lever: LeverAdapter,
    private readonly ashby: AshbyAdapter,
  ) {}

  async fetchByCanonicalKey(
    canonicalKey: string,
    options?: AtsFetchOptions,
  ) {
    const parsed = parseCanonicalKey(canonicalKey);
    if (!parsed) {
      return null;
    }

    const opts: AtsFetchOptions = {
      source: options?.source ?? ('ats_direct' as JobSource),
      company: options?.company,
    };

    switch (parsed.atsType) {
      case 'greenhouse':
        return this.greenhouse.fetchJob(parsed.board, parsed.jobId, opts);
      case 'lever':
        return this.lever.fetchJob(parsed.board, parsed.jobId, opts);
      case 'ashby':
        return this.ashby.fetchJob(parsed.board, parsed.jobId, opts);
      default:
        return null;
    }
  }
}
