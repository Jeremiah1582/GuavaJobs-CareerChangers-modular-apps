import { z } from 'zod';
import { profileAtsAssessmentSchema } from './assessment.schema';
import { cvMetaSchema } from './cv.schema';
import {
  profileIndustrySchema,
  salaryPeriodSchema,
  seniorityLevelSchema,
} from './enums.schema';

export const profileResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileTitle: z.string(),
  jobTitle: z.string(),
  seniority: seniorityLevelSchema,
  primaryIndustry: profileIndustrySchema,
  summary: z.string().nullable(),
  skills: z.array(z.string()),
  jobCategories: z.array(z.string()),
  locationCity: z.string().nullable(),
  locationCountry: z.string().nullable(),
  contactPhone: z.string().nullable(),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  salaryCurrency: z.string().nullable(),
  salaryPeriod: salaryPeriodSchema.nullable(),
  autofillAnswers: z.record(z.unknown()),
  isDefault: z.boolean(),
  currentCvId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const profileDetailResponseSchema = profileResponseSchema.extend({
  currentCv: cvMetaSchema.nullable(),
  generalAtsAssessment: profileAtsAssessmentSchema.nullable(),
});

export const createProfileSchema = z.object({
  profileTitle: z.string().min(1).max(200),
  jobTitle: z.string().min(1).max(200),
  seniority: seniorityLevelSchema,
  primaryIndustry: profileIndustrySchema,
  summary: z.string().max(10000).optional(),
  skills: z.array(z.string()).optional(),
  jobCategories: z.array(z.string()).optional(),
  locationCity: z.string().max(200).optional(),
  locationCountry: z.string().length(2).optional(),
  contactPhone: z.string().max(50).optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  salaryCurrency: z.string().length(3).optional(),
  salaryPeriod: salaryPeriodSchema.optional(),
  isDefault: z.boolean().optional(),
});

export const patchProfileSchema = createProfileSchema
  .partial()
  .extend({
    autofillAnswers: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type ProfileDetailResponse = z.infer<typeof profileDetailResponseSchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type PatchProfileInput = z.infer<typeof patchProfileSchema>;
