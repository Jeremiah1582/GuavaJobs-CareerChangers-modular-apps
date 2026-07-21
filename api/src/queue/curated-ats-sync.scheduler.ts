import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobCacheService } from '../jobs/cache/job-cache.service';
import {
  CURATED_ATS_SYNC_EVERY_MS,
  CURATED_ATS_SYNC_QUEUE,
} from './queue.constants';

/**
 * Registers the 6h repeatable sync and boots once when the curated index is empty.
 * Always runs in the API process (even when workers are split out).
 */
@Injectable()
export class CuratedAtsSyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(CuratedAtsSyncScheduler.name);

  constructor(
    @InjectQueue(CURATED_ATS_SYNC_QUEUE)
    private readonly queue: Queue,
    private readonly cache: JobCacheService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureRepeatable();
      await this.maybeBootSync();
    } catch (err) {
      this.logger.warn(
        `Curated ATS scheduler init failed: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  private async ensureRepeatable(): Promise<void> {
    const existing = await this.queue.getRepeatableJobs();
    const already = existing.some(
      (j) => j.name === 'sync' && j.every === String(CURATED_ATS_SYNC_EVERY_MS),
    );
    if (already) {
      return;
    }
    await this.queue.add(
      'sync',
      {},
      {
        repeat: { every: CURATED_ATS_SYNC_EVERY_MS },
        removeOnComplete: 20,
        removeOnFail: 50,
      },
    );
    this.logger.log(
      `Registered curated ATS sync every ${CURATED_ATS_SYNC_EVERY_MS / 3600000}h`,
    );
  }

  private async maybeBootSync(): Promise<void> {
    const count = await this.cache.countCuratedKeys();
    if (count > 0) {
      return;
    }
    await this.queue.add(
      'sync',
      { reason: 'boot' },
      {
        jobId: `curated-ats-boot-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: 20,
      },
    );
    this.logger.log('Enqueued boot curated ATS sync (index empty)');
  }
}
