"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const env_validation_1 = require("../config/env.validation");
const error_schema_1 = require("../shared/schemas/error.schema");
let LlmClient = class LlmClient {
    config;
    constructor(config) {
        this.config = config;
    }
    async chatJson(systemPrompt, userPrompt) {
        const env = {
            OPENAI_API_KEY: this.config.get('OPENAI_API_KEY', { infer: true }),
            OPENROUTER_API_KEY: this.config.get('OPENROUTER_API_KEY', { infer: true }),
            OPENAI_MODEL: this.config.get('OPENAI_MODEL', { infer: true }),
            OPENROUTER_MODEL: this.config.get('OPENROUTER_MODEL', { infer: true }),
        };
        const apiKey = (0, env_validation_1.getLlmApiKey)(env);
        if (!apiKey) {
            throw new error_schema_1.AppError('AI_NOT_CONFIGURED', 'OPENAI_API_KEY (or OPENROUTER_API_KEY) is required for AI features', 503);
        }
        const baseUrl = (0, env_validation_1.getLlmBaseUrl)(env);
        const model = (0, env_validation_1.getLlmModel)(env);
        const headers = {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        };
        if (apiKey && (0, env_validation_1.isOpenRouterKey)(apiKey)) {
            headers['HTTP-Referer'] = 'https://guavajobs.app';
            headers['X-Title'] = 'GuavaJobs API';
        }
        else if (env.OPENROUTER_API_KEY && !env.OPENAI_API_KEY) {
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
            throw new error_schema_1.AppError('AI_REQUEST_FAILED', `LLM request failed (${res.status}): ${text.slice(0, 300)}`, 502);
        }
        const data = (await res.json());
        const content = data.choices?.[0]?.message?.content?.trim();
        if (!content) {
            throw new error_schema_1.AppError('AI_EMPTY_RESPONSE', 'LLM returned empty content', 502);
        }
        return content;
    }
};
exports.LlmClient = LlmClient;
exports.LlmClient = LlmClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LlmClient);
//# sourceMappingURL=llm.client.js.map