import {
  calibrateAtsScores,
  estimateFitSeverity,
} from './ats-score-calibrate';

describe('estimateFitSeverity', () => {
  it('rates domain-mismatch narratives as severe', () => {
    const severity = estimateFitSeverity({
      missingKeywords: [
        'plumbing',
        'pipe fitting',
        'soldering',
        'Gas Safe',
        'boiler',
        'WRAS',
        'copper pipe',
        'drainage',
      ],
      gaps: [
        'No plumbing or trades experience',
        'Background is software engineering — wrong field for this role',
        'Missing required Gas Safe certification',
        'No hands-on pipe fitting evidence',
      ],
      strengths: ['Clear written communication'],
      keywordCoverage: {
        plumbing: 0,
        typescript: 90,
        react: 80,
        soldering: 0,
      },
    });
    expect(severity).toBeGreaterThanOrEqual(0.7);
  });

  it('rates strong keyword coverage with few gaps as mild', () => {
    const severity = estimateFitSeverity({
      missingKeywords: ['kubernetes'],
      gaps: ['Limited container orchestration depth'],
      strengths: [
        'Strong TypeScript backend experience',
        'Shipped production APIs',
        'Mentored engineers',
      ],
      keywordCoverage: {
        typescript: 95,
        nodejs: 90,
        api: 85,
        postgres: 80,
      },
    });
    expect(severity).toBeLessThan(0.35);
  });
});

describe('calibrateAtsScores', () => {
  it('caps inflated scores when narrative shows a domain mismatch', () => {
    const calibrated = calibrateAtsScores(
      {
        score: 78,
        letterScore: 3,
        cvScore: 72,
        missingKeywords: [
          'plumbing',
          'pipe fitting',
          'soldering',
          'Gas Safe',
          'boiler',
          'WRAS',
        ],
        gaps: [
          'No experience in plumbing',
          'Does not match the required trades background',
          'Missing Gas Safe and boiler work',
        ],
        strengths: ['Professional tone in writing'],
        keywordCoverage: {
          plumbing: 5,
          typescript: 90,
          soldering: 0,
        },
        suggestions: [],
        actionableSteps: [],
      },
      { coverLetterLength: 800 },
    );

    expect(calibrated.score).toBeLessThanOrEqual(35);
    expect(calibrated.cvScore).toBeLessThanOrEqual(30);
    expect(calibrated.letterScore).toBeDefined();
    expect(calibrated.letterScore!).toBeGreaterThanOrEqual(calibrated.cvScore!);
    expect(calibrated.letterScore!).toBeLessThanOrEqual(45);
  });

  it('does not crush a strong-fit report', () => {
    const calibrated = calibrateAtsScores({
      score: 82,
      letterScore: 80,
      cvScore: 84,
      missingKeywords: ['graphql'],
      gaps: ['No GraphQL exposure yet'],
      strengths: ['Deep TypeScript', 'API design', 'Team leadership'],
      keywordCoverage: {
        typescript: 95,
        nodejs: 90,
        postgres: 85,
      },
      suggestions: [],
      actionableSteps: [],
    });

    expect(calibrated.score).toBeGreaterThanOrEqual(75);
    expect(calibrated.cvScore).toBeGreaterThanOrEqual(75);
    expect(calibrated.letterScore).toBeGreaterThanOrEqual(75);
  });
});
