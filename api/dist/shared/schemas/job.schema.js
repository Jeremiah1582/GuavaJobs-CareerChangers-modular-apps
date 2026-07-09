"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobSearchQuerySchema = exports.jobSearchResponseSchema = exports.unifiedJobSchema = exports.jobListItemSchema = exports.atsTypeSchema = void 0;
const zod_1 = require("zod");
exports.atsTypeSchema = zod_1.z.enum([
    'greenhouse',
    'lever',
    'ashby',
    'adzuna',
    'unknown',
]);
exports.jobListItemSchema = zod_1.z.object({
    canonicalKey: zod_1.z.string(),
    title: zod_1.z.string(),
    company: zod_1.z.string(),
    location: zod_1.z.string().nullable(),
    snippet: zod_1.z.string(),
    applyUrl: zod_1.z.string().url(),
    atsType: exports.atsTypeSchema,
    hasFullDescription: zod_1.z.boolean(),
    applyType: zod_1.z.enum(['url', 'unknown']),
    salaryMin: zod_1.z.number().nullable().optional(),
    salaryMax: zod_1.z.number().nullable().optional(),
    salaryCurrency: zod_1.z.string().nullable().optional(),
    postedAt: zod_1.z.string().datetime().nullable().optional(),
});
exports.unifiedJobSchema = exports.jobListItemSchema.extend({
    description: zod_1.z.string(),
    source: zod_1.z.literal('adzuna'),
    fetchedAt: zod_1.z.string().datetime(),
    adzunaId: zod_1.z.string().optional(),
    adzunaCountry: zod_1.z.string().optional(),
});
exports.jobSearchResponseSchema = zod_1.z.object({
    results: zod_1.z.array(exports.jobListItemSchema),
    page: zod_1.z.number().int().positive(),
    totalResults: zod_1.z.number().int().nonnegative(),
    attribution: zod_1.z.literal('Jobs by Adzuna'),
});
exports.jobSearchQuerySchema = zod_1.z.object({
    q: zod_1.z.string().max(200).optional(),
    location: zod_1.z.string().max(200).optional(),
    country: zod_1.z.string().length(2).optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
});
//# sourceMappingURL=job.schema.js.map