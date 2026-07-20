import { z } from 'zod';
import { salaryPeriodSchema } from './enums.schema';
import {
  applicationCvChoiceSchema,
  generatedCvResponseSchema,
  hydratedGeneratedCvExportSchema,
  storedGeneratedCvContentSchema,
} from './generated-cv.schema';

export const applicationStatusSchema = z.enum([
  'DRAFT',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'OFFER_ACCEPTED',
  'OFFER_DECLINED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
  'ARCHIVED',
]);

export const generationStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

export const generationModeSchema = z.enum(['AI', 'MANUAL']);

export const coverLetterSourceSchema = z.enum(['AI', 'MANUAL']);

export { applicationCvChoiceSchema };

export const applicationAtsReportSchema = z.object({
  score: z.number().int().min(0).max(100),
  letterScore: z.number().int().min(0).max(100).nullable().optional(),
  cvScore: z.number().int().min(0).max(100).nullable().optional(),
  missingKeywords: z.array(z.string()),
  suggestions: z.array(z.string()),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  actionableSteps: z.array(z.string()),
  /** Roles the CV supports today — useful when this JD is a poor fit. */
  suggestedRoles: z.array(z.string()).optional().default([]),
  /** One-sentence career guidance grounded in suggestedRoles. */
  careerSuggestion: z.string().nullable().optional(),
  keywordCoverage: z.record(z.number()),
  icpMatch: z.record(z.unknown()),
  breakdown: z.record(z.number()),
  assessedAt: z.string().datetime(),
  /** True when JD, letter, or CV used for scoring changed since assessedAt. */
  stale: z.boolean().optional(),
});

