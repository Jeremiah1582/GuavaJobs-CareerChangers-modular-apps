import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { LlmClient } from './llm.client';
import {
  toIntScore,
  toNumberRecord,
  toStringArray,
} from './score-normalize';

export const applicationAtsLlmOutputSchema = z.object({
  score: z.coerce.number().int().min(0).max(100),
  letterScore: z.coerce.number().int().min(0).max(100).optional(),
  cvScore: z.coerce.number().int().min(0).max(100).optional(),
  missingKeywords: z.array(z.string()).max(30),
  suggestions: z.array(z.string()).max(15),
  strengths: z.array(z.string()).max(15),
  gaps: z.array(z.string()).max(15),
  actionableSteps: z.array(z.string()).max(15),
  keywordCoverage: z.record(z.coerce.number()).optional().default({}),
  icpMatch: z.record(z.unknown()).optional().default({}),
  breakdown: z.record(z.coerce.number()).optional().default({}),
});

export type ApplicationAtsLlmOutput = z.infer<typeof applicationAtsLlmOutputSchema>;

const SYSTEM_PROMPT = `You assess job application fit (CV + cover letter vs job description).
Score honestly based only on provided text. Never invent candidate credentials.
Return JSON with: score (number), letterScore, cvScore, missingKeywords (array of strings), suggestions (array of strings), strengths, gaps, actionableSteps, keywordCoverage (object with numeric values 0-1), icpMatch (object), breakdown (object with numeric scores).`;

@Injectable()
export class AtsReportGenerator {
  constructor(private readonly llm: LlmClient) {}

  async generate(params: {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    coverLetter: string;
    cvText: string;
  }): Promise<ApplicationAtsLlmOutput> {
    const userPrompt = JSON.stringify(
      {
        jobTitle: params.jobTitle,
        company: params.companyName,
        jobDescription: params.jobDescription.slice(0, 20_000),
        coverLetter: params.coverLetter.slice(0, 10_000),
        cvText: params.cvText.slice(0, 20_000),
      },
      null,
      2,
    );

    const raw = await this.llm.chatJson(SYSTEM_PROMPT, userPrompt, 'ats-report');
    if (!raw?.trim()) {
      throw new Error('Empty LLM response for ATS report');
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`Invalid JSON for ATS report: ${raw.slice(0, 120)}`);
    }
    return applicationAtsLlmOutputSchema.parse(normalizeAtsOutput(parsed));
  }
}

function normalizeAtsOutput(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    ...raw,
    score: toIntScore(raw.score),
    letterScore: raw.letterScore === undefined ? undefined : toIntScore(raw.letterScore),
    cvScore: raw.cvScore === undefined ? undefined : toIntScore(raw.cvScore),
    missingKeywords: toStringArray(raw.missingKeywords),
    suggestions: toStringArray(raw.suggestions),
    strengths: toStringArray(raw.strengths),
    gaps: toStringArray(raw.gaps),
    actionableSteps: toStringArray(raw.actionableSteps),
    keywordCoverage: toNumberRecord(raw.keywordCoverage),
    icpMatch: toObject(raw.icpMatch),
    breakdown: toNumberRecord(raw.breakdown),
  };
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string' && value.trim()) {
    return { summary: value.trim() };
  }
  return {};
}
