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
