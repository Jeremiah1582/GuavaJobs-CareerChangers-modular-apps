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
  resolveCvTextForGeneration,
  resolveJobDescriptionForAts,
  serializeCareerContent,
} from './application-ats.fingerprint';
import { AppError } from '../shared/schemas/error.schema';

function normalizeGenerationError(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) {
    if (
      error.name === 'TimeoutError' ||
      error.name === 'AbortError' ||
      /aborted due to timeout|timed out/i.test(error.message)
    ) {
      return 'AI generation timed out. Try again — if this keeps happening, switch to a faster chat model (e.g. deepseek/deepseek-chat).';
    }
    return error.message;
  }
  return 'AI generation failed';
}

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
    // Package jobs always enter PROCESSING. Side-effect hybrids (CV / ATS)
    // must not flip a COMPLETED package into regenerating UI — only promote
    // PENDING → PROCESSING when the enqueue path already marked in-flight.
    if (job.type === 'generate' || job.type === 'regenerate') {
      await this.prisma.application.update({
        where: { id: job.applicationId },
        data: { generationStatus: ApplicationGenerationStatus.PROCESSING },
      });
    } else if (job.type === 'hybrid-cover-letter') {
      await this.prisma.application.update({
        where: { id: job.applicationId },
        data: { generationStatus: ApplicationGenerationStatus.PROCESSING },
      });
    } else {
      await this.prisma.application.updateMany({
        where: {
          id: job.applicationId,
          generationStatus: ApplicationGenerationStatus.PENDING,
        },
        data: { generationStatus: ApplicationGenerationStatus.PROCESSING },
      });
    }

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
      const message = normalizeGenerationError(error);
      this.logger.error(`Job ${job.type} failed for ${job.applicationId}: ${message}`);

      if (
        job.type === 'hybrid-generate-cv' ||
        job.type === 'hybrid-ats-report'
      ) {
        // Leave COMPLETED packages intact; only fail true in-flight hybrids.
        await this.prisma.application.updateMany({
          where: {
            id: job.applicationId,
            generationStatus: {
              in: [
                ApplicationGenerationStatus.PENDING,
                ApplicationGenerationStatus.PROCESSING,
              ],
            },
          },
          data: {
            generationStatus: ApplicationGenerationStatus.FAILED,
            generationError: message,
          },
        });
      } else {
        await this.prisma.application.update({
          where: { id: job.applicationId },
          data: {
            generationStatus: ApplicationGenerationStatus.FAILED,
            generationError: message,
          },
        });
      }
      throw error;
    }
  }

  private async runFullGenerate(job: AiGenerationJobData): Promise<void> {
    const started = Date.now();
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
    // Tailored CV only when preference is on or user actively selected GENERATED.
    // A leftover GeneratedCv row with cvChoice=UPLOADED must not slow package regen.
    const shouldGenerateCv =
      prefs.autoGenerateTailoredCv || app.cvChoice === 'GENERATED';

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
    const careerRow = await this.prisma.profileCareerCv.findUnique({
      where: { profileId: app.profileId },
      select: { content: true },
    });
    const careerContent = serializeCareerContent(careerRow?.content);
    const cvText = resolveCvTextForGeneration({
      cvSnapshot: bundle.cvSnapshot,
      careerCvContent: careerRow?.content,
    });
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

    await this.touchProcessing(app.id);

    // Cover letter first (ATS needs it). Soft-fail CV; run ATS in parallel with CV
    // so a slow tailored-CV call does not delay the fit report.
    const coverLetter = await this.withProcessingHeartbeat(
      app.id,
      this.coverLetterGen.generate(genInput),
    );

    const cvPromise = shouldGenerateCv
      ? this.generatedCvGen.generate(genInput).catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Generated CV failed';
          this.logger.warn(
            `GeneratedCv soft-failed for ${app.id} (package continues): ${message}`,
          );
          return null;
        })
      : Promise.resolve(null);

    const atsPromise = this.atsReportGen.generate({
      jobTitle: jobData.title,
      companyName: jobData.company,
      jobDescription,
      coverLetter: coverLetter.coverLetter,
      cvText,
    });

    const [generatedCv, ats] = await this.withProcessingHeartbeat(
      app.id,
      Promise.all([cvPromise, atsPromise]),
    );

    const atsFingerprint = buildApplicationAtsFingerprint({
      jobDescription,
      coverLetter: coverLetter.coverLetter,
      // Score against the CV the user currently has selected (not a draft they haven't chosen).
      cvText,
      cvChoice: app.cvChoice,
      careerContent,
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
          suggestedRoles: ats.suggestedRoles,
          careerSuggestion: ats.careerSuggestion || null,
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
          suggestedRoles: ats.suggestedRoles,
          careerSuggestion: ats.careerSuggestion || null,
          keywordCoverage: ats.keywordCoverage,
          icpMatch: ats.icpMatch as Prisma.InputJsonValue,
          breakdown: ats.breakdown,
          inputFingerprint: atsFingerprint,
          assessedAt: new Date(),
        },
      });
    });

    await this.usage.incrementAiUsage(job.userId);
    this.logger.log(
      JSON.stringify({
        event: 'package_generate_done',
        applicationId: app.id,
        type: job.type,
        includeCv: shouldGenerateCv,
        cvProduced: !!generatedCv,
        ms: Date.now() - started,
      }),
    );
  }

  /** Bump updatedAt so stuck-detection / UI know the worker is still alive. */
  private async touchProcessing(applicationId: string): Promise<void> {
    await this.prisma.application.updateMany({
      where: {
        id: applicationId,
        generationStatus: ApplicationGenerationStatus.PROCESSING,
      },
      data: { generationError: null },
    });
  }

  /** Keep PROCESSING heartbeats during long LLM awaits (avoids false "stuck"). */
  private async withProcessingHeartbeat<T>(
    applicationId: string,
    work: Promise<T>,
  ): Promise<T> {
    const timer = setInterval(() => {
      void this.touchProcessing(applicationId).catch(() => undefined);
    }, 25_000);
    try {
      return await work;
    } finally {
      clearInterval(timer);
    }
  }

  private async resolveJobForWorker(app: {
    canonicalJobKey: string;
    jobSnapshot: unknown;
    pastedJobDescription: string | null;
    jobRoleTitle: string | null;
    companyName: string | null;
    applyUrl: string | null;
  }): Promise<import('../shared/schemas/job.schema').UnifiedJob> {
    const fromStore = this.jobFromStoredData(app);
    const pasted = app.pastedJobDescription?.trim() ?? '';
    // Skip Redis/ATS expand when paste or rich snapshot already supplies the JD.
    if (fromStore && (pasted || fromStore.hasFullDescription)) {
      return fromStore;
    }

    try {
      return await this.jobs.getByCanonicalKey(app.canonicalJobKey, {
        // Only expand when we still lack a usable full description.
        expandAts: !fromStore?.hasFullDescription,
      });
    } catch (error) {
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
      include: { profile: { include: { currentCv: true, careerCv: true } } },
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

    const cvText = resolveCvTextForGeneration(app);
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
        profile: { include: { currentCv: true, careerCv: true } },
        generatedCv: true,
      },
    });

    const jd = resolveJobDescriptionForAts(app);
    if (!jd || !app.coverLetterContent) {
      throw new Error('Cover letter and job description required for ATS report');
    }

    const cvText = resolveCvTextForAts(app);
    const careerContent = serializeCareerContent(app.profile?.careerCv?.content);
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
      careerContent,
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
          suggestedRoles: ats.suggestedRoles,
          careerSuggestion: ats.careerSuggestion || null,
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
          suggestedRoles: ats.suggestedRoles,
          careerSuggestion: ats.careerSuggestion || null,
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
      include: { profile: { include: { currentCv: true, careerCv: true } } },
    });

    const jd = resolveJobDescriptionForAts(app);
    if (!jd) {
      throw new Error('Job description is required');
    }

    const cvText = resolveCvTextForGeneration(app);
    if (!cvText) {
      throw new Error('Profile CV with parsed text is required');
    }

    // CV-only: never touch package generationStatus. Full regenerate is
    // POST …/regenerate. Only upsert GeneratedCv + switch cvChoice.
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

    const sourceCvDocumentId =
      app.profile.currentCv?.id ??
      (typeof jsonField(app.cvSnapshot, 'cvDocumentId') === 'string'
        ? String(jsonField(app.cvSnapshot, 'cvDocumentId'))
        : null);

    await this.prisma.$transaction(async (tx) => {
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

      await tx.application.update({
        where: { id: app.id },
        data: { cvChoice: 'GENERATED' },
      });
    });

    await this.usage.incrementAiUsage(job.userId);
  }
}

function jsonField(json: unknown, key: string): unknown {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  return (json as Record<string, unknown>)[key];
}
