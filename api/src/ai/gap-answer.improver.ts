import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { LlmClient } from './llm.client';
import { HUMAN_VOICE_PROMPT } from './prompt-human-voice';
import { improveGapResponseSchema } from '../shared/schemas/career-cv.schema';
import { countWords } from '../shared/utils/word-count';

export { countWords };
export const MIN_GAP_IMPROVE_WORDS = 10;

const llmImproveSchema = z.object({
  improvedAnswer: z.string().min(1).max(8000),
  factsUsed: z.array(z.string()).max(50).default([]),
  warnings: z.array(z.string()).max(20).optional().default([]),
});

const SYSTEM_PROMPT = `You polish a candidate's own gap-fill draft into 1–2 ATS-style bullets.
Use ONLY facts present in the draft. Never invent employers, dates, tools, certifications, metrics, or skills.
You may tighten wording and weave in missingKeywords ONLY when the draft already supports them (or the user named the tool).
If the draft is too thin, contradicts the gap, or claims a domain with no evidence, set improvedAnswer to the original draft (or lightly cleaned), put a clear refusal in warnings, and do not fabricate.

${HUMAN_VOICE_PROMPT}

Return JSON: { "improvedAnswer": "1-2 bullets or short Role/Details block", "factsUsed": ["fact", …], "warnings": ["optional"] }`;

/** Multi-word proper-noun spans that look like company/product names. */
const PROPER_PHRASE =
  /\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,3})\b/g;

const ALLOWED_WITHOUT_DRAFT = new Set([
  'Role',
  'Dates',
  'Details',
  'Outcome',
  'I',
  'The',
  'A',
  'An',
  'And',
  'Or',
  'For',
  'With',
  'At',
  'In',
  'On',
  'To',
  'Of',
  'As',
  'By',
  'From',
  'My',
  'We',
  'Our',
  'This',
  'That',
  'These',
  'Those',
  'Built',
  'Led',
  'Wrote',
  'Ran',
  'Helped',
  'Delivered',
  'Shipped',
  'Managed',
  'Created',
  'Developed',
  'Designed',
  'Implemented',
  'Reduced',
  'Improved',
  'Supported',
  'Trained',
  'REST',
  'API',
  'APIs',
  'SQL',
  'CI',
  'CD',
  'JSON',
  'HTML',
  'CSS',
  'UI',
  'UX',
]);

/**
 * Find proper-noun phrases in `text` that do not appear in `draft`
 * (case-insensitive). Used to catch invented employers/products.
 */
export function findUngroundedProperNouns(
  text: string,
  draft: string,
): string[] {
  const draftLower = draft.toLowerCase();
  const found = new Set<string>();
  for (const match of text.matchAll(PROPER_PHRASE)) {
    const phrase = match[1]?.trim();
    if (!phrase) continue;
    if (ALLOWED_WITHOUT_DRAFT.has(phrase)) continue;
    // Skip all-caps acronyms ≤4 chars unless draft has them
    if (/^[A-Z]{2,4}$/.test(phrase) && !draftLower.includes(phrase.toLowerCase())) {
      // still flag if it looks like a brand-ish token not in draft — skip short tools
      continue;
    }
    if (!draftLower.includes(phrase.toLowerCase())) {
      found.add(phrase);
    }
  }
  return [...found];
}

export function groundToDraft(
  out: {
    improvedAnswer: string;
    factsUsed: string[];
    warnings?: string[];
  },
  draft: string,
): {
  improvedAnswer: string;
  factsUsed: string[];
  warnings?: string[];
} {
  const invented = findUngroundedProperNouns(out.improvedAnswer, draft);
  if (invented.length === 0) {
    const { warnings, ...rest } = out;
    return warnings && warnings.length > 0 ? out : rest;
  }

  return {
    improvedAnswer: draft,
    factsUsed: out.factsUsed.filter((f) =>
      draft.toLowerCase().includes(f.trim().toLowerCase()),
    ),
    warnings: [
      ...(out.warnings ?? []),
      `Improve refused unverified names not in your draft: ${invented.join(', ')}.`,
    ],
  };
}

@Injectable()
export class GapAnswerImprover {
  constructor(private readonly llm: LlmClient) {}

  async improve(params: {
    gapText: string;
    draft: string;
    missingKeywords?: string[];
  }): Promise<z.infer<typeof improveGapResponseSchema>> {
    const draft = params.draft.trim();

    if (countWords(draft) < MIN_GAP_IMPROVE_WORDS) {
      return improveGapResponseSchema.parse({
        improvedAnswer: draft,
        factsUsed: [],
        warnings: [
          `Write at least ${MIN_GAP_IMPROVE_WORDS} words before Improve with AI can run.`,
        ],
      });
    }

    const userPrompt = JSON.stringify(
      {
        gapText: params.gapText.slice(0, 2000),
        draft: draft.slice(0, 8000),
        missingKeywords: (params.missingKeywords ?? []).slice(0, 30),
        rules: [
          'Facts only — no invented employers, tools, certs, or metrics',
          'Prefer 1–2 ATS bullets grounded in the draft',
          'List every concrete fact you used in factsUsed',
          'If you cannot improve honestly, warn and return the draft unchanged',
        ],
      },
      null,
      2,
    );

    const raw = await this.llm.chatJson(SYSTEM_PROMPT, userPrompt, 'gap-improve');
    if (!raw?.trim()) {
      throw new Error('Empty LLM response for gap improve');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON for gap improve: ${raw.slice(0, 120)}`);
    }

    const normalized =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? {
            ...parsed,
            improvedAnswer:
              (parsed as Record<string, unknown>).improvedAnswer ??
              (parsed as Record<string, unknown>).answer ??
              draft,
            factsUsed: Array.isArray(
              (parsed as Record<string, unknown>).factsUsed,
            )
              ? (parsed as Record<string, unknown>).factsUsed
              : [],
            warnings: Array.isArray((parsed as Record<string, unknown>).warnings)
              ? (parsed as Record<string, unknown>).warnings
              : [],
          }
        : {
            improvedAnswer: draft,
            factsUsed: [],
            warnings: ['Invalid model output'],
          };

    const llmOut = llmImproveSchema.parse(normalized);
    const grounded = groundToDraft(llmOut, draft);
    const warnings =
      grounded.warnings && grounded.warnings.length > 0
        ? grounded.warnings
        : undefined;

    return improveGapResponseSchema.parse({
      improvedAnswer: grounded.improvedAnswer,
      factsUsed: grounded.factsUsed,
      ...(warnings ? { warnings } : {}),
    });
  }
}
