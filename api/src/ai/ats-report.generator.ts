import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { ProfileIndustry, SeniorityLevel } from '@prisma/client';
import {
  buildAtsChangeSummary,
  calibrateAtsScores,
  isNonTrivialEnrichmentAnswer,
} from './ats-score-calibrate';
import { getIndustryCriteria } from './industry-criteria';
import { extractJdMustHaves } from './jd-must-haves';
import { LlmClient } from './llm.client';
import {
  toIntScore,
  toNumberRecord,
  toStringArray,
} from './score-normalize';

export const atsGapKindSchema = z.enum([
  'keyword',
  'evidence',
  'cert',
  'domain',
  'seniority',
]);

export type AtsGapKind = z.infer<typeof atsGapKindSchema>;

export const atsGapDetailedSchema = z.object({
  text: z.string().min(1).max(2000),
  kind: atsGapKindSchema,
});

export type AtsGapDetailed = z.infer<typeof atsGapDetailedSchema>;

export const applicationAtsLlmOutputSchema = z.object({
  score: z.coerce.number().int().min(0).max(100),
  letterScore: z.coerce.number().int().min(0).max(100).optional(),
  cvScore: z.coerce.number().int().min(0).max(100).optional(),
  missingKeywords: z.array(z.string()).max(30),
  suggestions: z.array(z.string()).max(15),
  strengths: z.array(z.string()).max(15),
  gaps: z.array(z.string()).max(15),
  /** Optional taxonomy for UX routing; gaps[] remains the compat list. */
  gapsDetailed: z.array(atsGapDetailedSchema).max(15).optional().default([]),
  actionableSteps: z.array(z.string()).max(15),
  /** Job titles the CV actually supports today (not the target JD when misfit). */
  suggestedRoles: z.array(z.string()).max(8).optional().default([]),
  /** One-sentence career guidance grounded in suggestedRoles. */
  careerSuggestion: z.string().max(500).optional().default(''),
  keywordCoverage: z.record(z.coerce.number()).optional().default({}),
  icpMatch: z.record(z.unknown()).optional().default({}),
  breakdown: z.record(z.coerce.number()).optional().default({}),
  /** Set post-generation when a previous report exists. */
  changeSummary: z.string().max(500).nullable().optional().default(null),
});

export type ApplicationAtsLlmOutput = z.infer<typeof applicationAtsLlmOutputSchema>;

export type CareerEnrichmentForAts = {
  gapText: string;
  answer: string;
};

export type PreviousAtsSnapshot = {
  score: number;
  missingKeywords: string[];
  gaps: string[];
};

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

## Candidate-supplied enrichments (mandatory when present)
When "careerEnrichments" lists gap→answer evidence the candidate added:
- Treat substantiated answers as PRESENT evidence in the CV corpus.
- Do NOT keep the same gap bullet if the answer clearly covers it.
- Prefer updating missingKeywords / keywordCoverage from evidence, not stale narrative inertia.
- Never invent beyond what the enrichment or CV states.

## Consistency (mandatory — scores must match the narrative)
If missingKeywords lists many critical JD terms, OR gaps say the candidate lacks domain/required experience / is in the wrong field:
  → score and cvScore MUST be ≤ 35 (often ≤ 25 for total domain mismatch).
Soft-skill strengths alone must NOT inflate scores when hard requirements are missing.
Never output a high overall score alongside a long list of critical gaps or missing keywords.

## Career guidance (always populate)
- suggestedRoles: 3–6 realistic job titles the CV supports TODAY (grounded in CV evidence). If the target JD is a poor fit, suggest roles in the candidate's actual field — not the target title.
- careerSuggestion: One sentence like: "Your CV is currently suited toward [role1], [role2], and [role3] — consider applying for these roles to leverage your existing experience."

## Gap taxonomy (gapsDetailed)
For each gap in gaps[], also emit gapsDetailed entry { text, kind } where kind is one of:
- keyword — missing term/tool that could be evidenced
- evidence — experience exists but weakly shown
- cert — certification / license
- domain — wrong field / domain mismatch
- seniority — level / years mismatch
Keep gaps: string[] as the plain texts (same order preferred).

