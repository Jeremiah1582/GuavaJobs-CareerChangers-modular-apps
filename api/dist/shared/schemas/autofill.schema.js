"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchAutofillAnswersSchema = exports.autofillPayloadSchema = exports.autofillValueSchema = exports.atsFieldMapSchema = exports.autofillFieldBindingSchema = void 0;
const zod_1 = require("zod");
const job_schema_1 = require("./job.schema");
exports.autofillFieldBindingSchema = zod_1.z.object({
    logicalKey: zod_1.z.string(),
    selectors: zod_1.z.array(zod_1.z.string()).optional(),
    name: zod_1.z.string().optional(),
    id: zod_1.z.string().optional(),
    autocomplete: zod_1.z.string().optional(),
    inputType: zod_1.z
        .enum(['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'url'])
        .optional(),
});
exports.atsFieldMapSchema = zod_1.z.object({
    atsType: zod_1.z.enum(['greenhouse', 'lever', 'ashby']),
    version: zod_1.z.string(),
    fields: zod_1.z.array(exports.autofillFieldBindingSchema),
});
exports.autofillValueSchema = zod_1.z.union([
    zod_1.z.string(),
    zod_1.z.number(),
    zod_1.z.boolean(),
    zod_1.z.null(),
]);
exports.autofillPayloadSchema = zod_1.z.object({
    applicationId: zod_1.z.string(),
    profileId: zod_1.z.string(),
    applyUrl: zod_1.z.string().url().nullable(),
    atsType: job_schema_1.atsTypeSchema,
    atsSupported: zod_1.z.boolean(),
    fieldMap: exports.atsFieldMapSchema.nullable(),
    values: zod_1.z.record(exports.autofillValueSchema),
    coverLetterContent: zod_1.z.string().nullable(),
    cvStaging: zod_1.z.object({
        hint: zod_1.z.string(),
        downloadPath: zod_1.z.string(),
    }),
    disclaimers: zod_1.z.array(zod_1.z.string()),
});
exports.patchAutofillAnswersSchema = zod_1.z
    .record(zod_1.z.unknown())
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one autofill answer is required',
});
//# sourceMappingURL=autofill.schema.js.map