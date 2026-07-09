import { Injectable } from '@nestjs/common';
import { parseCanonicalKey } from '../ats/canonical-key.util';
import { AshbyAdapter } from '../ats/adapters/ashby.adapter';
import { GreenhouseAdapter } from '../ats/adapters/greenhouse.adapter';
import { LeverAdapter } from '../ats/adapters/lever.adapter';

@Injectable()
export class AtsEnrichmentService {
  constructor(
    private readonly greenhouse: GreenhouseAdapter,
    private readonly lever: LeverAdapter,
    private readonly ashby: AshbyAdapter,
  ) {}

  async fetchByCanonicalKey(canonicalKey: string) {
    const parsed = parseCanonicalKey(canonicalKey);
    if (!parsed) {
      return null;
    }

    switch (parsed.atsType) {
      case 'greenhouse':
        return this.greenhouse.fetchJob(parsed.board, parsed.jobId);
      case 'lever':
        return this.lever.fetchJob(parsed.board, parsed.jobId);
      case 'ashby':
        return this.ashby.fetchJob(parsed.board, parsed.jobId);
      default:
        return null;
    }
  }
}
