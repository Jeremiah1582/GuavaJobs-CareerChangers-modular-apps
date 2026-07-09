import { Module } from '@nestjs/common';
import { AdzunaClient } from './adzuna/adzuna.client';
import { AdzunaRateLimitService } from './adzuna/adzuna-rate-limit.service';
import { JobCacheService } from './cache/job-cache.service';
import { AshbyAdapter } from './ats/adapters/ashby.adapter';
import { GreenhouseAdapter } from './ats/adapters/greenhouse.adapter';
import { LeverAdapter } from './ats/adapters/lever.adapter';
import { AtsEnrichmentService } from './ats/ats-enrichment.service';
import { AtsResolverService } from './ats/ats-resolver.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    AdzunaClient,
    AdzunaRateLimitService,
    JobCacheService,
    AtsResolverService,
    AtsEnrichmentService,
    GreenhouseAdapter,
    LeverAdapter,
    AshbyAdapter,
  ],
  exports: [JobsService, JobCacheService],
})
export class JobsModule {}
