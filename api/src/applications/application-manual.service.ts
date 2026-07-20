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
import {
  resolveCvTextForGeneration,
  resolveJobDescriptionForAts,
} from './application-ats.fingerprint';
import { toApplicationResponse, applicationDetailInclude } from './application.mapper';

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
        include: applicationDetailInclude,
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
        include: applicationDetailInclude,
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
      include: applicationDetailInclude,
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
        include: applicationDetailInclude,
      }),
    );
  }

  async generateAtsReport(userId: string, applicationId: string) {
    await this.usage.assertCanGenerateAi(userId);
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: applicationDetailInclude,
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }

    const jd =
      app.pastedJobDescription?.trim() ||
      (app.jobSnapshot &&
      typeof app.jobSnapshot === 'object' &&
      !Array.isArray(app.jobSnapshot) &&
      typeof (app.jobSnapshot as Record<string, unknown>).description === 'string'
        ? String((app.jobSnapshot as Record<string, unknown>).description).trim()
        : '');
    if (!jd || !app.coverLetterContent?.trim()) {
      throw new AppError(
        'INVALID_OPERATION',
        'Cover letter and job description are required to refresh the ATS report',
        400,
      );
    }

    // First-time MANUAL ATS: show package generating state.
    // Refresh on COMPLETED AI/MANUAL packages: leave status alone (badge handles UX).
    const needsInFlightStatus =
      app.generationMode === ApplicationGenerationMode.MANUAL &&
      app.generationStatus !== ApplicationGenerationStatus.COMPLETED;

    if (needsInFlightStatus) {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          generationStatus: ApplicationGenerationStatus.PENDING,
          generationError: null,
        },
      });
    }

    const jobId = `hybrid-ats-${applicationId}`;
    const existing = await this.aiQueue.getJob(jobId);
    let skipEnqueue = false;
    if (existing) {
      const state = await existing.getState();
      if (state === 'active' || state === 'waiting' || state === 'delayed') {
        skipEnqueue = true;
      } else {
        await existing.remove().catch(() => undefined);
      }
    }
    if (!skipEnqueue) {
      await this.aiQueue.add(
        'hybrid-ats-report',
        { type: 'hybrid-ats-report', applicationId, userId },
        {
          jobId,
          attempts: 2,
          removeOnComplete: 20,
          removeOnFail: 20,
        },
      );
    }

    return toApplicationResponse(
      await this.prisma.application.findFirstOrThrow({
        where: { id: applicationId },
        include: applicationDetailInclude,
      }),
    );
  }

  async generateCv(
    userId: string,
    applicationId: string,
    pastedJobDescription?: string,
  ) {
    await this.usage.assertCanGenerateAi(userId);
    const app = await this.findOwned(userId, applicationId);

    const profile = await this.prisma.profile.findFirst({
      where: { id: app.profileId, userId },
      include: { currentCv: true, careerCv: true },
    });
    const cvText = resolveCvTextForGeneration({
      cvSnapshot: app.cvSnapshot,
      profile,
    });
    if (!cvText) {
      throw new AppError(
        'CV_REQUIRED',
        'Upload and parse a CV before generating a tailored CV',
        400,
      );
    }

    if (pastedJobDescription) {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: { pastedJobDescription },
      });
      app.pastedJobDescription = pastedJobDescription;
    }

    const jd = resolveJobDescriptionForAts(app);
    if (!jd) {
      throw new AppError(
        'INVALID_OPERATION',
        'Job description is required to generate a tailored CV',
        400,
      );
    }

    // CV-only path: never flip package generationStatus (keeps letter/ATS UI
    // stable). Deduplicate concurrent clicks with a stable Bull job id.
    const jobId = `hybrid-cv-${applicationId}`;
    const existing = await this.aiQueue.getJob(jobId);
    let skipEnqueue = false;
    if (existing) {
      const state = await existing.getState();
      if (state === 'active' || state === 'waiting' || state === 'delayed') {
        skipEnqueue = true;
      } else {
        await existing.remove().catch(() => undefined);
      }
    }
    if (!skipEnqueue) {
      await this.aiQueue.add(
        'hybrid-generate-cv',
        { type: 'hybrid-generate-cv', applicationId, userId },
        {
          jobId,
          attempts: 2,
          removeOnComplete: 20,
          removeOnFail: 20,
        },
      );
    }

    return toApplicationResponse(
      await this.prisma.application.findFirstOrThrow({
        where: { id: applicationId },
        include: applicationDetailInclude,
      }),
    );
  }

  private async findManual(userId: string, applicationId: string) {
    const app = await this.findOwned(userId, applicationId);
    if (app.generationMode !== ApplicationGenerationMode.MANUAL) {
      throw new AppError(
        'INVALID_OPERATION',
        'Hybrid AI endpoints require MANUAL applications',
        400,
      );
    }
    return app;
  }

  private async findOwned(userId: string, applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }
    return app;
  }
}
