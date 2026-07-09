import { Injectable } from '@nestjs/common';
import { CvParseStatus, ProfileAtsAssessment } from '@prisma/client';
import { ProfileAtsGenerator } from '../ai/profile-ats.generator';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import { ProfileAtsAssessmentResponse } from '../shared/schemas/assessment.schema';

@Injectable()
export class ProfileAtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: ProfileAtsGenerator,
  ) {}

  async runAssessment(
    userId: string,
    profileId: string,
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

    const generated = await this.generator.generate({
      profile,
      parsedCvText: parsedText,
    });

    const row = await this.prisma.profileAtsAssessment.upsert({
      where: { profileId },
      create: {
        profileId,
        industry: profile.primaryIndustry,
        score: generated.score,
        missingKeywords: generated.missingKeywords,
        suggestions: generated.suggestions,
        breakdown: generated.breakdown,
        inputFingerprint: generated.inputFingerprint,
        assessedAt: new Date(),
      },
      update: {
        industry: profile.primaryIndustry,
        score: generated.score,
        missingKeywords: generated.missingKeywords,
        suggestions: generated.suggestions,
        breakdown: generated.breakdown,
        inputFingerprint: generated.inputFingerprint,
        assessedAt: new Date(),
      },
    });

    return this.toResponse(row);
  }

  async getForProfile(profileId: string): Promise<ProfileAtsAssessmentResponse | null> {
    const row = await this.prisma.profileAtsAssessment.findUnique({
      where: { profileId },
    });
    return row ? this.toResponse(row) : null;
  }

  private toResponse(row: ProfileAtsAssessment): ProfileAtsAssessmentResponse {
    return {
      profileId: row.profileId,
      industry: row.industry,
      score: row.score,
      missingKeywords: this.jsonStringArray(row.missingKeywords),
      suggestions: this.jsonStringArray(row.suggestions),
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
}
