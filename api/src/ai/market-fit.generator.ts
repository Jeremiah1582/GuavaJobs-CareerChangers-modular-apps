import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { LlmClient } from '../ai/llm.client';
import { HUMAN_VOICE_PROMPT } from '../ai/prompt-human-voice';
import type { ProfileIndustry, SeniorityLevel } from '../shared/schemas/enums.schema';
import { marketFitLevelSchema } from '../shared/schemas/market-fit.schema';

const llmRoleSchema = z.object({
  title: z.string().min(1).max(200),
  fitLevel: marketFitLevelSchema,
  matchScore: z.number().int().min(0).max(100),
  whyFit: z.string().min(1).max(800),
  evidenceSkills: z.array(z.string()).max(12),
});

export const marketFitLlmOutputSchema = z.object({
  roles: z.array(llmRoleSchema).min(5).max(5),
});

export type MarketFitLlmRole = z.infer<typeof llmRoleSchema>;
export type MarketFitLlmOutput = z.infer<typeof marketFitLlmOutputSchema>;

const SYSTEM_PROMPT = `You help career changers and growers discover where they fit in the job market.
Given the candidate's skills, seniority, industry lean, location, and optional CV/career evidence,
suggest exactly 5 job titles that suit them — without using any current job title they already claim.

Rules:
- Do NOT invent employers, degrees, dates, or skills.
- Base every suggestion on transferable skills and evidence present in the input.
- Prefer a mix: strong matches, adjacent pivots, and one thoughtful stretch role.
- matchScore: integer 0–100 for how well skills evidence supports this title (strong: typically 78–95, adjacent: 55–77, stretch: 35–54).
- whyFit: one short sentence citing concrete skills from the input.
- evidenceSkills: subset of skills from the input that support the title.
- Do NOT include salary figures or compensation estimates.

${HUMAN_VOICE_PROMPT}

Return JSON only:
{ "roles": [ { "title", "fitLevel": "strong"|"adjacent"|"stretch", "matchScore": number, "whyFit", "evidenceSkills": string[] } ] }
Exactly 5 roles.`;

@Injectable()
export class MarketFitGenerator {
  constructor(private readonly llm: LlmClient) {}

  fingerprint(input: {
    skills: string[];
    summary: string | null;
    seniority: SeniorityLevel;
    primaryIndustry: ProfileIndustry;
    locationCountry: string;
    locationCity: string | null;
    cvTextHash: string | null;
    careerHash: string | null;
  }): string {
    const payload = JSON.stringify({
      skills: [...input.skills].map((s) => s.toLowerCase()).sort(),
      summary: input.summary?.trim() ?? '',
      seniority: input.seniority,
      primaryIndustry: input.primaryIndustry,
      locationCountry: input.locationCountry.toLowerCase(),
      locationCity: input.locationCity?.trim().toLowerCase() ?? '',
      cvTextHash: input.cvTextHash,
      careerHash: input.careerHash,
    });
    return createHash('sha256').update(payload).digest('hex');
  }

  async generate(params: {
    skills: string[];
    summary: string | null;
    seniority: SeniorityLevel;
    primaryIndustry: ProfileIndustry;
    locationCountry: string;
    locationCity: string | null;
    cvText: string | null;
    careerCorpus: unknown | null;
  }): Promise<MarketFitLlmOutput> {
    const userPrompt = JSON.stringify(
      {
        // Intentionally omit jobTitle / profileTitle — avoid echoing current title.
        skills: params.skills,
        summary: params.summary,
        seniority: params.seniority,
        primaryIndustry: params.primaryIndustry,
        locationCountry: params.locationCountry,
        locationCity: params.locationCity,
        cvExcerpt: params.cvText?.slice(0, 12_000) ?? null,
        careerCorpus: params.careerCorpus,
        rules: [
          'Exactly 5 roles',
          'Do not use or echo a current job title field (none is provided)',
          'No salary numbers',
          'evidenceSkills must come from the skills list or CV',
        ],
      },
      null,
      2,
    );

    const raw = await this.llm.chatJson(
      SYSTEM_PROMPT,
      userPrompt,
      'market-fit',
    );
    if (!raw?.trim()) {
      throw new Error('Empty LLM response for market fit');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON for market fit: ${raw.slice(0, 120)}`);
    }
    return marketFitLlmOutputSchema.parse(parsed);
  }
}
