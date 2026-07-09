import { z } from 'zod';
export declare const apiErrorSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    };
}, {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    };
}>;
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
export declare class AppError extends Error {
    readonly code: string;
    readonly status: number;
    readonly details?: Record<string, unknown> | undefined;
    constructor(code: string, message: string, status?: number, details?: Record<string, unknown> | undefined);
}
