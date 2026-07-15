import { loadAiEvalFixtures, findForbiddenMentions } from './load-fixtures';

/** Always runs — no LLM calls. Keeps fixtures honest and loadable. */
describe('AI eval fixtures', () => {
  const fixtures = loadAiEvalFixtures();

  it('loads at least 10 fixtures across multiple industries', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(10);
    const industries = new Set(fixtures.map((f) => f.industry));
    expect(industries.size).toBeGreaterThanOrEqual(5);
  });

  it.each(fixtures.map((f) => [f.id, f] as const))(
    'forbidden probes are absent from cvText: %s',
    (_id, fixture) => {
      expect(
        findForbiddenMentions(fixture.cvText, fixture.forbiddenEmployers),
      ).toEqual([]);
      expect(
        findForbiddenMentions(fixture.cvText, fixture.forbiddenDegrees),
      ).toEqual([]);
      expect(
        findForbiddenMentions(
          fixture.baselineCoverLetter,
          fixture.forbiddenEmployers,
        ),
      ).toEqual([]);
      expect(
        findForbiddenMentions(
          fixture.baselineCoverLetter,
          fixture.forbiddenDegrees,
        ),
      ).toEqual([]);
      expect(fixture.atsScoreMin).toBeLessThanOrEqual(fixture.atsScoreMax);
    },
  );
});
