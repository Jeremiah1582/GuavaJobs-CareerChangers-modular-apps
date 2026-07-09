"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileAtsLlmOutputSchema = exports.profileAtsAssessmentSchema = void 0;
const zod_1 = require("zod");
const enums_schema_1 = require("./enums.schema");
exports.profileAtsAssessmentSchema = zod_1.z.object({
    profileId: zod_1.z.string(),
    industry: enums_schema_1.profileIndustrySchema,
    score: zod_1.z.number().int().min(0).max(100),
    missingKeywords: zod_1.z.array(zod_1.z.string()),
    suggestions: zod_1.z.array(zod_1.z.string()),
    breakdown: zod_1.z.record(zod_1.z.number()),
    inputFingerprint: zod_1.z.string().nullable(),
    assessedAt: zod_1.z.string().datetime(),
});
exports.profileAtsLlmOutputSchema = zod_1.z.object({
    score: zod_1.z.number().int().min(0).max(100),
    missingKeywords: zod_1.z.array(zod_1.z.string()).max(30),
    suggestions: zod_1.z.array(zod_1.z.string()).max(15),
    breakdown: zod_1.z.record(zod_1.z.number()).optional().default({}),
});
//# sourceMappingURL=assessment.schema.js.map