"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hybridCoverLetterSchema = exports.listApplicationsQuerySchema = exports.patchApplicationSchema = exports.generateApplicationSchema = exports.createManualApplicationSchema = exports.applicationResponseSchema = exports.applicationEventSummarySchema = exports.applicationAtsReportSchema = exports.coverLetterSourceSchema = exports.generationModeSchema = exports.generationStatusSchema = exports.applicationStatusSchema = void 0;
const zod_1 = require("zod");
const enums_schema_1 = require("./enums.schema");
exports.applicationStatusSchema = zod_1.z.enum([
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
exports.generationStatusSchema = zod_1.z.enum([
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
]);
exports.generationModeSchema = zod_1.z.enum(['AI', 'MANUAL']);
exports.coverLetterSourceSchema = zod_1.z.enum(['AI', 'MANUAL']);
exports.applicationAtsReportSchema = zod_1.z.object({
    score: zod_1.z.number().int().min(0).max(100),
    letterScore: zod_1.z.number().int().min(0).max(100).nullable().optional(),
    cvScore: zod_1.z.number().int().min(0).max(100).nullable().optional(),
    missingKeywords: zod_1.z.array(zod_1.z.string()),
    suggestions: zod_1.z.array(zod_1.z.string()),
    strengths: zod_1.z.array(zod_1.z.string()),
    gaps: zod_1.z.array(zod_1.z.string()),
    actionableSteps: zod_1.z.array(zod_1.z.string()),
    keywordCoverage: zod_1.z.record(zod_1.z.number()),
    icpMatch: zod_1.z.record(zod_1.z.unknown()),
    breakdown: zod_1.z.record(zod_1.z.number()),
    assessedAt: zod_1.z.string().datetime(),
});
exports.applicationEventSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    eventType: zod_1.z.enum([
        'RESPONSE',
        'INTERVIEW',
        'NOTE',
        'NEXT_STEP',
        'STATUS_CHANGE',
    ]),
    occurredAt: zod_1.z.string().datetime(),
    content: zod_1.z.string(),
    contactName: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime(),
});
exports.applicationResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    profileId: zod_1.z.string(),
    status: exports.applicationStatusSchema,
    generationMode: exports.generationModeSchema,
    canonicalJobKey: zod_1.z.string().nullable(),
    applyUrl: zod_1.z.string().nullable(),
    generationStatus: exports.generationStatusSchema.nullable(),
    generationError: zod_1.z.string().nullable(),
    jobSnapshot: zod_1.z.record(zod_1.z.unknown()).nullable(),
    profileSnapshot: zod_1.z.record(zod_1.z.unknown()).nullable(),
    cvSnapshot: zod_1.z.record(zod_1.z.unknown()).nullable(),
    snapshottedAt: zod_1.z.string().datetime(),
    pastedJobDescription: zod_1.z.string().nullable(),
    companyName: zod_1.z.string().nullable(),
    jobRoleTitle: zod_1.z.string().nullable(),
    jobLocation: zod_1.z.string().nullable(),
    jobWebsite: zod_1.z.string().nullable(),
    industry: zod_1.z.string().nullable(),
    sourceOfListing: zod_1.z.string().nullable(),
    languageRequired: zod_1.z.array(zod_1.z.string()),
    jobStartDate: zod_1.z.string().datetime().nullable(),
    jobSalaryMin: zod_1.z.number().int().nullable(),
    jobSalaryMax: zod_1.z.number().int().nullable(),
    jobSalaryCurrency: zod_1.z.string().nullable(),
    jobSalaryPeriod: enums_schema_1.salaryPeriodSchema.nullable(),
    jobSalaryRaw: zod_1.z.string().nullable(),
    userFitRating: zod_1.z.number().int().nullable(),
    coverLetterContent: zod_1.z.string().nullable(),
    coverLetterTemplateId: zod_1.z.string(),
    coverLetterSource: exports.coverLetterSourceSchema,
    coverLetterEdited: zod_1.z.boolean(),
    appliedAt: zod_1.z.string().datetime().nullable(),
    atsReport: exports.applicationAtsReportSchema.nullable(),
    events: zod_1.z.array(exports.applicationEventSummarySchema).optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
exports.createManualApplicationSchema = zod_1.z.object({
    profileId: zod_1.z.string().min(1),
    companyName: zod_1.z.string().min(1).max(200),
    jobRoleTitle: zod_1.z.string().min(1).max(200),
    jobLocation: zod_1.z.string().max(200).optional(),
    jobWebsite: zod_1.z.string().url().optional(),
    industry: zod_1.z.string().max(200).optional(),
    sourceOfListing: zod_1.z.string().max(200).optional(),
    languageRequired: zod_1.z.array(zod_1.z.string()).optional(),
    jobStartDate: zod_1.z.string().datetime().optional(),
    jobSalaryMin: zod_1.z.number().int().positive().optional(),
    jobSalaryMax: zod_1.z.number().int().positive().optional(),
    jobSalaryCurrency: zod_1.z.string().length(3).optional(),
    jobSalaryPeriod: enums_schema_1.salaryPeriodSchema.optional(),
    jobSalaryRaw: zod_1.z.string().max(200).optional(),
    userFitRating: zod_1.z.number().int().min(0).max(100).optional(),
    applyUrl: zod_1.z.string().url().optional(),
    pastedJobDescription: zod_1.z.string().max(50_000).optional(),
    status: exports.applicationStatusSchema.optional(),
});
exports.generateApplicationSchema = zod_1.z.object({
    profileId: zod_1.z.string().min(1),
    canonicalJobKey: zod_1.z.string().min(1),
});
exports.patchApplicationSchema = zod_1.z
    .object({
    status: exports.applicationStatusSchema.optional(),
    companyName: zod_1.z.string().max(200).optional(),
    jobRoleTitle: zod_1.z.string().max(200).optional(),
    jobLocation: zod_1.z.string().max(200).optional(),
    jobWebsite: zod_1.z.string().url().optional(),
    industry: zod_1.z.string().max(200).optional(),
    sourceOfListing: zod_1.z.string().max(200).optional(),
    languageRequired: zod_1.z.array(zod_1.z.string()).optional(),
    jobStartDate: zod_1.z.string().datetime().nullable().optional(),
    jobSalaryMin: zod_1.z.number().int().positive().nullable().optional(),
    jobSalaryMax: zod_1.z.number().int().positive().nullable().optional(),
    jobSalaryCurrency: zod_1.z.string().length(3).nullable().optional(),
    jobSalaryPeriod: enums_schema_1.salaryPeriodSchema.nullable().optional(),
    jobSalaryRaw: zod_1.z.string().max(200).nullable().optional(),
    userFitRating: zod_1.z.number().int().min(0).max(100).nullable().optional(),
    applyUrl: zod_1.z.string().url().nullable().optional(),
    coverLetterContent: zod_1.z.string().max(50_000).optional(),
    coverLetterEdited: zod_1.z.boolean().optional(),
    appliedAt: zod_1.z.string().datetime().nullable().optional(),
    pastedJobDescription: zod_1.z.string().max(50_000).nullable().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
});
exports.listApplicationsQuerySchema = zod_1.z.object({
    status: exports.applicationStatusSchema.optional(),
    sourceOfListing: zod_1.z.string().max(200).optional(),
    companyName: zod_1.z.string().max(200).optional(),
});
exports.hybridCoverLetterSchema = zod_1.z.object({
    pastedJobDescription: zod_1.z.string().min(50).max(50_000).optional(),
});
//# sourceMappingURL=application.schema.js.map