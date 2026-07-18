import { analyzeCvHeuristics } from '../src/ai/cv-ats-heuristics';
import { toIntScore } from '../src/ai/score-normalize';

describe('toIntScore', () => {
  it('rounds floats and scales 0–1 fractions', () => {
    expect(toIntScore(72.6)).toBe(73);
    expect(toIntScore(0.68)).toBe(68);
    expect(toIntScore('55')).toBe(55);
    expect(toIntScore(120)).toBe(100);
  });
});

describe('analyzeCvHeuristics', () => {
  const sample = `
Jane Doe
jane.doe@example.com
+44 7700 900123
linkedin.com/in/janedoe

Experience
Software engineer at Acme. Built APIs and databases for 3 years. Improved conversion by 15%.

Education
BSc Computer Science

Skills
TypeScript, React, testing, CI/CD, PostgreSQL
`;

  it('detects contact, sections, and some software keywords', () => {
    const result = analyzeCvHeuristics(sample, 'SOFTWARE', 'MID');
    expect(result.signals.hasEmail).toBe(true);
    expect(result.signals.hasPhone).toBe(true);
    expect(result.signals.sectionHits).toEqual(
      expect.arrayContaining(['experience', 'education', 'skills']),
    );
    expect(result.keywordHits.length).toBeGreaterThan(0);
    expect(result.heuristicScore).toBeGreaterThan(40);
    expect(result.checklist.some((c) => c.id === 'contact_email' && c.passed)).toBe(
      true,
    );
  });

  it('flags thin CVs without inventing content', () => {
    const result = analyzeCvHeuristics('Hi I want a job', 'SALES', 'JUNIOR');
    expect(result.signals.hasEmail).toBe(false);
    expect(result.checklist.find((c) => c.id === 'length')?.passed).toBe(false);
    expect(result.missingKeywords.length).toBeGreaterThan(0);
  });
});
