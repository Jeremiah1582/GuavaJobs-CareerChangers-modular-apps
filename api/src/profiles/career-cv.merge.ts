import {
  CareerCvEnrichment,
  ProfileCareerCvContent,
  profileCareerCvContentSchema,
} from '../shared/schemas/career-cv.schema';

/**
 * Deterministically fold a gap-fill answer into anonymous career JSON.
 * No LLM — maps optional `section` hint to skills / work highlights / projects / summary.
 */
export function mergeEnrichmentIntoContent(
  content: ProfileCareerCvContent,
  enrichment: Pick<CareerCvEnrichment, 'gapText' | 'answer' | 'section'>,
): ProfileCareerCvContent {
  const next = structuredClone(content);
  const answer = enrichment.answer.trim();
  const gapText = enrichment.gapText.trim();
  const section = normalizeSection(enrichment.section);

  if (section === 'skills' || section === 'competencies') {
    mergeIntoSkills(next, answer);
  } else if (section === 'projects' || section === 'project') {
    mergeIntoProjects(next, gapText, answer);
  } else if (section === 'summary') {
    mergeIntoSummary(next, answer);
  } else {
    // work / experience / education / certificates / default → work highlights
    mergeIntoWorkHighlights(next, gapText, answer);
  }

  return profileCareerCvContentSchema.parse(next);
}

function normalizeSection(section?: string): string {
  return (section ?? 'work').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function mergeIntoSkills(content: ProfileCareerCvContent, answer: string): void {
  const lines = answer
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const candidates = lines.length > 1 ? lines : [answer.trim()];
  for (const raw of candidates) {
    const name = clip(raw, 100);
    if (!name) continue;
    const existing = content.skills.find(
      (s) => s.name.toLowerCase() === name.toLowerCase(),
    );
    if (!existing) {
      if (content.skills.length < 40) {
        content.skills.push({ name });
      }
    }
    if (
      content.coreCompetencies.length < 30 &&
      !content.coreCompetencies.some((c) => c.toLowerCase() === name.toLowerCase())
    ) {
      content.coreCompetencies.push(name);
    }
  }
}

function mergeIntoProjects(
  content: ProfileCareerCvContent,
  gapText: string,
  answer: string,
): void {
  if (content.projects.length >= 20) return;
  content.projects.push({
    name: clip(gapText || 'Additional project', 200) || 'Additional project',
    description: clip(answer, 2000),
    highlights: [],
  });
}

function mergeIntoSummary(
  content: ProfileCareerCvContent,
  answer: string,
): void {
  const snippet = clip(answer, 4000);
  if (!content.summary?.trim()) {
    content.summary = snippet;
    return;
  }
  const combined = `${content.summary.trim()}\n\n${snippet}`;
  content.summary = clip(combined, 4000);
}

function mergeIntoWorkHighlights(
  content: ProfileCareerCvContent,
  gapText: string,
  answer: string,
): void {
  const highlight = clip(answer, 500);
  if (!highlight) return;

  const target = content.work.find((w) => w.highlights.length < 12);
  if (target) {
    target.highlights.push(highlight);
    return;
  }

  if (content.work.length >= 30) {
    // Cap reached — fold into projects instead of dropping the fact.
    mergeIntoProjects(content, gapText, answer);
    return;
  }

  const ym = currentYearMonth();
  content.work.push({
    name: 'Additional experience',
    position: clip(gapText, 200) || 'Contributor',
    location: null,
    startDate: ym,
    endDate: null,
    highlights: [highlight],
  });
}

function currentYearMonth(): string {
  const d = new Date();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${d.getUTCFullYear()}-${m}`;
}

function clip(value: string, max: number): string {
  const t = value.trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd();
}
