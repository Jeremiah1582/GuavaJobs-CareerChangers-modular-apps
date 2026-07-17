import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import {
  ApplicationGenerationMode,
  ApplicationGenerationStatus,
  ApplicationStatus,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { JobsService } from '../jobs/jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AI_GENERATION_QUEUE, AiGenerationJobData } from '../queue/queue.constants';
import { AppError } from '../shared/schemas/error.schema';
import { GenerateApplicationInput } from '../shared/schemas/application.schema';
import { UsageService } from '../users/usage.service';
import { toApplicationResponse } from './application.mapper';
import { IdempotencyService } from './idempotency.service';

@Injectable()
export class ApplicationGenerateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    private readonly usage: UsageService,
    private readonly idempotency: IdempotencyService,
    @InjectQueue(AI_GENERATION_QUEUE)
    private readonly aiQueue: Queue<AiGenerationJobData>,
  ) {}

  async generate(
    userId: string,
    input: GenerateApplicationInput,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const existingId = await this.idempotency.getExistingApplicationId(
        userId,
        idempotencyKey,
      );
      if (existingId) {
        const existing = await this.getOwnedApplication(userId, existingId);
        if (this.isStuckGeneration(existing)) {
          await this.requeueStuck(userId, existing.id, 'generate');
          const refreshed = await this.getOwnedApplication(userId, existing.id);
          return {
            statusCode: 202 as const,
            body: toApplicationResponse(refreshed),
          };
        }
        return { statusCode: 202 as const, body: toApplicationResponse(existing) };
      }
    }

    await this.usage.assertCanGenerateAi(userId);

    const profile = await this.prisma.profile.findFirst({
      where: { id: input.profileId, userId },
      include: { currentCv: true },
    });
    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }
    if (!profile.currentCv?.parsedText) {
      throw new AppError('CV_REQUIRED', 'Upload and parse a CV first', 400);
    }

    const canonicalJobKey = input.canonicalJobKey.toLowerCase();
    await this.jobs.getByCanonicalKey(canonicalJobKey);

    const duplicate = await this.prisma.application.findFirst({
      where: { userId, canonicalJobKey },
      include: { atsReport: true },
    });
    if (duplicate) {
      // Stuck PENDING/PROCESSING (worker down / Redis / LLM) — re-enqueue without a new row.
      if (this.isStuckGeneration(duplicate)) {
        await this.requeueStuck(userId, duplicate.id, 'generate');
        const refreshed = await this.getOwnedApplication(userId, duplicate.id);
        return {
          statusCode: 202 as const,
          body: toApplicationResponse(refreshed),
        };
      }
      // Tracker row saved from a public listing (MANUAL, no AI yet) — upgrade in place.
      if (
        duplicate.generationMode === ApplicationGenerationMode.MANUAL &&
        duplicate.generationStatus == null
      ) {
        const upgraded = await this.prisma.application.update({
          where: { id: duplicate.id },
          data: {
            profileId: input.profileId,
            generationMode: ApplicationGenerationMode.AI,
            generationStatus: ApplicationGenerationStatus.PENDING,
            generationError: null,
          },
          include: { atsReport: true },
        });
        if (idempotencyKey) {
          await this.idempotency.bind(userId, idempotencyKey, upgraded.id);
        }
        await this.enqueue({
          type: 'generate',
          applicationId: upgraded.id,
          userId,
        });
        return {
          statusCode: 202 as const,
          body: toApplicationResponse(upgraded),
        };
      }
      return { statusCode: 200 as const, body: toApplicationResponse(duplicate) };
    }

    const application = await this.prisma.application.create({
      data: {
        userId,
        profileId: input.profileId,
        status: ApplicationStatus.DRAFT,
        generationMode: ApplicationGenerationMode.AI,
        canonicalJobKey,
        generationStatus: ApplicationGenerationStatus.PENDING,
      },
      include: { atsReport: true },
    });

    if (idempotencyKey) {
      await this.idempotency.bind(userId, idempotencyKey, application.id);
    }

    await this.enqueue({
      type: 'generate',
      applicationId: application.id,
      userId,
    });

    return { statusCode: 202 as const, body: toApplicationResponse(application) };
  }

  async regenerate(userId: string, applicationId: string) {
    const app = await this.getOwnedApplication(userId, applicationId);
    if (app.generationMode !== ApplicationGenerationMode.AI) {
      throw new AppError(
        'INVALID_OPERATION',
        'Regenerate is only for AI applications',
        400,
      );
    }

    const stuck =
      app.generationStatus === ApplicationGenerationStatus.PENDING ||
      app.generationStatus === ApplicationGenerationStatus.PROCESSING;

    // Re-queue of a stuck job must not consume another quota credit.
    if (!stuck) {
      await this.usage.assertCanGenerateAi(userId);
    }

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        generationStatus: ApplicationGenerationStatus.PENDING,
        generationError: null,
      },
    });

    await this.enqueue({
      type: stuck ? 'generate' : 'regenerate',
      applicationId,
      userId,
    });

    const updated = await this.getOwnedApplication(userId, applicationId);
    return toApplicationResponse(updated);
  }

  /** Pending/processing with no progress for STUCK_MS → worker likely never ran. */
  private isStuckGeneration(app: {
    generationStatus: ApplicationGenerationStatus | null;
    updatedAt: Date;
  }): boolean {
    if (
      app.generationStatus !== ApplicationGenerationStatus.PENDING &&
      app.generationStatus !== ApplicationGenerationStatus.PROCESSING
    ) {
      return false;
    }
    const ageMs = Date.now() - app.updatedAt.getTime();
    return ageMs >= ApplicationGenerateService.STUCK_MS;
  }

  private static readonly STUCK_MS = 30_000;

  private async requeueStuck(
    userId: string,
    applicationId: string,
    type: AiGenerationJobData['type'],
  ): Promise<void> {
    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        generationStatus: ApplicationGenerationStatus.PENDING,
        generationError: null,
      },
    });
    await this.enqueue({ type, applicationId, userId });
  }

  private async enqueue(data: AiGenerationJobData): Promise<void> {
    await this.aiQueue.add(data.type, data, {
      jobId: `${data.type}-${data.applicationId}-${Date.now()}`,
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
    });
  }

  private async getOwnedApplication(userId: string, applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { atsReport: true },
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }
    return app;
  }
}
