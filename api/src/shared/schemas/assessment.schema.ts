import { z } from 'zod';
import { profileIndustrySchema } from './enums.schema';

export const profileAtsAssessmentSchema = z.object({
  profileId: z.string(),
  industry: profileIndustrySchema,
  score: z.number().int().min(0).max(100),
  missingKeywords: z.array(z.string()),
  suggestions: z.array(z.string()),
  breakdown: z.record(z.number()),
  inputFingerprint: z.string().nullable(),
  assessedAt: z.string().datetime(),
});

export const profileAtsLlmOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  missingKeywords: z.array(z.string()).max(30),
  suggestions: z.array(z.string()).max(15),
  breakdown: z.record(z.number()).optional().default({}),
});

export type ProfileAtsAssessmentResponse = z.infer<
  typeof profileAtsAssessmentSchema
>;
export type ProfileAtsLlmOutput = z.infer<typeof profileAtsLlmOutputSchema>;
