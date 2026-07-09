"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEventsQuerySchema = exports.patchApplicationEventSchema = exports.createApplicationEventSchema = exports.applicationEventTypeSchema = void 0;
const zod_1 = require("zod");
exports.applicationEventTypeSchema = zod_1.z.enum([
    'RESPONSE',
    'INTERVIEW',
    'NOTE',
    'NEXT_STEP',
    'STATUS_CHANGE',
]);
exports.createApplicationEventSchema = zod_1.z.object({
    eventType: exports.applicationEventTypeSchema,
    occurredAt: zod_1.z.string().datetime(),
    content: zod_1.z.string().min(1).max(10_000),
    contactName: zod_1.z.string().max(200).optional(),
});
exports.patchApplicationEventSchema = exports.createApplicationEventSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
});
exports.listEventsQuerySchema = zod_1.z.object({
    eventType: exports.applicationEventTypeSchema.optional(),
});
//# sourceMappingURL=application-event.schema.js.map