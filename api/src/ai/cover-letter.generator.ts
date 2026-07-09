import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { LlmClient } from './llm.client';

export const coverLetterLlmOutputSchema = z.object({
  coverLetter: z.string().min(50).max(8000),
});

export type CoverLetterLlmOutput = z.infer<typeof coverLetterLlmOutputSchema>;

const SYSTEM_PROMPT = `You write honest, tailored cover letters for job applications.
Use ONLY facts from the candidate profile and CV text provided.
Never invent employers, dates, degrees, or skills.
Career-change framing is allowed when supported by the CV.
Return JSON: { "coverLetter": "plain text letter" }`;

@Injectable()
export class CoverLetterGenerator {
  constructor(private readonly llm: LlmClient) {}

  async generate(params: {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    profileSummary: Record<string, unknown>;
    cvText: string;
  }): Promise<CoverLetterLlmOutput> {
    const userPrompt = JSON.stringify(
      {
        jobTitle: params.jobTitle,
        company: params.companyName,
        jobDescription: params.jobDescription.slice(0, 20_000),
        profile: params.profileSummary,
        cvText: params.cvText.slice(0, 20_000),
        rules: [
          'Plain text only, 3-4 paragraphs',
          'No placeholders like [Company Name]',
          'Do not fabricate experience',
        ],
      },
      null,
      2,
    );

    const raw = await this.llm.chatJson(SYSTEM_PROMPT, userPrompt);
    if (!raw?.trim()) {
      throw new Error('Empty LLM response for cover letter');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON for cover letter: ${raw.slice(0, 120)}`);
    }
    const normalized =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? {
            ...parsed,
            coverLetter:
              (parsed as Record<string, unknown>).coverLetter ??
              (parsed as Record<string, unknown>).content ??
              (parsed as Record<string, unknown>).letter,
          }
        : parsed;
    return coverLetterLlmOutputSchema.parse(normalized);
  }
}
