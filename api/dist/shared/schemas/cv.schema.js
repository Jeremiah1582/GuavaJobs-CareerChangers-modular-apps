"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cvDownloadResponseSchema = exports.cvUploadResponseSchema = exports.cvMetaSchema = exports.cvParseStatusSchema = void 0;
const zod_1 = require("zod");
exports.cvParseStatusSchema = zod_1.z.enum(['PENDING', 'READY', 'FAILED']);
exports.cvMetaSchema = zod_1.z.object({
    id: zod_1.z.string(),
    fileName: zod_1.z.string(),
    mimeType: zod_1.z.string(),
    fileSizeBytes: zod_1.z.number().int(),
    parseStatus: exports.cvParseStatusSchema,
    uploadedAt: zod_1.z.string().datetime(),
});
exports.cvUploadResponseSchema = zod_1.z.object({
    cv: exports.cvMetaSchema,
    profileId: zod_1.z.string(),
    currentCvId: zod_1.z.string(),
});
exports.cvDownloadResponseSchema = zod_1.z.object({
    signedUrl: zod_1.z.string().url(),
    expiresInSeconds: zod_1.z.number().int(),
    fileName: zod_1.z.string(),
});
//# sourceMappingURL=cv.schema.js.map