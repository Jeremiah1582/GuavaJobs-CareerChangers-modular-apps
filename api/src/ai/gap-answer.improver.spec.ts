import {
  GapAnswerImprover,
  MIN_GAP_IMPROVE_WORDS,
  countWords,
  findUngroundedProperNouns,
  groundToDraft,
} from './gap-answer.improver';
import {
  improveGapResponseSchema,
  improveGapSchema,
} from '../shared/schemas/career-cv.schema';

describe('countWords', () => {
  it('counts whitespace-separated tokens', () => {
    expect(countWords('  one two   three ')).toBe(3);
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });
});

describe('improveGapSchema', () => {
  it('accepts gapText, draft, and optional missingKeywords', () => {
    const parsed = improveGapSchema.parse({
      gapText: 'Limited Kubernetes experience',
      draft:
        'Role: Backend Intern\nDates: 2021–2022\nDetails: Ran staging K8s clusters and wrote Helm charts for deploys\nOutcome: Faster rollbacks',
      missingKeywords: ['kubernetes', 'helm'],
    });
    expect(parsed.missingKeywords).toEqual(['kubernetes', 'helm']);
  });

  it('rejects empty draft', () => {
    expect(() =>
      improveGapSchema.parse({
        gapText: 'Missing React',
        draft: '',
      }),
    ).toThrow();
  });
});

describe('findUngroundedProperNouns / groundToDraft', () => {
  const draft =
    'Role: Backend Intern\nDates: 2021–2022\nDetails: Built REST APIs in Node.js at Acme Labs\nOutcome: Fewer production incidents';

  it('flags employers invented by the model', () => {
    const invented = findUngroundedProperNouns(
      'Delivered APIs at MegaCorp Industries using Node.js',
      draft,
    );
    expect(invented).toEqual(expect.arrayContaining(['MegaCorp Industries']));
  });

  it('allows proper nouns already in the draft', () => {
    expect(
      findUngroundedProperNouns(
        'Built REST APIs in Node.js at Acme Labs',
        draft,
      ),
    ).toEqual([]);
  });

  it('falls back to draft when LLM invents employers', () => {
    const result = groundToDraft(
      {
        improvedAnswer:
          'Shipped Kubernetes workloads at Forbidden Corp for enterprise clients',
        factsUsed: ['Kubernetes'],
        warnings: [],
      },
      draft,
    );
    expect(result.improvedAnswer).toBe(draft);
    expect(result.warnings?.some((w) => /unverified|Forbidden Corp/i.test(w))).toBe(
      true,
    );
  });
});

describe('GapAnswerImprover', () => {
  const richDraft = [
    'Role: Backend Intern',
    'Dates: 2021–2022',
    'Details: Built REST APIs in Node.js and wrote integration tests at Acme Labs',
    'Outcome: Reduced flaky deploys by tracking failures',
  ].join('\n');

  it(`returns a warning without calling the LLM when draft has fewer than ${MIN_GAP_IMPROVE_WORDS} words`, async () => {
    const chatJson = jest.fn();
    const improver = new GapAnswerImprover({ chatJson } as never);

    const result = await improver.improve({
      gapText: 'Limited API experience',
      draft: 'Built some APIs',
    });

    expect(chatJson).not.toHaveBeenCalled();
    expect(result.improvedAnswer).toBe('Built some APIs');
    expect(result.warnings?.[0]).toMatch(/at least 10 words/i);
    expect(improveGapResponseSchema.parse(result)).toEqual(result);
  });

  it('polishes with facts from the draft only (mock LLM)', async () => {
    const polished =
      'Built REST APIs in Node.js and wrote integration tests at Acme Labs, reducing flaky deploys by tracking failures.';
    const chatJson = jest.fn().mockResolvedValue(
      JSON.stringify({
        improvedAnswer: polished,
        factsUsed: [
          'REST APIs',
          'Node.js',
          'integration tests',
          'Acme Labs',
          'flaky deploys',
        ],
      }),
    );
    const improver = new GapAnswerImprover({ chatJson } as never);

    const result = await improver.improve({
      gapText: 'Limited backend evidence',
      draft: richDraft,
      missingKeywords: ['nodejs'],
    });

    expect(chatJson).toHaveBeenCalledTimes(1);
    expect(result.improvedAnswer).toBe(polished);
    expect(result.factsUsed).toEqual(
      expect.arrayContaining(['Node.js', 'Acme Labs']),
    );
    expect(result.warnings).toBeUndefined();
  });

  it('does not ship invented employers from the LLM', async () => {
    const chatJson = jest.fn().mockResolvedValue(
      JSON.stringify({
        improvedAnswer:
          'Led Kubernetes platform work at Totally Fake Corp using Helm',
        factsUsed: ['Kubernetes', 'Helm'],
      }),
    );
    const improver = new GapAnswerImprover({ chatJson } as never);

    const result = await improver.improve({
      gapText: 'Limited Kubernetes experience',
      draft: richDraft,
    });

    expect(result.improvedAnswer).toBe(richDraft);
    expect(result.warnings?.join(' ')).toMatch(/Totally Fake Corp/i);
    expect(result.improvedAnswer).not.toMatch(/Totally Fake Corp/i);
  });
});
