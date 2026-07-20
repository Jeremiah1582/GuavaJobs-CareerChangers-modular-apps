import { Injectable } from '@nestjs/common';
import { Prisma, ProfileCareerCv as ProfileCareerCvRow } from '@prisma/client';
import {
  GapAnswerImprover,
  MIN_GAP_IMPROVE_WORDS,
  countWords,
} from '../ai/gap-answer.improver';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddressGapInput,
  CareerCvEnrichment,
  careerCvEnrichmentsSchema,
  emptyCareerCvContent,
  ImproveGapInput,
  ImproveGapResponse,
  PatchCareerCvInput,
  ProfileCareerCv,
  ProfileCareerCvContent,
  profileCareerCvContentSchema,
  profileCareerCvSchema,
} from '../shared/schemas/career-cv.schema';
import { AppError } from '../shared/schemas/error.schema';
import {
  applicationDetailInclude,
  toApplicationResponse,
} from '../applications/application.mapper';
import { UsageService } from '../users/usage.service';
import {
  mergeEnrichmentIntoContent,
  rebuildContentFromEnrichments,
  removeEnrichmentFromContent,
} from './career-cv.merge';

@Injectable()
export class CareerCvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gapImprover: GapAnswerImprover,
    private readonly usage: UsageService,
  ) {}

  async getByProfileId(
    userId: string,
    profileId: string,
  ): Promise<ProfileCareerCv> {
    await this.assertOwnedProfile(userId, profileId);
    const row = await this.prisma.profileCareerCv.findUnique({
      where: { profileId },
    });
    if (!row) {
      throw new AppError('CAREER_CV_NOT_FOUND', 'Career profile not found', 404);
    }
    return this.toResponse(row);
  }

  async patch(
    userId: string,
    profileId: string,
    input: PatchCareerCvInput,
  ): Promise<ProfileCareerCv> {
    await this.assertOwnedProfile(userId, profileId);
    const existing = await this.prisma.profileCareerCv.findUnique({
      where: { profileId },
    });

    const baseContent = existing
      ? this.parseContent(existing.content)
      : emptyCareerCvContent();
    const baseEnrichments = existing
      ? this.parseEnrichments(existing.enrichments)
      : [];

    const mergedContent =
      input.content !== undefined ? input.content : baseContent;

    const enrichments =
      input.enrichments !== undefined ? input.enrichments : baseEnrichments;

    const sourceCvDocumentId =
      input.sourceCvDocumentId !== undefined
        ? input.sourceCvDocumentId
        : (existing?.sourceCvDocumentId ?? null);

    const row = await this.prisma.profileCareerCv.upsert({
      where: { profileId },
      create: {
        profileId,
        userId,
        content: mergedContent as Prisma.InputJsonValue,
        enrichments: enrichments as Prisma.InputJsonValue,
        sourceCvDocumentId,
      },
      update: {
        content: mergedContent as Prisma.InputJsonValue,
        enrichments: enrichments as Prisma.InputJsonValue,
        ...(input.sourceCvDocumentId !== undefined
          ? { sourceCvDocumentId }
          : {}),
      },
    });

    return this.toResponse(row);
  }

  /**
   * Inline ATS gap fill: upsert master career, append enrichment, merge facts.
   * Optionally cheap-merges into application GeneratedCv when cvChoice=GENERATED.
   * Does not enqueue AI regeneration.
   */
  async addressGap(
    userId: string,
    applicationId: string,
    input: AddressGapInput,
  ) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { generatedCv: true },
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }

    await this.assertOwnedProfile(userId, app.profileId);

    const gapKey = input.gapText.trim();
    const enrichment: CareerCvEnrichment = {
      gapText: gapKey,
      answer: input.answer.trim(),
      ...(input.section?.trim() ? { section: input.section.trim() } : {}),
      createdAt: new Date().toISOString(),
    };

    const existing = await this.prisma.profileCareerCv.findUnique({
      where: { profileId: app.profileId },
    });

    const baseContent = existing
      ? this.parseContent(existing.content)
      : emptyCareerCvContent();
    const baseEnrichments = existing
      ? this.parseEnrichments(existing.enrichments)
      : [];

    const existingIndex = baseEnrichments.findIndex(
      (e) => e.gapText.trim() === gapKey,
    );
    const isEdit = existingIndex >= 0;

    if (!isEdit && baseEnrichments.length >= 200) {
      throw new AppError(
        'CAREER_CV_ENRICHMENTS_FULL',
        'Career profile enrichment limit reached',
        400,
      );
    }

    if (isEdit) {
      enrichment.createdAt = baseEnrichments[existingIndex]!.createdAt;
    }

    const enrichments = isEdit
      ? baseEnrichments.map((e, i) => (i === existingIndex ? enrichment : e))
      : [...baseEnrichments, enrichment];

    const mergedContent = isEdit
      ? rebuildContentFromEnrichments(enrichments)
      : mergeEnrichmentIntoContent(baseContent, enrichment);

    await this.prisma.$transaction(async (tx) => {
      await tx.profileCareerCv.upsert({
        where: { profileId: app.profileId },
        create: {
          profileId: app.profileId,
          userId,
          content: mergedContent as Prisma.InputJsonValue,
          enrichments: enrichments as Prisma.InputJsonValue,
          sourceCvDocumentId: null,
        },
        update: {
          content: mergedContent as Prisma.InputJsonValue,
          enrichments: enrichments as Prisma.InputJsonValue,
        },
      });

      if (app.cvChoice === 'GENERATED' && app.generatedCv) {
        let genContent = this.parseContent(app.generatedCv.content);
        if (isEdit) {
          genContent = removeEnrichmentFromContent(
            genContent,
            baseEnrichments[existingIndex]!,
          );
        }
        const mergedGen = mergeEnrichmentIntoContent(genContent, enrichment);
        await tx.generatedCv.update({
          where: { applicationId },
          data: {
            content: mergedGen as Prisma.InputJsonValue,
            edited: true,
          },
        });
      }
    });

    const updated = await this.prisma.application.findFirstOrThrow({
      where: { id: applicationId, userId },
      include: {
        ...applicationDetailInclude,
        events: { orderBy: { occurredAt: 'desc' } },
      },
    });

    return toApplicationResponse(updated, true);
  }

  /**
   * Optional AI polish of a user-authored gap draft (facts only).
   * Thin drafts (< 10 words) return a warning without consuming AI quota.
   * Successful LLM polish counts toward freemium AI generations (same as hybrid ATS).
   */
  async improveGap(
    userId: string,
    applicationId: string,
    input: ImproveGapInput,
  ): Promise<ImproveGapResponse> {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      select: { id: true },
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }

    const draft = input.draft.trim();
    const thinDraft = countWords(draft) < MIN_GAP_IMPROVE_WORDS;
    if (!thinDraft) {
      await this.usage.assertCanGenerateAi(userId);
    }

    const result = await this.gapImprover.improve({
      gapText: input.gapText,
      draft: input.draft,
      missingKeywords: input.missingKeywords,
    });

    if (!thinDraft) {
      await this.usage.incrementAiUsage(userId);
    }
    return result;
  }

  async findContentByProfileId(
    profileId: string,
  ): Promise<ProfileCareerCvContent | null> {
    const row = await this.prisma.profileCareerCv.findUnique({
      where: { profileId },
      select: { content: true },
    });
    if (!row) return null;
    try {
      return this.parseContent(row.content);
    } catch {
      return null;
    }
  }

  private async assertOwnedProfile(
    userId: string,
    profileId: string,
  ): Promise<void> {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
      select: { id: true },
    });
    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }
  }

  private parseContent(raw: unknown): ProfileCareerCvContent {
    return profileCareerCvContentSchema.parse(raw);
  }

  private parseEnrichments(raw: unknown): CareerCvEnrichment[] {
    return careerCvEnrichmentsSchema.parse(raw ?? []);
  }

  private toResponse(row: ProfileCareerCvRow): ProfileCareerCv {
    return profileCareerCvSchema.parse({
      id: row.id,
      profileId: row.profileId,
      userId: row.userId,
      content: this.parseContent(row.content),
      enrichments: this.parseEnrichments(row.enrichments),
      sourceCvDocumentId: row.sourceCvDocumentId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }
}
