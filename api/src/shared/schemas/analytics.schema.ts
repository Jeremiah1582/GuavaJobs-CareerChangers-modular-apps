import { z } from 'zod';
import { profileIndustrySchema } from './enums.schema';

/** Events persisted in Postgres for the admin engagement dashboard. */
export const ANALYTICS_INGEST_EVENTS = [
  'login_completed',
  'signup_completed',
  'job_search',
  'session_heartbeat',
  'session_end',
] as const;

export type AnalyticsIngestEventName =
  (typeof ANALYTICS_INGEST_EVENTS)[number];

const analyticsPropertyValueSchema = z.union([
  z.string().max(500),
  z.number(),
  z.boolean(),
  z.null(),
]);

const analyticsPropertiesSchema = z
  .record(analyticsPropertyValueSchema)
  .default({});

export const analyticsEventItemSchema = z.object({
  event: z.enum(ANALYTICS_INGEST_EVENTS),
  properties: analyticsPropertiesSchema.optional(),
  timestamp: z.string().datetime().optional(),
});

export const analyticsEventsBodySchema = z.object({
  events: z.array(analyticsEventItemSchema).min(1).max(50),
});

export const analyticsSessionBodySchema = z.object({
  sessionId: z.string().uuid(),
  ended: z.boolean().optional(),
  durationMs: z.number().int().nonnegative().optional(),
});

/** Sanitized job_search props stored for aggregates. */
export const jobSearchEventPropertiesSchema = z.object({
  q: z.string().max(200).nullable().optional(),
  country: z.string().length(2).optional(),
  industry: profileIndustrySchema.optional(),
  primaryIndustry: profileIndustrySchema.optional(),
  location: z.string().max(200).nullable().optional(),
  page: z.number().int().positive().optional(),
  source: z.string().max(100).optional(),
  action: z.string().max(100).optional(),
});

export type AnalyticsEventsBody = z.infer<typeof analyticsEventsBodySchema>;
export type AnalyticsSessionBody = z.infer<typeof analyticsSessionBodySchema>;
export type AnalyticsEventItem = z.infer<typeof analyticsEventItemSchema>;
