import { z } from 'zod';
import { profileIndustrySchema } from './enums.schema';

export const atsChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  passed: z.boolean(),
  detail: z.string(),
});

export const priorityActionSchema = z.object({
  title: z.string().min(1).max(160),
  detail: z.string().min(1).max(600),
  impact: z.enum(['high', 'medium', 'low']),
});

export const profileAtsAssessmentSchema = z.object({
  profileId: z.string(),
  industry: profileIndustrySchema,
  cvDocumentId: z.string().nullable().optional(),
  score: z.number().int().min(0).max(100),
  summary: z.string().nullable(),
  missingKeywords: z.array(z.string()),
  suggestions: z.array(z.string()),
  strengths: z.array(z.string()),
  priorityActions: z.array(priorityActionSchema),
  checklist: z.array(atsChecklistItemSchema),
  breakdown: z.record(z.number()),
  inputFingerprint: z.string().nullable(),
  assessedAt: z.string().datetime(),
});

export const profileAtsLlmOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string().max(500).optional().default(''),
  missingKeywords: z.array(z.string()).max(30),
  suggestions: z.array(z.string()).max(15),
  strengths: z.array(z.string()).max(10).optional().default([]),
  priorityActions: z
    .array(priorityActionSchema)
    .max(8)
    .optional()
    .default([]),
  breakdown: z.record(z.number()).optional().default({}),
});

export type ProfileAtsAssessmentResponse = z.infer<
  typeof profileAtsAssessmentSchema
>;
export type ProfileAtsLlmOutput = z.infer<typeof profileAtsLlmOutputSchema>;
export type AtsChecklistItem = z.infer<typeof atsChecklistItemSchema>;
export type PriorityAction = z.infer<typeof priorityActionSchema>;
