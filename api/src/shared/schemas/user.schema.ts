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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const patchMeSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    imgUrl: z.string().url().nullable().optional(),
    linkedinUrl: z.string().url().nullable().optional(),
    githubUrl: z.string().url().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export type UserResponse = z.infer<typeof userResponseSchema>;
export type PatchMeInput = z.infer<typeof patchMeSchema>;
