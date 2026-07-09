"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchProfileSchema = exports.createProfileSchema = exports.profileDetailResponseSchema = exports.profileResponseSchema = void 0;
const zod_1 = require("zod");
const assessment_schema_1 = require("./assessment.schema");
const cv_schema_1 = require("./cv.schema");
const enums_schema_1 = require("./enums.schema");
exports.profileResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    profileTitle: zod_1.z.string(),
    jobTitle: zod_1.z.string(),
    seniority: enums_schema_1.seniorityLevelSchema,
    primaryIndustry: enums_schema_1.profileIndustrySchema,
    summary: zod_1.z.string().nullable(),
    skills: zod_1.z.array(zod_1.z.string()),
    jobCategories: zod_1.z.array(zod_1.z.string()),
    locationCity: zod_1.z.string().nullable(),
    locationCountry: zod_1.z.string().nullable(),
    contactPhone: zod_1.z.string().nullable(),
    salaryMin: zod_1.z.number().int().nullable(),
    salaryMax: zod_1.z.number().int().nullable(),
    salaryCurrency: zod_1.z.string().nullable(),
    salaryPeriod: enums_schema_1.salaryPeriodSchema.nullable(),
    autofillAnswers: zod_1.z.record(zod_1.z.unknown()),
    isDefault: zod_1.z.boolean(),
    currentCvId: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
exports.profileDetailResponseSchema = exports.profileResponseSchema.extend({
    currentCv: cv_schema_1.cvMetaSchema.nullable(),
    generalAtsAssessment: assessment_schema_1.profileAtsAssessmentSchema.nullable(),
});
exports.createProfileSchema = zod_1.z.object({
    profileTitle: zod_1.z.string().min(1).max(200),
    jobTitle: zod_1.z.string().min(1).max(200),
    seniority: enums_schema_1.seniorityLevelSchema,
    primaryIndustry: enums_schema_1.profileIndustrySchema,
    summary: zod_1.z.string().max(10000).optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
    jobCategories: zod_1.z.array(zod_1.z.string()).optional(),
    locationCity: zod_1.z.string().max(200).optional(),
    locationCountry: zod_1.z.string().length(2).optional(),
    contactPhone: zod_1.z.string().max(50).optional(),
    salaryMin: zod_1.z.number().int().positive().optional(),
    salaryMax: zod_1.z.number().int().positive().optional(),
    salaryCurrency: zod_1.z.string().length(3).optional(),
    salaryPeriod: enums_schema_1.salaryPeriodSchema.optional(),
    isDefault: zod_1.z.boolean().optional(),
});
exports.patchProfileSchema = exports.createProfileSchema
    .partial()
    .extend({
    autofillAnswers: zod_1.z.record(zod_1.z.unknown()).optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
});
//# sourceMappingURL=profile.schema.js.map