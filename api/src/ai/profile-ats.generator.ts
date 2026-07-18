import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { ZodError } from 'zod';
import {
  ProfileAtsLlmOutput,
  profileAtsLlmOutputSchema,
} from '../shared/schemas/assessment.schema';
import { AppError } from '../shared/schemas/error.schema';
import {
  analyzeCvHeuristics,
  CvAtsHeuristicResult,
} from './cv-ats-heuristics';
import { getIndustryCriteria } from './industry-criteria';
import { LlmClient } from './llm.client';
import {
  toIntScore,
  toNumberRecord,
  toStringArray,
} from './score-normalize';

const SYSTEM_PROMPT = `You are an honest ATS (Applicant Tracking System) coach for job seekers.
Score ONLY from the provided CV text, profile metadata, and heuristic checklist.
Never invent employers, dates, degrees, certifications, or skills not evidenced in the CV.
Prefer improvements that quantify or clarify EXISTING claims over adding new skills the candidate may not have.
If a keyword is missing, say "only add if you have real experience" — never pressure fabrication.
Return strict JSON with keys:
- score (0-100 number)
- summary (1-2 sentence plain-English verdict)
- missingKeywords (string array — industry terms weak/absent; be selective)
- suggestions (string array — short actionable tips)
- strengths (string array — what already works, grounded in CV evidence)
- priorityActions (array of {title, detail, impact: high|medium|low}) — highest-leverage honest fixes first
- breakdown (object with numeric 0-100 scores for: keywords, formatting, seniorityAlignment, impactEvidence, contactAndStructure)`;

@Injectable()
export class ProfileAtsGenerator {
  private readonly logger = new Logger(ProfileAtsGenerator.name);

  constructor(private readonly llm: LlmClient) {}

  buildInputFingerprint(
    profile: Pick<
      Profile,
      | 'profileTitle'
      | 'jobTitle'
      | 'seniority'
      | 'primaryIndustry'
      | 'skills'
      | 'summary'
    >,
    parsedCvText: string,
  ): string {
    const payload = JSON.stringify({
      profileTitle: profile.profileTitle,
      jobTitle: profile.jobTitle,
      seniority: profile.seniority,
      primaryIndustry: profile.primaryIndustry,
      skills: profile.skills,
      summary: profile.summary,
      cvTextLength: parsedCvText.length,
      cvTextHash: createHash('sha256').update(parsedCvText).digest('hex'),
    });
    return createHash('sha256').update(payload).digest('hex');
  }

  runHeuristics(profile: Profile, parsedCvText: string): CvAtsHeuristicResult {
    return analyzeCvHeuristics(
      parsedCvText,
      profile.primaryIndustry,
      profile.seniority,
    );
  }

