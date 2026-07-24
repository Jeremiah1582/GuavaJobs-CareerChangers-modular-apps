import { z } from 'zod';
import { platformRoleSchema, userTierSchema } from './enums.schema';

export const patchUserRoleBodySchema = z.object({
  platformRole: platformRoleSchema,
});

export const adminUsersListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const engagementSummarySchema = z.object({
  signups: z.object({
    total: z.number().int(),
    series: z.array(
      z.object({
        date: z.string(),
        count: z.number().int(),
      }),
    ),
  }),
  peaks: z.object({
    weekday: z.object({
      day: z.number().int().min(0).max(6),
      label: z.string(),
      count: z.number().int(),
    }),
    dayOfMonth: z.object({
      day: z.number().int().min(1).max(31),
      count: z.number().int(),
    }),
  }),
  sessions: z.object({
    avgDurationMs: z.number().int().nullable(),
    totalEnded: z.number().int(),
  }),
  topRegions: z.array(
    z.object({
      country: z.string(),
      searches: z.number().int(),
      logins: z.number().int(),
      total: z.number().int(),
    }),
  ),
  topSearchTerms: z.array(
    z.object({
      term: z.string(),
      count: z.number().int(),
    }),
  ),
  topIndustries: z.array(
    z.object({
      industry: z.string(),
      count: z.number().int(),
    }),
  ),
});

export const adminEngagementUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  tier: userTierSchema,
  platformRole: platformRoleSchema,
  region: z.string().nullable(),
  joinedAt: z.string().datetime(),
  lastActiveAt: z.string().datetime().nullable(),
});

export const adminOwnerUserSchema = adminEngagementUserSchema.extend({
  email: z.string().email(),
});

export const adminEngagementUsersResponseSchema = z.object({
  results: z.array(adminEngagementUserSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});

export const adminOwnerUsersResponseSchema = z.object({
  results: z.array(adminOwnerUserSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});

export type PatchUserRoleBody = z.infer<typeof patchUserRoleBodySchema>;
export type AdminUsersListQuery = z.infer<typeof adminUsersListQuerySchema>;
export type EngagementSummary = z.infer<typeof engagementSummarySchema>;
export type AdminEngagementUser = z.infer<typeof adminEngagementUserSchema>;
export type AdminOwnerUser = z.infer<typeof adminOwnerUserSchema>;
