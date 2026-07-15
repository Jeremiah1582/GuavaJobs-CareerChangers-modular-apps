import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AtsReportGenerator } from '../../src/ai/ats-report.generator';
import { CoverLetterGenerator } from '../../src/ai/cover-letter.generator';
import { LlmClient } from '../../src/ai/llm.client';
import { EnvConfig } from '../../src/config/env.validation';

/** Minimal Nest module: real LlmClient + generators, env from process.env. */
export async function createAiEvalModule(): Promise<{
  module: TestingModule;
  coverLetter: CoverLetterGenerator;
  atsReport: AtsReportGenerator;
}> {
  const module = await Test.createTestingModule({
    providers: [
      CoverLetterGenerator,
      AtsReportGenerator,
      LlmClient,
      {
        provide: ConfigService,
        useValue: {
          get(key: keyof EnvConfig | string) {
            return process.env[key as string];
          },
        },
      },
    ],
  }).compile();

  return {
    module,
    coverLetter: module.get(CoverLetterGenerator),
    atsReport: module.get(AtsReportGenerator),
  };
}
