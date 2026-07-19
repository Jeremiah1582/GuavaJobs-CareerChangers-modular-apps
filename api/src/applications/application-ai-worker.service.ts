import { Injectable, Logger } from '@nestjs/common';
import {
  ApplicationGenerationMode,
  ApplicationGenerationStatus,
  Prisma,
} from '@prisma/client';
import { AtsReportGenerator } from '../ai/ats-report.generator';
import { CoverLetterGenerator } from '../ai/cover-letter.generator';
import { GeneratedCvGenerator } from '../ai/generated-cv.generator';
import { JobFactsParser } from '../ai/job-facts.parser';
import { JobsService } from '../jobs/jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { preferencesFromMetadata } from '../shared/schemas/user.schema';
import { UsageService } from '../users/usage.service';
import { AiGenerationJobData } from '../queue/queue.constants';
import { ApplicationSnapshotService } from './application-snapshot.service';
import {
  buildApplicationAtsFingerprint,
  resolveCvTextForAts,
  resolveJobDescriptionForAts,
} from './application-ats.fingerprint';

@Injectable()
export class ApplicationAiWorkerService {
  private readonly logger = new Logger(ApplicationAiWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    private readonly snapshots: ApplicationSnapshotService,
    private readonly coverLetterGen: CoverLetterGenerator,
    private readonly generatedCvGen: GeneratedCvGenerator,
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
        case 'hybrid-generate-cv':
          await this.runHybridGenerateCv(job);
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

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: job.userId },
      select: { metadata: true },
    });
    const prefs = preferencesFromMetadata(user.metadata);
    const existingGeneratedCv = await this.prisma.generatedCv.findUnique({
      where: { applicationId: app.id },
      select: { id: true },
    });
    // Regenerate tailored CV when preference is on, user already has one, or chose GENERATED.
    const shouldGenerateCv =
      prefs.autoGenerateTailoredCv ||
      !!existingGeneratedCv ||
      app.cvChoice === 'GENERATED';

    const jobData = await this.resolveJobForWorker({
      canonicalJobKey: app.canonicalJobKey,
      jobSnapshot: app.jobSnapshot,
      pastedJobDescription: app.pastedJobDescription,
      jobRoleTitle: app.jobRoleTitle,
      companyName: app.companyName,
      applyUrl: app.applyUrl,
    });
    const bundle = await this.snapshots.buildForGenerate(
      job.userId,
      app.profileId,
      app.id,
      jobData,
    );

    // Prefer pasted full JD, then snapshot description, then resolved job.
    const jobDescription =
      app.pastedJobDescription?.trim() ||
      String(jsonField(bundle.jobSnapshot, 'description') ?? '') ||
      jobData.description;

    const facts = this.jobFacts.parseFromJob(jobData);
    const cvText = String(bundle.cvSnapshot.parsedText ?? '');
    const sourceCvDocumentId =
      typeof bundle.cvSnapshot.cvDocumentId === 'string'
        ? bundle.cvSnapshot.cvDocumentId
        : null;

    const genInput = {
      jobTitle: jobData.title,
      companyName: jobData.company,
      jobDescription,
      profileSummary: bundle.profileSnapshot,
      cvText,
    };

    // Soft-fail GeneratedCv so a Zod/LLM CV error never blocks letter + ATS.
    const [coverLetter, generatedCv] = await Promise.all([
      this.coverLetterGen.generate(genInput),
      shouldGenerateCv
        ? this.generatedCvGen.generate(genInput).catch((error: unknown) => {
            const message =
              error instanceof Error ? error.message : 'Generated CV failed';
            this.logger.warn(
              `GeneratedCv soft-failed for ${app.id} (package continues): ${message}`,
            );
            return null;
          })
        : Promise.resolve(null),
    ]);

    const ats = await this.atsReportGen.generate({
      jobTitle: jobData.title,
      companyName: jobData.company,
      jobDescription,
      coverLetter: coverLetter.coverLetter,
      cvText,
    });

    const atsFingerprint = buildApplicationAtsFingerprint({
      jobDescription,
      coverLetter: coverLetter.coverLetter,
      // Score against the CV the user currently has selected (not a draft they haven't chosen).
      cvText,
      cvChoice: app.cvChoice,
    });

    // Keep pasted JD in snapshot.description when present so UI + regen stay aligned.
    const jobSnapshot: Record<string, unknown> = {
      ...bundle.jobSnapshot,
      ...(app.pastedJobDescription?.trim()
        ? { description: app.pastedJobDescription.trim() }
        : {}),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: app.id },
        data: {
          jobSnapshot: jobSnapshot as Prisma.InputJsonValue,
          profileSnapshot: bundle.profileSnapshot as Prisma.InputJsonValue,
          cvSnapshot: bundle.cvSnapshot as Prisma.InputJsonValue,
          cvStorageKey: bundle.cvStorageKey,
          applyUrl: bundle.applyUrl,
          snapshottedAt: new Date(),
          coverLetterContent: coverLetter.coverLetter,
          coverLetterSource: 'AI',
          coverLetterEdited: false,
          // Stay UPLOADED unless user explicitly generates/switches to tailored CV.
          generationStatus: ApplicationGenerationStatus.COMPLETED,
          generationError: null,
          ...facts,
        },
      });

      if (generatedCv) {
        await tx.generatedCv.upsert({
          where: { applicationId: app.id },
          create: {
            userId: job.userId,
            applicationId: app.id,
            profileId: app.profileId,
            sourceCvDocumentId,
            content: generatedCv.content as Prisma.InputJsonValue,
            edited: false,
            templateId: 'json-ats-v1',
          },
          update: {
            sourceCvDocumentId,
            content: generatedCv.content as Prisma.InputJsonValue,
            edited: false,
          },
        });
      }

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
          inputFingerprint: atsFingerprint,
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
          inputFingerprint: atsFingerprint,
          assessedAt: new Date(),
        },
      });
    });

    await this.usage.incrementAiUsage(job.userId);
  }

  private async resolveJobForWorker(app: {
    canonicalJobKey: string;
    jobSnapshot: unknown;
    pastedJobDescription: string | null;
    jobRoleTitle: string | null;
    companyName: string | null;
    applyUrl: string | null;
  }): Promise<import('../shared/schemas/job.schema').UnifiedJob> {
    try {
      return await this.jobs.getByCanonicalKey(app.canonicalJobKey, {
        expandAts: true,
      });
    } catch (error) {
      const fromStore = this.jobFromStoredData(app);
      if (fromStore) {
        this.logger.warn(
          `Worker using stored job data for ${app.canonicalJobKey} (cache miss)`,
        );
        return fromStore;
      }
      throw error;
    }
  }

  private jobFromStoredData(app: {
    canonicalJobKey: string;
    jobSnapshot: unknown;
    pastedJobDescription: string | null;
    jobRoleTitle: string | null;
    companyName: string | null;
    applyUrl: string | null;
  }): import('../shared/schemas/job.schema').UnifiedJob | null {
    const row =
      app.jobSnapshot &&
      typeof app.jobSnapshot === 'object' &&
      !Array.isArray(app.jobSnapshot)
        ? (app.jobSnapshot as Record<string, unknown>)
        : null;

    const title =
      (typeof row?.title === 'string' && row.title.trim()) ||
      app.jobRoleTitle?.trim() ||
      null;
    const company =
      (typeof row?.company === 'string' && row.company.trim()) ||
      app.companyName?.trim() ||
      null;

    const snapshotDescription =
      typeof row?.description === 'string' ? row.description.trim() : '';
    const snapshotSnippet =
      typeof row?.snippet === 'string' ? row.snippet.trim() : '';
    const pasted = app.pastedJobDescription?.trim() ?? '';

    const description =
      pasted ||
      snapshotDescription ||
      snapshotSnippet ||
      (title && company ? `${title} at ${company}` : '');

    if (!title || !company || !description) {
      return null;
    }

    const applyUrl =
      app.applyUrl?.trim() ||
      (typeof row?.applyUrl === 'string' && row.applyUrl.trim()) ||
      'https://www.adzuna.com';

    return {
      canonicalKey: app.canonicalJobKey,
      title,
      company,
      location:
        typeof row?.location === 'string' ? row.location : null,
      snippet: description.slice(0, 280),
      description,
      applyUrl,
      atsType:
        row?.atsType === 'greenhouse' ||
        row?.atsType === 'lever' ||
        row?.atsType === 'ashby' ||
        row?.atsType === 'adzuna' ||
        row?.atsType === 'unknown'
          ? row.atsType
          : 'adzuna',
      hasFullDescription: description.length > 200,
      applyType: applyUrl.startsWith('http') ? 'url' : 'unknown',
      source: 'adzuna',
      fetchedAt:
        typeof row?.fetchedAt === 'string'
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
      include: {
        profile: { include: { currentCv: true } },
        generatedCv: true,
      },
    });

    const jd = resolveJobDescriptionForAts(app);
    if (!jd || !app.coverLetterContent) {
      throw new Error('Cover letter and job description required for ATS report');
    }

    const cvText = resolveCvTextForAts(app);
    const ats = await this.atsReportGen.generate({
      jobTitle: app.jobRoleTitle ?? 'Role',
      companyName: app.companyName ?? 'Company',
      jobDescription: jd,
      coverLetter: app.coverLetterContent,
      cvText,
    });

    const atsFingerprint = buildApplicationAtsFingerprint({
      jobDescription: jd,
      coverLetter: app.coverLetterContent,
      cvText,
      cvChoice: app.cvChoice,
    });

    const wasInFlight =
      app.generationStatus === ApplicationGenerationStatus.PENDING ||
      app.generationStatus === ApplicationGenerationStatus.PROCESSING;

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
          inputFingerprint: atsFingerprint,
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
          inputFingerprint: atsFingerprint,
          assessedAt: new Date(),
        },
      });

      // ATS-only refresh on an already-COMPLETED AI package must not flip
      // generationStatus to PENDING/COMPLETED churn in the UI.
      if (wasInFlight) {
        await tx.application.update({
          where: { id: app.id },
          data: {
            generationStatus: ApplicationGenerationStatus.COMPLETED,
            generationError: null,
          },
        });
      }
    });

    await this.usage.incrementAiUsage(job.userId);
  }

  private async runHybridGenerateCv(job: AiGenerationJobData): Promise<void> {
    const app = await this.prisma.application.findFirstOrThrow({
      where: { id: job.applicationId, userId: job.userId },
      include: { profile: { include: { currentCv: true } } },
    });

    if (app.generationMode !== ApplicationGenerationMode.MANUAL) {
      throw new Error('Hybrid generated CV requires MANUAL application');
    }

    const jd =
      app.pastedJobDescription?.trim() ||
      String(jsonField(app.jobSnapshot, 'description') ?? '');

    if (!jd) {
      throw new Error('pastedJobDescription is required');
    }

    const cvText = app.profile.currentCv?.parsedText ?? '';
    if (!cvText) {
      throw new Error('Profile CV with parsed text is required');
    }

    const generatedCv = await this.generatedCvGen.generate({
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

    await this.prisma.$transaction(async (tx) => {
      await tx.generatedCv.upsert({
        where: { applicationId: app.id },
        create: {
          userId: job.userId,
          applicationId: app.id,
          profileId: app.profileId,
          sourceCvDocumentId: app.profile.currentCv?.id ?? null,
          content: generatedCv.content as Prisma.InputJsonValue,
          edited: false,
          templateId: 'json-ats-v1',
        },
        update: {
          sourceCvDocumentId: app.profile.currentCv?.id ?? null,
          content: generatedCv.content as Prisma.InputJsonValue,
          edited: false,
        },
      });

      await tx.application.update({
        where: { id: app.id },
        data: {
          cvChoice: 'GENERATED',
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
