import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { LlmClient } from './llm.client';
import { calibrateAtsScores } from './ats-score-calibrate';
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
  /** Job titles the CV actually supports today (not the target JD when misfit). */
  suggestedRoles: z.array(z.string()).max(8).optional().default([]),
  /** One-sentence career guidance grounded in suggestedRoles. */
  careerSuggestion: z.string().max(500).optional().default(''),
  keywordCoverage: z.record(z.coerce.number()).optional().default({}),
  icpMatch: z.record(z.unknown()).optional().default({}),
  breakdown: z.record(z.coerce.number()).optional().default({}),
});

export type ApplicationAtsLlmOutput = z.infer<typeof applicationAtsLlmOutputSchema>;

const SYSTEM_PROMPT = `You are a strict, honest job-application ATS assessor (CV + cover letter vs job description).
Score ONLY from provided text. Never invent candidate credentials, employers, degrees, or skills.

## Score meanings (integers 0–100)
- score (overall fit): Would a real ATS + recruiter shortlist this person for THIS role based on CV evidence?
- cvScore: How well the CV covers the JD's must-have skills, tools, certifications, and domain experience.
- letterScore: How well the cover letter supports a *credible* application given what the CV actually proves.
  Do NOT reward parroting JD keywords that the CV does not support.
  Honest transferable-skill / career-change framing may score higher than cvScore.
  For a clear domain mismatch, letterScore is usually the least-bad of the three — still low absolute — not near zero and not high.

## Rubric bands (overall + cvScore)
- 0–25: Wrong field or missing most must-haves (e.g. software CV vs plumbing / trades JD)
- 26–45: Adjacent background with major hard-requirement gaps; long shot
- 46–65: Partial fit; some transferable evidence; notable gaps remain
- 66–80: Solid fit with fixable gaps
- 81–100: Strong match on must-haves

## Consistency (mandatory — scores must match the narrative)
If missingKeywords lists many critical JD terms, OR gaps say the candidate lacks domain/required experience / is in the wrong field:
  → score and cvScore MUST be ≤ 35 (often ≤ 25 for total domain mismatch).
Soft-skill strengths alone must NOT inflate scores when hard requirements are missing.
Never output a high overall score alongside a long list of critical gaps or missing keywords.

## Career guidance (always populate)
- suggestedRoles: 3–6 realistic job titles the CV supports TODAY (grounded in CV evidence). If the target JD is a poor fit, suggest roles in the candidate's actual field — not the target title.
- careerSuggestion: One sentence like: "Your CV is currently suited toward [role1], [role2], and [role3] — consider applying for these roles to leverage your existing experience."

## Return strict JSON keys
score, letterScore, cvScore, missingKeywords, suggestions, strengths, gaps, actionableSteps, suggestedRoles, careerSuggestion, keywordCoverage (term → 0–1 coverage), icpMatch (object), breakdown (object with numeric 0–100 component scores such as skills, domain, seniority, keywords).`;

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
        reminders: [
          'Be harsh on domain mismatches — inflated scores are a failure.',
          'Scores must agree with gaps and missingKeywords.',
          'Populate suggestedRoles from the CV, not from wishful JD fit.',
        ],
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
    const normalized = applicationAtsLlmOutputSchema.parse(
      normalizeAtsOutput(parsed),
    );
    const withSuggestion = ensureCareerSuggestion(normalized);
    return calibrateAtsScores(withSuggestion, {
      coverLetterLength: params.coverLetter.trim().length,
    });
  }
}

function ensureCareerSuggestion(
  out: ApplicationAtsLlmOutput,
): ApplicationAtsLlmOutput {
  const roles = out.suggestedRoles.map((r) => r.trim()).filter(Boolean);
  let careerSuggestion = out.careerSuggestion.trim();
  if (!careerSuggestion && roles.length > 0) {
    const listed =
      roles.length === 1
        ? roles[0]!
        : roles.length === 2
          ? `${roles[0]} and ${roles[1]}`
          : `${roles.slice(0, -1).join(', ')}, and ${roles[roles.length - 1]}`;
    careerSuggestion = `Your CV is currently suited toward ${listed} — consider applying for these roles to leverage your existing experience.`;
  }
  return { ...out, suggestedRoles: roles, careerSuggestion };
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
    suggestedRoles: toStringArray(raw.suggestedRoles, 8),
    careerSuggestion: toCareerSuggestion(raw.careerSuggestion),
    keywordCoverage: toNumberRecord(raw.keywordCoverage),
    icpMatch: toObject(raw.icpMatch),
    breakdown: toNumberRecord(raw.breakdown),
  };
}

function toCareerSuggestion(value: unknown): string {
  if (typeof value === 'string') return value.trim().slice(0, 500);
  return '';
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