  async generate(params: {
    profile: Profile;
    parsedCvText: string;
  }): Promise<
    ProfileAtsLlmOutput & {
      inputFingerprint: string;
      checklist: CvAtsHeuristicResult['checklist'];
      heuristics: CvAtsHeuristicResult;
    }
  > {
    const { profile, parsedCvText } = params;
    const heuristics = this.runHeuristics(profile, parsedCvText);
    const criteria = getIndustryCriteria(profile.primaryIndustry);
    const seniorityHint =
      criteria.seniorityExpectations[profile.seniority] ??
      'Match expectations to stated seniority level';

    const inputFingerprint = this.buildInputFingerprint(profile, parsedCvText);

    let llmOut: ProfileAtsLlmOutput | null = null;
    try {
      llmOut = await this.callLlm({
        profile,
        parsedCvText,
        heuristics,
        criteriaLabel: criteria.label,
        keywordFocus: criteria.keywordFocus,
        seniorityHint,
      });
    } catch (error) {
      this.logger.warn(
        `Profile ATS LLM failed; using heuristics fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const merged = this.mergeHeuristicsAndLlm(heuristics, llmOut);
    return { ...merged, inputFingerprint, checklist: heuristics.checklist, heuristics };
  }

  private async callLlm(params: {
    profile: Profile;
    parsedCvText: string;
    heuristics: CvAtsHeuristicResult;
    criteriaLabel: string;
    keywordFocus: string[];
    seniorityHint: string;
  }): Promise<ProfileAtsLlmOutput> {
    const { profile, parsedCvText, heuristics } = params;

    const userPrompt = JSON.stringify(
      {
        task: 'Score this CV for ATS readiness and produce honest improvement coaching',
        industry: profile.primaryIndustry,
        industryLabel: params.criteriaLabel,
        keywordFocus: params.keywordFocus,
        seniority: profile.seniority,
        seniorityExpectations: params.seniorityHint,
        heuristicSignals: heuristics.signals,
        heuristicChecklist: heuristics.checklist,
        heuristicScore: heuristics.heuristicScore,
        heuristicMissingKeywords: heuristics.missingKeywords,
        profile: {
          profileTitle: profile.profileTitle,
          jobTitle: profile.jobTitle,
          summary: profile.summary,
          skills: profile.skills,
          jobCategories: profile.jobCategories,
        },
        cvText: parsedCvText.slice(0, 50_000),
        rules: [
          'Do not fabricate CV content',
          'missingKeywords must be industry-relevant and absent/weak in the CV',
          'priorityActions must be actionable and honest — never invent experience',
          'strengths must cite evidence already in the CV',
          'Blend heuristicScore with your judgment; large disagreements need justification in summary',
        ],
      },
      null,
      2,
    );

    const raw = await this.llm.chatJson(SYSTEM_PROMPT, userPrompt, 'profile-ats');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AppError(
        'AI_INVALID_RESPONSE',
        'LLM returned invalid JSON for profile ATS',
        502,
      );
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new AppError(
        'AI_INVALID_RESPONSE',
        'LLM returned unexpected profile ATS shape',
        502,
      );
    }

    try {
      return profileAtsLlmOutputSchema.parse(
        normalizeProfileAtsOutput(parsed as Record<string, unknown>),
      );
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          'AI_INVALID_RESPONSE',
          'LLM profile ATS output failed validation',
          502,
          { issues: error.issues },
        );
      }
      throw error;
    }
  }

  private mergeHeuristicsAndLlm(
    heuristics: CvAtsHeuristicResult,
    llm: ProfileAtsLlmOutput | null,
  ): ProfileAtsLlmOutput {
    if (!llm) {
      return {
        score: heuristics.heuristicScore,
        summary: this.fallbackSummary(heuristics),
        missingKeywords: heuristics.missingKeywords.slice(0, 12),
        suggestions: this.fallbackSuggestions(heuristics),
        strengths: this.fallbackStrengths(heuristics),
        priorityActions: this.fallbackActions(heuristics),
        breakdown: {
          keywords: Math.round(
            (heuristics.keywordHits.length /
              Math.max(
                heuristics.keywordHits.length + heuristics.missingKeywords.length,
                1,
              )) *
              100,
          ),
          formatting: heuristics.checklist.find((c) => c.id === 'sections')
            ?.passed
            ? 75
            : 40,
          seniorityAlignment: heuristics.heuristicScore,
          impactEvidence: heuristics.signals.quantifiedBullets >= 2 ? 70 : 35,
          contactAndStructure:
            (heuristics.signals.hasEmail ? 40 : 0) +
            (heuristics.signals.hasPhone ? 25 : 0) +
            (heuristics.signals.sectionHits.length >= 2 ? 35 : 10),
        },
      };
    }

    // Prefer heuristic keyword gaps when LLM invents none / too few.
    const missingKeywords =
      llm.missingKeywords.length >= 2
        ? llm.missingKeywords
        : heuristics.missingKeywords.slice(0, 12);

    // Blend scores so parseability failures pull the headline score down.
    const blended = Math.round(llm.score * 0.65 + heuristics.heuristicScore * 0.35);

    return {
      ...llm,
      score: blended,
      missingKeywords,
      strengths: llm.strengths.length
        ? llm.strengths
        : this.fallbackStrengths(heuristics),
      priorityActions: llm.priorityActions.length
        ? llm.priorityActions
        : this.fallbackActions(heuristics),
      suggestions: llm.suggestions.length
        ? llm.suggestions
        : this.fallbackSuggestions(heuristics),
      summary: llm.summary?.trim() || this.fallbackSummary(heuristics),
      breakdown: {
        keywords: 0,
        formatting: 0,
        seniorityAlignment: 0,
        impactEvidence: 0,
        contactAndStructure: 0,
        ...llm.breakdown,
      },
    };
  }

  private fallbackSummary(h: CvAtsHeuristicResult): string {
    const fails = h.checklist.filter((c) => !c.passed).length;
    if (fails === 0) {
      return 'Your CV clears the basic ATS parseability checks for this industry. Tighten wording and keep evidence honest before applying.';
    }
    return `ATS health is mixed (${h.heuristicScore}/100). ${fails} checklist item${fails === 1 ? '' : 's'} need attention before you rely on automated screening.`;
  }

  private fallbackSuggestions(h: CvAtsHeuristicResult): string[] {
    return h.checklist
      .filter((c) => !c.passed)
      .slice(0, 6)
      .map((c) => c.detail);
  }

  private fallbackStrengths(h: CvAtsHeuristicResult): string[] {
    return h.checklist
      .filter((c) => c.passed)
      .slice(0, 5)
      .map((c) => `${c.label}: ${c.detail}`);
  }

  private fallbackActions(
    h: CvAtsHeuristicResult,
  ): ProfileAtsLlmOutput['priorityActions'] {
    return h.checklist
      .filter((c) => !c.passed)
      .slice(0, 5)
      .map((c, i) => ({
        title: c.label,
        detail: c.detail,
        impact: (i === 0 ? 'high' : i < 3 ? 'medium' : 'low') as
          | 'high'
          | 'medium'
          | 'low',
      }));
  }
}

function normalizeProfileAtsOutput(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const priorityActions = Array.isArray(raw.priorityActions)
    ? raw.priorityActions
        .map((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return null;
          }
          const row = item as Record<string, unknown>;
          const title = typeof row.title === 'string' ? row.title.trim() : '';
          const detail = typeof row.detail === 'string' ? row.detail.trim() : '';
          const impactRaw =
            typeof row.impact === 'string' ? row.impact.toLowerCase() : 'medium';
          const impact =
            impactRaw === 'high' || impactRaw === 'low' || impactRaw === 'medium'
              ? impactRaw
              : 'medium';
          if (!title || !detail) return null;
          return { title, detail, impact };
        })
        .filter(Boolean)
    : [];

  return {
    ...raw,
    score: toIntScore(raw.score),
    summary: typeof raw.summary === 'string' ? raw.summary.trim() : '',
    missingKeywords: toStringArray(raw.missingKeywords, 30),
    suggestions: toStringArray(raw.suggestions, 15),
    strengths: toStringArray(raw.strengths, 10),
    priorityActions,
    breakdown: toNumberRecord(raw.breakdown),
  };
}

export function isPrimaryIndustrySet(
  industry: import('@prisma/client').ProfileIndustry | null | undefined,
): industry is import('@prisma/client').ProfileIndustry {
  return Boolean(industry);
}
