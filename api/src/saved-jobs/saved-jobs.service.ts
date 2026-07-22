import { Injectable, Logger } from '@nestjs/common';
import { SavedJobResolveStatus } from '@prisma/client';
import { AppError } from '../shared/schemas/error.schema';
import {
  SaveJobBody,
  SavedJobResponse,
  SavedJobsListResponse,
} from '../shared/schemas/saved-job.schema';
import { JobsService } from '../jobs/jobs.service';
import { PrismaService } from '../prisma/prisma.service';

const RESOLVE_CONCURRENCY = 5;

@Injectable()
export class SavedJobsService {
  private readonly logger = new Logger(SavedJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
  ) {}

  async list(
    userId: string,
    options?: { resolve?: boolean },
  ): Promise<SavedJobsListResponse> {
    const rows = await this.prisma.savedJob.findMany({
      where: { userId },
      orderBy: { savedAt: 'desc' },
    });

    if (options?.resolve && rows.length > 0) {
      const resolved = await this.resolveMany(userId, rows);
      return { results: resolved.map((r) => this.toResponse(r)) };
    }

    return { results: rows.map((r) => this.toResponse(r)) };
  }

  async save(userId: string, body: SaveJobBody): Promise<SavedJobResponse> {
    const canonicalKey = body.canonicalKey.trim().toLowerCase();
    if (!canonicalKey.includes(':')) {
      throw new AppError(
        'INVALID_JOB_KEY',
        'canonicalKey must look like ats:company:id',
        400,
      );
    }

    const row = await this.prisma.savedJob.upsert({
      where: {
        userId_canonicalKey: { userId, canonicalKey },
      },
      create: {
        userId,
        canonicalKey,
        title: body.title?.trim() || null,
        company: body.company?.trim() || null,
        location: body.location === undefined ? null : body.location,
        atsType: body.atsType ?? null,
        salaryMin: body.salaryMin ?? null,
        salaryMax: body.salaryMax ?? null,
        salaryCurrency: body.salaryCurrency ?? null,
        resolveStatus: SavedJobResolveStatus.UNKNOWN,
      },
      update: {
        ...(body.title !== undefined
          ? { title: body.title.trim() || null }
          : {}),
        ...(body.company !== undefined
          ? { company: body.company.trim() || null }
          : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.atsType !== undefined ? { atsType: body.atsType } : {}),
        ...(body.salaryMin !== undefined ? { salaryMin: body.salaryMin } : {}),
        ...(body.salaryMax !== undefined ? { salaryMax: body.salaryMax } : {}),
        ...(body.salaryCurrency !== undefined
          ? { salaryCurrency: body.salaryCurrency }
          : {}),
      },
    });

    return this.toResponse(row);
  }

  async remove(userId: string, rawKey: string): Promise<void> {
    const canonicalKey = decodeURIComponent(rawKey).trim().toLowerCase();
    const existing = await this.prisma.savedJob.findUnique({
      where: { userId_canonicalKey: { userId, canonicalKey } },
    });
    if (!existing) {
      throw new AppError('SAVED_JOB_NOT_FOUND', 'Bookmark not found', 404);
    }
    await this.prisma.savedJob.delete({
      where: { id: existing.id },
    });
  }

  async listKeys(userId: string): Promise<{ canonicalKeys: string[] }> {
    const rows = await this.prisma.savedJob.findMany({
      where: { userId },
      select: { canonicalKey: true },
      orderBy: { savedAt: 'desc' },
    });
    return { canonicalKeys: rows.map((r) => r.canonicalKey) };
  }

  private async resolveMany(
    userId: string,
    rows: Array<{
      id: string;
      userId: string;
      canonicalKey: string;
      savedAt: Date;
      title: string | null;
      company: string | null;
      location: string | null;
      atsType: string | null;
      salaryMin: number | null;
      salaryMax: number | null;
      salaryCurrency: string | null;
      lastResolvedAt: Date | null;
      resolveStatus: SavedJobResolveStatus;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ) {
    const out = [...rows];
    for (let i = 0; i < out.length; i += RESOLVE_CONCURRENCY) {
      const chunk = out.slice(i, i + RESOLVE_CONCURRENCY);
      await Promise.all(
        chunk.map(async (row, chunkIndex) => {
          const updated = await this.resolveOne(userId, row);
          out[i + chunkIndex] = updated;
        }),
      );
    }
    return out;
  }

  private async resolveOne(
    userId: string,
    row: {
      id: string;
      userId: string;
      canonicalKey: string;
      savedAt: Date;
      title: string | null;
      company: string | null;
      location: string | null;
      atsType: string | null;
      salaryMin: number | null;
      salaryMax: number | null;
      salaryCurrency: string | null;
      lastResolvedAt: Date | null;
      resolveStatus: SavedJobResolveStatus;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    try {
      const job = await this.jobs.getByCanonicalKey(row.canonicalKey);
      return this.prisma.savedJob.update({
        where: { id: row.id },
        data: {
          title: job.title,
          company: job.company,
          location: job.location,
          atsType: job.atsType,
          salaryMin: job.salaryMin ?? null,
          salaryMax: job.salaryMax ?? null,
          salaryCurrency: job.salaryCurrency ?? null,
          lastResolvedAt: new Date(),
          resolveStatus: SavedJobResolveStatus.LIVE,
        },
      });
    } catch (err) {
      if (err instanceof AppError && err.code === 'JOB_NOT_FOUND') {
        return this.prisma.savedJob.update({
          where: { id: row.id },
          data: {
            lastResolvedAt: new Date(),
            resolveStatus: SavedJobResolveStatus.GONE,
          },
        });
      }
      this.logger.warn(
        `Bookmark resolve failed for ${row.canonicalKey} (user ${userId}): ${
          err instanceof Error ? err.message : err
        }`,
      );
      return this.prisma.savedJob.update({
        where: { id: row.id },
        data: {
          lastResolvedAt: new Date(),
          resolveStatus: SavedJobResolveStatus.UNKNOWN,
        },
      });
    }
  }

  private toResponse(row: {
    id: string;
    canonicalKey: string;
    savedAt: Date;
    title: string | null;
    company: string | null;
    location: string | null;
    atsType: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    lastResolvedAt: Date | null;
    resolveStatus: SavedJobResolveStatus;
  }): SavedJobResponse {
    return {
      id: row.id,
      canonicalKey: row.canonicalKey,
      savedAt: row.savedAt.toISOString(),
      title: row.title,
      company: row.company,
      location: row.location,
      atsType: row.atsType,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      salaryCurrency: row.salaryCurrency,
      lastResolvedAt: row.lastResolvedAt?.toISOString() ?? null,
      resolveStatus: row.resolveStatus,
    };
  }
}
