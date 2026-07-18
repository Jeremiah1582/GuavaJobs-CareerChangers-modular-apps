import { Injectable, Logger } from '@nestjs/common';
import {
  ApplicationGenerationMode,
  ApplicationGenerationStatus,
  Prisma,
} from '@prisma/client';
import { AtsReportGenerator } from '../ai/ats-report.generator';
import { CoverLetterGenerator } from '../ai/cover-letter.generator';
import { JobFactsParser } from '../ai/job-facts.parser';
import { JobsService } from '../jobs/jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../users/usage.service';
import { AiGenerationJobData } from '../queue/queue.constants';
import { ApplicationSnapshotService } from './application-snapshot.service';

@Injectable()
export class ApplicationAiWorkerService {
  private readonly logger = new Logger(ApplicationAiWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    private readonly snapshots: ApplicationSnapshotService,
    private readonly coverLetterGen: CoverLetterGenerator,
    private readonly atsReportGen: AtsReportGenerator,
    private readonly jobFacts: JobFactsParser,
    private readonly usage: UsageService,
  ) {}

  async process(job: AiGenerationJobData): Promise<void> {
    await this.prisma.application.update({
      where: { id: job.applicationId },
      data: { generationStatus: ApplicationGenerationStatus.PROCESSING },
    });

    try {
      switch (job.type) {
        case 'generate':
          await this.runFullGenerate(job);
          break;
        case 'regenerate':
          await this.runRegenerate(job);
          break;
        case 'hybrid-cover-letter':
          await this.runHybridCoverLetter(job);
          break;
        case 'hybrid-ats-report':
          await this.runHybridAtsReport(job);
          break;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'AI generation failed';
      this.logger.error(`Job ${job.type} failed for ${job.applicationId}: ${message}`);
      await this.prisma.application.update({
        where: { id: job.applicationId },
        data: {
          generationStatus: ApplicationGenerationStatus.FAILED,
          generationError: message,
        },
      });
      throw error;
    }
  }

  private async runFullGenerate(job: AiGenerationJobData): Promise<void> {
    const app = await this.prisma.application.findFirstOrThrow({
      where: { id: job.applicationId, userId: job.userId },
    });

    if (!app.canonicalJobKey) {
      throw new Error('Missing canonicalJobKey');
    }

    const jobData = await this.resolveJobForWorker(
      app.canonicalJobKey,
      app.jobSnapshot,
    );
    const bundle = await this.snapshots.buildForGenerate(
      job.userId,
      app.profileId,
      app.id,
      jobData,
    );

    const facts = this.jobFacts.parseFromJob(jobData);
    const cvText = String(bundle.cvSnapshot.parsedText ?? '');
    const coverLetter = await this.coverLetterGen.generate({
      jobTitle: jobData.title,
      companyName: jobData.company,
      jobDescription: jobData.description,
      profileSummary: bundle.profileSnapshot,
      cvText,
    });

    const ats = await this.atsReportGen.generate({
      jobTitle: jobData.title,
      companyName: jobData.company,
      jobDescription: jobData.description,
      coverLetter: coverLetter.coverLetter,
      cvText,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: app.id },
        data: {
          jobSnapshot: bundle.jobSnapshot as Prisma.InputJsonValue,
          profileSnapshot: bundle.profileSnapshot as Prisma.InputJsonValue,
          cvSnapshot: bundle.cvSnapshot as Prisma.InputJsonValue,
          cvStorageKey: bundle.cvStorageKey,
          applyUrl: bundle.applyUrl,
          snapshottedAt: new Date(),
          coverLetterContent: coverLetter.coverLetter,
          coverLetterSource: 'AI',
          coverLetterEdited: false,
          generationStatus: ApplicationGenerationStatus.COMPLETED,
          generationError: null,
          ...facts,
        },
      });

      await tx.applicationAtsReport.upsert({
        where: { applicationId: app.id },
        create: {
          applicationId: app.id,
          score: ats.score,
          letterScore: ats.letterScore ?? null,
          cvScore: ats.cvScore ?? null,
          missingKeywords: ats.missingKeywords,
          suggestions: ats.suggestions,
          strengths: ats.strengths,
          gaps: ats.gaps,
          actionableSteps: ats.actionableSteps,
          keywordCoverage: ats.keywordCoverage,
          icpMatch: ats.icpMatch as Prisma.InputJsonValue,
          breakdown: ats.breakdown,
          assessedAt: new Date(),
        },
        update: {
          score: ats.score,
          letterScore: ats.letterScore ?? null,
          cvScore: ats.cvScore ?? null,
          missingKeywords: ats.missingKeywords,
          suggestions: ats.suggestions,
          strengths: ats.strengths,
          gaps: ats.gaps,
          actionableSteps: ats.actionableSteps,
          keywordCoverage: ats.keywordCoverage,
          icpMatch: ats.icpMatch as Prisma.InputJsonValue,
          breakdown: ats.breakdown,
          assessedAt: new Date(),
        },
      });
    });

    await this.usage.incrementAiUsage(job.userId);
  }

  private async resolveJobForWorker(
    canonicalJobKey: string,
    storedSnapshot: unknown,
  ): Promise<import('../shared/schemas/job.schema').UnifiedJob> {
    try {
      return await this.jobs.getByCanonicalKey(canonicalJobKey, {
        expandAts: true,
      });
    } catch (error) {
      const fromStore = this.jobFromSnapshot(canonicalJobKey, storedSnapshot);
      if (fromStore) {
        this.logger.warn(
          `Worker using stored jobSnapshot for ${canonicalJobKey} (cache miss)`,
        );
        return fromStore;
      }
      throw error;
    }
  }

  private jobFromSnapshot(
    canonicalJobKey: string,
    snapshot: unknown,
  ): import('../shared/schemas/job.schema').UnifiedJob | null {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return null;
    }
    const row = snapshot as Record<string, unknown>;
    const title = typeof row.title === 'string' ? row.title : null;
    const company = typeof row.company === 'string' ? row.company : null;
    const description =
      typeof row.description === 'string' ? row.description : null;
    if (!title || !company || !description) {
      return null;
    }
    const applyUrl =
      typeof row.applyUrl === 'string' && row.applyUrl
        ? row.applyUrl
        : 'https://www.adzuna.com';
    return {
      canonicalKey: canonicalJobKey,
      title,
      company,
      location: typeof row.location === 'string' ? row.location : null,
      snippet: description.slice(0, 280),
      description,
      applyUrl,
      atsType:
        row.atsType === 'greenhouse' ||
        row.atsType === 'lever' ||
        row.atsType === 'ashby' ||
        row.atsType === 'adzuna' ||
        row.atsType === 'unknown'
          ? row.atsType
          : 'adzuna',
      hasFullDescription: description.length > 200,
      applyType: applyUrl.startsWith('http') ? 'url' : 'unknown',
      source: 'adzuna',
      fetchedAt:
        typeof row.fetchedAt === 'string'
          ? row.fetchedAt
          : new Date().toISOString(),
    };
  }

  private async runRegenerate(job: AiGenerationJobData): Promise<void> {
    await this.runFullGenerate(job);
  }

  private async runHybridCoverLetter(job: AiGenerationJobData): Promise<void> {
    const app = await this.prisma.application.findFirstOrThrow({
      where: { id: job.applicationId, userId: job.userId },
      include: { profile: { include: { currentCv: true } } },
    });

    if (app.generationMode !== ApplicationGenerationMode.MANUAL) {
      throw new Error('Hybrid cover letter requires MANUAL application');
    }

    const jd =
      app.pastedJobDescription?.trim() ||
      String(jsonField(app.jobSnapshot, 'description') ?? '');

    if (!jd) {
      throw new Error('pastedJobDescription is required');
    }

    const cvText = app.profile.currentCv?.parsedText ?? '';
    const coverLetter = await this.coverLetterGen.generate({
      jobTitle: app.jobRoleTitle ?? 'Role',
      companyName: app.companyName ?? 'Company',
      jobDescription: jd,
      profileSummary: {
        jobTitle: app.profile.jobTitle,
        summary: app.profile.summary,
        skills: app.profile.skills,
      },
      cvText,
    });

    await this.prisma.application.update({
      where: { id: app.id },
      data: {
        coverLetterContent: coverLetter.coverLetter,
        coverLetterSource: 'AI',
        generationStatus: ApplicationGenerationStatus.COMPLETED,
        generationError: null,
      },
    });

    await this.usage.incrementAiUsage(job.userId);
  }

  private async runHybridAtsReport(job: AiGenerationJobData): Promise<void> {
    const app = await this.prisma.application.findFirstOrThrow({
      where: { id: job.applicationId, userId: job.userId },
      include: { profile: { include: { currentCv: true } } },
    });

    const jd =
      app.pastedJobDescription?.trim() ||
      String(jsonField(app.jobSnapshot, 'description') ?? '');

    if (!jd || !app.coverLetterContent) {
      throw new Error('Cover letter and job description required for ATS report');
    }

    const ats = await this.atsReportGen.generate({
      jobTitle: app.jobRoleTitle ?? 'Role',
      companyName: app.companyName ?? 'Company',
      jobDescription: jd,
      coverLetter: app.coverLetterContent,
      cvText: app.profile.currentCv?.parsedText ?? '',
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.applicationAtsReport.upsert({
        where: { applicationId: app.id },
        create: {
          applicationId: app.id,
          score: ats.score,
          letterScore: ats.letterScore ?? null,
          cvScore: ats.cvScore ?? null,
          missingKeywords: ats.missingKeywords,
          suggestions: ats.suggestions,
          strengths: ats.strengths,
          gaps: ats.gaps,
          actionableSteps: ats.actionableSteps,
          keywordCoverage: ats.keywordCoverage,
          icpMatch: ats.icpMatch as Prisma.InputJsonValue,
          breakdown: ats.breakdown,
          assessedAt: new Date(),
        },
        update: {
          score: ats.score,
          letterScore: ats.letterScore ?? null,
          cvScore: ats.cvScore ?? null,
          missingKeywords: ats.missingKeywords,
          suggestions: ats.suggestions,
          strengths: ats.strengths,
          gaps: ats.gaps,
          actionableSteps: ats.actionableSteps,
          keywordCoverage: ats.keywordCoverage,
          icpMatch: ats.icpMatch as Prisma.InputJsonValue,
          breakdown: ats.breakdown,
          assessedAt: new Date(),
        },
      });

      await tx.application.update({
        where: { id: app.id },
        data: {
          generationStatus: ApplicationGenerationStatus.COMPLETED,
          generationError: null,
        },
      });
    });

    await this.usage.incrementAiUsage(job.userId);
  }
}

function jsonField(json: unknown, key: string): unknown {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  return (json as Record<string, unknown>)[key];
}
