"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
exports.getSupabaseServiceRoleKey = getSupabaseServiceRoleKey;
exports.getLlmApiKey = getLlmApiKey;
exports.isOpenRouterKey = isOpenRouterKey;
exports.getLlmBaseUrl = getLlmBaseUrl;
exports.getLlmModel = getLlmModel;
exports.getAdzunaAppKey = getAdzunaAppKey;
const zod_1 = require("zod");
exports.envSchema = zod_1.z
    .object({
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    DATABASE_URL: zod_1.z.string().min(1),
    DIRECT_URL: zod_1.z.string().min(1),
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_JWKS_URL: zod_1.z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().optional(),
    SUPABASE_SECRET_KEY: zod_1.z.string().optional(),
    SUPABASE_STORAGE_BUCKET: zod_1.z.string().default('cvs'),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    OPENAI_API_KEY: zod_1.z.string().optional(),
    OPENAI_MODEL: zod_1.z.string().default('gpt-4o-mini'),
    OPENROUTER_API_KEY: zod_1.z.string().optional(),
    OPENROUTER_MODEL: zod_1.z.string().optional(),
    ADZUNA_APP_ID: zod_1.z.string().optional(),
    ADZUNA_APP_KEY: zod_1.z.string().optional(),
    ADZUNA_API_KEY: zod_1.z.string().optional(),
    ADZUNA_DEFAULT_COUNTRY: zod_1.z.string().length(2).default('gb'),
    DEV_MODE: zod_1.z
        .string()
        .optional()
        .transform((v) => v === 'True' || v === 'true' || v === '1'),
})
    .refine((env) => Boolean(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY), {
    message: 'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required for Storage',
    path: ['SUPABASE_SERVICE_ROLE_KEY'],
});
function validateEnv(config) {
    const parsed = exports.envSchema.safeParse(config);
    if (!parsed.success) {
        const message = parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ');
        throw new Error(`Invalid environment: ${message}`);
    }
    return parsed.data;
}
function getSupabaseServiceRoleKey(env) {
    return env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY;
}
function getLlmApiKey(env) {
    return env.OPENAI_API_KEY ?? env.OPENROUTER_API_KEY;
}
function isOpenRouterKey(apiKey) {
    return apiKey.startsWith('sk-or-');
}
function getLlmBaseUrl(env) {
    const apiKey = getLlmApiKey(env);
    if (apiKey && isOpenRouterKey(apiKey)) {
        return 'https://openrouter.ai/api/v1';
    }
    if (env.OPENAI_API_KEY) {
        return 'https://api.openai.com/v1';
    }
    return 'https://openrouter.ai/api/v1';
}
function getLlmModel(env) {
    const apiKey = getLlmApiKey(env);
    if (apiKey && isOpenRouterKey(apiKey)) {
        return env.OPENROUTER_MODEL ?? env.OPENAI_MODEL ?? 'deepseek/deepseek-chat';
    }
    if (env.OPENAI_API_KEY) {
        return env.OPENAI_MODEL;
    }
    return env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat';
}
function getAdzunaAppKey(env) {
    return env.ADZUNA_APP_KEY ?? env.ADZUNA_API_KEY ?? '';
}
//# sourceMappingURL=env.validation.js.map