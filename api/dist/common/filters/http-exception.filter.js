"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const error_schema_1 = require("../../shared/schemas/error.schema");
const zod_1 = require("zod");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        if (exception instanceof error_schema_1.AppError) {
            response.status(exception.status).json({
                error: {
                    code: exception.code,
                    message: exception.message,
                    ...(exception.details ? { details: exception.details } : {}),
                },
            });
            return;
        }
        if (exception instanceof zod_1.ZodError) {
            response.status(common_1.HttpStatus.BAD_REQUEST).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: { issues: exception.issues },
                },
            });
            return;
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            if (typeof body === 'object' && body !== null && 'error' in body) {
                response.status(status).json(body);
                return;
            }
            response.status(status).json({
                error: {
                    code: 'HTTP_ERROR',
                    message: typeof body === 'string'
                        ? body
                        : (body.message ??
                            'Request failed'),
                },
            });
            return;
        }
        console.error(exception);
        response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred',
            },
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map