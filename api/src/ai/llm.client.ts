import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EnvConfig,
  getLlmApiKey,
  getLlmBaseUrl,
  getLlmModel,
  getLlmModelCandidates,
  isOpenRouterKey,
} from '../config/env.validation';
import { AppError } from '../shared/schemas/error.schema';

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning?: string | null;
      reasoning_content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
};

/** Keep under typical reverse-proxy idle limits so clients don't see Internal Server Error. */
const LLM_TIMEOUT_MS = 45_000;
const LLM_MAX_ATTEMPTS = 3;
const LLM_RETRY_BASE_MS = 1_000;
const LLM_RETRY_MAX_MS = 8_000;

@Injectable()
export class LlmClient {
  private readonly logger = new Logger(LlmClient.name);

  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  async chatJson(
    systemPrompt: string,
    userPrompt: string,
    purpose = 'unknown',
  ): Promise<string> {
    const env = {
      OPENAI_API_KEY: this.config.get('OPENAI_API_KEY', { infer: true }),
      OPENROUTER_API_KEY: this.config.get('OPENROUTER_API_KEY', { infer: true }),
      OPENAI_MODEL: this.config.get('OPENAI_MODEL', { infer: true }),
      OPENROUTER_MODEL: this.config.get('OPENROUTER_MODEL', { infer: true }),
      OPENROUTER_FALLBACK_MODELS: this.config.get('OPENROUTER_FALLBACK_MODELS', {
        infer: true,
      }),
    } as EnvConfig;

    const apiKey = getLlmApiKey(env);
    if (!apiKey) {
      throw new AppError(
        'AI_NOT_CONFIGURED',
        'OPENAI_API_KEY (or OPENROUTER_API_KEY) is required for AI features',
        503,
      );
    }

    const baseUrl = getLlmBaseUrl(env);
    const model = getLlmModel(env);
    const modelCandidates = getLlmModelCandidates(env);
    const useOpenRouterFallbacks =
      isOpenRouterKey(apiKey) && modelCandidates.length > 1;
    const started = Date.now();

    if (/r1|reason/i.test(model)) {
      this.logger.warn(
        `Model "${model}" looks like a reasoning model — JSON ATS/cover-letter calls often hang. Prefer deepseek/deepseek-chat or gpt-4o-mini.`,
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    if (isOpenRouterKey(apiKey) || (env.OPENROUTER_API_KEY && !env.OPENAI_API_KEY)) {
      headers['HTTP-Referer'] = 'https://guavajobs.app';
      headers['X-Title'] = 'GuavaJobs API';
    }

    const body: Record<string, unknown> = {
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };

    // OpenRouter: `models` walks the list on 429/outage (priority order).
    if (useOpenRouterFallbacks) {
      body.models = modelCandidates;
    } else {
      body.model = model;
    }

    let lastErrorText = '';
    let lastStatus = 0;

    for (let attempt = 1; attempt <= LLM_MAX_ATTEMPTS; attempt++) {
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
          body: JSON.stringify(body),
        });
      } catch (error) {
        const timedOut =
          error instanceof Error &&
          (error.name === 'TimeoutError' ||
            error.name === 'AbortError' ||
            /aborted|timeout/i.test(error.message));
        if (timedOut) {
          throw new AppError(
            'AI_TIMEOUT',
            `LLM timed out after ${LLM_TIMEOUT_MS / 1000}s (model=${model}). Use a fast chat model such as deepseek/deepseek-chat — not reasoning/r1.`,
            504,
            { model, purpose, ms: Date.now() - started },
          );
        }
        throw new AppError(
          'AI_REQUEST_FAILED',
          `LLM request failed: ${error instanceof Error ? error.message : String(error)}`,
          502,
        );
      }

      if (res.ok) {
        const data = (await res.json()) as ChatCompletionResponse;
        const message = data.choices?.[0]?.message;
        const content = extractJsonContent(message);
        if (!content) {
          throw new AppError(
            'AI_EMPTY_RESPONSE',
            `LLM returned empty content (model=${data.model ?? model}). Reasoning models often omit message.content — switch to deepseek/deepseek-chat or gpt-4o-mini.`,
            502,
            { model: data.model ?? model, purpose },
          );
        }

        this.logger.log(
          JSON.stringify({
            model: data.model ?? model,
            modelCandidates: useOpenRouterFallbacks ? modelCandidates : [model],
            promptTokens: data.usage?.prompt_tokens ?? null,
            completionTokens: data.usage?.completion_tokens ?? null,
            ms: Date.now() - started,
            purpose,
            attempt,
          }),
        );

        return content;
      }

      lastStatus = res.status;
      lastErrorText = await res.text();

      const retryable = res.status === 429 || res.status === 503;
      if (!retryable || attempt >= LLM_MAX_ATTEMPTS) {
        break;
      }

      const delayMs = resolveRetryDelayMs(res.headers.get('Retry-After'), attempt);
      this.logger.warn(
        `LLM ${res.status} (attempt ${attempt}/${LLM_MAX_ATTEMPTS}, model=${model}); retrying in ${delayMs}ms — ${lastErrorText.slice(0, 160)}`,
      );
      await sleep(delayMs);
    }

    const statusHint =
      lastStatus === 429
        ? ' Rate-limited — retries exhausted; OpenRouter model fallbacks were requested when configured.'
        : '';

    throw new AppError(
      'AI_REQUEST_FAILED',
      `LLM request failed (${lastStatus}): ${lastErrorText.slice(0, 300)}${statusHint}`,
      lastStatus === 429 ? 429 : 502,
      {
        model,
        purpose,
        status: lastStatus,
        modelCandidates: useOpenRouterFallbacks ? modelCandidates : undefined,
      },
    );
  }
}

function resolveRetryDelayMs(
  retryAfterHeader: string | null,
  attempt: number,
): number {
  if (retryAfterHeader) {
    const asSeconds = Number(retryAfterHeader);
    if (Number.isFinite(asSeconds) && asSeconds > 0) {
      return Math.min(asSeconds * 1000, LLM_RETRY_MAX_MS);
    }
    const asDate = Date.parse(retryAfterHeader);
    if (!Number.isNaN(asDate)) {
      const delta = asDate - Date.now();
      if (delta > 0) return Math.min(delta, LLM_RETRY_MAX_MS);
    }
  }
  const exponential = LLM_RETRY_BASE_MS * 2 ** (attempt - 1);
  return Math.min(exponential, LLM_RETRY_MAX_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonContent(
  message:
    | {
        content?: string | null;
        reasoning?: string | null;
        reasoning_content?: string | null;
      }
    | undefined,
): string | null {
  if (!message) return null;
  const direct = message.content?.trim();
  if (direct) return direct;

  // Some reasoning providers put the final answer in reasoning fields.
  for (const raw of [message.reasoning, message.reasoning_content]) {
    const text = raw?.trim();
    if (!text) continue;
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return text.slice(start, end + 1);
    }
  }
  return null;
}
