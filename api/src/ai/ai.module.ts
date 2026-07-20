import { Module } from '@nestjs/common';
import { AtsReportGenerator } from './ats-report.generator';
import { CoverLetterGenerator } from './cover-letter.generator';
import { GapAnswerImprover } from './gap-answer.improver';
import { GeneratedCvGenerator } from './generated-cv.generator';
import { JobFactsParser } from './job-facts.parser';
import { LlmClient } from './llm.client';
import { ProfileAtsGenerator } from './profile-ats.generator';

@Module({
  providers: [
    LlmClient,
    ProfileAtsGenerator,
    CoverLetterGenerator,
    GapAnswerImprover,
    GeneratedCvGenerator,
    AtsReportGenerator,
    JobFactsParser,
  ],
  exports: [
    LlmClient,
    ProfileAtsGenerator,
    CoverLetterGenerator,
    GapAnswerImprover,
    GeneratedCvGenerator,
    AtsReportGenerator,
    JobFactsParser,
  ],
})
export class AiModule {}
