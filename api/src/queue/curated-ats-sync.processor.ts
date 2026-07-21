import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GreenhouseAdapter } from '../jobs/ats/adapters/greenhouse.adapter';
import { LeverAdapter } from '../jobs/ats/adapters/lever.adapter';
import { AshbyAdapter } from '../jobs/ats/adapters/ashby.adapter';
import { JobCacheService } from '../jobs/cache/job-cache.service';
import { loadCuratedBoards } from '../jobs/curated/curated-boards.loader';
import { CURATED_ATS_SYNC_QUEUE } from './queue.constants';

export type CuratedAtsSyncResult = {
  boardsOk: number;
  boardsFailed: number;
  jobsWritten: number;
  keysRemoved: number;
};

@Processor(CURATED_ATS_SYNC_QUEUE)
export class CuratedAtsSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CuratedAtsSyncProcessor.name);

  constructor(
    private readonly cache: JobCacheService,
    private readonly greenhouse: GreenhouseAdapter,
    private readonly lever: LeverAdapter,
    private readonly ashby: AshbyAdapter,
  ) {
    super();
  }

  async process(_job: Job): Promise<CuratedAtsSyncResult> {
    return this.syncAllBoards();
  }

  /** Exposed for unit tests. */
  async syncAllBoards(): Promise<CuratedAtsSyncResult> {
    const boards = loadCuratedBoards();
    let boardsOk = 0;
    let boardsFailed = 0;
    let jobsWritten = 0;
    let keysRemoved = 0;

    for (const board of boards) {
      try {
        const jobs = await this.listForBoard(board.atsType, board.board, {
          company: board.company,
          source: 'ats_direct',
        });
        const { added, removed } = await this.cache.replaceBoardJobs(
          board.atsType,
          board.board,
          jobs,
        );
        boardsOk += 1;
        jobsWritten += added;
        keysRemoved += removed;
        this.logger.log(
          `Curated sync ${board.atsType}:${board.board} — ${added} jobs (${removed} stale removed)`,
        );
      } catch (err) {
        boardsFailed += 1;
        this.logger.warn(
          `Curated sync failed for ${board.atsType}:${board.board}: ${
            err instanceof Error ? err.message : err
          }`,
        );
      }
    }

    await this.cache.bumpCuratedVersion();
    this.logger.log(
      `Curated ATS sync complete: ${boardsOk} ok, ${boardsFailed} failed, ${jobsWritten} jobs`,
    );

    return { boardsOk, boardsFailed, jobsWritten, keysRemoved };
  }

  private async listForBoard(
    atsType: string,
    board: string,
    options: { company: string; source: 'ats_direct' },
  ) {
    switch (atsType) {
      case 'greenhouse':
        return this.greenhouse.listJobs(board, options);
      case 'lever':
        return this.lever.listJobs(board, options);
      case 'ashby':
        return this.ashby.listJobs(board, options);
      default:
        throw new Error(`Unsupported curated ATS type: ${atsType}`);
    }
  }
}
