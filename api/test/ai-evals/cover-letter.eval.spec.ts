import {
  aiEvalsEnabled,
  assertHonesty,
  loadAiEvalFixtures,
  requireLlmApiKey,
} from './load-fixtures';
import { createAiEvalModule } from './create-eval-module';
import { coverLetterLlmOutputSchema } from '../../src/ai/cover-letter.generator';

const run = aiEvalsEnabled();

(run ? describe : describe.skip)('AI eval — cover letter', () => {
  const fixtures = loadAiEvalFixtures();

  beforeAll(() => {
    requireLlmApiKey();
  });

  it.each(fixtures.map((f) => [f.id, f] as const))(
    'Zod-valid + no invented employers/degrees: %s',
    async (_id, fixture) => {
      const { coverLetter, module } = await createAiEvalModule();
      try {
        const result = await coverLetter.generate({
          jobTitle: fixture.jobTitle,
          companyName: fixture.companyName,
          jobDescription: fixture.jobDescription,
          profileSummary: fixture.profile,
          cvText: fixture.cvText,
        });

        expect(() => coverLetterLlmOutputSchema.parse(result)).not.toThrow();
        expect(result.coverLetter.length).toBeGreaterThanOrEqual(50);
        assertHonesty(result.coverLetter, fixture, 'cover letter');
      } finally {
        await module.close();
      }
    },
    180_000,
  );
});
