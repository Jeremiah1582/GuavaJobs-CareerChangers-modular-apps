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
import { CreateManualApplicationInput } from '../shared/schemas/application.schema';
import { UsageService } from '../users/usage.service';
import { toApplicationResponse } from './application.mapper';

@Injectable()
export class ApplicationManualService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly jobs: JobsService,
    @InjectQueue(AI_GENERATION_QUEUE)
    private readonly aiQueue: Queue<AiGenerationJobData>,
  ) {}

  async create(userId: string, input: CreateManualApplicationInput) {
    const profile = await this.prisma.profile.findFirst({
      where: { id: input.profileId, userId },
    });
    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }

    if (input.canonicalJobKey) {
      const canonicalJobKey = input.canonicalJobKey.toLowerCase();
      const existing = await this.prisma.application.findFirst({
        where: { userId, canonicalJobKey },
        include: { atsReport: true },
      });
      if (existing) {
        return toApplicationResponse(existing);
      }

      const job = await this.jobs.getByCanonicalKey(canonicalJobKey, {
        expandAts: true,
      });

      const app = await this.prisma.application.create({
        data: {
          userId,
          profileId: input.profileId,
          status: input.status ?? ApplicationStatus.DRAFT,
          generationMode: ApplicationGenerationMode.MANUAL,
          canonicalJobKey,
          companyName: job.company,
          jobRoleTitle: job.title,
          jobLocation: job.location ?? undefined,
          applyUrl: job.applyUrl,
          sourceOfListing:
            input.sourceOfListing ??
            (job.atsType === 'adzuna' ? 'Jobs by Adzuna' : job.atsType),
          jobSalaryMin: job.salaryMin ?? undefined,
          jobSalaryMax: job.salaryMax ?? undefined,
          jobSalaryCurrency: job.salaryCurrency ?? undefined,
          pastedJobDescription: job.description?.slice(0, 50_000) || undefined,
        },
        include: { atsReport: true },
      });

      return toApplicationResponse(app);
    }

    if (!input.companyName || !input.jobRoleTitle) {
      throw new AppError(
        'VALIDATION_ERROR',
        'companyName and jobRoleTitle are required',
        400,
      );
    }

    const app = await this.prisma.application.create({
      data: {
        userId,
        profileId: input.profileId,
        status: input.status ?? ApplicationStatus.DRAFT,
        generationMode: ApplicationGenerationMode.MANUAL,
        companyName: input.companyName,
        jobRoleTitle: input.jobRoleTitle,
        jobLocation: input.jobLocation,
        jobWebsite: input.jobWebsite,
        industry: input.industry,
        sourceOfListing: input.sourceOfListing,
        languageRequired: input.languageRequired ?? [],
        jobStartDate: input.jobStartDate
          ? new Date(input.jobStartDate)
          : undefined,
        jobSalaryMin: input.jobSalaryMin,
        jobSalaryMax: input.jobSalaryMax,
        jobSalaryCurrency: input.jobSalaryCurrency,
        jobSalaryPeriod: input.jobSalaryPeriod,
        jobSalaryRaw: input.jobSalaryRaw,
        userFitRating: input.userFitRating,
        applyUrl: input.applyUrl,
        pastedJobDescription: input.pastedJobDescription,
      },
      include: { atsReport: true },
    });

    return toApplicationResponse(app);
  }

  async generateCoverLetter(
    userId: string,
    applicationId: string,
    pastedJobDescription?: string,
  ) {
    await this.usage.assertCanGenerateAi(userId);
    const app = await this.findManual(userId, applicationId);

    if (pastedJobDescription) {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: { pastedJobDescription },
      });
    }

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        generationStatus: ApplicationGenerationStatus.PENDING,
        generationError: null,
      },
    });

    await this.aiQueue.add(
      'hybrid-cover-letter',
      { type: 'hybrid-cover-letter', applicationId, userId },
      {
        jobId: `hybrid-cl-${applicationId}-${Date.now()}`,
        attempts: 2,
      },
    );

    return toApplicationResponse(
      await this.prisma.application.findFirstOrThrow({
        where: { id: applicationId },
        include: { atsReport: true },
      }),
    );
  }

  async generateAtsReport(userId: string, applicationId: string) {
    await this.usage.assertCanGenerateAi(userId);
    await this.findManual(userId, applicationId);

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        generationStatus: ApplicationGenerationStatus.PENDING,
        generationError: null,
      },
    });

    await this.aiQueue.add(
      'hybrid-ats-report',
      { type: 'hybrid-ats-report', applicationId, userId },
      {
        jobId: `hybrid-ats-${applicationId}-${Date.now()}`,
        attempts: 2,
      },
    );

    return toApplicationResponse(
      await this.prisma.application.findFirstOrThrow({
        where: { id: applicationId },
        include: { atsReport: true },
      }),
    );
  }

  private async findManual(userId: string, applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }
    if (app.generationMode !== ApplicationGenerationMode.MANUAL) {
      throw new AppError(
        'INVALID_OPERATION',
        'Hybrid AI endpoints require MANUAL applications',
        400,
      );
    }
    return app;
  }
}