export const applicationEventSummarySchema = z.object({
  id: z.string(),
  eventType: z.enum([
    'RESPONSE',
    'INTERVIEW',
    'NOTE',
    'NEXT_STEP',
    'STATUS_CHANGE',
  ]),
  occurredAt: z.string().datetime(),
  content: z.string(),
  contactName: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const applicationResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileId: z.string(),
  status: applicationStatusSchema,
  generationMode: generationModeSchema,
  canonicalJobKey: z.string().nullable(),
  applyUrl: z.string().nullable(),
  generationStatus: generationStatusSchema.nullable(),
  generationError: z.string().nullable(),
  jobSnapshot: z.record(z.unknown()).nullable(),
  profileSnapshot: z.record(z.unknown()).nullable(),
  cvSnapshot: z.record(z.unknown()).nullable(),
  snapshottedAt: z.string().datetime(),
  pastedJobDescription: z.string().nullable(),
  companyName: z.string().nullable(),
  jobRoleTitle: z.string().nullable(),
  jobLocation: z.string().nullable(),
  jobWebsite: z.string().nullable(),
  industry: z.string().nullable(),
  sourceOfListing: z.string().nullable(),
  languageRequired: z.array(z.string()),
  jobStartDate: z.string().datetime().nullable(),
  jobSalaryMin: z.number().int().nullable(),
  jobSalaryMax: z.number().int().nullable(),
  jobSalaryCurrency: z.string().nullable(),
  jobSalaryPeriod: salaryPeriodSchema.nullable(),
  jobSalaryRaw: z.string().nullable(),
  userFitRating: z.number().int().nullable(),
  coverLetterContent: z.string().nullable(),
  coverLetterTemplateId: z.string(),
  coverLetterSource: coverLetterSourceSchema,
  coverLetterEdited: z.boolean(),
  cvChoice: applicationCvChoiceSchema,
  generatedCv: generatedCvResponseSchema.nullable(),
  /** Hydrated export (identity merged) — present when generatedCv + user/profile loaded. */
  generatedCvExport: hydratedGeneratedCvExportSchema.nullable().optional(),
  appliedAt: z.string().datetime().nullable(),
  atsReport: applicationAtsReportSchema.nullable(),
  events: z.array(applicationEventSummarySchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createManualApplicationSchema = z
  .object({
    profileId: z.string().min(1),
    companyName: z.string().min(1).max(200).optional(),
    jobRoleTitle: z.string().min(1).max(200).optional(),
    jobLocation: z.string().max(200).optional(),
    jobWebsite: z.string().url().optional(),
    industry: z.string().max(200).optional(),
    sourceOfListing: z.string().max(200).optional(),
    languageRequired: z.array(z.string()).optional(),
    jobStartDate: z.string().datetime().optional(),
    jobSalaryMin: z.number().int().positive().optional(),
    jobSalaryMax: z.number().int().positive().optional(),
    jobSalaryCurrency: z.string().length(3).optional(),
    jobSalaryPeriod: salaryPeriodSchema.optional(),
    jobSalaryRaw: z.string().max(200).optional(),
    userFitRating: z.number().int().min(0).max(100).optional(),
    applyUrl: z.string().url().optional(),
    pastedJobDescription: z.string().max(50_000).optional(),
    /** Links a tracker row to a browsed listing for later Generate (no AI credit on create). */
    canonicalJobKey: z.string().min(1).max(500).optional(),
    status: applicationStatusSchema.optional(),
  })
  .refine(
    (data) =>
      data.canonicalJobKey != null ||
      (data.companyName != null && data.jobRoleTitle != null),
    {
      message:
        'companyName and jobRoleTitle are required without canonicalJobKey',
    },
  );

export const generateApplicationSchema = z.object({
  profileId: z.string().min(1),
  canonicalJobKey: z.string().min(1),
  /** Client-supplied job facts — used when Redis job cache has expired. */
  job: z
    .object({
      title: z.string().min(1).max(300),
      company: z.string().min(1).max(300),
      description: z.string().max(100_000).optional(),
      applyUrl: z.string().max(2000).optional(),
      location: z.string().max(300).nullable().optional(),
      snippet: z.string().max(2000).optional(),
      atsType: z
        .enum(['greenhouse', 'lever', 'ashby', 'adzuna', 'unknown'])
        .optional(),
    })
    .optional(),
});

export const patchApplicationSchema = z
  .object({
    status: applicationStatusSchema.optional(),
    companyName: z.string().max(200).optional(),
    jobRoleTitle: z.string().max(200).optional(),
    jobLocation: z.string().max(200).optional(),
    jobWebsite: z.string().url().optional(),
    industry: z.string().max(200).optional(),
    sourceOfListing: z.string().max(200).optional(),
    languageRequired: z.array(z.string()).optional(),
    jobStartDate: z.string().datetime().nullable().optional(),
    jobSalaryMin: z.number().int().positive().nullable().optional(),
    jobSalaryMax: z.number().int().positive().nullable().optional(),
    jobSalaryCurrency: z.string().length(3).nullable().optional(),
    jobSalaryPeriod: salaryPeriodSchema.nullable().optional(),
    jobSalaryRaw: z.string().max(200).nullable().optional(),
    userFitRating: z.number().int().min(0).max(100).nullable().optional(),
    applyUrl: z.string().url().nullable().optional(),
    coverLetterContent: z.string().max(50_000).optional(),
    coverLetterEdited: z.boolean().optional(),
    cvChoice: applicationCvChoiceSchema.optional(),
    /** Optional edit of anonymous GeneratedCv content (sets edited=true). */
    generatedCvContent: storedGeneratedCvContentSchema.optional(),
    appliedAt: z.string().datetime().nullable().optional(),
    pastedJobDescription: z.string().max(50_000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const listApplicationsQuerySchema = z.object({
  status: applicationStatusSchema.optional(),
  sourceOfListing: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
});

export const hybridCoverLetterSchema = z.object({
  pastedJobDescription: z.string().min(50).max(50_000).optional(),
});

export const hybridGenerateCvSchema = z.object({
  pastedJobDescription: z.string().min(50).max(50_000).optional(),
});

export type ApplicationResponse = z.infer<typeof applicationResponseSchema>;
export type CreateManualApplicationInput = z.infer<
  typeof createManualApplicationSchema
>;
export type GenerateApplicationInput = z.infer<typeof generateApplicationSchema>;
export type PatchApplicationInput = z.infer<typeof patchApplicationSchema>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
