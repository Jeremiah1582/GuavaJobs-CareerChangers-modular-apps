import { z } from 'zod';
import { userTierSchema } from './enums.schema';

export const profileSummarySchema = z.object({
  id: z.string(),
  profileTitle: z.string(),
  jobTitle: z.string(),
  isDefault: z.boolean(),
});

export const usageSummarySchema = z.object({
  tier: userTierSchema,
  aiGenerationsUsedPeriod: z.number().int(),
  aiGenerationsLimit: z.number().int().nullable(),
  usagePeriodStart: z.string().datetime().nullable(),
});

/** Typed prefs stored in User.metadata (other metadata keys are preserved). */
export const userPreferencesSchema = z.object({
  autoGenerateTailoredCv: z.boolean().optional(),
});

export const userPreferencesResponseSchema = z.object({
  autoGenerateTailoredCv: z.boolean(),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  imgUrl: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  tier: userTierSchema,
  defaultProfileId: z.string().nullable(),
  defaultProfile: profileSummarySchema.nullable(),
  usage: usageSummarySchema,
  preferences: userPreferencesResponseSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const patchMeSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    imgUrl: z.string().url().nullable().optional(),
    linkedinUrl: z.string().url().nullable().optional(),
    githubUrl: z.string().url().nullable().optional(),
    preferences: userPreferencesSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UserPreferencesResponse = z.infer<
  typeof userPreferencesResponseSchema
>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type PatchMeInput = z.infer<typeof patchMeSchema>;

/** Read prefs from User.metadata; absent autoGenerateTailoredCv defaults to false. */
export function preferencesFromMetadata(
  metadata: unknown,
): UserPreferencesResponse {
  const base =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};
  const parsed = userPreferencesSchema.safeParse({
    autoGenerateTailoredCv: base.autoGenerateTailoredCv,
  });
  return {
    autoGenerateTailoredCv:
      parsed.success && parsed.data.autoGenerateTailoredCv === true,
  };
}

/** Shallow-merge prefs into metadata without wiping unrelated keys. */
export function mergePreferencesIntoMetadata(
  metadata: unknown,
  prefs: UserPreferences,
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};
  if (prefs.autoGenerateTailoredCv !== undefined) {
    base.autoGenerateTailoredCv = prefs.autoGenerateTailoredCv;
  }
  return base;
}
