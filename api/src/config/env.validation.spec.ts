import {
  getLlmModel,
  getLlmModelCandidates,
  EnvConfig,
} from './env.validation';

function baseEnv(overrides: Partial<EnvConfig> = {}): EnvConfig {
  return {
    NODE_ENV: 'test',
    PORT: 3000,
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    DIRECT_URL: 'postgresql://u:p@localhost:5432/db',
    SUPABASE_URL: 'https://abc.supabase.co',
    SUPABASE_JWKS_URL: 'https://abc.supabase.co/auth/v1/.well-known/jwks.json',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    SUPABASE_STORAGE_BUCKET: 'cvs',
    REDIS_URL: 'redis://localhost:6379',
    OPENAI_MODEL: 'gpt-4o-mini',
    ADZUNA_DEFAULT_COUNTRY: 'gb',
    DEV_MODE: false,
    ...overrides,
  } as EnvConfig;
}

describe('getLlmModelCandidates', () => {
  it('returns only primary for non-OpenRouter keys', () => {
    const env = baseEnv({
      OPENAI_API_KEY: 'sk-openai-test',
      OPENAI_MODEL: 'gpt-4o-mini',
    });
    expect(getLlmModel(env)).toBe('gpt-4o-mini');
    expect(getLlmModelCandidates(env)).toEqual(['gpt-4o-mini']);
  });

  it('adds default OpenRouter fallbacks after primary', () => {
    const env = baseEnv({
      OPENAI_API_KEY: 'sk-or-v1-test',
      OPENAI_MODEL: 'deepseek/deepseek-chat',
    });
    expect(getLlmModelCandidates(env)).toEqual([
      'deepseek/deepseek-chat',
      'openai/gpt-4o-mini',
      'google/gemini-2.0-flash-001',
    ]);
  });

  it('uses OPENROUTER_FALLBACK_MODELS and dedupes primary', () => {
    const env = baseEnv({
      OPENAI_API_KEY: 'sk-or-v1-test',
      OPENAI_MODEL: 'openai/gpt-4o-mini',
      OPENROUTER_FALLBACK_MODELS:
        'openai/gpt-4o-mini, google/gemini-2.0-flash-001 ',
    });
    expect(getLlmModelCandidates(env)).toEqual([
      'openai/gpt-4o-mini',
      'google/gemini-2.0-flash-001',
    ]);
  });
});
