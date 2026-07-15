import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Profile, ProfileIndustry } from '@prisma/client';
import { getIndustryCriteria } from './industry-criteria';
import { LlmClient } from './llm.client';
import {
  ProfileAtsLlmOutput,
  profileAtsLlmOutputSchema,
} from '../shared/schemas/assessment.schema';

const SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) coach for job seekers.
Score ONLY based on the provided CV text and profile metadata.
Never invent employers, dates, degrees, or skills not present in the CV.
Return strict JSON with keys: score (0-100 integer), missingKeywords (string array), suggestions (string array), breakdown (object with numeric sub-scores 0-100 for categories like keywords, formatting, seniorityAlignment).`;

@Injectable()
export class ProfileAtsGenerator {
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

  async generate(params: {
    profile: Profile;
    parsedCvText: string;
  }): Promise<ProfileAtsLlmOutput & { inputFingerprint: string }> {
    const { profile, parsedCvText } = params;
    const criteria = getIndustryCriteria(profile.primaryIndustry);
    const seniorityHint =
      criteria.seniorityExpectations[profile.seniority] ??
      'Match expectations to stated seniority level';

    const userPrompt = JSON.stringify(
      {
        task: 'Score this CV for ATS readiness in the given industry',
        industry: profile.primaryIndustry,
        industryLabel: criteria.label,
        keywordFocus: criteria.keywordFocus,
        seniority: profile.seniority,
        seniorityExpectations: seniorityHint,
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
          'missingKeywords should be industry-relevant terms absent or weak in the CV',
          'suggestions must be actionable and honest',
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
      throw new Error('LLM returned invalid JSON for profile ATS');
    }

    const result = profileAtsLlmOutputSchema.parse(parsed);
    const inputFingerprint = this.buildInputFingerprint(profile, parsedCvText);

    return { ...result, inputFingerprint };
  }
}

export function isPrimaryIndustrySet(
  industry: ProfileIndustry | null | undefined,
): industry is ProfileIndustry {
  return Boolean(industry);
}
