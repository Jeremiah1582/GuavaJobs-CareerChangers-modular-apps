import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { aiEvalFixtureSchema, AiEvalFixture } from './fixture.schema';

const FIXTURES_DIR = join(__dirname, 'fixtures');

export function loadAiEvalFixtures(): AiEvalFixture[] {
  const files = readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (files.length < 10) {
    throw new Error(
      `Expected ≥10 AI eval fixtures, found ${files.length} in ${FIXTURES_DIR}`,
    );
  }

  return files.map((file) => {
    const raw = JSON.parse(readFileSync(join(FIXTURES_DIR, file), 'utf8'));
    const parsed = aiEvalFixtureSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid fixture ${file}: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      );
    }
    return parsed.data;
  });
}

/** Case-insensitive substring check for hallucinated employers/degrees. */
export function findForbiddenMentions(
  text: string,
  forbidden: string[],
): string[] {
  const haystack = text.toLowerCase();
  return forbidden.filter((phrase) => haystack.includes(phrase.toLowerCase()));
}

export function assertHonesty(
  text: string,
  fixture: AiEvalFixture,
  label: string,
): void {
  const hits = [
    ...findForbiddenMentions(text, fixture.forbiddenEmployers),
    ...findForbiddenMentions(text, fixture.forbiddenDegrees),
  ];
  if (hits.length > 0) {
    throw new Error(
      `${label} (${fixture.id}): invented credentials not in CV: ${hits.join(', ')}`,
    );
  }
}

export function aiEvalsEnabled(): boolean {
  return process.env.RUN_AI_EVALS === 'true';
}

export function requireLlmApiKey(): void {
  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    throw new Error(
      'RUN_AI_EVALS=true requires OPENAI_API_KEY or OPENROUTER_API_KEY',
    );
  }
}
