import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    SUPABASE_URL: z.string().url(),
    SUPABASE_JWKS_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_SECRET_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default('cvs'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().optional(),
    ADZUNA_APP_ID: z.string().optional(),
    ADZUNA_APP_KEY: z.string().optional(),
    ADZUNA_API_KEY: z.string().optional(),
    ADZUNA_DEFAULT_COUNTRY: z.string().length(2).default('gb'),
    DEV_MODE: z
      .string()
      .optional()
      .transform((v) => v === 'True' || v === 'true' || v === '1'),
  })
  .refine(
    (env) => Boolean(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY),
    {
      message:
        'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required for Storage',
      path: ['SUPABASE_SERVICE_ROLE_KEY'],
    },
  );

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${message}`);
  }
  return parsed.data;
}

export function getSupabaseServiceRoleKey(env: EnvConfig): string {
  return env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY!;
}

export function getLlmApiKey(env: EnvConfig): string | undefined {
  return env.OPENAI_API_KEY ?? env.OPENROUTER_API_KEY;
}

export function isOpenRouterKey(apiKey: string): boolean {
  return apiKey.startsWith('sk-or-');
}

export function getLlmBaseUrl(env: EnvConfig): string {
  const apiKey = getLlmApiKey(env);
  if (apiKey && isOpenRouterKey(apiKey)) {
    return 'https://openrouter.ai/api/v1';
  }
  if (env.OPENAI_API_KEY) {
    return 'https://api.openai.com/v1';
  }
  return 'https://openrouter.ai/api/v1';
}

export function getLlmModel(env: EnvConfig): string {
  const apiKey = getLlmApiKey(env);
  if (apiKey && isOpenRouterKey(apiKey)) {
    return env.OPENROUTER_MODEL ?? env.OPENAI_MODEL ?? 'deepseek/deepseek-chat';
  }
  if (env.OPENAI_API_KEY) {
    return env.OPENAI_MODEL;
  }
  return env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat';
}

export function getAdzunaAppKey(env: EnvConfig): string {
  return env.ADZUNA_APP_KEY ?? env.ADZUNA_API_KEY ?? '';
}
