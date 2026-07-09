import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import {
  ApplicationGenerationMode,
  ApplicationGenerationStatus,
  ApplicationStatus,
} from '@prisma/client';
import { Queue } from 'bullmq';
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
    @InjectQueue(AI_GENERATION_QUEUE)
    private readonly aiQueue: Queue<AiGenerationJobData>,
  ) {}

  create(userId: string, input: CreateManualApplicationInput) {
    return this.prisma.profile
      .findFirst({ where: { id: input.profileId, userId } })
      .then((profile) => {
        if (!profile) {
          throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
        }
        return this.prisma.application.create({
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
      })
      .then((app) => toApplicationResponse(app));
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
