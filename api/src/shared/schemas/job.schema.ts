import { z } from 'zod';
import { ADZUNA_COUNTRY_CODES } from '../constants/adzuna-countries';

export const atsTypeSchema = z.enum([
  'greenhouse',
  'lever',
  'ashby',
  'adzuna',
  'unknown',
]);

export const adzunaCountrySchema = z.enum(ADZUNA_COUNTRY_CODES);

export const jobListItemSchema = z.object({
  canonicalKey: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string().nullable(),
  snippet: z.string(),
  applyUrl: z.string().url(),
  atsType: atsTypeSchema,
  hasFullDescription: z.boolean(),
  applyType: z.enum(['url', 'unknown']),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  salaryCurrency: z.string().nullable().optional(),
  postedAt: z.string().datetime().nullable().optional(),
});

export const unifiedJobSchema = jobListItemSchema.extend({
  description: z.string(),
  source: z.literal('adzuna'),
  fetchedAt: z.string().datetime(),
  adzunaId: z.string().optional(),
  adzunaCountry: z.string().optional(),
});

export const jobSearchResponseSchema = z.object({
  results: z.array(jobListItemSchema),
  page: z.number().int().positive(),
  totalResults: z.number().int().nonnegative(),
  attribution: z.literal('Jobs by Adzuna'),
});

export const jobSearchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  country: adzunaCountrySchema.optional(),
  page: z.coerce.number().int().positive().default(1),
});

export type JobListItem = z.infer<typeof jobListItemSchema>;
export type UnifiedJob = z.infer<typeof unifiedJobSchema>;
export type JobSearchResponse = z.infer<typeof jobSearchResponseSchema>;
export type JobSearchQuery = z.infer<typeof jobSearchQuerySchema>;
