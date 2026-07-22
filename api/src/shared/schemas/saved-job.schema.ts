import { z } from 'zod';
import { atsTypeSchema } from './job.schema';

export const savedJobResolveStatusSchema = z.enum(['LIVE', 'GONE', 'UNKNOWN']);

/** Thin card fields only — never full JD / description. */
export const saveJobBodySchema = z.object({
  canonicalKey: z.string().min(3).max(200),
  title: z.string().max(300).optional(),
  company: z.string().max(300).optional(),
  location: z.string().max(300).nullable().optional(),
  atsType: atsTypeSchema.optional(),
  salaryMin: z.number().int().nullable().optional(),
  salaryMax: z.number().int().nullable().optional(),
  salaryCurrency: z.string().max(8).nullable().optional(),
});

export const savedJobResponseSchema = z.object({
  id: z.string(),
  canonicalKey: z.string(),
  savedAt: z.string().datetime(),
  title: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  atsType: z.string().nullable(),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  salaryCurrency: z.string().nullable(),
  lastResolvedAt: z.string().datetime().nullable(),
  resolveStatus: savedJobResolveStatusSchema,
});

export const savedJobsListResponseSchema = z.object({
  results: z.array(savedJobResponseSchema),
});

export const savedJobsListQuerySchema = z.object({
  resolve: z
    .union([z.literal('1'), z.literal('true'), z.literal('0'), z.literal('false')])
    .optional()
    .transform((v) => v === '1' || v === 'true'),
});

export type SaveJobBody = z.infer<typeof saveJobBodySchema>;
export type SavedJobResponse = z.infer<typeof savedJobResponseSchema>;
export type SavedJobsListResponse = z.infer<typeof savedJobsListResponseSchema>;