## Return strict JSON keys
score, letterScore, cvScore, missingKeywords, suggestions, strengths, gaps, gapsDetailed, actionableSteps, suggestedRoles, careerSuggestion, keywordCoverage (term → 0–1 coverage), icpMatch (object), breakdown (object with numeric 0–100 component scores such as skills, domain, seniority, keywords).`;

@Injectable()
export class AtsReportGenerator {
  constructor(private readonly llm: LlmClient) {}

  async generate(params: {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    coverLetter: string;
    cvText: string;
    careerEnrichments?: CareerEnrichmentForAts[];
    primaryIndustry?: ProfileIndustry | null;
    seniority?: SeniorityLevel | null;
    previousReport?: PreviousAtsSnapshot | null;
  }): Promise<ApplicationAtsLlmOutput> {
    const enrichments = (params.careerEnrichments ?? [])
      .map((e) => ({
        gapText: e.gapText.trim(),
        answer: e.answer.trim(),
      }))
      .filter((e) => e.gapText && e.answer);

    const addressedGapTexts = enrichments
      .filter((e) => isNonTrivialEnrichmentAnswer(e.answer))
      .map((e) => e.gapText);

    const mustHaves = extractJdMustHaves(params.jobDescription);
    const industry = params.primaryIndustry ?? ProfileIndustry.OTHER;
    const criteria = getIndustryCriteria(industry);
    const seniority = params.seniority ?? SeniorityLevel.MID;
    const seniorityHint =
      criteria.seniorityExpectations[seniority] ??
      'Match expectations to stated seniority level';

    const userPrompt = JSON.stringify(
      {
        jobTitle: params.jobTitle,
        company: params.companyName,
        jobDescription: params.jobDescription.slice(0, 20_000),
        coverLetter: params.coverLetter.slice(0, 10_000),
        cvText: params.cvText.slice(0, 20_000),
        jdMustHaves: mustHaves,
        industry: {
          code: industry,
          label: criteria.label,
          keywordFocus: criteria.keywordFocus,
          seniority,
          seniorityExpectations: seniorityHint,
        },
        careerEnrichments: enrichments.slice(0, 40).map((e) => ({
          gapText: e.gapText.slice(0, 500),
          answer: e.answer.slice(0, 2000),
        })),
        reminders: [
          'Be harsh on domain mismatches — inflated scores are a failure.',
          'Scores must agree with gaps and missingKeywords.',
          'Populate suggestedRoles from the CV, not from wishful JD fit.',
          'JD must-haves are the primary bar; industry keywordFocus is secondary guidance on how evidence usually looks.',
          'Treat careerEnrichments as candidate-supplied evidence addressing prior gaps.',
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
    const withGapsDetailed = ensureGapsDetailed(withSuggestion);
    const calibrated = calibrateAtsScores(withGapsDetailed, {
      coverLetterLength: params.coverLetter.trim().length,
      addressedGapTexts,
    });

    const changeSummary = buildAtsChangeSummary(params.previousReport, {
      score: calibrated.score,
      missingKeywords: calibrated.missingKeywords,
      gaps: calibrated.gaps,
    });

    return { ...calibrated, changeSummary };
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

function ensureGapsDetailed(
  out: ApplicationAtsLlmOutput,
): ApplicationAtsLlmOutput {
  if (out.gapsDetailed.length > 0) {
    // Prefer model taxonomy; ensure every gaps[] text is represented.
    const byText = new Map(
      out.gapsDetailed.map((g) => [g.text.trim().toLowerCase(), g] as const),
    );
    const merged = out.gaps.map((text) => {
      const existing = byText.get(text.trim().toLowerCase());
      return existing ?? { text, kind: inferGapKind(text) };
    });
    return { ...out, gapsDetailed: merged };
  }
  return {
    ...out,
    gapsDetailed: out.gaps.map((text) => ({ text, kind: inferGapKind(text) })),
  };
}

export function inferGapKind(text: string): AtsGapKind {
  const t = text.toLowerCase();
  if (
    /\b(certif|license|licence|gas safe|accredited|credential)\b/.test(t)
  ) {
    return 'cert';
  }
  if (
    /\b(wrong field|unrelated|domain|different (?:industry|field)|not a fit|no experience in)\b/.test(
      t,
    )
  ) {
    return 'domain';
  }
  if (/\b(senior|junior|years? of experience|mid-level|staff|principal)\b/.test(t)) {
    return 'seniority';
  }
  if (/\b(keyword|mention|term|tool|stack|framework|missing)\b/.test(t)) {
    return 'keyword';
  }
  return 'evidence';
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
    gapsDetailed: normalizeGapsDetailed(raw.gapsDetailed, toStringArray(raw.gaps)),
    actionableSteps: toStringArray(raw.actionableSteps),
    suggestedRoles: toStringArray(raw.suggestedRoles, 8),
    careerSuggestion: toCareerSuggestion(raw.careerSuggestion),
    keywordCoverage: toNumberRecord(raw.keywordCoverage),
    icpMatch: toObject(raw.icpMatch),
    breakdown: toNumberRecord(raw.breakdown),
    changeSummary: null,
  };
}

function normalizeGapsDetailed(
  value: unknown,
  fallbackGaps: string[],
): AtsGapDetailed[] {
  if (!Array.isArray(value)) {
    return fallbackGaps.map((text) => ({ text, kind: inferGapKind(text) }));
  }
  const out: AtsGapDetailed[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const rec = item as Record<string, unknown>;
    const text =
      typeof rec.text === 'string'
        ? rec.text.trim()
        : typeof rec.gap === 'string'
          ? rec.gap.trim()
          : '';
    if (!text) continue;
    const kindRaw = typeof rec.kind === 'string' ? rec.kind : '';
    const kindParsed = atsGapKindSchema.safeParse(kindRaw);
    out.push({
      text: text.slice(0, 2000),
      kind: kindParsed.success ? kindParsed.data : inferGapKind(text),
    });
  }
  return out.slice(0, 15);
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
