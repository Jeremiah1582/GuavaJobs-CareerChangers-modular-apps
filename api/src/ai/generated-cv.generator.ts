import { Injectable } from '@nestjs/common';
import {
  assertNoForbiddenStoredCvKeys,
  StoredGeneratedCvContent,
  storedGeneratedCvContentSchema,
  stripIdentityFromStoredContent,
} from '../shared/schemas/generated-cv.schema';
import { LlmClient } from './llm.client';
import { HUMAN_VOICE_PROMPT } from './prompt-human-voice';

export type GeneratedCvLlmOutput = {
  content: StoredGeneratedCvContent;
};

const SYSTEM_PROMPT = `You write ATS-aligned, job-tailored CV content as anonymous JSON for applications.

HARD HONESTY RULES (non-negotiable):
- Use ONLY facts present in the provided CV text and profile summary.
- Never invent employers, job titles, dates, degrees, certifications, metrics, tools, technologies, or responsibilities.
- Never add skills or keywords that are not supported by (or clearly evidenced in) the source CV/profile.
- Career-change framing and transferable-skill wording are OK only when grounded in real experience from the source.
- If the source lacks evidence for a section, omit that section or leave it empty — do not pad with fabrication.
- Prefer omitting a keyword over inventing it to match the JD.

COMPREHENSIVE COVERAGE (without fabricating):
- Preserve every evidenced role, education entry, certification, and project from the source CV.
- Fill every schema section that has source evidence (summary, coreCompetencies, work, education, skills, certificates, projects, languages, awards, volunteer).
- For recent roles, aim for 3–6 highlights when the source supports that many distinct facts; do not invent bullets to hit a count.
- Keep chronological order of work and education as in the source (newest first unless source clearly differs).
- Skills and coreCompetencies must be grounded in the source; reorder/emphasize for the JD but do not invent.

JD / COMPANY RELEVANCE (without fabricating):
- Reorder and emphasize real experience that best matches the job description.
- Rewrite/rephrase existing highlights toward JD language when the underlying fact is true.
- Prefer Action + Context + Result bullets only when metrics already exist in the source CV.
- Front-load JD-aligned keywords that already appear (or are clearly evidenced) in the source CV/profile.
- Structure for ATS using only real data: summary, coreCompetencies, work, education, skills, certificates, projects, languages, awards, volunteer.
- Include company/role context from the JD in summary framing and expect meta.tailoredFor to reflect "jobTitle @ company" — never invent candidate history at that company.

GDPR / anonymity:
- Never include personal identity: no name, email, phone, address, LinkedIn/GitHub URLs, or a "basics" object.

${HUMAN_VOICE_PROMPT}
- On CV bullets: concrete verbs, no identical openers across consecutive highlights, no filler.

Return JSON: { "content": { ...career body... } } where content matches:
{
  "label": "target job title for this application",
  "summary": "3-5 sentence professional summary tailored to the JD using only real facts",
  "coreCompetencies": ["JD-aligned keyword evidenced in source", "..."],
  "work": [{ "name": "Company", "position": "Title", "location": "City or null", "startDate": "YYYY-MM", "endDate": "YYYY-MM or null if current", "highlights": ["Action + Context + Result bullet grounded in source"] }],
  "education": [{ "institution": "...", "area": "field", "studyType": "degree", "startDate": "YYYY-MM or null", "endDate": "YYYY-MM or null" }],
  "skills": [{ "name": "Category", "keywords": ["skill evidenced in source"] }],
  "certificates": [{ "name": "...", "issuer": "...", "date": "YYYY-MM or null", "expiryDate": "YYYY-MM or null" }],
  "projects": [{ "name": "...", "description": "...", "highlights": ["..."], "startDate": null, "endDate": null, "url": null }],
  "languages": [{ "language": "...", "fluency": "..." }],
  "awards": [],
  "volunteer": [],
  "meta": { "schemaVersion": "json-ats-v1" }
}

Formatting:
- Dates MUST be YYYY-MM or YYYY-MM-DD (never year-only like "2020", never "Jan 2020", never "Present" as a string).
- If the source only has a year, expand to YYYY-01 (e.g. "2018" → "2018-01").
- endDate null means current/Present — use JSON null, not the string "Present".
- Prefer standard sections: Summary, Experience (work), Education, Skills.
- Omit sections with no source evidence.`;

@Injectable()
export class GeneratedCvGenerator {
  constructor(private readonly llm: LlmClient) {}

  async generate(params: {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    profileSummary: Record<string, unknown>;
    cvText: string;
  }): Promise<GeneratedCvLlmOutput> {
    const userPrompt = JSON.stringify(
      {
        jobTitle: params.jobTitle,
        company: params.companyName,
        jobDescription: params.jobDescription.slice(0, 20_000),
        profile: params.profileSummary,
        cvText: params.cvText.slice(0, 20_000),
        rules: [
          'Use ONLY facts from cvText and profile — never invent employers, titles, dates, degrees, certifications, metrics, tools, or responsibilities',
          'Never add skills/keywords not supported by the source CV/profile',
          'Career-change / transferable-skill wording only when grounded in real experience',
          'Preserve every evidenced role/education/cert/project; fill evidenced schema sections',
          '3–6 bullets per recent role when source supports; keep chronology',
          'Reorder and rephrase real experience toward JD language; do not fabricate fit',
          'Prefer Action + Context + Result only when metrics exist in the source CV',
          'Front-load JD-aligned keywords that are already evidenced in the source',
          'Frame summary for the target role/company without inventing history at that company',
          'Never include name, email, phone, address, or profile URLs',
          'Omit sections with no source evidence',
          'Human voice: vary rhythm, concrete verbs, no identical bullet openers',
        ],
      },
      null,
      2,
    );

    const raw = await this.llm.chatJson(SYSTEM_PROMPT, userPrompt, 'generated-cv');
    if (!raw?.trim()) {
      throw new Error('Empty LLM response for generated CV');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON for generated CV: ${raw.slice(0, 120)}`);
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Generated CV JSON must be an object');
    }

    const root = parsed as Record<string, unknown>;
    const bodyRaw =
      root.content && typeof root.content === 'object' && !Array.isArray(root.content)
        ? (root.content as Record<string, unknown>)
        : root;

    const stripped = stripIdentityFromStoredContent(bodyRaw);
    assertNoForbiddenStoredCvKeys(stripped);

    const priorMeta =
      typeof stripped.meta === 'object' &&
      stripped.meta &&
      !Array.isArray(stripped.meta)
        ? (stripped.meta as Record<string, unknown>)
        : {};

    const withMeta = {
      ...stripped,
      meta: {
        ...priorMeta,
        schemaVersion: 'json-ats-v1',
        tailoredFor: `${params.jobTitle} @ ${params.companyName}`,
        generatedAt: new Date().toISOString(),
      },
    };

    return {
      content: storedGeneratedCvContentSchema.parse(withMeta),
    };
  }
}
