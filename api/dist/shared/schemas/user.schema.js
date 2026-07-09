"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchMeSchema = exports.userResponseSchema = exports.usageSummarySchema = exports.profileSummarySchema = void 0;
const zod_1 = require("zod");
const enums_schema_1 = require("./enums.schema");
exports.profileSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    profileTitle: zod_1.z.string(),
    jobTitle: zod_1.z.string(),
    isDefault: zod_1.z.boolean(),
});
exports.usageSummarySchema = zod_1.z.object({
    tier: enums_schema_1.userTierSchema,
    aiGenerationsUsedPeriod: zod_1.z.number().int(),
    aiGenerationsLimit: zod_1.z.number().int().nullable(),
    usagePeriodStart: zod_1.z.string().datetime().nullable(),
});
exports.userResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string(),
    imgUrl: zod_1.z.string().nullable(),
    linkedinUrl: zod_1.z.string().nullable(),
    githubUrl: zod_1.z.string().nullable(),
    tier: enums_schema_1.userTierSchema,
    defaultProfileId: zod_1.z.string().nullable(),
    defaultProfile: exports.profileSummarySchema.nullable(),
    usage: exports.usageSummarySchema,
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
exports.patchMeSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1).max(200).optional(),
    imgUrl: zod_1.z.string().url().nullable().optional(),
    linkedinUrl: zod_1.z.string().url().nullable().optional(),
    githubUrl: zod_1.z.string().url().nullable().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
});
//# sourceMappingURL=user.schema.js.map