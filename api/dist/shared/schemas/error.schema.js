"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.apiErrorSchema = void 0;
const zod_1 = require("zod");
exports.apiErrorSchema = zod_1.z.object({
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.record(zod_1.z.unknown()).optional(),
    }),
});
class AppError extends Error {
    code;
    status;
    details;
    constructor(code, message, status = 400, details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
//# sourceMappingURL=error.schema.js.map