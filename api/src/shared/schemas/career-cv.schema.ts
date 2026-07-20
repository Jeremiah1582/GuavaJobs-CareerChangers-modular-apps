import { z } from 'zod';
import { storedGeneratedCvContentSchema } from './generated-cv.schema';

/** Audit entry for a gap fill saved into the master career corpus. */
export const careerCvEnrichmentSchema = z.object({
  gapText: z.string().min(1).max(2000),
  answer: z.string().min(1).max(8000),
  section: z.string().min(1).max(100).optional(),
  createdAt: z.string().datetime(),
});

export type CareerCvEnrichment = z.infer<typeof careerCvEnrichmentSchema>;

export const careerCvEnrichmentsSchema = z
  .array(careerCvEnrichmentSchema)
  .max(200);

export type CareerCvEnrichments = z.infer<typeof careerCvEnrichmentsSchema>;

/**
 * Master career body — same anonymous shape as GeneratedCv.content.
 * Re-exported under this name for career-cv call sites.
 */
export const profileCareerCvContentSchema = storedGeneratedCvContentSchema;

export type ProfileCareerCvContent = z.infer<
  typeof profileCareerCvContentSchema
>;

/** Full persisted ProfileCareerCv row shape (API foundation). */
export const profileCareerCvSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  userId: z.string(),
  content: profileCareerCvContentSchema,
  enrichments: careerCvEnrichmentsSchema,
  sourceCvDocumentId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProfileCareerCv = z.infer<typeof profileCareerCvSchema>;

/** Empty anonymous career body used when bootstrapping ProfileCareerCv. */
export function emptyCareerCvContent(): ProfileCareerCvContent {
  return profileCareerCvContentSchema.parse({
    coreCompetencies: [],
    work: [],
    education: [],
    skills: [],
    certificates: [],
    projects: [],
    languages: [],
    awards: [],
    volunteer: [],
  });
}

/** PATCH /profiles/:id/career-cv — upsert content and/or replace enrichments. */
export const patchCareerCvSchema = z
  .object({
    /** Full anonymous career body (replaces stored content when provided). */
    content: profileCareerCvContentSchema.optional(),
    enrichments: careerCvEnrichmentsSchema.optional(),
    sourceCvDocumentId: z.string().min(1).nullable().optional(),
  })
  .refine(
    (data) =>
      data.content !== undefined ||
      data.enrichments !== undefined ||
      data.sourceCvDocumentId !== undefined,
    { message: 'At least one field is required' },
  );

export type PatchCareerCvInput = z.infer<typeof patchCareerCvSchema>;

/** POST /applications/:id/gaps/address */
export const addressGapSchema = z.object({
  gapText: z.string().min(1).max(2000),
  answer: z.string().min(1).max(8000),
  section: z.string().min(1).max(100).optional(),
});

export type AddressGapInput = z.infer<typeof addressGapSchema>;

/** POST /applications/:id/gaps/improve — facts-only polish (AI quota). */
export const improveGapSchema = z.object({
  gapText: z.string().min(1).max(2000),
  /** Composed micro-form text (Role / Dates / Details / Outcome). */
  draft: z.string().min(1).max(8000),
  missingKeywords: z.array(z.string().min(1).max(100)).max(50).optional(),
});

export type ImproveGapInput = z.infer<typeof improveGapSchema>;

export const improveGapResponseSchema = z.object({
  improvedAnswer: z.string().min(1).max(8000),
  factsUsed: z.array(z.string().min(1).max(500)).max(50),
  warnings: z.array(z.string().min(1).max(500)).max(20).optional(),
});

export type ImproveGapResponse = z.infer<typeof improveGapResponseSchema>;
