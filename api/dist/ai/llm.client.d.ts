import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.validation';
export declare class LlmClient {
    private readonly config;
    constructor(config: ConfigService<EnvConfig, true>);
    chatJson(systemPrompt: string, userPrompt: string): Promise<string>;
}
