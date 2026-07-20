import { z } from 'zod';
import {
  deriveJwksUrl,
  normalizeDatabaseUrl,
  supabaseProjectRef,
} from './database-url';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1).transform(normalizeDatabaseUrl),
    DIRECT_URL: z.string().min(1),
    SUPABASE_URL: z.string().url(),
    SUPABASE_JWKS_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_SECRET_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default('cvs'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().optional(),
    /** Comma-separated OpenRouter fallback models after the primary (429 / outage). */
    OPENROUTER_FALLBACK_MODELS: z.string().optional(),
    /** Per-request LLM timeout (ms). Package jobs run several calls sequentially. */
    LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
    ADZUNA_APP_ID: z.string().optional(),
    ADZUNA_APP_KEY: z.string().optional(),
    ADZUNA_API_KEY: z.string().optional(),
    ADZUNA_DEFAULT_COUNTRY: z.string().length(2).default('gb'),
    /** Exact production web origin (Vercel). Preview *.vercel.app always allowed. */
    WEB_ORIGIN: z.string().url().optional(),
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

export type EnvConfig = z.infer<typeof envSchema> & {
  SUPABASE_JWKS_URL: string;
};

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const withJwks = { ...config };
  if (
    typeof withJwks.SUPABASE_URL === 'string' &&
    !withJwks.SUPABASE_JWKS_URL
  ) {
    withJwks.SUPABASE_JWKS_URL = deriveJwksUrl(withJwks.SUPABASE_URL);
  }

  const parsed = envSchema.safeParse(withJwks);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${message}`);
  }

  const env = parsed.data as EnvConfig;
  env.SUPABASE_JWKS_URL =
    env.SUPABASE_JWKS_URL ?? deriveJwksUrl(env.SUPABASE_URL);

  const ref = supabaseProjectRef(env.SUPABASE_URL);
  if (ref && !env.DATABASE_URL.includes(ref) && !env.DIRECT_URL.includes(ref)) {
    console.warn(
      `[env] SUPABASE_URL project ref "${ref}" does not appear in DATABASE_URL/DIRECT_URL — auth sync will fail against the wrong database.`,
    );
  }

  return env;
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

/** Default cheap/reliable OpenRouter backups when the primary is rate-limited. */
const DEFAULT_OPENROUTER_FALLBACKS = [
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
] as const;

/**
 * Priority-ordered model list for OpenRouter `models` fallbacks.
 * Primary first; duplicates removed. Empty when not using OpenRouter.
 */
export function getLlmModelCandidates(env: EnvConfig): string[] {
  const apiKey = getLlmApiKey(env);
  const primary = getLlmModel(env);
  if (!apiKey || !isOpenRouterKey(apiKey)) {
    return [primary];
  }

  const fromEnv = (env.OPENROUTER_FALLBACK_MODELS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const fallbacks =
    fromEnv.length > 0 ? fromEnv : [...DEFAULT_OPENROUTER_FALLBACKS];

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of [primary, ...fallbacks]) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  return ordered;
}

export function getAdzunaAppKey(env: EnvConfig): string {
  return env.ADZUNA_APP_KEY ?? env.ADZUNA_API_KEY ?? '';
}
