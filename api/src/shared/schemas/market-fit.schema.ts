import { z } from 'zod';
import { adzunaCountrySchema } from './job.schema';

export const marketFitLevelSchema = z.enum(['strong', 'adjacent', 'stretch']);

export const marketFitSalarySourceSchema = z.enum([
  'ons_ashe',
  'eurosalary',
]);

export const marketFitSalaryBandSchema = z.object({
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
  median: z.number().int().nonnegative().optional(),
  period: z.literal('year'),
  currency: z.string().length(3),
  source: marketFitSalarySourceSchema,
  label: z.string(),
});

export const marketFitRoleSchema = z.object({
  title: z.string().min(1).max(200),
  fitLevel: marketFitLevelSchema,
  whyFit: z.string().min(1).max(800),
  evidenceSkills: z.array(z.string()).max(12),
  salary: marketFitSalaryBandSchema.nullable(),
  searchCta: z.object({
    q: z.string(),
    country: adzunaCountrySchema,
    location: z.string().optional(),
  }),
});

export const marketFitPaywallSchema = z.object({
  enabled: z.boolean(),
  message: z.string().nullable(),
});

export const marketFitResponseSchema = z.object({
  profileId: z.string(),
  regionCountry: adzunaCountrySchema,
  currency: z.string().length(3),
  generatedAt: z.string().datetime(),
  inputFingerprint: z.string(),
  stale: z.boolean().optional(),
  paywall: marketFitPaywallSchema,
  roles: z.array(marketFitRoleSchema).length(5),
  attribution: z.array(z.string()),
});

export type MarketFitLevel = z.infer<typeof marketFitLevelSchema>;
export type MarketFitSalaryBand = z.infer<typeof marketFitSalaryBandSchema>;
export type MarketFitRole = z.infer<typeof marketFitRoleSchema>;
export type MarketFitResponse = z.infer<typeof marketFitResponseSchema>;
