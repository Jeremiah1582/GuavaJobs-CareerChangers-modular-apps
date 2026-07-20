import {
  aiEvalsEnabled,
  assertHonesty,
  loadAiEvalFixtures,
  requireLlmApiKey,
} from './load-fixtures';
import { createAiEvalModule } from './create-eval-module';
import { applicationAtsLlmOutputSchema } from '../../src/ai/ats-report.generator';

const run = aiEvalsEnabled();

(run ? describe : describe.skip)('AI eval — ATS report', () => {
  const fixtures = loadAiEvalFixtures();

  beforeAll(() => {
    requireLlmApiKey();
  });

  it.each(fixtures.map((f) => [f.id, f] as const))(
    'Zod-valid + score band + no invented employers/degrees: %s',
    async (_id, fixture) => {
      const { atsReport, module } = await createAiEvalModule();
      try {
        const result = await atsReport.generate({
          jobTitle: fixture.jobTitle,
          companyName: fixture.companyName,
          jobDescription: fixture.jobDescription,
          coverLetter: fixture.baselineCoverLetter,
          cvText: fixture.cvText,
        });

        expect(() => applicationAtsLlmOutputSchema.parse(result)).not.toThrow();
        expect(result.score).toBeGreaterThanOrEqual(fixture.atsScoreMin);
        expect(result.score).toBeLessThanOrEqual(fixture.atsScoreMax);

        const narrative = [
          ...result.strengths,
          ...result.gaps,
          ...result.suggestions,
          ...result.actionableSteps,
          ...result.missingKeywords,
          ...result.suggestedRoles,
          result.careerSuggestion,
        ].join('\n');
        assertHonesty(narrative, fixture, 'ATS narrative');
        expect(result.suggestedRoles.length).toBeGreaterThan(0);
        expect(result.careerSuggestion.trim().length).toBeGreaterThan(20);
      } finally {
        await module.close();
      }
    },
    180_000,
  );
});
