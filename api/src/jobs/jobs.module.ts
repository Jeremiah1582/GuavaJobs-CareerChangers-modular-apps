import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { shouldRunBullmqWorkers } from '../config/workers';
import { CURATED_ATS_SYNC_QUEUE } from '../queue/queue.constants';
import { CuratedAtsSyncProcessor } from '../queue/curated-ats-sync.processor';
import { CuratedAtsSyncScheduler } from '../queue/curated-ats-sync.scheduler';
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

const curatedWorkerProviders = shouldRunBullmqWorkers()
  ? [CuratedAtsSyncProcessor]
  : [];

@Module({
  imports: [BullModule.registerQueue({ name: CURATED_ATS_SYNC_QUEUE })],
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
    CuratedAtsSyncScheduler,
    ...curatedWorkerProviders,
  ],
  exports: [JobsService, JobCacheService],
})
export class JobsModule {}
