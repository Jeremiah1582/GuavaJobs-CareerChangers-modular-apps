import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EnvConfig,
  getLlmApiKey,
  getLlmBaseUrl,
  getLlmModel,
  isOpenRouterKey,
} from '../config/env.validation';
import { AppError } from '../shared/schemas/error.schema';

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

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
    };

    const apiKey = getLlmApiKey(env as EnvConfig);
    if (!apiKey) {
      throw new AppError(
        'AI_NOT_CONFIGURED',
        'OPENAI_API_KEY (or OPENROUTER_API_KEY) is required for AI features',
        503,
      );
    }

    const baseUrl = getLlmBaseUrl(env as EnvConfig);
    const model = getLlmModel(env as EnvConfig);
    const started = Date.now();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    if (apiKey && isOpenRouterKey(apiKey)) {
      headers['HTTP-Referer'] = 'https://guavajobs.app';
      headers['X-Title'] = 'GuavaJobs API';
    } else if (env.OPENROUTER_API_KEY && !env.OPENAI_API_KEY) {
      headers['HTTP-Referer'] = 'https://guavajobs.app';
      headers['X-Title'] = 'GuavaJobs API';
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new AppError(
        'AI_REQUEST_FAILED',
        `LLM request failed (${res.status}): ${text.slice(0, 300)}`,
        502,
      );
    }

    const data = (await res.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new AppError('AI_EMPTY_RESPONSE', 'LLM returned empty content', 502);
    }

    // BUSINESS_PLAN R9 — token-usage line per LLM call
    this.logger.log(
      JSON.stringify({
        model,
        promptTokens: data.usage?.prompt_tokens ?? null,
        completionTokens: data.usage?.completion_tokens ?? null,
        ms: Date.now() - started,
        purpose,
      }),
    );

    return content;
  }
}
