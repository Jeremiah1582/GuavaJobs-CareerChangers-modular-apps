import { Injectable, Logger } from '@nestjs/common';
import { CvParseStatus, ProfileAtsAssessment } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ProfileAtsGenerator } from '../ai/profile-ats.generator';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import {
  AtsChecklistItem,
  PriorityAction,
  ProfileAtsAssessmentResponse,
} from '../shared/schemas/assessment.schema';

@Injectable()
export class ProfileAtsService {
  private readonly logger = new Logger(ProfileAtsService.name);
  /** Latest auto-run token per profile — supersedes in-flight assessments on CV replace. */
  private readonly runTokens = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: ProfileAtsGenerator,
  ) {}

  async runAssessment(
    userId: string,
    profileId: string,
    opts?: { expectedCvDocumentId?: string; runToken?: string },
  ): Promise<ProfileAtsAssessmentResponse> {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
      include: { currentCv: true },
    });

    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }

    if (!profile.currentCv) {
      throw new AppError(
        'CV_REQUIRED',
        'Upload a CV before running ATS assessment',
        400,
      );
    }

    const cvDocumentId = profile.currentCv.id;
    if (
      opts?.expectedCvDocumentId &&
      opts.expectedCvDocumentId !== cvDocumentId
    ) {
      throw new AppError(
        'CV_CHANGED',
        'CV was replaced during assessment; skipping stale run',
        409,
      );
    }

    if (profile.currentCv.parseStatus === CvParseStatus.PENDING) {
      throw new AppError(
        'CV_PARSE_PENDING',
        'CV is still being parsed; try again shortly',
        409,
      );
    }

    if (profile.currentCv.parseStatus === CvParseStatus.FAILED) {
      throw new AppError(
        'CV_PARSE_FAILED',
        'CV parsing failed; re-upload a PDF or DOCX file',
        400,
      );
    }

    const parsedText = profile.currentCv.parsedText?.trim();
    if (!parsedText) {
      throw new AppError(
        'CV_TEXT_EMPTY',
        'CV has no extractable text for assessment',
        400,
      );
    }

    this.assertRunStillCurrent(profileId, opts?.runToken, cvDocumentId);

    const generated = await this.generator.generate({
      profile,
      parsedCvText: parsedText,
    });

    // CV may have been replaced while the LLM ran — never overwrite the new CV's report.
    await this.assertStillCurrentCv(userId, profileId, cvDocumentId);
    this.assertRunStillCurrent(profileId, opts?.runToken, cvDocumentId);

    const row = await this.prisma.profileAtsAssessment.upsert({
      where: { profileId },
      create: {
        profileId,
        industry: profile.primaryIndustry,
        cvDocumentId,
        score: generated.score,
        summary: generated.summary || null,
        missingKeywords: generated.missingKeywords,
        suggestions: generated.suggestions,
        strengths: generated.strengths,
        priorityActions: generated.priorityActions,
        checklist: generated.checklist,
        breakdown: generated.breakdown,
        inputFingerprint: generated.inputFingerprint,
        assessedAt: new Date(),
      },
      update: {
        industry: profile.primaryIndustry,
        cvDocumentId,
        score: generated.score,
        summary: generated.summary || null,
        missingKeywords: generated.missingKeywords,
        suggestions: generated.suggestions,
        strengths: generated.strengths,
        priorityActions: generated.priorityActions,
        checklist: generated.checklist,
        breakdown: generated.breakdown,
        inputFingerprint: generated.inputFingerprint,
        assessedAt: new Date(),
      },
    });

    return this.toResponse(row);
  }

  /**
   * Fire-and-forget after CV parse. Tokens cancel superseded runs on replace.
   */
  scheduleAutoAssessment(
    userId: string,
    profileId: string,
    cvDocumentId: string,
  ): void {
    const runToken = randomUUID();
    this.runTokens.set(profileId, runToken);
    void this.runAssessment(userId, profileId, {
      expectedCvDocumentId: cvDocumentId,
      runToken,
    }).catch((error) => {
      if (error instanceof AppError && error.code === 'CV_CHANGED') {
        this.logger.debug(
          `Auto profile ATS superseded for ${profileId} (CV replaced)`,
        );
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Unknown ATS error';
      this.logger.warn(
        `Auto profile ATS failed for ${profileId}: ${message}`,
      );
    });
  }

  async clearForProfile(profileId: string): Promise<void> {
    // Invalidate any in-flight auto-run for this profile.
    this.runTokens.set(profileId, randomUUID());
    await this.prisma.profileAtsAssessment.deleteMany({
      where: { profileId },
    });
  }

  async getForProfile(
    profileId: string,
  ): Promise<ProfileAtsAssessmentResponse | null> {
    const row = await this.prisma.profileAtsAssessment.findUnique({
      where: { profileId },
    });
    return row ? this.toResponse(row) : null;
  }

  private assertRunStillCurrent(
    profileId: string,
    runToken: string | undefined,
    _cvDocumentId: string,
  ): void {
    if (!runToken) return;
    const latest = this.runTokens.get(profileId);
    if (latest && latest !== runToken) {
      throw new AppError(
        'CV_CHANGED',
        'A newer CV assessment superseded this run',
        409,
      );
    }
  }

  private async assertStillCurrentCv(
    userId: string,
    profileId: string,
    expectedCvDocumentId: string,
  ): Promise<void> {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
      select: { currentCvId: true },
    });
    if (!profile || profile.currentCvId !== expectedCvDocumentId) {
      throw new AppError(
        'CV_CHANGED',
        'CV was replaced during assessment; skipping stale run',
        409,
      );
    }
  }

  private toResponse(row: ProfileAtsAssessment): ProfileAtsAssessmentResponse {
    return {
      profileId: row.profileId,
      industry: row.industry,
      cvDocumentId: row.cvDocumentId ?? null,
      score: row.score,
      summary: row.summary ?? null,
      missingKeywords: this.jsonStringArray(row.missingKeywords),
      suggestions: this.jsonStringArray(row.suggestions),
      strengths: this.jsonStringArray(row.strengths),
      priorityActions: this.jsonPriorityActions(row.priorityActions),
      checklist: this.jsonChecklist(row.checklist),
      breakdown: this.jsonNumberRecord(row.breakdown),
      inputFingerprint: row.inputFingerprint,
      assessedAt: row.assessedAt.toISOString(),
    };
  }

  private jsonStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === 'string');
    }
    return [];
  }

  private jsonNumberRecord(value: unknown): Record<string, number> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    const out: Record<string, number> = {};
    for (const [key, val] of Object.entries(value)) {
      if (typeof val === 'number') {
        out[key] = val;
      }
    }
    return out;
  }

  private jsonPriorityActions(value: unknown): PriorityAction[] {
    if (!Array.isArray(value)) return [];
    const out: PriorityAction[] = [];
    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === 'string' ? row.title : '';
      const detail = typeof row.detail === 'string' ? row.detail : '';
      const impact =
        row.impact === 'high' || row.impact === 'low' || row.impact === 'medium'
          ? row.impact
          : null;
      if (title && detail && impact) {
        out.push({ title, detail, impact });
      }
    }
    return out;
  }

  private jsonChecklist(value: unknown): AtsChecklistItem[] {
    if (!Array.isArray(value)) return [];
    const out: AtsChecklistItem[] = [];
    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const row = item as Record<string, unknown>;
      if (
        typeof row.id === 'string' &&
        typeof row.label === 'string' &&
        typeof row.passed === 'boolean' &&
        typeof row.detail === 'string'
      ) {
        out.push({
          id: row.id,
          label: row.label,
          passed: row.passed,
          detail: row.detail,
        });
      }
    }
    return out;
  }
}
